import mongoose from "mongoose";
const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please Enter Course Title"],
    maxLength: [80, "Title cannot exceeds 80 characters"],
    minLength: [4, "Title should have more than 4 characters"],
    // trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter Description"],
    minLength: [20, "Description should have more than 20 characters"],
  },
  language: {
    type: String,
    required: [true, "Please Enter Course Language"],
  },
  sections: [
    {
      title: {
        type: String,
        required: [true, "Please Enter Lecture Title"],
      },
      description: {
        type: String,
        required: [true, "Please Enter Description"],
        minLength: [20, "Description should have more than 20 characters"],
      },
      lectures: [
        {
          title: {
            type: String,
            required: [true, "Please Enter Lecture Title"],
          },
          description: {
            type: String,
            required: [true, "Please Enter Description"],
            minLength: [20, "Description should have more than 20 characters"],
          },
          video: {
            public_id: {
              type: String,
              required: true,
            },
            url: {
              type: String,
              required: true,
            },
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  ],
  details: {
    learningPoints: [
      {
        points: {
          type: String,
        },
      },
    ],
    content: [
      {
        points: {
          type: String,
        },
      },
    ],
  },
  lectures: [
    {
      title: {
        type: String,
        required: [true, "Please Enter Lecture Title"],
      },
      description: {
        type: String,
        required: [true, "Please Enter Description"],
        minLength: [20, "Description should have more than 20 characters"],
      },
      video: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  demo: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
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
  subscriptions: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 149,
  },
  overPriced: {
    type: Number,
    default: 249,
  },
  numOfVideos: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: [true, "Please Enter Lecture Category"],
  },

  createdBy: {
    type: String,
    required: [true, "Enter Course Creator Name"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
export const Course = mongoose.model("Course", schema);
