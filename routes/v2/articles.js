const express = require("express");
const router = express.Router();
const { Articles } = require("../../schemas/v2/Articles");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  const articlesData = req.body

  if (!articlesData) {
    res.status(400).json({ status: 400, message: "Invalid data"});
  }
  try {
    const result = await Articles.create(articlesData) 
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Articles has been created successfully",
        data: result
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the article data",
    });
  } 
})

router.get("/:id", async (req, res) => {
  const articleId = req.params.id

  if (!articleId) {
    res.status(400).json({ status: 400, message: "Invalid article id"});
  }
  try {
    const result = await Articles.find({ _id: new ObjectId(articleId) })
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
      message: "Error in fetching the article by id",
    });
  } 
})

router.get("/", async (req, res) => {
  try {
    const result = await Articles.find()  
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
      message: "Error in fetching all the articles data",
    });
  } 
})

router.put("/:id", async (req, res) => {
  const articleUpdatedData = req.body
  const articleId = req.params.id

  if (!articleUpdatedData) {
    res.status(400).json({ status: 400, message: "Invalid article update data"});
  }
  try {
    const updateDoc = {
      $set: articleUpdatedData
    }
    const result = await Articles.updateOne({ _id: new ObjectId(articleId) }, updateDoc)
    if (result) {
      res.status(200).json({
        status: 200,
        message: "article data has been updated successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while updating the article data",
    });
  } 
})

router.delete("/:id", async (req, res) => {
  const articleId = req.params.id
  if (!articleId) {
    res.status(400).json({ status: 400, message: "Invalid article id"});
  }
  try {
    const result = await Articles.deleteOne({ _id: new ObjectId(articleId) })
    if (result) {
      res.status(200).json({
        status: 200,
        message: "article data has been deleted successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while deleting the article",
    });
  } 
})


module.exports = router;
