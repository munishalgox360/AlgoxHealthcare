const express = require("express");
const router = express.Router();
const { Music } = require("../../schemas/v2/Music");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  const musicData = req.body

  if (!musicData) {
    res.status(400).json({ status: 400, message: "Invalid data"});
  }
  try {
    const result = await Music.create(musicData) 
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Music has been created successfully",
        data: result
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the music data",
    });
  } 
})

router.get("/:id", async (req, res) => {
  const musicId = req.params.id

  if (!musicId) {
    res.status(400).json({ status: 400, message: "Invalid music id"});
  }
  try {
    const result = await Music.find({ _id: new ObjectId(musicId) })
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
      message: "Error in fetching the music by id",
    });
  } 
})

router.get("/", async (req, res) => {
  try {
    const result = await Music.find()  
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
      message: "Error in fetching all the music data",
    });
  } 
})

router.put("/:id", async (req, res) => {
  const musicUpdatedData = req.body
  const musicId = req.params.id

  if (!musicUpdatedData) {
    res.status(400).json({ status: 400, message: "Invalid music update data"});
  }
  try {
    const updateDoc = {
      $set: musicUpdatedData
    }
    const result = await Music.updateOne({ _id: new ObjectId(musicId) }, updateDoc)
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Music data has been updated successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while updating the music data",
    });
  } 
})

router.delete("/:id", async (req, res) => {
  const musicId = req.params.id
  if (!musicId) {
    res.status(400).json({ status: 400, message: "Invalid music id"});
  }
  try {
    const result = await Music.deleteOne({ _id: new ObjectId(musicId) })
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Music data has been deleted successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while deleting the music",
    });
  } 
})

module.exports = router;
