const express = require("express");
const router = express.Router();
const { Podcast } = require("../../schemas/v2/Podcast");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  const podcastsData = req.body

  if (!podcastsData) {
    res.status(400).json({ status: 400, message: "Invalid data"});
  }
  try {
    const result = await Podcast.create(podcastsData) 
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Podcast has been created successfully",
        data: result
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the podcast data",
    });
  } 
})

router.get("/:id", async (req, res) => {
  const podcastId = req.params.id

  if (!podcastId) {
    res.status(400).json({ status: 400, message: "Invalid podcast id"});
  }
  try {
    const result = await Podcast.find({ _id: new ObjectId(podcastId) })
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
      message: "Error in fetching the podcast by id",
    });
  } 
})

router.get("/", async (req, res) => {
  try {
    const result = await Podcast.find()  
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
      message: "Error in fetching all the podcasts data",
    });
  } 
})

router.put("/:id", async (req, res) => {
  const podcastUpdatedData = req.body
  const podcastId = req.params.id

  if (!podcastUpdatedData) {
    res.status(400).json({ status: 400, message: "Invalid podcast update data"});
  }
  try {
    const updateDoc = {
      $set: podcastUpdatedData
    }
    const result = await Podcast.updateOne({ _id: new ObjectId(podcastId) }, updateDoc)
    if (result) {
      res.status(200).json({
        status: 200,
        message: "podcast data has been updated successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while updating the podcast data",
    });
  } 
})

router.delete("/:id", async (req, res) => {
  const podcastId = req.params.id
  if (!podcastId) {
    res.status(400).json({ status: 400, message: "Invalid podcast id"});
  }
  try {
    const result = await Podcast.deleteOne({ _id: new ObjectId(podcastId) })
    if (result) {
      res.status(200).json({
        status: 200,
        message: "podcast data has been deleted successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while deleting the podcast",
    });
  } 
})

module.exports = router;
