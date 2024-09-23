require("dotenv").config();
const mail = require("@sendgrid/mail");
const {
  generateBookingTemplate,
} = require("../../../templates/generateTemplate");

mail.setApiKey(process.env.MAIL_KEY);

const sendEmail = (bookingData, toEmail) => {
  return new Promise((resolve, reject) => {
    const patientEmail = bookingData.patientsEmail;
    const patientNumber = bookingData.patientsPhoneNumber;
    const patientName = bookingData.patientsName;
    const doctorName = bookingData.doctordisplayName;
    const practiceName = "";
    const appointmentId = bookingData.bookingId;
    const appointmentDate = bookingData.appointmentDate;
    const appointmentSlot = bookingData.slot;
    const bookingType = bookingData.status;
    try {
      mail
        .send({
          to: toEmail,
          from: process.env.MAIL_FROM,
          subject: `Booking Confirmation from Psymate: #${appointmentId}`,
          html: generateBookingTemplate({
            patientEmail,
            patientNumber,
            patientName,
            doctorName,
            practiceName,
            appointmentId,
            appointmentDate,
            appointmentSlot,
            bookingType,
          }),
        })
        .then(() => {
          resolve({ status: 1, message: "Success" });
        });
    } catch {
      reject({ status: 0, message: "Failure" });
    }
  });
};

module.exports = sendEmail;
