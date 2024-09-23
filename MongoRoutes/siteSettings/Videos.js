const express = require("express");
const router = express.Router();
const { Videos } = require("../../schemas/Videos");

router.get("/all", (req, res) => {
  const search = req.query.search;
  if (search) {
    Videos.find({ title: { $regex: search, $options: "i" } })
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
    Videos.find()
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
  Videos.find()
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
});

router.post("/", (req, res) => {
  const data = req.body.data;
  if (!data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    const form = new Videos(data);
    form
      .save()
      .then((result) => {
        res.json({
          status: "200",
          message: "Success",
          data: { Videos: form },
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
    Videos.findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .then((result) => {
        if (result === null) {
          res.status(400).json({
            status: 400,
            message: "Videos does not exist",
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
    Videos.findOneAndDelete({ _id: id })
      .then((success) => {
        if (success === null) {
          res.status(200).json({
            status: 200,
            message: "Videos does not exist",
          });
        } else {
          res.status(200).json({
            status: 200,
            message: `Successfully deleted Videos`,
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
