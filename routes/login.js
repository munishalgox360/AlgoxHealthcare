const express = require("express");
const router = express.Router();
const firebase = require("../lib/firebase.prod.js");
const { v4: uuidv4 } = require("uuid");

router.get("/", (req, res) => {
  const number = req.query.credential;
  if (!number) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    firebase.fs
      .firestore()
      .collection("user-patients")
      .where("phone", "==", number)
      .get()
      .then((success) => {
        if (success.empty) {
          res.status(200).json({
            status: 200,
            login: false,
            data: {}
          });
        } else {
          const data = success.docs.map((contentObj) => ({
            ...contentObj.data()
          }));

          res.status(200).json({
            status: 200,
            message: "Success",
            login: true,
            data: { ...data[0] }
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request"
        });
      });
  }
});

router.post("/register", (req, res) => {
  const data = req.body.userData;
  if (!data || !data.uid) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    firebase.fs
      .firestore()
      .collection("user-patients")
      .doc(data.uid)
      .set({ ...data })
      .then((success) => {
        res.status(200).json({
          status: 200,
          message: "Success",
          data: { ...data }
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request"
        });
      });
  }
});

module.exports = router;
