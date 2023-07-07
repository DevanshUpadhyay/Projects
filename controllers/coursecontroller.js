import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Course } from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import { Stats } from "../models/Stats.js";
import { Vimeo } from "vimeo";
import fs from "fs";
import axios from "axios";

// get all courses
export const getAllCourses = catchAsyncErrors(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";

  const courses = await Course.find({
    title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },
  }).select("-lectures");
  // .sort({ createdAt: "desc" });
  res.status(200).json({
    success: true,
    courses,
  });
});
// craete new courses
export const createCourse = catchAsyncErrors(async (req, res, next) => {
  const { title, description, category, createdBy, language } = req.body;

  if (!title || !description || !category || !createdBy || !language) {
    return next(new ErrorHandler("Please add all fields", 400));
  }

  const file = req.file;

  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await Course.create({
    title,
    description,
    category,
    createdBy,
    language,
    poster: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
    demo: {
      public_id: 0,
      url: 0,
    },
  });

  res.status(201).json({
    success: true,
    message: "Course Created Successfully. You can add lectures now.",
  });
});
// get lecture of the course
export const getCourseLectures = catchAsyncErrors(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  course.views += 1;
  await course.save();
  res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});
// add demo lectures to course
export const addDemoLecture = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  // upload file here
  const file = req.file;
  if (!title || !description) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  course.lectures.push({
    title,
    description,
    video: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  course.numOfVideos = course.lectures.length;
  await course.save();
  res.status(200).json({
    success: true,
    message: "Lecture added in Course",
  });
});
// demo free lecture
export const getDemoLecture = catchAsyncErrors(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  await course.save();
  res.status(200).json({
    success: true,
    singleCourse: course,
  });
});
// add lectures to course
export const addlecture = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  // upload file here
  const file = req.file;
  if (!title || !description) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });
  // if (!title || !description) {
  //   return next(new ErrorHandler("Please add all fields", 400));
  // }

  course.lectures.push({
    title,
    description,
    video: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  // course.numOfVideos = course.lectures.length;
  await course.save();
  res.status(200).json({
    success: true,
    message: "Lecture added in Course",
  });
});
// delete course
export const deleteCourse = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  await cloudinary.v2.uploader.destroy(course.poster.public_id);

  for (let i = 0; i < course.sections.length; i++) {
    for (let j = 0; j < course.sections[i].lectures.length; j++) {
      const singleLecture = course.sections[i].lectures[j];
      await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
        resource_type: "video",
      });
    }
  }
  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Course Deleted Successfully.",
  });
});
// delete lectures from the course
export const deleteLecture = catchAsyncErrors(async (req, res, next) => {
  const { courseId, lectureId } = req.query;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) {
      return item;
    }
  });
  if (!lecture) {
    return next(new ErrorHandler("Lecture not found", 404));
  }
  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) {
      return item;
    }
  });
  course.numOfVideos = course.lectures.length;
  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture Deleted Successfully.",
  });
});

// details
export const addCourseLearnings = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { learning } = req.body;
  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  if (!learning) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  course.details.learningPoints.push({
    points: learning,
  });
  await course.save();
  res.status(200).json({
    success: true,
    message: "Learning Points added in Course",
  });
});
export const addCourseContent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { include } = req.body;
  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  if (!include) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  course.details.content.push({
    points: include,
  });
  await course.save();
  res.status(200).json({
    success: true,
    message: "Content Points added in Course",
  });
});
// get course larning points
export const getCourseLearning = catchAsyncErrors(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  // course.views += 1;
  await course.save();
  res.status(200).json({
    success: true,
    learning: course.details.learningPoints,
  });
});

// get course content poiunts
export const getCourseContent = catchAsyncErrors(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  // course.views += 1;
  await course.save();
  res.status(200).json({
    success: true,
    content: course.details.content,
  });
});
// add sections in the course
export const addCourseSections = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  if (!title || !description) {
    return next(new ErrorHandler("Please add all fields", 400));
  }
  course.sections.push({
    title,
    description,
  });
  await course.save();
  res.status(200).json({
    success: true,
    message: "Section added in Course",
  });
});
// delete lectures from the course section
export const deleteSection = catchAsyncErrors(async (req, res, next) => {
  const { courseId, sectionId } = req.query;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  //
  var index = false;
  for (let i = 0; i < course.sections.length; i++) {
    if (String(course.sections[i]._id) === String(sectionId)) {
      index = i;
    }
  }

  if (!index && index !== 0) {
    return next(new ErrorHandler("Section not found", 404));
  }
  let count = 0;
  for (let i = 0; i < course.sections[index].lectures.length; i++) {
    count++;
    const singleLecture = course.sections[index].lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
      resource_type: "video",
    });
  }
  await course.sections[index].deleteOne();
  // course.sections[index].lectures = course.sections[index].lectures.filter(
  //   (item) => {
  //     if (item._id.toString() !== lectureId.toString()) {
  //       return item;
  //     }
  //   }
  // );

  course.numOfVideos = course.numOfVideos - count;
  await course.save();

  res.status(200).json({
    success: true,
    message: "Section Deleted Successfully.",
  });
});
// add demo
export const addDemo = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  // upload file here
  const file = req.file;

  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  course.demo.public_id = myCloud.public_id;
  course.demo.url = myCloud.secure_url;

  await course.save();
  res.status(200).json({
    success: true,
    message: "Course Demo Added Successfully",
  });
});
// add lectures to section
export const addSectionlecture = catchAsyncErrors(async (req, res, next) => {
  const { id, sid } = req.params;
  const { title, description } = req.body;
  const course = await Course.findById(id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  var index = false;
  for (let i = 0; i < course.sections.length; i++) {
    if (String(course.sections[i]._id) === String(sid)) {
      index = i;
    }
  }

  if (!index && index !== 0) {
    return next(new ErrorHandler("Section not found", 404));
  }
  // upload file here
  const file = req.file;
  // console.log(file);
  const fileUri = getDataUri(file);
  console.log(fileUri);

  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });
  // if (!title || !description) {
  //   return next(new ErrorHandler("Please add all fields", 400));
  // }
  course.sections[index].lectures.push({
    title,
    description,
    video: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  course.numOfVideos = course.numOfVideos + 1;
  await course.save();
  res.status(200).json({
    success: true,
    message: "Lecture added in Course Section",
  });
});
// add lectures to section
// export const addSectionlectureVimeo = catchAsyncErrors(
//   async (req, res, next) => {
//     const { id, sid } = req.params;

//     const course = await Course.findById(id);
//     if (!course) {
//       return next(new ErrorHandler("Course not found", 404));
//     }
//     var index = false;
//     for (let i = 0; i < course.sections.length; i++) {
//       if (String(course.sections[i]._id) === String(sid)) {
//         index = i;
//       }
//     }

//     if (!index && index !== 0) {
//       return next(new ErrorHandler("Section not found", 404));
//     }
//     // upload file here

//     let client = new Vimeo(
//       process.env.client_id,
//       process.env.client_secret,
//       process.env.access_token
//     );
//     async function uploadVideo(filePath) {
//       try {
//         // Step 1: Upload the video file
//         const uploadResponse = await axios({
//           method: "post",
//           url: "https://api.vimeo.com/me/videos",
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//             "Content-Type": "application/json",
//             Accept: "application/vnd.vimeo.*+json;version=3.4",
//           },
//           data: {
//             upload: {
//               approach: "tus",
//               size: fs.statSync(filePath).size,
//             },
//           },
//         });

//         console.log("Video uploaded successfully!");
//       } catch (error) {
//         console.log("Error uploading video:");
//       }
//     }
//     const file = req.file;
//     const fileUri = getDataUri(file);
//     const videoFilePath = file;
//     uploadVideo(videoFilePath);

//     res.status(200).json({
//       success: true,
//       message: "Lecture added in Course Section",
//       // uri: videoUri,
//     });
//   }
// );
// get sections lecture of the course
export const getSectionLectures = catchAsyncErrors(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  var index = false;
  for (let i = 0; i < course.sections.length; i++) {
    if (String(course.sections[i]._id) === String(req.params.sid)) {
      index = i;
    }
  }

  if (!index && index !== 0) {
    return next(new ErrorHandler("Section not found", 404));
  }
  course.views += 1;
  await course.save();
  res.status(200).json({
    success: true,
    lectures: course.sections[index].lectures,
  });
});
// delete lectures from the course section
export const deleteSectionLecture = catchAsyncErrors(async (req, res, next) => {
  const { courseId, sectionId, lectureId } = req.query;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  //
  var index = false;
  for (let i = 0; i < course.sections.length; i++) {
    if (String(course.sections[i]._id) === String(sectionId)) {
      index = i;
    }
  }

  if (!index && index !== 0) {
    return next(new ErrorHandler("Section not found", 404));
  }

  const lecture = course.sections[index].lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) {
      return item;
    }
  });
  if (!lecture) {
    return next(new ErrorHandler("Lecture not found", 404));
  }
  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  course.sections[index].lectures = course.sections[index].lectures.filter(
    (item) => {
      if (item._id.toString() !== lectureId.toString()) {
        return item;
      }
    }
  );
  course.numOfVideos = course.numOfVideos - 1;
  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture Deleted Successfully.",
  });
});

// watcher
Course.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
  const courses = await Course.find({});
  let totalViews = 0;
  for (let i = 0; i < courses.length; i++) {
    totalViews += courses[i].views;
  }
  stats[0].views = totalViews;
  stats[0].createdAt = new Date(Date.now());
  await stats[0].save();
});
