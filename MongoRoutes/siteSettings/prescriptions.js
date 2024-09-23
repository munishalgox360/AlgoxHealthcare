const express = require("express");
const router = express.Router();
const { Prescriptions } = require("../../schemas/Prescriptions");
const { Timeline } = require("../../schemas/Timeline");

router.get("/", (req, res) => {
  const { search, keyword, id, prescriptionID, number } = req.query;
  let query = {};

  if (id) {
    query = { "user._id": id };
  } else if (search) {
    query = { number: { $regex: search, $options: "i" } };
  } else if (prescriptionID) {
    query = { _id: prescriptionID };
  } else if (keyword) {
    query = { displayName: keyword };
  } else if (number) {
    query = { number: number };
  }

  Prescriptions.find(query)
    .then((success) => {
      if (!success) {
        return res
          .status(200)
          .json({ status: 200, message: "User Prescriptions does not exist" });
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
    const form = new Prescriptions(data);
    const timeline = {
      userId: [data.user._id, data.createdBy._id],
      type: "prescriptions",
      title: `Prescription`,
      description: `Prescription added by ${data.createdBy.displayName} in the name of ${data.user.displayName}`,
    };
    const time = new Timeline(timeline);
    form
      .save()
      .then((result) => {
        time.postId = result._id;
        time
          .save()
          .then((result) => {
            res.json({
              status: "200",
              message: "Success",
              data: { Prescriptions: form },
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({ message: "Error In adding to timeline" });
          });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Error In adding to prescriptions" });
      });
  }
});

router.put("/", (req, res) => {
  const id = req.query.id;
  const data = req.body.data;
  if (!id || !data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    Prescriptions.findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .then((result) => {
        if (result === null) {
          res.status(400).json({
            status: 400,
            message: "Prescriptions does not exist",
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
    Prescriptions.findOneAndDelete({ _id: id })
      .then((success) => {
        if (success === null) {
          res.status(200).json({
            status: 200,
            message: "Prescriptions does not exist",
          });
        } else {
          res.status(200).json({
            status: 200,
            message: `Successfully deleted Prescriptions`,
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
