const express = require("express");
const router = express.Router();
const { Videos } = require("../../schemas/v2//Videos");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  const videosData = req.body

  if (!videosData) {
    res.status(400).json({ status: 400, message: "Invalid data"});
  }
  try {
    const result = await Videos.create(videosData) 
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Videos has been created successfully",
        data: result
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the videos data",
    });
  } 
})

router.get("/:id", async (req, res) => {
  const videosId = req.params.id

  if (!videosId) {
    res.status(400).json({ status: 400, message: "Invalid videos id"});
  }
  try {
    const result = await Videos.find({ _id: new ObjectId(videosId) })
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
      message: "Error in fetching the videos by id",
    });
  } 
})

router.get("/", async (req, res) => {
  try {
    const result = await Videos.find()  
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
      message: "Error in fetching all the videoss data",
    });
  } 
})

router.put("/:id", async (req, res) => {
  const videosUpdatedData = req.body
  const videosId = req.params.id

  if (!videosUpdatedData) {
    res.status(400).json({ status: 400, message: "Invalid videos update data"});
  }
  try {
    const updateDoc = {
      $set: videosUpdatedData
    }
    const result = await Videos.updateOne({ _id: new ObjectId(videosId) }, updateDoc)
    if (result) {
      res.status(200).json({
        status: 200,
        message: "videos data has been updated successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while updating the videos data",
    });
  } 
})

router.delete("/:id", async (req, res) => {
  const videosId = req.params.id
  if (!videosId) {
    res.status(400).json({ status: 400, message: "Invalid videos id"});
  }
  try {
    const result = await Videos.deleteOne({ _id: new ObjectId(videosId) })
    if (result) {
      res.status(200).json({
        status: 200,
        message: "videos data has been deleted successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while deleting the videos",
    });
  } 
})

module.exports = router;
