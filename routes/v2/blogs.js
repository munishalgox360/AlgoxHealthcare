const express = require("express");
const router = express.Router();
const { Blogs } = require("../../schemas/v2/Blogs");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  const blogsData = req.body

  if (!blogsData) {
    res.status(400).json({ status: 400, message: "Invalid data"});
  }
  try {
    const result = await Blogs.create(blogsData) 
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Blogs has been created successfully",
        data: result
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the blog data",
    });
  } 
})

router.get("/:id", async (req, res) => {
  const blogId = req.params.id

  if (!blogId) {
    res.status(400).json({ status: 400, message: "Invalid blog id"});
  }
  try {
    const result = await Blogs.find({ _id: new ObjectId(blogId) })
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
      message: "Error in fetching the blog by id",
    });
  } 
})

router.get("/", async (req, res) => {
  try {
    const result = await Blogs.find()  
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
      message: "Error in fetching all the blogs data",
    });
  } 
})

router.put("/:id", async (req, res) => {
  const blogUpdatedData = req.body
  const blogId = req.params.id

  if (!blogUpdatedData) {
    res.status(400).json({ status: 400, message: "Invalid blog update data"});
  }
  try {
    const updateDoc = {
      $set: blogUpdatedData
    }
    const result = await Blogs.updateOne({ _id: new ObjectId(blogId) }, updateDoc)
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Blog data has been updated successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while updating the blog data",
    });
  } 
})

router.delete("/:id", async (req, res) => {
  const blogId = req.params.id
  if (!blogId) {
    res.status(400).json({ status: 400, message: "Invalid blog id"});
  }
  try {
    const result = await Blogs.deleteOne({ _id: new ObjectId(blogId) })
    if (result) {
      res.status(200).json({
        status: 200,
        message: "Blog data has been deleted successfully",
        data: result,
      });
    }
  }
  catch(error) {
    res.status(500).json({
      status: 500,
      message: "Error while deleting the blog",
    });
  } 
})


module.exports = router;
