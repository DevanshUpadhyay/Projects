import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Blog } from "../models/Blog.js";
import getDataUri from "../utils/dataUri.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";

// get all blogs
export const getAllBlogs = catchAsyncErrors(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";
  const page = Number(req.query.page) || 1;
  let limit = 5;
  let skip = (page - 1) * limit;

  const blogs = await Blog.find({
    title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },
  })
    .sort({ createdAt: "desc" })
    .skip(skip)
    .limit(limit);
  res.status(200).json({
    success: true,
    blogs,
  });
});

// get number of blogs
export const getNoOfBlogs = catchAsyncErrors(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";

  const blogs = await Blog.find({
    title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },
  });
  let noOfBlogs = blogs.length;
  res.status(200).json({
    success: true,
    nHits: noOfBlogs,
  });
});

// get all blogs
export const getPopularBlogs = catchAsyncErrors(async (req, res, next) => {
  const popularBlogs = await Blog.find().sort({ views: "desc" }).limit(6);

  res.status(200).json({
    success: true,
    popularBlogs,
  });
});
// get all blogs
export const getRecentBlogs = catchAsyncErrors(async (req, res, next) => {
  const recentBlogs = await Blog.find().sort({ createdAt: "desc" }).limit(6);

  res.status(200).json({
    success: true,
    recentBlogs,
  });
});

// create new blog
export const createBlog = catchAsyncErrors(async (req, res, next) => {
  const { title, description, category, createdBy, content } = req.body;

  if (!title || !description || !category || !createdBy || !content) {
    return next(new ErrorHandler("Please add all fields", 400));
  }

  const file = req.file;

  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const d = new Date();
  let month = months[d.getMonth()];
  let date = d.getDate();
  let year = d.getFullYear();

  await Blog.create({
    title,
    description,
    category,
    createdBy,
    postedAt: `${date} ${month} ${year}`,
    content,
    poster: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    message: "Blog Created Successfully.",
  });
});
// get single blog
export const getSingleBlog = catchAsyncErrors(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }
  blog.views += 1;
  await blog.save();
  res.status(200).json({
    success: true,
    blog,
  });
});
// delete blog
// delete blog
export const deleteBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const blog = await Blog.findById(id);
  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  await cloudinary.v2.uploader.destroy(blog.poster.public_id);

  await blog.deleteOne();

  res.status(200).json({
    success: true,
    message: "Blog Deleted Successfully.",
  });
});
// get all admim blogs
// get all blogs
export const getBlogs = catchAsyncErrors(async (req, res, next) => {
  const adminblogs = await Blog.find().sort({ createdAt: "desc" });
  res.status(200).json({
    success: true,
    adminblogs,
  });
});
// update blog
export const updateBlog = catchAsyncErrors(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }
  const { title, description, category, createdBy, content } = req.body;

  if (!title || !description || !category || !createdBy || !content) {
    return next(new ErrorHandler("Please add all fields", 400));
  }

  const file = req.file;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const d = new Date();
  let month = months[d.getMonth()];
  let date = d.getDate();
  let year = d.getFullYear();

  blog.title = title;
  blog.description = description;
  blog.category = category;
  blog.content = content;
  blog.createdBy = createdBy;
  blog.postedAt = `${date} ${month} ${year}`;

  if (file) {
    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    blog.poster.public_id = myCloud.public_id;
    blog.poster.url = myCloud.secure_url;
  }
  await blog.save();
  res.status(201).json({
    success: true,
    message: "Blog Updated Successfully.",
  });
});
