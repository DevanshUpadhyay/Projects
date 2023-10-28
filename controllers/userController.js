import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";
import { Stats } from "../models/Stats.js";

// register
export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, referralCode } = req.body;
  const file = req.file;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorHandler("User Already Exist", 409));
  }
  var referralEmail = null;
  var cashback = 0;
  if (referralCode) {
    var referral = await User.findOne({ referralCode });
    if (!referral) {
      return next(new ErrorHandler("Referral Code is invalid", 401));
    }
    referralEmail = referral.email;
    referral.referrals.push({
      userEmail: email,
      userName: name,
      status: "Registered",
    });
    cashback = 20;
    await referral.save();
  }

  // referral code generator
  function randomString() {
    //initialize a variable having alpha-numeric characters
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz";

    //specify the length for the new string to be generated
    var string_length = 8;
    var randomstring = "";

    //put a loop to select a character randomly in each iteration
    for (var i = 0; i < string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
  }
  let code = randomString();

  if (file) {
    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      referralCode: code,
      referredBy: referralEmail,
      cashback: cashback,
    });
  } else {
    user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: "public_id",
        url: "url",
      },
      referralCode: code,
      referredBy: referralEmail,
      cashback: cashback,
    });
  }

  sendToken(res, user, "Registered Successfully", 201);
});
// login
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  // checking if user has given password and email both
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email and Password", 400));
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  sendToken(res, user, `Welcome back , ${user.name}`, 200);
});
// Logout User
export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    // .clearCookie()
    .cookie("token", null, {
      expires: new Date(Date.now()),
      // maxAge: -1,
      // httpOnly: true,
      // secure: true,
      // sameSite: "none",
      // domain: "https://www.haco.study",
      // path: "/",
    })
    // .clearCookie("token", {
    //   expires: new Date(Date.now()),
    //   maxAge: -1,
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "Strict",
    // domain: "online-video-teaching-streaming-platform.vercel.app",
    // path: "/",
    // })
    .json({
      success: true,
      messsage: "Logged Out Successfully",
    });
});
// Get User Details
export const getmyProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  // const courses = await Course.find();
  let count = user.subscription.length;
  for (let i = 0; i < count; i++) {
    const course = await Course.findById(user.subscription[i].course_id);
    if (!course) {
      await user.subscription[i].deleteOne();
      i = i - 1;
      count--;
    }
  }
  await user.save();
  res.status(200).json({
    success: true,
    user,
  });
});
// change/update password
export const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }
  const user = await User.findById(req.user._id).select("+password");

  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old Password is incorect", 400));
  }

  user.password = newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
  });
});
// change/update profile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;

  const user = await User.findById(req.user._id);

  if (name) {
    user.name = name;
  }

  await user.save();
  res.status(200).json({
    success: true,
    message: "Profile updated Successfully",
  });
});

// update profile picture

export const updateProfilePicture = catchAsyncErrors(async (req, res, next) => {
  const file = req.file;
  const user = await User.findById(req.user._id);
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  user.avatar = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };
  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Picture updated Successfully",
  });
});

// Forgot Password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  // Get ResetPassword Token
  const resetToken = await user.getResetPasswordToken();
  //   const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  await user.save({ validateBeforeSave: false });
  // const resetPasswordUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/resetpassword/${resetToken}`;
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `Your password reset token is :-\n\n ${resetPasswordUrl} \n\n If you did not request this email then please ignore it`;

  try {
    await sendEmail(user.email, "Online Course Reset Password", message);
    res.status(200).json({
      success: true,
      message: `Email is sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Pasword
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Creating token hash
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        401
      )
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  res.status(200).json({
    success: true,
    message: "Password change successfully",
  });
});
// add to playlist
export const addToPlaylist = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.body.id);
  if (!course) {
    return next(new ErrorHandler("Invalid Course Id", 404));
  }
  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) return true;
  });
  if (itemExist) {
    return next(new ErrorHandler("Item Alredy Exist", 409));
  }
  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });
  await user.save();
  res.status(200).json({
    success: true,
    message: "Added To playlist",
  });
});
// remove from playlist
export const removeFromPlaylist = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.query.id);
  if (!course) {
    return next(new ErrorHandler("Invalid Course Id", 404));
  }
  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) return item;
  });
  user.playlist = newPlaylist;

  await user.save();
  res.status(200).json({
    success: true,
    message: "Removed from playlist",
  });
});

// for admin controllers

// get all users
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    success: true,
    users,
  });
});

// update user role
export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  if (user.plan === "inactive") {
    user.plan = "active";
  } else {
    user.plan = "inactive";
  }
  await user.save();
  res.status(200).json({
    success: true,
    message: `Plan is changed from ${
      user.plan === "inactive" ? "active" : "inactive"
    } to ${user.plan === "inactive" ? "inactive" : "active"}`,
  });
});

// Delete user
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  // cancel subscription
  await user.deleteOne();
  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});
// Delete my profile
export const deleteMyProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  // cancel subscription
  await user.deleteOne();
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      // don't add secure in local host
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message: "User Deleted Successfully",
    });
});
// watcher by mongodb
User.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
  const subscription = await User.find({ "subscription.status": "active" });
  stats[0].users = await User.countDocuments();
  stats[0].subscriptions = subscription.length;
  stats[0].createdAt = new Date(Date.now());
  await stats[0].save();
});
