const express = require("express");
const router = express.Router();
const firebase = require("../../lib/firebase.prod.js");

router.get("/patients", (req, res) => {
  const token = req.header("authorization");
  if (token) {
    if (token == process.env.PASSKEY) {
      firebase.fs
        .firestore()
        .collection("user-patients")
        .get()
        .then((snapshot) => {
          const allPatients = snapshot.docs.map((contentObj) => ({
            ...contentObj.data(),
            docId: contentObj.id
          }));
          res
            .status(200)
            .json({ status: 200, message: "Success", data: allPatients });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            status: 500,
            message: "Server error in processing your request"
          });
        });
    } else {
      res.status(401).json({ status: 401, message: "No valid token found" });
    }
  } else {
    res.status(401).json({ status: 401, message: "No valid token found" });
  }
});

module.exports = router;
