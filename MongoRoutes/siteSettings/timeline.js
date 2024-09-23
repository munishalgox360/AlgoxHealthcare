const express = require("express");
const router = express.Router();
const { Timeline } = require("../../schemas/Timeline");
const { ObjectID } = require("bson");

router.get("/", (req, res) => {
  const { search, keyword, user, id, number } = req.query;
  let query = {};

  if (user) {
    query = {
      $or: [
        { userId: { $in: [new ObjectID(user)] } }, // Check for ObjectId
        { userId: { $in: [user] } }, // Check for normal id (string)
      ],
    };
    // The `userId: { $in: [user] }` condition checks if the provided `user` exists in the `userId` array
  } else if (search) {
    query = { number: { $regex: search, $options: "i" } };
  } else if (id) {
    query = { _id: id };
  } else if (keyword) {
    query = { displayName: keyword };
  } else if (number) {
    query = { number: number };
  }

  Timeline.find(query)
    .then((success) => {
      if (!success || success.length === 0) {
        return res
          .status(200)
          .json({ status: 200, message: "User Timeline does not exist" });
      }
      res.status(200).json({ status: 200, message: "Success", data: success });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        status: 500,
        message: "Server error in processing your request",
      });
    });
});

router.post("/", (req, res) => {
  const data = req.body.data;
  if (!data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    const form = new Timeline(data);
    form
      .save()
      .then((result) => {
        res.json({
          status: "200",
          message: "Success",
          data: { Timeline: form },
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Error. Please try again" });
      });
  }
});

router.put("/", (req, res) => {
  const id = req.query.id;
  const data = req.body.data;
  if (!id || !data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    Timeline.findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .then((result) => {
        if (result === null) {
          res.status(400).json({
            status: 400,
            message: "Timeline does not exist",
          });
        } else {
          res.status(200).json({
            status: 200,
            message: "Successfully updated form data",
            data: { ...result._doc },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          status: 500,
          message: "Error. Please try again",
        });
      });
  }
});

router.delete("/", (req, res) => {
  const id = req.query.id;
  if (!id) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    Timeline.findOneAndDelete({ _id: id })
      .then((success) => {
        if (success === null) {
          res.status(200).json({
            status: 200,
            message: "Timeline does not exist",
          });
        } else {
          res.status(200).json({
            status: 200,
            message: `Successfully deleted Timeline`,
            data: { ...success._doc },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  }
});

module.exports = router;
