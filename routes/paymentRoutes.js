import express from "express";
import {
  buySubscription,
  cancelSubscription,

  // getPayerId,
  getRazorPayKey,
  paymentVerification,
} from "../controllers/paymentController.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

const router = express.Router();
// Buy subscription
router.route("/subscribe").post(isAuthenticatedUser, buySubscription);
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
// router.route("/payment").post(isAuthenticatedUser, getPayerId);
// paypal integration
// router.route("/orders").post(createOrder);
// router.route("/orders/:orderID/capture").post(capturePayment);

export default router;
