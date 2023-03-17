import express from "express";
import {
  buySubscription,
  cancelSubscription,
  getRazorPayKey,
  paymentVerification,
} from "../controllers/paymentController.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();
// Buy subscription
router.route("/subscribe").get(isAuthenticatedUser, buySubscription);
// verify payment and save reference in database
router
  .route("/paymentverification")
  .post(isAuthenticatedUser, paymentVerification);
// Get Razorpay key
router.route("/razorpaykey").get(getRazorPayKey);
// cancel subscription
router
  .route("/subscribe/cancel")
  .delete(isAuthenticatedUser, cancelSubscription);

export default router;
