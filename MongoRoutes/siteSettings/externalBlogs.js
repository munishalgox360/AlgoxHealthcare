const express = require("express");
const router = express.Router();
const { ExternalBlogs } = require("../../schemas/ExternalBlogs");

router.get("/", (req, res) => {
  const search = req.query.search;
  const keyword = req.query.keyword;
  const id = req.query.id;
  if (id) {
    ExternalBlogs.findOne({ _id: id })
      .then((success) => {
        if (success === null) {
          res
            .status(200)
            .json({ status: 200, message: "ExternalBlogs does not exist" });
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
  } else if (search) {
    ExternalBlogs.find({ displayName: { $regex: search, $options: "i" } })
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
  } else if (keyword) {
    ExternalBlogs.find({ displayName: keyword })
      .then((response) => {
        console.log("reached keyword");
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
    ExternalBlogs.find()
      .then((success) => {
        if (success === null) {
          res
            .status(200)
            .json({ status: 200, message: "ExternalBlogs does not exist" });
        } else {
          res.status(200).json({
            status: 200,
            message: `Success`,
            data: success,
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
    const form = new ExternalBlogs(data);
    form
      .save()
      .then((result) => {
        res.json({
          status: "200",
          message: "Success",
          data: { ExternalBlogs: form },
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
    ExternalBlogs.findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .then((result) => {
        if (result === null) {
          res.status(400).json({
            status: 400,
            message: "ExternalBlogs does not exist",
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
    ExternalBlogs.findOneAndDelete({ _id: id })
      .then((success) => {
        if (success === null) {
          res.status(200).json({
            status: 200,
            message: "ExternalBlogs does not exist",
          });
        } else {
          res.status(200).json({
            status: 200,
            message: `Successfully deleted ExternalBlogs`,
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
