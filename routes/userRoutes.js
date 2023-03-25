import express from "express";
import {
  login,
  logout,
  getmyProfile,
  register,
  changePassword,
  updateProfile,
  updateProfilePicture,
  forgotPassword,
  resetPassword,
  addToPlaylist,
  removeFromPlaylist,
  getAllUsers,
  updateUserRole,
  deleteUser,
  deleteMyProfile,
} from "../controllers/userController.js";
import { authorizeAdmin, isAuthenticatedUser } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";
const router = express.Router();
// To Register a new User
router.route("/register").post(singleUpload, register);

// Login
router.route("/login").post(login);
// Logout
router.route("/logout").get(logout);
// Get my profile
router.route("/me").get(isAuthenticatedUser, getmyProfile);
// delete my profile
router.route("/me").delete(isAuthenticatedUser, deleteMyProfile);
// change password
router.route("/changepassword").put(isAuthenticatedUser, changePassword);
// update profile
router.route("/updateprofile").put(isAuthenticatedUser, updateProfile);
// update profile picture
router
  .route("/updateprofilepicture")
  .put(isAuthenticatedUser, singleUpload, updateProfilePicture);
// forget password
// reset password
router.route("/forgetpassword").post(forgotPassword);

router.route("/resetpassword/:token").put(resetPassword);
// add to playlist
router.route("/addtoplaylist").post(isAuthenticatedUser, addToPlaylist);
// remove from playlist
router
  .route("/removefromplaylist")
  .delete(isAuthenticatedUser, removeFromPlaylist);

// admin routes
router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeAdmin, getAllUsers);
router
  .route("/admin/user/:id")
  .put(isAuthenticatedUser, authorizeAdmin, updateUserRole)
  .delete(isAuthenticatedUser, authorizeAdmin, deleteUser);
export default router;
