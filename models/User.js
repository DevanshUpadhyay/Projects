import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Your Name"],
    maxLength: [30, "Name cannot exceeds 30 characters"],
    minLength: [3, "Name should have more than 3 characters"],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter your Password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,
  },
  otp: {
    type: Number,
    default: null,
  },
  verify: {
    type: Boolean,
    default: false,
  },
  cashback: {
    type: Number,
    default: 0,
  },

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  plan: {
    type: String,
    enum: ["inactive", "active"],
    default: "inactive",
  },
  subscription: [
    {
      transaction_id: String,
      payer_id: String,
      email_address: String,
      course_id: String,
      transaction_at: Date,
    },
  ],
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  playlist: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      poster: String,
    },
  ],
  referralCode: {
    type: String,
    unique: true,
    default: null,
  },
  referredBy: {
    type: String,
    default: null,
  },
  referrals: [
    {
      userName: String,
      userEmail: String,
      status: {
        type: String,
        default: null,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now(),
  },

  resetPasswordToken: String,
  resetPasswordExpire: String,
});

schema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// JWT Token
schema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
// Compare Password
schema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
// Generating Password Reset Token
schema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");
  // Hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

export const User = mongoose.model("User", schema);
