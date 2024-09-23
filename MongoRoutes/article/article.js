const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { Article } = require("../../schemas/Article");

router.get("/all", (req, res) => {
  const search = req.query.search;
  if (search) {
    Article.find({ title: { $regex: search, $options: "i" } })
      .then((response) => {
        res.json({ status: 200, data: response, message: `Success` });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  } else {
    Article.find()
      .then((response) => {
        res.json({ status: 200, data: response, message: `Success` });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  }
});

router.get("/", (req, res) => {
  const id = req.query.id;
  if (!id) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    Article.findOne({ _id: id })
      .then((success) => {
        if (success === null) {
          res
            .status(200)
            .json({ status: 200, message: "Article does not exist" });
        } else {
          res.status(200).json({
            status: 200,
            message: `Success`,
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

router.post("/", (req, res) => {
  const data = req.body.data;
  if (!data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    const id = uuidv4();
    const article = new Article({
      ...data,
      id: id,
    });
    article
      .save()
      .then((result) => {
        res.json({
          status: "200",
          message: "Success",
          data: { id: id, article: article },
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
    Article.findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .then((result) => {
        if (result === null) {
          res
            .status(400)
            .json({ status: 400, message: "Article does not exist" });
        } else {
          res.status(200).json({
            status: 200,
            message: "Successfully updated article data",
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
    Article.findOneAndDelete({ _id: id })
      .then((success) => {
        if (success === null) {
          res
            .status(200)
            .json({ status: 200, message: "Article does not exist" });
        } else {
          res.status(200).json({
            status: 200,
            message: `Successfully deleted Article`,
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
