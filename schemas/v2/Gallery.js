const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  thumbnail: String,
  type: {
    type: String,
    default: "image"
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

const Gallery = mongoose.model("Gallery", gallerySchema);

module.exports = { Gallery };
