const mongoose = require("mongoose");

const VideosSchema = new mongoose.Schema({
  displayName: { type: mongoose.Mixed },
  link: { type: mongoose.Mixed },
  type: { type: mongoose.Mixed },
  active: { type: mongoose.Mixed },
  category: { type: mongoose.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Videos = mongoose.model("Videos", VideosSchema);

module.exports = { Videos };
