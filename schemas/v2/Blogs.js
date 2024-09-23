const mongoose = require("mongoose");

const blogsSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  thumbnail: String,
  description: String,
  videoLink: String,
  audioLink: String,
  type: {
    type: String,
    enum: ["content", "video", "audio"],
    required: true
  },
  content1: String,
  content2: String,
  content3: String,
  readingTime: String,
  comments: [mongoose.Mixed],
  author: [mongoose.Mixed],
  tags: [mongoose.Mixed],
  views: [mongoose.Mixed],
  publisherId: {
    type: String
  },
  publisherName: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "draft", "active", "inactive"],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Blogs = mongoose.model("Blogs", blogsSchema);

module.exports = { Blogs };
