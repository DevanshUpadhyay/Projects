import mongoose from "mongoose";
const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please Enter Blog Title"],
    maxLength: [120, "Title cannot exceeds 120 characters"],
    minLength: [3, "Title should have more than 3 characters"],
    // trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter Description"],
    minLength: [20, "Description should have more than 20 characters"],
  },
  content: {
    type: String,
    required: [true, "Please Enter Description"],
  },
  poster: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  views: {
    type: Number,
    default: 0,
  },

  category: {
    type: String,
    required: [true, "Please Enter Lecture Category"],
  },

  createdBy: {
    type: String,
    required: [true, "Enter Course Creator  Name"],
  },
  postedAt: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
export const Blog = mongoose.model("Blog", schema);
