import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import { instance } from "../server.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import fetch from "node-fetch";

// payment verification
export const paymentVerification = catchAsyncErrors(async (req, res, next) => {
  const { razorpay_signature, razorpay_payment_id, razorpay_subscription_id } =
    req.body;
  const user = await User.findById(req.user._id);
  const subscription_id = user.subscription[user.subscription.length - 1].id;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update((razorpay_payment_id + "|" + subscription_id).toString())
    .digest("hex");
  const isAuthentic = generated_signature === razorpay_signature;
  if (!isAuthentic) {
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);
  }
  //   database comes here
  await Payment.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });

  user.subscription[user.subscription.length - 1].status = "active";
  await user.save();
  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});
// get razorpay key
export const getRazorPayKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});
// cancel subscription
export const cancelSubscription = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const subscriptionId = user.subscription.id;
  let refund = false;

  await instance.subscriptions.cancel(subscriptionId);
  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });
  const gap = Date.now() - payment.createdAt;
  const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;
  if (refundTime > gap) {
    await instance.payments.refund(payment.razorpay_payment_id);
    refund = true;
  }
  await payment.deleteOne();
  user.subscription.id = undefined;
  user.subscription.status = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: refund
      ? "Subscription cancelled,You will receive full refund within 7 days."
      : "Subscription cancelled,No refund initiated as subscription was cancelled after 7 days.",
  });
});

// buy subscription
export const buySubscription = catchAsyncErrors(async (req, res, next) => {
  const { courseId, payerId, createdAt, emailAddress, transactionId } =
    req.body;
  const user = await User.findById(req.user._id);
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Invalid Course Id", 404));
  }
  if (user.role === "admin") {
    return next(new ErrorHandler("Admin can't buy subscription", 400));
  }

  let duplicate = false;
  for (let i = 0; i < user.subscription.length; i++) {
    if (String(user.subscription[i].course_id) === String(courseId)) {
      duplicate = true;
      break;
    }
  }
  if (!duplicate) {
    user.subscription.push({
      transaction_id: transactionId,
      payer_id: payerId,
      course_id: courseId,
      email_address: emailAddress,
      transaction_at: createdAt,
    });
    if (user.referredBy) {
      const email = user.referredBy;
      var referral = await User.findOne({ email });
      var index = 0;
      for (let i = 0; i < referral.referrals.length; i++) {
        if (referral.referrals[i].userEmail === user.email) {
          index = i;
          break;
        }
      }
      referral.referrals[index].status = "Completed";
      referral.cashback = referral.cashback + 30;

      await referral.save();
    }
    user.plan = "active";
    if (user.cashback > course.price) {
      user.cashback = user.cashback - course.price;
    } else {
      user.cashback = 0;
    }
    await user.save();
    course.subscriptions += 1;
    await course.save();
  }

  res.status(201).json({
    success: true,
    message: "Subscribed Successfully",
  });
});
