const mongoose = require("mongoose");

const videosSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  thumbnail: String,
  description: String,
  videoLink: String,
  type: {
    type: String,
    default: "video"
  },
  author: [mongoose.Mixed],
  tags: [mongoose.Mixed],
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

const Videos = mongoose.model("Videos1", videosSchema);

module.exports = { Videos };
