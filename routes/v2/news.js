const express = require("express");
const router = express.Router();
const { News } = require("../../schemas/v2/News");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  const newsData = req.body

  if (!newsData) {
    res.status(400).json({ status: 400, message: "Invalid data"});
  }
  try {
    const result = await News.create(newsData) 
    if (result) {
      res.status(200).json({
        status: 200,
        message: "News has been created successfully",
        data: result
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the news data",
    });
  } 
})

router.get("/:id", async (req, res) => {
  const newsId = req.params.id

  if (!newsId) {
    res.status(400).json({ status: 400, message: "Invalid news id"});
  }
  try {
    const result = await News.find({ _id: new ObjectId(newsId) })
    if (result) {
      res.status(200).json({
        status: 200,
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in fetching the news by id",
    });
  } 
})

router.get("/", async (req, res) => {
  try {
    const result = await News.find()  
    if (result) {
      res.status(200).json({
        status: 200,
        count: result.length,
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in fetching all the news data",
    });
  } 
})

router.put("/:id", async (req, res) => {
  const newsUpdatedData = req.body
  const newsId = req.params.id

  if (!newsUpdatedData) {
    res.status(400).json({ status: 400, message: "Invalid news update data"});
  }
  try {
    const updateDoc = {
      $set: newsUpdatedData
    }
    const result = await News.updateOne({ _id: new ObjectId(newsId) }, updateDoc)
    if (result) {
      res.status(200).json({
        status: 200,
        message: "news data has been updated successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while updating the news data",
    });
  } 
})

router.delete("/:id", async (req, res) => {
  const newsId = req.params.id
  if (!newsId) {
    res.status(400).json({ status: 400, message: "Invalid news id"});
  }
  try {
    const result = await News.deleteOne({ _id: new ObjectId(newsId) })
    if (result) {
      res.status(200).json({
        status: 200,
        message: "news data has been deleted successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while deleting the news",
    });
  } 
})

module.exports = router;
