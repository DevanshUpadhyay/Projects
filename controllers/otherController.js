import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { Stats } from "../models/Stats.js";
import { User } from "../models/User.js";

// conatct form
export const contact = catchAsyncErrors(async (req, res, next) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  const to = process.env.MY_MAIL;
  const subject = "Contact from haco";
  const text = `I am ${name} and my email is ${email}.\n ${message}.`;
  await sendEmail(to, subject, text);
  res.status(200).json({
    success: true,
    message: "Your Message has been Sent.",
  });
});
// course request form
export const courseRequest = catchAsyncErrors(async (req, res, next) => {
  const { name, email, course } = req.body;
  if (!name || !email || !course) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  const to = process.env.MY_MAIL;
  const subject = "Requesting for a course on haco";
  const text = `I am ${name} and my email is ${email}.\n ${course}.`;
  await sendEmail(to, subject, text);
  res.status(200).json({
    success: true,
    message: "Your Request has been Sent.",
  });
});
// get dashboard stats
export const getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(12);
  const statsData = [];
  for (let i = 0; i < stats.length; i++) {
    statsData.unshift(stats[i]);
  }
  const requiredSize = 12 - stats.length;
  for (let i = 0; i < requiredSize; i++) {
    statsData.unshift({
      users: 0,
      subscriptions: 0,
      views: 0,
    });
  }
  const usersCount = statsData[11].users;
  const subscriptionsCount = statsData[11].subscriptions;
  const viewsCount = statsData[11].views;
  let usersPercentage = 0,
    viewsPercentage = 0,
    subscriptionsPercentage = 0;

  let usersProfit = true,
    viewsProfit = true,
    subscriptionsProfit = true;

  if (statsData[10].users === 0) usersPercentage = usersCount * 100;
  if (statsData[10].subscriptions === 0)
    subscriptionsPercentage = subscriptionsCount * 100;
  if (statsData[10].views === 0) viewsPercentage = viewsCount * 100;
  else {
    const difference = {
      users: statsData[11].users - statsData[10].users,
      subscriptions: statsData[11].subscriptions - statsData[10].subscriptions,
      views: statsData[11].views - statsData[10].views,
    };

    usersPercentage = (difference.users / statsData[10].users) * 100;
    subscriptionsPercentage =
      (difference.subscriptions / statsData[10].subscriptions) * 100;
    viewsPercentage = (difference.views / statsData[10].views) * 100;

    if (usersPercentage < 0) usersProfit = false;
    if (subscriptionsPercentage < 0) subscriptionsProfit = false;
    if (viewsPercentage < 0) viewsProfit = false;
  }
  res.status(200).json({
    success: true,
    stats: statsData,
    usersCount,
    subscriptionsCount,
    viewsCount,
    usersPercentage,
    subscriptionsPercentage,
    viewsPercentage,
    usersProfit,
    subscriptionsProfit,
    viewsProfit,
  });
});

//
export const sendOtp = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const generateOTP = (length = 4) => {
    let otp = "";

    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }

    return otp;
  };
  let check = generateOTP(6);

  await sendEmail(user.email, "haco Email verification", `OTP is  ${check}`);
  user.otp = check;
  await user.save();

  res.status(200).json({
    success: true,
    message: `OTP is sent to ${user.email} successfully`,
  });
});
export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const { otp } = req.body;
  if (!otp) {
    return next(new ErrorHandler("Please Enter otp", 404));
  }

  if (otp != user.otp) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        401
      )
    );
  }

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
    referral.referrals[index].status = "Verified";

    await referral.save();
  }

  user.verify = true;
  // await user.otp.deleteOne();
  user.otp = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Email Verified",
  });
});
