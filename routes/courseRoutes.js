import express from "express";
import {
  addCourseContent,
  addCourseLearnings,
  addCourseSections,
  addDemo,
  addSectionlecture,
  addlecture,
  createCourse,
  deleteCourse,
  deleteLecture,
  deleteSection,
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
router.route("/coursedemo/:id").get(getDemoLecture);
router
  .route("/courselearning/:id")
  .post(isAuthenticatedUser, authorizeAdmin, addCourseLearnings)
  .get(getCourseLearning);

router
  .route("/coursecontent/:id")
  .post(isAuthenticatedUser, authorizeAdmin, addCourseContent)
  .get(getCourseContent);
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
router
  .route("/section")
  .delete(isAuthenticatedUser, authorizeAdmin, deleteSection);
router
  .route("/demo/:id")
  .post(isAuthenticatedUser, authorizeAdmin, singleUpload, addDemo);
// router.route("/vimeo/:id/:sid").post(singleUpload, addSectionlectureVimeo);
export default router;
