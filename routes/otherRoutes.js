import express from "express";
import {
  contact,
  courseRequest,
  getDashboardStats,
  sendOtp,
  verifyOtp,
} from "../controllers/otherController.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();

// contact form
router.route("/contact").post(contact);
// request form
router.route("/courserequest").post(courseRequest);
// get admin dashboard stats
router.route("/admin/stats").get(isAuthenticatedUser, getDashboardStats);
// otp form
router.route("/sendotp").post(isAuthenticatedUser, sendOtp);
router.route("/verifyotp").post(isAuthenticatedUser, verifyOtp);

export default router;
