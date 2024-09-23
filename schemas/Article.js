const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  id: String,
  title: String,
  author: String,
  date: String,
  description: String,
  images: String,
  banner: String,
  para1: String,
  para2: String,  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

});

const Article = mongoose.model("Article", articleSchema);

module.exports = { Article };
