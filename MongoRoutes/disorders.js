const express = require("express");
const router = express.Router();
const { Disorder } = require("../schemas/User");

router.get("/", (req, res) => {
  Disorder.find().then((result) => {
    res.status(200).json({
      status: 200,
      message: "Success",
      data: result
    });
  });
});

module.exports = router;
