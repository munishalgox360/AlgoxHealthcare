const express = require("express");
const router = express.Router();
const sendEmail = require("../../routes/payment/utils/sendEmail");
const sendSMS = require("../../routes/payment/utils/sendSms");
const sendWhatsappMessage = require("../../routes/payment/utils/sendWhatsappMessage");
const { User } = require("../../schemas/User");

router.get("/details", (req, res) => {
  const type = req.query.type;
  const uid = req.query.uid;
  if (!uid || !type) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    User.findOne({
      uid: uid,
      type: type
    })
      .then((result) => {
        if (result === null) {
          res.status(200).json({ status: 200, message: "User does not exist" });
        } else {
          if (result._doc.appointments) {
            res.status(200).json({
              status: 200,
              message: "Success",
              data: { appointments: result._doc.appointments }
            });
          } else {
            res.status(200).json({
              status: 200,
              message: "Success",
              data: []
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
  if (!patientUid || !type) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    if (type === "appointment") {
      if (dbPopulate) {
        User.findOneAndUpdate(
          { uid: doctorUid, type: "doctor" },
          { $push: { appointments: bookingDetails } }
        ).then((doctorResult) => {
          if (doctorResult === null) {
            res
              .status(401)
              .json({ status: 401, message: "Invalid doctor uid" });
          } else {
            User.findOneAndUpdate(
              { uid: patientUid, type: "patient" },
              {
                $push: {
                  appointments: bookingDetails,
                  transactions: bookingDetails
                }
              },
              { new: true }
            ).then((patientResult) => {
              if (patientResult === null) {
                User.findOneAndUpdate(
                  { uid: doctorUid, type: "doctor" },
                  { ...doctorResult._doc }
                );
                res
                  .status(401)
                  .json({ status: 401, message: "Invalid patient uid" });
              } else {
                if (smsCheck) {
                  sendSMS(bookingDetails, bookingDetails.patientsPhoneNumber);
                }
                if (emailCheck) {
                  sendEmail(bookingDetails, bookingDetails.patientsEmail);
                  sendEmail(bookingDetails, bookingDetails.doctorEmail);
                }
                if (whatsappCheck) {
                  sendWhatsappMessage(patientUid, bookingDetails, "patient");
                  sendWhatsappMessage(doctorUid, bookingDetails, "doctor");
                }
                User.findOne({ uid: doctorUid, type: "doctor" }).then(
                  (doctorResultNew) => {
                    res.status(200).json({
                      status: 200,
                      message: "Success",
                      data: {
                        patientAppointments: [
                          ...patientResult._doc.appointments
                        ],
                        doctorAppointments: [
                          ...doctorResultNew._doc.appointments
                        ]
                      }
                    });
                  }
                );
              }
            });
          }
        });
      } else if (dbUpdate) {
        User.findOne({ uid: doctorUid, type: "doctor" })
          .then((doctorResult) => {
            if (doctorResult === null) {
              res
                .status(401)
                .json({ status: 401, message: "Invalid doctor uid" });
            } else {
              const copyAppointmentsDoctor = doctorResult._doc.appointments;
              const updateIndexDoctor = copyAppointmentsDoctor.findIndex(
                (appointment) =>
                  appointment.bookingId === bookingDetails.bookingId
              );
              if (updateIndexDoctor !== -1) {
                copyAppointmentsDoctor[updateIndexDoctor] = bookingDetails;
              }
              User.findOneAndUpdate(
                { uid: doctorUid, type: "doctor" },
                { $set: { appointments: copyAppointmentsDoctor } }
              ).then(() => {
                User.findOne({ uid: patientUid, type: "patient" }).then(
                  (patientResult) => {
                    if (patientResult === null) {
                      User.findOneAndUpdate(
                        { uid: doctorUid, type: "doctor" },
                        { ...doctorResult._doc }
                      );
                      res
                        .status(401)
                        .json({ status: 401, message: "Invalid patient uid" });
                    } else {
                      const copyAppointmentsPatient =
                        patientResult._doc.appointments;
                      const updateIndexPatient =
                        copyAppointmentsPatient.findIndex(
                          (appointment) =>
                            appointment.bookingId === bookingDetails.bookingId
                        );
                      if (updateIndexPatient !== -1) {
                        copyAppointmentsPatient[updateIndexPatient] =
                          bookingDetails;
                      }
                      User.findOneAndUpdate(
                        { uid: patientUid, type: "patient" },
                        { $set: { appointments: copyAppointmentsPatient } }
                      ).then(() => {
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
                          message: "Success here",
                          data: {
                            patientAppointments: [...copyAppointmentsPatient],
                            doctorAppointments: [...copyAppointmentsDoctor]
                          }
                        });
                      });
                    }
                  }
                );
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
      if (
        (smsCheck || emailCheck || whatsappCheck) &&
        !dbPopulate &&
        !dbUpdate
      ) {
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
        (smsCheck || emailCheck || whatsappCheck) &&
        !dbPopulate &&
        !dbUpdate
      ) {
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
        res.status(400).json({
          status: 400,
          message: "No fields to update or send message"
        });
      }
    } else if (type === "assessment" || type === "RTMS") {
      User.findOneAndUpdate(
        { uid: patientUid, type: "patient" },
        { $push: { transactions: bookingDetails } },
        { new: true }
      ).then((patientResult) => {
        if (patientResult === null) {
          res.status(401).json({ status: 401, message: "Invalid patient uid" });
        } else {
          res.status(200).json({
            status: 200,
            message: "Success",
            data: {
              patientAssessments: [...patientResult._doc.transactions]
            }
          });
        }
      });
    }
  }
});

module.exports = router;
