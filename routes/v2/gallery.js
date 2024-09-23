const express = require("express");
const router = express.Router();
const { Gallery } = require("../../schemas/v2/Gallery");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  const articlesData = req.body

  if (!articlesData) {
    res.status(400).json({ status: 400, message: "Invalid data"});
  }
  try {
    const result = await Gallery.create(articlesData) 
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Gallery has been created successfully",
        data: result
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the gallery data",
    });
  } 
})

router.get("/:id", async (req, res) => {
  const articleId = req.params.id

  if (!articleId) {
    res.status(400).json({ status: 400, message: "Invalid gallery id"});
  }
  try {
    const result = await Gallery.find({ _id: new ObjectId(articleId) })
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
      message: "Error in fetching the gallery by id",
    });
  } 
})

router.get("/", async (req, res) => {
  try {
    const result = await Gallery.find()  
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
      message: "Error in fetching all the gallery data",
    });
  } 
})

router.put("/:id", async (req, res) => {
  const articleUpdatedData = req.body
  const articleId = req.params.id

  if (!articleUpdatedData) {
    res.status(400).json({ status: 400, message: "Invalid gallery update data"});
  }
  try {
    const updateDoc = {
      $set: articleUpdatedData
    }
    const result = await Gallery.updateOne({ _id: new ObjectId(articleId) }, updateDoc)
    if (result) {
      res.status(200).json({
        status: 200,
        message: "gallery data has been updated successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while updating the gallery data",
    });
  } 
})

router.delete("/:id", async (req, res) => {
  const articleId = req.params.id
  if (!articleId) {
    res.status(400).json({ status: 400, message: "Invalid gallery id"});
  }
  try {
    const result = await Gallery.deleteOne({ _id: new ObjectId(articleId) })
    if (result) {
      res.status(200).json({
        status: 200,
        message: "gallery data has been deleted successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while deleting the gallery",
    });
  } 
})

module.exports = router;
