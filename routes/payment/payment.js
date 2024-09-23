const express = require("express");
const router = express.Router();
const firebase = require("../../lib/firebase.prod.js");
const sendEmail = require("./utils/sendEmail.js");
const sendSMS = require("./utils/sendSms");
const sendWhatsappMessage = require("./utils/sendWhatsappMessage");

const FieldValue = require("firebase-admin").firestore.FieldValue;

router.get("/details", (req, res) => {
  const type = req.query.type;
  const uid = req.query.uid;
  if (!uid || !type) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    if (type === "patient") {
      firebase.fs
        .firestore()
        .collection("user-patients")
        .doc(uid)
        .get()
        .then((result) => {
          if (result.empty) {
            res
              .status(200)
              .json({ status: 200, message: "User does not exist" });
          } else {
            if (result.data().appointments) {
              res.status(200).json({
                status: 200,
                message: "Success",
                data: { appointments: result.data().appointments }
              });
            } else {
              res.status(200).json({
                status: 200,
                message: "No appointments for this user",
                data: { appointments: [] }
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
    } else if (type === "doctor") {
      firebase.fs
        .firestore()
        .collection("user-doctors")
        .doc(uid)
        .get()
        .then((result) => {
          if (result.empty) {
            res
              .status(200)
              .json({ status: 200, message: "User does not exist" });
          } else {
            if (result.data().appointments) {
              res.status(200).json({
                status: 200,
                message: "Success",
                data: { appointments: result.data().appointments }
              });
            } else {
              res.status(200).json({
                status: 200,
                message: "No appointments for this user",
                data: { appointments: [] }
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
    } else {
      res.status(401).json({ status: 401, message: "Not valid user type" });
    }
  }
});

router.post("/book", (req, res) => {
  const type = req.query.type;
  const patientUid = req.body.patientUid;
  const doctorUid = req.body.doctorUid;
  const bookingDetails = req.body.bookingDetails;
  const whatsappCheck = req.body.whatsapp;
  const smsCheck = req.body.sms;
  const dbPopulate = req.body.dbPopulate;
  const dbUpdate = req.body.dbUpdate;
  const emailCheck = req.body.email;
  if (!patientUid || !doctorUid || !type) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    if (dbPopulate) {
      const doctorRef = firebase.fs
        .firestore()
        .collection("user-doctors")
        .doc(doctorUid);
      const patientRef = firebase.fs
        .firestore()
        .collection("user-patients")
        .doc(patientUid);
      doctorRef
        .get()
        .then((doctorDoc) => {
          if (doctorDoc.exists) {
            patientRef.get().then((patientDoc) => {
              if (patientDoc.exists) {
                if (patientDoc.data().appointments) {
                  patientRef
                    .update({
                      appointments: [
                        ...patientDoc.data().appointments,
                        {
                          ...bookingDetails
                        }
                      ]
                    })
                    .then(() => {
                      if (doctorDoc.data().appointments) {
                        doctorRef
                          .update({
                            appointments: [
                              ...doctorDoc.data().appointments,
                              {
                                ...bookingDetails
                              }
                            ]
                          })
                          .then(() => {
                            if (smsCheck) {
                              sendSMS(
                                bookingDetails,
                                bookingDetails.patientsPhoneNumber
                              );
                            }
                            if (emailCheck) {
                              sendEmail(
                                bookingDetails,
                                bookingDetails.patientsEmail
                              );
                              sendEmail(
                                bookingDetails,
                                bookingDetails.doctorEmail
                              );
                            }
                            if (whatsappCheck) {
                              sendWhatsappMessage(
                                patientUid,
                                bookingDetails,
                                "patient"
                              );
                              sendWhatsappMessage(
                                doctorUid,
                                bookingDetails,
                                "doctor"
                              );
                            }
                            res.status(200).json({
                              status: 200,
                              message: "Success here"
                            });
                          });
                      } else {
                        doctorRef
                          .update({
                            appointments: [
                              {
                                ...bookingDetails
                              }
                            ]
                          })
                          .then(() => {
                            if (smsCheck) {
                              sendSMS(
                                bookingDetails,
                                bookingDetails.patientsPhoneNumber
                              );
                            }
                            if (emailCheck) {
                              sendEmail(
                                bookingDetails,
                                bookingDetails.patientsEmail
                              );
                              sendEmail(
                                bookingDetails,
                                bookingDetails.doctorEmail
                              );
                            }
                            if (whatsappCheck) {
                              sendWhatsappMessage(
                                patientUid,
                                bookingDetails,
                                "patient"
                              );
                              sendWhatsappMessage(
                                doctorUid,
                                bookingDetails,
                                "doctor"
                              );
                            }
                            res.status(200).json({
                              status: 200,
                              message: "Success here"
                            });
                          });
                      }
                    });
                } else {
                  patientRef
                    .update({
                      appointments: [{ ...bookingDetails }]
                    })
                    .then(() => {
                      if (doctorDoc.data().appointments) {
                        doctorRef
                          .update({
                            appointments: [
                              ...doctorDoc.data().appointments,
                              {
                                ...bookingDetails
                              }
                            ]
                          })
                          .then(() => {
                            if (smsCheck) {
                              sendSMS(
                                bookingDetails,
                                bookingDetails.patientsPhoneNumber
                              );
                            }
                            if (emailCheck) {
                              sendEmail(
                                bookingDetails,
                                bookingDetails.patientsEmail
                              );
                            }
                            if (whatsappCheck) {
                              sendWhatsappMessage(
                                patientUid,
                                bookingDetails,
                                "patient"
                              );
                            }
                            res.status(200).json({
                              status: 200,
                              message: "Success here"
                            });
                          });
                      } else {
                        doctorRef
                          .update({
                            appointments: [
                              {
                                ...bookingDetails
                              }
                            ]
                          })
                          .then(() => {
                            if (smsCheck) {
                              sendSMS(
                                bookingDetails,
                                bookingDetails.patientsPhoneNumber
                              );
                            }
                            if (emailCheck) {
                              sendEmail(
                                bookingDetails,
                                bookingDetails.patientsEmail
                              );
                            }
                            if (whatsappCheck) {
                              sendWhatsappMessage(
                                patientUid,
                                bookingDetails,
                                "patient"
                              );
                            }
                            res.status(200).json({
                              status: 200,
                              message: "Success here"
                            });
                          });
                      }
                    });
                }
              } else {
                res
                  .status(401)
                  .json({ status: 401, message: "Invalid patient uid" });
              }
            });
          } else {
            res
              .status(401)
              .json({ status: 401, message: "Invalid doctor uid" });
          }
        })
        .catch((err) => {
          res.status(500).json({
            status: 500,
            message: "Server error in processing your request."
          });
        });
    } else if (dbUpdate) {
      const doctorRef = firebase.fs
        .firestore()
        .collection("user-doctors")
        .doc(doctorUid);
      const patientRef = firebase.fs
        .firestore()
        .collection("user-patients")
        .doc(patientUid);
      doctorRef
        .get()
        .then((doctorDoc) => {
          if (doctorDoc.exists) {
            patientRef.get().then((patientDoc) => {
              if (patientDoc.exists) {
                const copyAppointmentsPatient =
                  patientDoc.data().appointments || [];
                const updateIndexPatient = copyAppointmentsPatient.findIndex(
                  (appointment) =>
                    appointment.bookingId === bookingDetails.bookingId
                );
                if (updateIndexPatient !== -1) {
                  copyAppointmentsPatient[updateIndexPatient] = bookingDetails;
                }
                patientRef
                  .update({
                    appointments: [...copyAppointmentsPatient]
                  })
                  .then(() => {
                    const copyAppointmentsDoctor =
                      doctorDoc.data().appointments || [];
                    const updateIndexDoctor = copyAppointmentsDoctor.findIndex(
                      (appointment) =>
                        appointment.bookingId === bookingDetails.bookingId
                    );
                    if (updateIndexDoctor !== -1) {
                      copyAppointmentsDoctor[updateIndexDoctor] =
                        bookingDetails;
                    }
                    doctorRef
                      .update({
                        appointments: [...copyAppointmentsDoctor]
                      })
                      .then(() => {
                        if (smsCheck) {
                          sendSMS(
                            bookingDetails,
                            bookingDetails.patientsPhoneNumber
                          );
                        }
                        if (emailCheck) {
                          sendEmail(
                            bookingDetails,
                            bookingDetails.patientsEmail
                          );
                        }
                        if (whatsappCheck) {
                          sendWhatsappMessage(
                            patientUid,
                            bookingDetails,
                            "patient"
                          );
                        }
                        res.status(200).json({
                          status: 200,
                          message: "Success here"
                        });
                      });
                  });
              } else {
                res
                  .status(401)
                  .json({ status: 401, message: "Invalid patient uid" });
              }
            });
          } else {
            res
              .status(401)
              .json({ status: 401, message: "Invalid doctor uid" });
          }
        })
        .catch((err) => {
          res.status(500).json({
            status: 500,
            message: "Server error in processing your request."
          });
        });
    }
    if ((smsCheck || emailCheck || whatsappCheck) && !dbPopulate && !dbUpdate) {
      if (smsCheck) {
        sendSMS(bookingDetails, bookingDetails.patientsPhoneNumber);
      }
      if (emailCheck) {
        sendEmail(bookingDetails, bookingDetails.patientsEmail);
      }
      if (whatsappCheck) {
        sendWhatsappMessage(patientUid, bookingDetails, "patient");
      }
      res.status(200).json({
        status: 200,
        message: "Success here"
      });
    }
    if (
      !smsCheck &&
      !emailCheck &&
      !whatsappCheck &&
      !dbPopulate &&
      !dbUpdate
    ) {
      res.status(200).json({
        status: 200,
        message: "No fields to update or send message"
      });
    }
  }
});

module.exports = router;
