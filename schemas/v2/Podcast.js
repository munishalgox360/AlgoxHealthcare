const mongoose = require("mongoose");

const podcastSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  thumbnail: String,
  description: String,
  audioLink: String,
  type: {
    type: String,
    default: "audio"
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

const Podcast = mongoose.model("Podcast", podcastSchema);

module.exports = { Podcast };
