const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  rank: {
    type: Number
  },
  newsType: {
    type: String,
    enum: ["video", "timesofindia", "indianexpress", "timesnow", "news18", "indiatoday", "music", "podcast"],
  },
  newsTitle: {
    type: String
  },
  newsDescription: {
    type: String
  },
  newsLink: {
    type: String
  },
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
  updatedDate: { type: Date, default: Date.now },
  createdDate: { type: Date, default: Date.now },
});

const News = mongoose.model("News", newsSchema);

module.exports = { News };
