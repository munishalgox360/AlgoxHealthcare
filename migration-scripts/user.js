const { User, Assessment } = require("../schemas/User");
const express = require("express");
const firebase = require("../lib/firebase.prod.js");
const router = express.Router();

router.get("/doctors", (req, res) => {
  firebase.fs
    .firestore()
    .collection("user-doctors")
    .get()
    .then((result) => {
      const data = result.docs.map((contentObj) => ({
        ...contentObj.data(),
        type: "doctor",
        role: "1"
      }));
      data.forEach((doctor) => {
        const newDoctor = new User({ ...doctor });
        newDoctor.save();
      });
      res.json({ data: data });
    });
});

router.get("/assessments", (req, res) => {
  firebase.fs
    .firestore()
    .collection("assessments")
    .get()
    .then((result) => {
      const data = result.docs.map((contentObj) => ({
        ...contentObj.data()
      }));
      // data.forEach((assessment) => {
      //   const newAssessment = new Assessment({ ...assessment });
      //   newAssessment.save();
      // });
      res.json({ data: data });
    });
});

router.get("/patients", (req, res) => {
  firebase.fs
    .firestore()
    .collection("user-patients")
    .get()
    .then((result) => {
      const data = result.docs.map((contentObj) => ({
        ...contentObj.data(),
        type: "patient",
        role: "0"
      }));

      data.forEach((patient) => {
        const newPatient = new User({ ...patient });
        newPatient.save();
      });
      res.json({ data: data.length });
    });
});

module.exports = router;
