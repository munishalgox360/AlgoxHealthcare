const express = require("express");
const router = express.Router();
const firebase = require("../../lib/firebase.prod.js");

router.get("/", (req, res) => {
  const type = req.query.type;
  firebase.fs
    .firestore()
    .collection("mediaGallery")
    .get()
    .then((result) => {
      if (result.empty) {
        res.status(200).json({ status: 200, message: "Media does not exist" });
      } else {
        const data = result.docs.map((contentObj) => ({
          ...contentObj.data()
        }));
        if (type) {
          const newData = data.filter((item) => item.type === type);
          res.status(200).json({
            status: 200,
            message: "Success",
            data: newData
          });
        } else {
          res.status(200).json({
            status: 200,
            message: "Success",
            data: data
          });
        }
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        status: 500,
        message: "Server error in processing your request"
      });
    });
});
module.exports = router;
