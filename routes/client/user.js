const express = require("express");
const router = express.Router();
const firebase = require("../../lib/firebase.prod.js");

router.post("/getUser", (req, res) => {
  const userCredential = req.body.credential;
  const userType = req.query.type;
  const document = req.query.doc;
  const collectionName = req.query.collection;
  if (!userCredential || !userType || !collectionName) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    firebase.fs
      .firestore()
      .collection(collectionName)
      .doc(userCredential)
      .get()
      .then((result) => {
        if (result.empty || result.data()?.type !== userType) {
          res.status(200).json({ status: 200, message: "User does not exist" });
        } else {
          res.status(200).json({
            status: 200,
            message: `Successfully sent document ${document}`,
            data: document ? result.data()[document] : { ...result.data() },
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

router.put("/user", (req, res) => {
  const userCredential = req.body.credential;
  const userType = req.query.type;
  const userData = req.body.data;
  if (!userType || !userCredential || !userData) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    if (userType === "patient") {
      firebase.fs
        .firestore()
        .collection("user-patients")
        .doc(userCredential)
        .update({ ...userData })
        .then((result) => {
          res
            .status(200)
            .json({ status: 200, message: "Successfully updated user data" });
        })
        .catch((err) => {
          console.log(err);
          res.status(400).json({
            status: 400,
            message: "Invalid user",
          });
        });
    } else if (userType === "doctor") {
      firebase.fs
        .firestore()
        .collection("user-doctors")
        .doc(userCredential)
        .update({ ...userData })
        .then((result) => {
          res
            .status(200)
            .json({ status: 200, message: "Successfully updated user data" });
        })
        .catch((err) => {
          console.log(err);
          res.status(400).json({
            status: 400,
            message: "Invalid user",
          });
        });
    } else {
      res.status(401).json({ status: 401, message: "Not valid user type" });
    }
  }
});

router.get("/getAllUsers", (req, res) => {
  const userType = req.query.type;
  if (!userType) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    if (userType === "patient") {
      firebase.fs
        .firestore()
        .collection("user-patients")
        .get()
        .then((result) => {
          if (result.empty) {
            res.status(200).json({ status: 200, message: "Success", data: {} });
          } else {
            const data = result.docs.map((contentObj) => ({
              ...contentObj.data()
            }));
            res.status(200).json({
              status: 200,
              message: "Success",
              data: data
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
    } else if (userType === "doctor") {
      const doctorType = userType;

      if (!doctorType) {
      } else {
        firebase.fs
          .firestore()
          .collection("user-doctors")
          .get()
          .then((result) => {
            if (result.empty) {
              res
                .status(200)
                .json({ status: 200, message: "Success", data: {} });
            } else {
              const data = result.docs.map((contentObj) => ({
                ...contentObj.data()
              }));
              // const returnData = data.map(
              //   (doctor) => doctor.category[0] === doctorType
              // );
              res.status(200).json({
                status: 200,
                message: "Success",
                data: data
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
    } else {
      res.status(401).json({ status: 401, message: "Not valid user type" });
    }
  }
});
router.post("/user", (req, res) => {
  const userType = req.query.type;
  const userData = req.body.user;
  const userPhoneNumber = req.body.number;
  const userEmail = req.body.email;
  if (!userType || !userData) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    firebase.fs
      .firestore()
      .collection("user")
      .add(userData)
      .then((result) => {
        firebase.fs
          .firestore()
          .collection("userCheck")
          .doc(userPhoneNumber)
          .set({ ...userData, uid: result.id })
          .then(() => {
            firebase.fs
              .firestore()
              .collection("userCheckEmail")
              .doc(userEmail)
              .set({ ...userData, uid: result.id })
              .then(() => {
                if (userType === "doctor") {
                  firebase.fs
                    .firestore()
                    .collection("user-doctors")
                    .doc(result.id)
                    .set({ ...userData, uid: result.id })
                    .then(() => {
                      res.json({
                        status: "200",
                        message: "Success",
                        data: { userId: result.id }
                      });
                    });
                } else {
                  firebase.fs
                    .firestore()
                    .collection("user-patients")
                    .doc(result.id)
                    .set({ ...userData, uid: result.id })
                    .then(() => {
                      res.json({
                        status: "200",
                        message: "Success",
                        data: { userId: result.id }
                      });
                    });
                }
              });
          });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Error. Please try again" });
      });
  }
});

router.post("/delete", (req, res) => {
  const phone = req.body.phone;
  const email = req.body.email;
  const uid = req.body.uid;
  const type = req.query.type;
  if (!phone || !email || !uid || !type) {
    res.json({ status: 400, message: "Incomplete User Credentials" });
  } else {
    firebase.fs
      .firestore()
      .collection("user")
      .doc(uid)
      .delete()
      .then(() => {
        firebase.fs
          .firestore()
          .collection("userCheck")
          .doc(phone)
          .delete()
          .then(() => {
            firebase.fs
              .firestore()
              .collection("userCheckEmail")
              .doc(email)
              .delete()
              .then(() => {
                if (type === "doctor") {
                  firebase.fs
                    .firestore()
                    .collection("user-doctors")
                    .doc(uid)
                    .delete()
                    .then(() => {
                      res.json({ status: 200, message: "Success" });
                    });
                } else if (type === "patient") {
                  firebase.fs
                    .firestore()
                    .collection("user-patients")
                    .doc(uid)
                    .delete()
                    .then(() => {
                      res.json({ status: 200, message: "Success" });
                    });
                }
              });
          });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: 500, message: "Server error" });
      });
  }
});

module.exports = router;