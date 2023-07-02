import express from "express";
import {
  buySubscription,
  cancelSubscription,
  getPayerId,
  getRazorPayKey,
  paymentVerification,
} from "../controllers/paymentController.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();
// Buy subscription
router.route("/subscribe/:id").get(isAuthenticatedUser, buySubscription);
// verify payment and save reference in database
// router.route("/subscribe/:id").get(isAuthenticatedUser, buySubscription);
router
  .route("/paymentverification")
  .post(isAuthenticatedUser, paymentVerification);
// Get Razorpay key
router.route("/razorpaykey").get(getRazorPayKey);
// cancel subscription
router
  .route("/subscribe/cancel")
  .delete(isAuthenticatedUser, cancelSubscription);
router.route("/payment").post(isAuthenticatedUser, getPayerId);
export default router;
