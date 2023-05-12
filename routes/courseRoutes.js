import express from "express";
import {
  addCourseContent,
  addCourseLearnings,
  addCourseSections,
  addSectionlecture,
  addlecture,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllCourses,
  getCourseContent,
  getCourseLearning,
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
  .route("/courselearning/:id")
  .post(isAuthenticatedUser, authorizeAdmin, addCourseLearnings)
  .get(isAuthenticatedUser, getCourseLearning);

router
  .route("/coursecontent/:id")
  .post(isAuthenticatedUser, authorizeAdmin, addCourseContent)
  .get(isAuthenticatedUser, getCourseContent);
router
  .route("/lecture")
  .delete(isAuthenticatedUser, authorizeAdmin, deleteLecture);
router.route("/coursesection/:id").post(addCourseSections);
router.route("/lecture/:id/:sid").post(singleUpload, addSectionlecture);
export default router;
