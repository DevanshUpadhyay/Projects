import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import { instance } from "../server.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import fetch from "node-fetch";
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
  const { courseId, payerId, createdAt, email_address } = req.body;
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
      payer_id: payerId,
      course_id: courseId,
      email_address: email_address,
      createdAt: createdAt,
    });
    user.plan = "active";
    await user.save();
    course.subscriptions += 1;
    await course.save();
  }

  res.status(201).json({
    success: true,
    message: "Subscribed Successfully",
  });
});
// paypal integration
// const { CLIENT_ID, APP_SECRET } = process.env;
// const CLIENT_ID =
//   "AXxatcVnSjn8hXDurzxEwQREX6pSdzRkXexK09AjG2mDN-0SeQG0GdXtKo_FymHutolwtnS48NVV1BI1";
// const APP_SECRET =
//   "EHMqMGHB4l1rdbapgelVrXNwnTRcCzN_WrcLzvM1T1lUL9RR2Kla_X2rfYwRBEiU2G8cN_HiwfCr-tLt";
// const base = "https://api-m.sandbox.paypal.com";

// export const generateAccessToken = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64");

//     const response = await fetch(`${base}/v1/oauth2/token`, {
//       method: "post",
//       body: "grant_type=client_credentials",
//       headers: {
//         Authorization: `Basic ${auth}`,
//       },
//     });

//     const data = await response.json();

//     return data.access_token;
//   } catch (error) {
//     console.error("Failed to generate Access Token:", error);
//   }
// });

// export const createOrder = catchAsyncErrors(async (req, res, next) => {
//   console.log("qwerty");
//   const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64");

//   const newresponse = await fetch(`${base}/v1/oauth2/token`, {
//     method: "post",
//     body: "grant_type=client_credentials",
//     headers: {
//       Authorization: `Basic ${auth}`,
//     },
//   });

//   const data = await newresponse.json();

//   const accessToken = data.access_token;

//   const url = `${base}/v2/checkout/orders`;
//   const payload = {
//     intent: "CAPTURE",
//     purchase_units: [
//       {
//         amount: {
//           currency_code: "USD",
//           value: "149",
//         },
//       },
//     ],
//   };

//   const response = await fetch(url, {
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${accessToken}`,
//     },
//     method: "POST",
//     body: JSON.stringify(payload),
//   });

//   return handleResponse(response);
// });
// export const capturePayment = catchAsyncErrors(async (req, res, next) => {
//   const { orderID } = req.params;

//   const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64");

//   const newresponse = await fetch(`${base}/v1/oauth2/token`, {
//     method: "post",
//     body: "grant_type=client_credentials",
//     headers: {
//       Authorization: `Basic ${auth}`,
//     },
//   });

//   const data = await newresponse.json();

//   const accessToken = data.access_token;
//   const url = `${base}/v2/checkout/orders/${orderID}/capture`;

//   const response = await fetch(url, {
//     method: "post",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   return handleResponse(response);
// });
// async function handleResponse(response) {
//   if (response.status === 200 || response.status === 201) {
//     return response.json();
//   }

//   const errorMessage = await response.text();
//   throw new Error(errorMessage);
// }
