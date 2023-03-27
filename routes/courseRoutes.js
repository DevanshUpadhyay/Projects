import express from "express";
import {
  addlecture,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllCourses,
  getCourseLectures,
  getDemoLecture,
} from "../controllers/coursecontroller.js";
import {
  authorizeAdmin,
  isAuthenticatedUser,
  authorizeSubscribers,
} from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";
const router = express.Router();
// get all courses
router.route("/courses").get(getAllCourses);
// create new courses
router
  .route("/createcourse")
  .post(isAuthenticatedUser, authorizeAdmin, singleUpload, createCourse);
// get lecture of the course
router
  .route("/course/:id")
  .get(isAuthenticatedUser, authorizeSubscribers, getCourseLectures)
  .post(isAuthenticatedUser, authorizeAdmin, singleUpload, addlecture)
  .delete(isAuthenticatedUser, authorizeAdmin, deleteCourse);
router.route("/coursedemo/:id").get(isAuthenticatedUser, getDemoLecture);
router
  .route("/lecture")
  .delete(isAuthenticatedUser, authorizeAdmin, deleteLecture);
export default router;
