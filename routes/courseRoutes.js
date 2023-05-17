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
  deleteSectionLecture,
  getAllCourses,
  getCourseContent,
  getCourseLearning,
  getCourseLectures,
  getDemoLecture,
  getSectionLectures,
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
  // .get(isAuthenticatedUser, authorizeSubscribers, getCourseLectures)
  .get(isAuthenticatedUser, getCourseLectures)
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
// router
//   .route("/lecture")
//   .delete(isAuthenticatedUser, authorizeAdmin, deleteLecture);
router.route("/coursesection/:id").post(addCourseSections);
router
  .route("/lecture/:id/:sid")
  .get(isAuthenticatedUser, getSectionLectures)
  .post(isAuthenticatedUser, authorizeAdmin, singleUpload, addSectionlecture);
router
  .route("/lecture")
  .delete(isAuthenticatedUser, authorizeAdmin, deleteSectionLecture);
export default router;
