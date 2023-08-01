import express from "express";

import { authorizeAdmin, isAuthenticatedUser } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogs,
  getNoOfBlogs,
  getPopularBlogs,
  getRecentBlogs,
  getSingleBlog,
  updateBlog,
} from "../controllers/blogcontroller.js";
const router = express.Router();
// get all blogs
router.route("/allblogs").get(getAllBlogs);
// get  blogs
router.route("/blogs").get(getBlogs);
// get number of blogs
router.route("/nfblogs").get(getNoOfBlogs);
// get popular blogs
router.route("/popularblogs").get(getPopularBlogs);
// get recent blogs
router.route("/recentblogs").get(getRecentBlogs);
// create new blog
router.route("/createblog").post(singleUpload, createBlog);
// get single blog
router
  .route("/blog/:id")
  // .get(isAuthenticatedUser, authorizeSubscribers, getCourseLectures)
  .get(getSingleBlog)
  .delete(isAuthenticatedUser, authorizeAdmin, deleteBlog);
// update blog
router.route("/updateblog/:id").post(singleUpload, updateBlog);

export default router;
