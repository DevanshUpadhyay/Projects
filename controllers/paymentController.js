import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import { instance } from "../server.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
// export const buySubscription = catchAsyncErrors(async (req, res, next) => {
//   const user = await User.findById(req.user._id);
//   const course = await Course.findById(req.params.id);
//   if (!course) {
//     return next(new ErrorHandler("Invalid Course Id", 404));
//   }
//   // const course_id=req.params.id;
//   if (user.role === "admin") {
//     return next(new ErrorHandler("Admin can't buy subscription", 400));
//   }
//   const plan_id = process.env.PLAN_ID || "plan_LRiPbl3X6XMRlz";

//   const subscription = await instance.subscriptions.create({
//     plan_id,
//     customer_notify: 1,
//     total_count: 12,
//   });
//   // user.subscription.id = subscription.id;
//   // user.subscription.status = subscription.status;
//   // user.subscription.course_id = req.params.id;

//   user.subscription.push({
//     id: subscription.id,
//     status: subscription.status,
//     course_id: req.params.id,
//     poster: course.poster.url,
//   });
//   await user.save();
//   course.subscriptions += 1;
//   await course.save();

//   res.status(201).json({
//     success: true,
//     subscriptionId: subscription.id,
//   });
// });
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
// paypal integration
// export const getPayerId = catchAsyncErrors(async (req, res, next) => {
//   const { PayerID } = req.body;
//   const user = await User.findById(req.user._id);
//   user.payerId = PayerID;
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Subscribed Successfully",
//   });
// });

export const buySubscription = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorHandler("Invalid Course Id", 404));
  }
  if (user.role === "admin") {
    return next(new ErrorHandler("Admin can't buy subscription", 400));
  }

  let duplicate = false;
  for (let i = 0; i < user.subscription.length; i++) {
    if (String(user.subscription[i].course_id) === String(req.params.id)) {
      duplicate = true;
      break;
    }
  }
  if (!duplicate) {
    user.subscription.push({
      id: req.params.pid,
      course_id: req.params.id,
      poster: course.poster.url,
    });
    user.plan = "active";
    await user.save();
    course.subscriptions += 1;
    await course.save();
  }

  res.status(201).json({
    success: true,
    subscriptionId: req.params.pid,
  });
});
