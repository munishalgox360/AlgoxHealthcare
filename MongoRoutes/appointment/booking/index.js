const express = require("express");
const router = express.Router();
const { Appointment } = require("../../../schemas/Appointment");
const Session = require("../../../schemas/Sessions");
const moment = require("moment-timezone");
const { User } = require("../../../schemas/User");
const { default: axios } = require("axios");
const { Orders } = require("../../../schemas/Orders");
const { Timeline } = require("../../../schemas/Timeline");
const Coupon = require("../../../schemas/Coupon");
const {
  generateBookingTemplate,
} = require("../../../templates/generateTemplate");
const { Establishments } = require("../../../schemas/Establishments");
const {
  generatePDFFromHTML,
} = require("../../../utils/pdf/GeneratePDFFromHTML");
const sendgrid = require("@sendgrid/mail");
const { s3Uploadv2 } = require("../../../routes/service/s3Service");
const { ObjectId } = require("mongodb");
const { invoiceTemplate } = require("../../../templates/invoiceTemplate");
const fs = require("fs").promises; // Import the built-in 'fs' library to read the PDF file
const uuid = require("uuid").v4;

// Get appointments, orders, and timelines based on user ID or appointment ID
router.get("/", async (req, res) => {
  try {
    const { userId, appointmentId, page = 1, pageSize = 10 } = req.query;

    if (userId) {
      // Retrieve appointments for a specific user
      const userAppointments = await Appointment.find({
        $or: [
          { "patient._id": userId },
          { "doctor._id": userId }, // Assuming doctor IDs are stored in "doctor._id"
        ],
      }).populate("doctorId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      if (userAppointments.length === 0) {
        return res.json({ message: "No appointments found for this user." });
      } else {
        // Retrieve related documents and timelines
        return res.json({ userAppointments });
      }
    } else if (appointmentId) {
      // Retrieve a specific appointment by its ID
      const appointment = await Appointment.findOne({
        bookingId: appointmentId,
      });

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found." });
      }
      // Retrieve related documents and timelines
      const relatedOrder = await Orders.findOne({ appointment: appointmentId });
      const relatedTimelines = await Timeline.find({
        postId: appointment._id,
      });

      return res.json({ appointment, relatedOrder, relatedTimelines });
    } else {
      // Retrieve appointments in descending order with pagination
      const appointments = await Appointment.find({}).populate("doctorId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return res.json({ appointments });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/", async (req, res) => {
  try {
    // Extracting request parameters
    const doctorId = req.body.doctorId;
    const establishmentId = req.body.establishmentId;
    const startTimeStr = req.body.startTime;
    const duration = req.body.duration;
    const payment = req.body.payment || [];
    const coupon = req.body.coupon;
    const amtPaid = payment.reduce((total, paymentItem) => {
      // Parse the amtPaid value as an integer and add it to the total
      return total + parseInt(paymentItem.amtPaid);
    }, 0);
    const timezone = req.header("Timezone") || "Asia/Kolkata"; // Extract the timezone from the custom header
    // Parsing the appointment start time using moment.js
    const startTime = moment(startTimeStr).utc();
    if (!startTime.isValid()) {
      return res.status(400).json({
        error: "Invalid date or time format.",
      });
    }

    // Finding the patient, doctor, and establishment in the database
    const patient = await User.findOne({ _id: req.body.patient });
    if (!patient) {
      return res.status(400).json({
        error: "No valid patient found.",
      });
    }

    const doctor = await User.findOne({ _id: doctorId });
    if (!doctor) {
      return res.status(400).json({
        error: "No valid doctor found.",
      });
    }

    const establishment = await Establishments.findOne({
      _id: establishmentId,
    });
    if (!establishment) {
      return res.status(400).json({
        error: "No valid establishment found.",
      });
    }
    const totalBillAmount = Number(doctor.price) * Number(duration);
    var doctorPrice = Number(doctor.price) * Number(duration);
    var appliedCoupon;
    if (coupon) {
      const couponData = await Coupon.findOne({
        displayName: coupon,
        deleted: false,
      });
      if (!couponData) {
        return res
          .status(400)
          .json({ error: "Coupon not found or is Expired" });
      }
      if (couponData.type == "percentage") {
        const discountedAmount = couponData?.discount / 100;
        doctorPrice = totalBillAmount - discountedAmount * totalBillAmount;
        if (payment) {
          payment[0].discount = discountedAmount * totalBillAmount;
        }
      } else {
        doctorPrice = totalBillAmount - couponData?.discount;
        if (payment) {
          payment[0].discount = couponData?.discount;
        }
      }

      const noOfUses = await Coupon.findOne({
        displayName: coupon,
        "usageHistory.userId": { $in: [new ObjectId(req.body.patient)] },
      });

      if (!noOfUses) {
        const update = {
          $push: {
            usageHistory: { userId: req.body.patient, used: 1 },
          },
          $inc: { currentUses: 1 },
        };
        appliedCoupon = couponData;
        await Coupon.updateOne({ displayName: coupon }, update);
      } else {
        return res
          .status(403)
          .json({ message: "Coupon Already Used", status: 403 });
      }
    }

    const address =
      establishment.establishmentName == "Psymate Virtual"
        ? doctor.meetLink
        : establishment.establishmentAddress;
    // Checking if the requested date falls on a valid weekday for the doctor and establishment
    const requestedWeekday = startTime.format("dddd");
    const doctorSessions = await Session.find({
      doctorId: doctorId,
      establishmentId: establishmentId,
      weekdays: requestedWeekday,
    });

    if (doctorSessions.length === 0) {
      return res.status(400).json({
        error: `Doctor is not available on ${requestedWeekday}.`,
      });
    }

    // Checking if the requested time slot is within the doctor's available session times
    // let isValidSlot = false;
    // for (const session of doctorSessions) {
    //   const sessionStartTime = moment.utc(
    //     `${startTime.format("YYYY-MM-DD")}T${moment(session.startTime)
    //       .utc()
    //       .format("HH:mm:ss")}`
    //   );
    //   const sessionEndTime = moment.utc(
    //     `${startTime.format("YYYY-MM-DD")}T${moment(session.endTime)
    //       .utc()
    //       .format("HH:mm:ss")}`
    //   );
    //   if (
    //     startTime.isSameOrAfter(sessionStartTime) &&
    //     startTime.isBefore(sessionEndTime)
    //   ) {
    //     isValidSlot = true;
    //     break;
    //   }
    // }

    // if (!isValidSlot) {
    //   return res.status(400).json({
    //     error: `Requested slot is not available in the doctor's schedule.`,
    //   });
    // }

    // Calculating the appointment end time
    const endTime = startTime.clone().add(duration, "minutes");

    // Checking for conflicting appointments in the requested time slot
    const conflictingAppointment = await Appointment.findOne({
      deleted: false,
      $or: [
        {
          $and: [
            { startTime: { $lt: new Date(endTime.toISOString()) } },
            { endTime: { $gt: new Date(startTime.toISOString()) } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: new Date(startTime.toISOString()) } },
            { startTime: { $lt: new Date(endTime.toISOString()) } },
          ],
        },
      ],
    });

    if (conflictingAppointment) {
      // A conflicting appointment exists
      return res.status(400).json({
        error: `Appointment slot is already booked or conflicting for ${new Date(
          startTime.toISOString()
        ).toLocaleString()} - ${new Date(
          endTime.toISOString()
        ).toLocaleString()} for ${conflictingAppointment.patient.displayName}`,
      });
    }

    // Generating an invoice ID based on the current date and count
    const count = await Orders.countDocuments();
    const invoiceId = `${new Date().getFullYear()}-${new Date().getMonth()}-${String(
      count + 1
    ).padStart(4, "0")}`;

    // Creating an appointment object
    const appointment = {
      ...req.body,
      slot: `${moment(startTime).tz(timezone).format("HH:mm")} - ${moment(
        endTime
      )
        .tz(timezone)
        .format("HH:mm")},${startTime.format("YYYY-MM-DD")}`,
      patient: {
        email: patient.email,
        displayName: patient.displayName,
        phone: patient.phone,
        psyID: patient.psyID,
        _id: req.body.patient,
      },
      payment: req.body.payment
        ? req.body.payment.map((i) => {
            const payload = {
              ...i,
              discount: i?.discount || 0,
              currency: i?.currency || "₹",
            };
            return payload;
          })
        : [],
      deleted: false,
      establishment: {
        displayName: establishment.establishmentName,
        phone: establishment.phone,
        email: establishment.email,
        _id: establishment._id,
      },
      coupon: appliedCoupon
        ? {
            displayName: appliedCoupon.displayName,
            discount: totalBillAmount - doctorPrice,
            type: appliedCoupon.type,
            _id: appliedCoupon._id,
          }
        : null,
      bookingId: invoiceId,
      doctor: {
        email: doctor.email,
        displayName: `${doctor.prefix} ${doctor.displayName}`,
        phone: doctor.phone,
        psyID: doctor.psyID,
        _id: doctorId,
      },
      doctorId : ObjectId(doctorId),
      platform: {
        ...req.headers,
      },
      appointmentDate: startTime.format("YYYY-MM-DD"),
      duration: duration,
      endTime: new Date(endTime.toISOString()),
      startTime: new Date(startTime.toISOString()),
    };
    if (
      Array.isArray(payment) &&
      payment.length > 0 &&
      amtPaid == doctorPrice
    ) {
      // Update appointment status to "confirmed" and set due amount to 0
      appointment.status = "confirmed";
      appointment.dueAmount = 0;
    } else {
      // Set appointment status to "scheduled" and set due amount to doctor's price
      appointment.status = "scheduled";
      appointment.dueAmount = doctorPrice - amtPaid;
    }

    // Create a new appointment
    const newAppointment = new Appointment(appointment);

    // Calculate the due amount, total paid, and determine the order status
    const totalPaid = parseFloat(amtPaid || 0);
    const totalAmount = parseFloat(doctorPrice);
    const discount = parseFloat(0); // Handle the case when there's no discount
    const discountedAmount = totalAmount - discount;
    const dueAmount = discountedAmount - totalPaid;

    const OrderStatus = totalPaid === discountedAmount ? "Paid" : "Due";

    // Check if paid amount is greater than total amount
    if (totalPaid > discountedAmount) {
      return res.status(400).json({
        status: 400,
        message: "Paid amount cannot be greater than the total amount",
      });
    }

    // Include the status, due amount, and discount in the orders data
    const ordersData = {
      address:
        patient?.addresses.length > 0 ? { ...patient?.addresses[0] } : {},
      user: appointment.patient,
      items: [
        {
          _id: doctorId,
          collection: "users",
          name: "Appointment",
          sellingPrice: totalBillAmount,
          itemTotal: totalBillAmount - (totalBillAmount - doctorPrice),
          orders: 1,
          category: "appointment",
          publishedDate: new Date().toDateString(),
          status: appointment.status,
          type: "service",
          discount: totalBillAmount - doctorPrice,
          quantity: 1,
        },
      ],
      autoGenerated: true,
      title: `Appointment Booked for ${patient.displayName} with ${doctor.prefix} ${doctor.displayName} at ${appointment.slot}`,
      invoiceId: invoiceId,
      payment: appointment.payment
        ? appointment.payment.map((i) => {
            const payload = {
              ...i,
              discount: i?.discount || 0,
              currency: i.currency ? i.currency : "₹",
            };
            return payload;
          })
        : [],
      company: {
        displayName: establishment.establishmentName,
        phone: establishment.phone,
        email: establishment.email,
        logo: establishment.logo,
        website: establishment.website,
        _id: establishment._id,
      },
      type: "appointment",
      createdBy: appointment.doctor,
      notes: "Appointment Booked",
      totalAmount: totalBillAmount,
      totalPaid: amtPaid,
      status: OrderStatus,
      dueAmount: dueAmount,
      discount: discount, // Include the discount in the orders data
    };
    const invoiceEmailTemplate = invoiceTemplate({
      ...ordersData,
      user: patient,
      company: establishment,
    });
    const invoiceConfirmPath = `Invoice-${invoiceId}.pdf`;
    await generatePDFFromHTML(invoiceEmailTemplate, invoiceConfirmPath)
      .then(async () => {
        console.log(`PDF saved to ${invoiceConfirmPath}`);

        // Read the PDF file
        const pdfFile = await fs.readFile(invoiceConfirmPath);

        // Upload the PDF to AWS S3
        const uploadToS3 = await s3Uploadv2([
          {
            originalname: invoiceConfirmPath,
            buffer: pdfFile,
          },
        ]);

        console.log("Uploaded invoice to S3 : ", uploadToS3[0].Location);
        // Send a WhatsApp message with the PDF attachment
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${Number(
              patient.phone
            )}`,
            {
              template_name: "invoice_with_pdf",
              broadcast_name: "invoice_with_pdf",
              parameters: [
                {
                  name: "patient_name",
                  value: patient.displayName,
                },
                {
                  name: "invoice_id",
                  value: invoiceId,
                },
                {
                  name: "date",
                  value: moment(new Date()).utc(),
                },
                {
                  name: "total_amount",
                  value: totalAmount,
                },
                {
                  name: "due_amount",
                  value: dueAmount,
                },
                {
                  name: "document",
                  value: uploadToS3[0].Location,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              `Invoice WhatsApp Message Sent to the registered whats app no. with PDF to ${patient.phone}`
            );
          });
        // Compose and send email to patient and doctor with PDF attachment
        const sendPatientEmail = {
          to: patient.email,
          from: process.env.MAIL_FROM,
          subject: `Invoice generated By Psymate: #${invoiceId}`,
          html: invoiceEmailTemplate,
          attachments: [
            {
              content: pdfFile.toString("base64"), // Convert PDF to base64
              filename: invoiceConfirmPath, // Specify the filename for the attachment
              type: "application/pdf", // Set the content type
              disposition: "attachment", // Specify as an attachment
            },
          ],
        };

        // Send the email to patient and doctor
        if (patient.email) {
          await sendgrid
            .send(sendPatientEmail)
            .then((res) => {
              console.log(
                `Email with ${invoiceConfirmPath} sent to patient with PDF attachment to ${patient.email}`
              );
            })
            .catch((err) => {
              console.log(
                `Error in sending email with ${invoiceConfirmPath} to patient with PDF attachment to ${patient.email}`
              );
            });
        }
      })
      .catch(async (error) => {
        console.error("Error generating PDF:", error);
      });
    // Creating a timeline entry
    var timeline = {};
    timeline = {
      postId: newAppointment?._id,
      userId: [req.body.patient, doctorId],
      type: "orders",
      title: `Appointment`,
      description: `Order created for ${patient.displayName} with a total of Rs. ${doctorPrice} for Appointment Booked for ${patient.displayName} with ${doctor.prefix} ${doctor.displayName} at ${appointment.slot}. Order Id - ${invoiceId} (${OrderStatus})`,
    };
    // Save the appointment, timeline, and order to the database
    await newAppointment.save();

    axios({
      method: "POST",
      url: `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=3ab8b5e9-6e33-11ec-b710-0200cd936042&to=91${
        patient.phone
      }&from=PSMATE&templatename=Appointment+Confirmed+Template+1&var1=${`Dear, ${patient.displayName}`}&var2=${
        establishment.establishmentName
      }&var3=${`${doctor.prefix} ${doctor.displayName}`}&var4=${
        appointment.slot
      }&var5=${address}`,
    });
    axios({
      method: "POST",
      url: `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=3ab8b5e9-6e33-11ec-b710-0200cd936042&to=91${
        doctor.phone
      }&from=PSMATE&templatename=Appointment+Confirmed+Template+1&var1=${`Dear, ${doctor.prefix} ${doctor.displayName}`}&var2=${
        establishment.establishmentName
      }&var3=${patient.displayName}&var4=${appointment.slot}&var5=${address}`,
    });

    const confirmPath = `Appointment-Confirmation-${uuid()}.pdf`;
    const emailTemplate = generateBookingTemplate({
      sendPatientEmail: patient.email,
      patientNumber: patient.phone,
      patientName: patient.displayName,
      doctorName: `${doctor.prefix} ${doctor.displayName}`,
      practiceName: patient.email,
      appointmentId: invoiceId,
      appointmentDate: appointment.appointmentDate,
      appointmentSlot: appointment.slot,
      paymentStatus: OrderStatus,
      address: address,
      bookingType: appointment.status,
    });

    await generatePDFFromHTML(emailTemplate, confirmPath)
      .then(async () => {
        console.log(`PDF saved to ${confirmPath}`);

        // Read the PDF file
        const pdfFile = await fs.readFile(confirmPath);

        // Upload the PDF to AWS S3
        const uploadToS3 = await s3Uploadv2([
          {
            originalname: confirmPath,
            buffer: pdfFile,
          },
        ]);

        console.log("Uploaded to S3 : ", uploadToS3[0].Location);
        timeline.reference = { document: uploadToS3 };
        ordersData.download = [uploadToS3[0].Location];
        // Send a WhatsApp message with the PDF attachment
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${Number(
              patient.phone
            )}`,
            {
              template_name: "book_appointment_with_pdf",
              broadcast_name: "book_appointment_with_pdf",
              parameters: [
                {
                  name: "patient_name",
                  value: patient.displayName,
                },
                {
                  name: "doctor_name",
                  value: `${doctor.prefix} ${doctor.displayName}`,
                },
                {
                  name: "slot",
                  value: appointment.slot,
                },
                {
                  name: "location",
                  value: address,
                },
                {
                  name: "document",
                  value: uploadToS3[0].Location,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              `book_appointment_with_pdf WhatsApp Message Sent to the registered whats app no. with PDF to ${patient.phone}`
            );
          });
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${doctor.phone}`,
            {
              template_name: "book_appointment_with_pdf",
              broadcast_name: "book_appointment_with_pdf",
              parameters: [
                {
                  name: "doctor_name",
                  value: patient.displayName,
                },
                {
                  name: "patient_name",
                  value: `${doctor.prefix} ${doctor.displayName}`,
                },
                {
                  name: "slot",
                  value: appointment.slot,
                },
                {
                  name: "location",
                  value: address,
                },
                {
                  name: "document",
                  value: uploadToS3[0].Location,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              `book_appointment_with_pdf WhatsApp Message Sent to the registered whats app no. with PDF to ${doctor.phone}`
            );
          });
        // Compose and send email to patient and doctor with PDF attachment
        const sendPatientEmail = {
          to: patient.email,
          from: process.env.MAIL_FROM,
          subject: `Booking ${appointment.status} from Psymate: #${invoiceId}`,
          html: emailTemplate,
          attachments: [
            {
              content: pdfFile.toString("base64"), // Convert PDF to base64
              filename: confirmPath, // Specify the filename for the attachment
              type: "application/pdf", // Set the content type
              disposition: "attachment", // Specify as an attachment
            },
          ],
        };
        const sendDoctorEmail = {
          to: doctor.email,
          from: process.env.MAIL_FROM,
          subject: `Booking ${appointment.status} from Psymate: #${invoiceId}`,
          html: emailTemplate,
          attachments: [
            {
              content: pdfFile.toString("base64"), // Convert PDF to base64
              filename: confirmPath, // Specify the filename for the attachment
              type: "application/pdf", // Set the content type
              disposition: "attachment", // Specify as an attachment
            },
          ],
        };
        // Send the email to patient and doctor
        if (patient.email) {
          await sendgrid.send(sendPatientEmail);
          console.log(
            `Email with ${confirmPath} sent to patient with PDF attachment to ${patient.email}`
          );
        }
        if (doctor.email) {
          await sendgrid.send(sendDoctorEmail);
          console.log(
            `Email with ${confirmPath} sent to doctor with PDF attachment to ${doctor.email}`
          );
        }
      })
      .catch(async (error) => {
        console.error(`Error with ${confirmPath} generating PDF: ${error}`);
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${Number(
              patient.phone
            )}`,
            {
              template_name: "book_appointment",
              broadcast_name: "book_appointment",
              parameters: [
                {
                  name: "patient_name",
                  value: patient.displayName,
                },
                {
                  name: "doctor_name",
                  value: `${doctor.prefix} ${doctor.displayName}`,
                },
                {
                  name: "slot",
                  value: appointment.slot,
                },
                {
                  name: "location",
                  value: address,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              "book_appointment WhatsApp Message Sent to the registered whats app no. without PDF"
            );
          });
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${Number(
              doctor.phone
            )}`,
            {
              template_name: "book_appointment",
              broadcast_name: "book_appointment",
              parameters: [
                {
                  name: "doctor_name",
                  value: patient.displayName,
                },
                {
                  name: "patient_name",
                  value: `${doctor.prefix} ${doctor.displayName}`,
                },
                {
                  name: "slot",
                  value: appointment.slot,
                },
                {
                  name: "location",
                  value: address,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              "book_appointment WhatsApp Message Sent to the registered whats app no. without PDF"
            );
          });
        const sendPatientEmail = {
          to: patient.email,
          from: process.env.MAIL_FROM,
          subject: `Booking ${appointment.status} from Psymate: #${invoiceId}`,
          html: emailTemplate,
        };
        const sendDoctorEmail = {
          to: doctor.email,
          from: process.env.MAIL_FROM,
          subject: `Booking ${appointment.status} from Psymate: #${invoiceId}`,
          html: emailTemplate,
        };
        // Send the email to patient and doctor
        if (patient.email) {
          await sendgrid.send(sendPatientEmail);
          console.log(
            `Email ${confirmPath} sent to patient with PDF attachment`
          );
        }
        if (doctor.email) {
          await sendgrid.send(sendDoctorEmail);
          console.log(
            `Email ${confirmPath} sent to doctor with PDF attachment`
          );
        }
      });

    const order = new Orders(ordersData);
    await order.save();
    // Respond with a success message and details
    const time = new Timeline(timeline);
    await time.save();
    res.status(200).json({
      message: "Appointment created successfully",
      appointment: newAppointment,
      order: order,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the appointment." });
  }
});

router.put("/:appointmentId", async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const newPatientId = req.body.patient;
    const newDoctorId = req.body.doctorId;
    const newEstablishmentId = req.body.establishmentId;
    const newStartTimeStr = req.body.startTime;
    const newDuration = req.body.duration;
    const timezone = req.header("Timezone") || "Asia/Kolkata"; // Extract the timezone from the custom header

    // Step 1: Check if the newPatientId is valid
    const newPatient = await User.findById(newPatientId);
    if (!newPatient) {
      return res.status(400).json({
        error: "Invalid new patient ID.",
      });
    }

    // Step 2: Find the existing appointment
    const existingAppointment = await Appointment.findOne({
      bookingId: appointmentId,
      status: { $ne: "cancelled" }, // Find appointments with a status not equal to 'cancelled'
    });
    if (!existingAppointment) {
      return res.status(200).json({
        status: 403,
        message: "Appointment not found or cancelled.",
      });
    }
    // Step 3: Verify that the requesting patient matches the patient in the appointment
    if (existingAppointment.patient._id.toString() !== newPatientId) {
      return res.status(200).json({
        status: 403,
        message: "You are not authorized to reschedule this appointment.",
      });
    } // Step 4: Parse the new start time using moment.js
    const newStartTime = moment(newStartTimeStr).utc();
    if (!newStartTime.isValid()) {
      return res.status(400).json({
        error: "Invalid date or time format for the new start time.",
      });
    }

    // Step 5: Calculate the new end time
    const newEndTime = newStartTime.clone().add(newDuration, "minutes");

    // Step 6: Check if the new slot is available in the new establishment and for the new doctor
    // Implement your logic to check for availability here

    // Example: Check if there are conflicting appointments in the new slot
    const conflictingAppointment = await Appointment.findOne({
      establishmentId: newEstablishmentId,
      doctorId: newDoctorId,
      deleted: false,
      $or: [
        {
          $and: [
            { startTime: { $lt: new Date(newEndTime.toISOString()) } },
            { endTime: { $gt: new Date(newStartTime.toISOString()) } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: new Date(newStartTime.toISOString()) } },
            { startTime: { $lt: new Date(newEndTime.toISOString()) } },
          ],
        },
      ],
    });
    if (conflictingAppointment) {
      return res.status(409).json({
        error: `The new slot conflicts with an existing appointment ${conflictingAppointment.status} for ${conflictingAppointment.patient.displayName} with ${conflictingAppointment.doctor.displayName} at ${conflictingAppointment.slot} in ${conflictingAppointment.establishment.displayName}`,
      });
    }

    const slot = `${moment(newStartTime)
      .tz(timezone)
      .format("HH:mm")} - ${moment(newEndTime)
      .tz(timezone)
      .format("HH:mm")},${newStartTime.format("YYYY-MM-DD")}`;
    var timeline = {};
    timeline = {
      postId: existingAppointment?._id,
      userId: [existingAppointment.patient._id, existingAppointment.doctor._id],
      type: "appointment",
      title: `Appointment Reschedule`,
      description: `Order updated for ${existingAppointment.patient.displayName} with a total of Rs. ${existingAppointment.doctor.price} for Rescheduled Appointment for ${existingAppointment.patient.displayName} with ${existingAppointment.doctor.displayName} at ${slot}. Order Id - ${existingAppointment.bookingId} (${existingAppointment.status})`,
    };
    const confirmPath = `Rescheduled-Appointment-Confirmation-${uuid()}.pdf`;
    const order = await Orders.findOne({
      invoiceId: appointmentId,
    });
    generatePDFFromHTML(
      generateBookingTemplate({
        patientName: existingAppointment.patient.displayName,
        patientNumber: existingAppointment.patient.phone,
        patientEmail: existingAppointment.patient.email,
        doctorName: `${existingAppointment.doctor.displayName}`,
        appointmentId: existingAppointment.bookingId,
        appointmentSlot: slot,
        practiceName: existingAppointment.patient.email,
        paymentStatus: order.status?.toUpperCase(),
        bookingType: existingAppointment.status?.toUpperCase(),
      }),
      confirmPath
    )
      .then(async () => {
        console.log(`PDF saved to ${confirmPath}`);

        // Read the PDF file
        const pdfFile = await fs.readFile(confirmPath);

        // Upload the PDF to AWS S3
        const uploadToS3 = await s3Uploadv2([
          {
            originalname: confirmPath,
            buffer: pdfFile,
          },
        ]);

        console.log("Uploaded to S3 : ", uploadToS3);
        timeline.reference = { document: uploadToS3 };

        // Send a WhatsApp message with the PDF attachment
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${existingAppointment.patient.phone}`,
            {
              template_name: "appointment_reschedule",
              broadcast_name: "appointment_reschedule",
              parameters: [
                {
                  name: "patient_name",
                  value: existingAppointment.patient.displayName,
                },
                {
                  name: "doctor_name",
                  value: `${existingAppointment.doctor.displayName}`,
                },
                {
                  name: "old_slot",
                  value: existingAppointment.slot.split(",")[0],
                },
                {
                  name: "old_date",
                  value: existingAppointment.slot.split(",")[1],
                },
                {
                  name: "slot",
                  value: slot.split(",")[0],
                },
                {
                  name: "date",
                  value: newStartTime.format("YYYY-MM-DD"),
                },
                {
                  name: "document",
                  value: uploadToS3[0].Location,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              "WhatsApp Message Sent to the registered whats app no."
            );
          });
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${existingAppointment.doctor.phone}`,
            {
              template_name: "appointment_reschedule",
              broadcast_name: "appointment_reschedule",
              parameters: [
                {
                  name: "patient_name",
                  value: existingAppointment.patient.displayName,
                },
                {
                  name: "doctor_name",
                  value: `${existingAppointment.doctor.displayName}`,
                },
                {
                  name: "old_slot",
                  value: existingAppointment.slot.split(",")[0],
                },
                {
                  name: "old_date",
                  value: existingAppointment.slot.split(",")[1],
                },
                {
                  name: "slot",
                  value: slot.split(",")[0],
                },
                {
                  name: "date",
                  value: newStartTime.format("YYYY-MM-DD"),
                },
                {
                  name: "document",
                  value: uploadToS3[0].Location,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              `WhatsApp Message Sent to the registered whats app no. ${existingAppointment.doctor.phone}`
            );
          });
        // Compose and send email to patient and doctor with PDF attachment
        const sendPatientEmail = {
          to: existingAppointment.patient.email,
          from: process.env.MAIL_FROM,
          subject: `Booking ${existingAppointment.status} from Psymate: #${existingAppointment.bookingId}`,
          html: generateBookingTemplate({
            patientName: existingAppointment.patient.displayName,
            patientNumber: existingAppointment.patient.phone,
            patientEmail: existingAppointment.patient.email,
            doctorName: `${existingAppointment.doctor.prefix} ${existingAppointment.doctor.displayName}`,
            appointmentId: existingAppointment.bookingId,
            appointmentSlot: slot,
            practiceName: existingAppointment.patient.email,
            paymentStatus: order.status?.toUpperCase(),
            bookingType: existingAppointment.status?.toUpperCase(),
          }),
          attachments: [
            {
              content: pdfFile.toString("base64"), // Convert PDF to base64
              filename: confirmPath, // Specify the filename for the attachment
              type: "application/pdf", // Set the content type
              disposition: "attachment", // Specify as an attachment
            },
          ],
        };
        const sendDoctorEmail = {
          to: existingAppointment.doctor.email,
          from: process.env.MAIL_FROM,
          subject: `Booking ${existingAppointment.status} from Psymate: #${existingAppointment.bookingId}`,
          html: generateBookingTemplate({
            patientName: existingAppointment.patient.displayName,
            patientNumber: existingAppointment.patient.phone,
            patientEmail: existingAppointment.patient.email,
            doctorName: `${existingAppointment.doctor.prefix} ${existingAppointment.doctor.displayName}`,
            appointmentId: existingAppointment.bookingId,
            appointmentSlot: slot,
            practiceName: existingAppointment.patient.email,
            paymentStatus: order.status?.toUpperCase(),
            bookingType: existingAppointment.status?.toUpperCase(),
          }),
          attachments: [
            {
              content: pdfFile.toString("base64"), // Convert PDF to base64
              filename: confirmPath, // Specify the filename for the attachment
              type: "application/pdf", // Set the content type
              disposition: "attachment", // Specify as an attachment
            },
          ],
        };

        // Send the email to patient and doctor
        await sendgrid.send(sendPatientEmail);
        await sendgrid.send(sendDoctorEmail);

        console.log("Email sent to doctor and patient with PDF attachment");
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
      });

    // Step 7: Update the appointment with the new details
    const time = new Timeline(timeline);
    await time.save();
    // Save the updated appointment
    const updatedAppointment = await Appointment.updateOne(
      { bookingId: appointmentId },
      {
        $set: {
          slot: slot,
          startTime: newStartTime.toDate(),
          endTime: newEndTime.toDate(),
          "doctor._id": newDoctorId,
          "establishment._id": newEstablishmentId,
          updatedAt: new Date(),
        },
      }
    );

    if (updatedAppointment.nModified === 0) {
      // If no documents were modified, return a 404 Not Found response
      return res.status(404).json({ message: "Appointment not found." });
    }

    return res.status(200).json({
      message: "Appointment rescheduled successfully.",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while rescheduling the appointment." });
  }
});

router.delete("/", async (req, res) => {
  try {
    // Parse the booking ID from the request body or query parameters
    const bookingIdToCancel = req.body.id || req.query.id;

    // Find the appointment with the specified booking ID and update it
    const existingAppointment = await Appointment.findOne({
      bookingId: bookingIdToCancel,
      deleted: false,
    });
    const order = await Orders.findOne({
      invoiceId: bookingIdToCancel,
    });
    var timeline = {};
    timeline = {
      postId: existingAppointment?._id,
      userId: [existingAppointment.patient._id, existingAppointment.doctor._id],
      type: "appointment",
      title: `Appointment Cancelled`,
      description: `Appointment Cancelled with a total of Rs. ${existingAppointment.doctor.price} for ${existingAppointment.patient.displayName} with ${existingAppointment.doctor.displayName} at ${existingAppointment.slot}. Order Id - ${existingAppointment.bookingId} (${existingAppointment.status},${order.status})`,
    };

    const confirmPath = `Cancelled-Appointment-Confirmation-${uuid()}.pdf`;
    generatePDFFromHTML(
      generateBookingTemplate({
        patientName: existingAppointment.patient.displayName,
        patientNumber: existingAppointment.patient.phone,
        patientEmail: existingAppointment.patient.email,
        doctorName: `${existingAppointment.doctor.displayName}`,
        appointmentId: existingAppointment.bookingId,
        appointmentSlot: existingAppointment.slot,
        practiceName: existingAppointment.patient.email,
        paymentStatus: order.status?.toUpperCase(),
        bookingType: "cancelled",
      }),
      confirmPath
    )
      .then(async () => {
        console.log(`PDF saved to ${confirmPath}`);

        // Read the PDF file
        const pdfFile = await fs.readFile(confirmPath);

        // Upload the PDF to AWS S3
        const uploadToS3 = await s3Uploadv2([
          {
            originalname: confirmPath,
            buffer: pdfFile,
          },
        ]);

        console.log("Uploaded to S3 : ", uploadToS3);
        timeline.reference = { document: uploadToS3 };

        // Send a WhatsApp message with the PDF attachment
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${existingAppointment.patient.phone}`,
            {
              template_name: "appointment_cancellation",
              broadcast_name: "appointment_cancellation",
              parameters: [
                {
                  name: "patient_name",
                  value: existingAppointment.patient.displayName,
                },
                {
                  name: "doctor_name",
                  value: `${existingAppointment.doctor.displayName}`,
                },
                {
                  name: "old_slot",
                  value: existingAppointment.slot.split(",")[0],
                },
                {
                  name: "old_date",
                  value: existingAppointment.slot.split(",")[1],
                },
                {
                  name: "document",
                  value: uploadToS3[0].Location,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              "WhatsApp Message Sent to the registered whats app no."
            );
          });
        axios
          .post(
            `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${existingAppointment.doctor.phone}`,
            {
              template_name: "appointment_cancellation",
              broadcast_name: "appointment_cancellation",
              parameters: [
                {
                  name: "patient_name",
                  value: existingAppointment.patient.displayName,
                },
                {
                  name: "doctor_name",
                  value: `${existingAppointment.doctor.displayName}`,
                },
                {
                  name: "old_slot",
                  value: existingAppointment.slot.split(",")[0],
                },
                {
                  name: "old_date",
                  value: existingAppointment.slot.split(",")[1],
                },
                {
                  name: "document",
                  value: uploadToS3[0].Location,
                },
              ],
            },
            {
              headers: {
                ["Authorization"]:
                  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
              },
            }
          )
          .then((res) => {
            console.log(
              `WhatsApp Message Sent to the registered whats app no. ${existingAppointment.doctor.phone}`
            );
          });
        // Compose and send email to patient and doctor with PDF attachment
        const sendPatientEmail = {
          to: existingAppointment.patient.email,
          from: process.env.MAIL_FROM,
          subject: `Booking ${existingAppointment.status} from Psymate: #${existingAppointment.bookingId}`,
          html: generateBookingTemplate({
            patientName: existingAppointment.patient.displayName,
            patientNumber: existingAppointment.patient.phone,
            patientEmail: existingAppointment.patient.email,
            doctorName: `${existingAppointment.doctor.prefix} ${existingAppointment.doctor.displayName}`,
            appointmentId: existingAppointment.bookingId,
            appointmentSlot: existingAppointment.slot,
            practiceName: existingAppointment.patient.email,
            paymentStatus: order.status?.toUpperCase(),
            bookingType: existingAppointment.status?.toUpperCase(),
          }),
          attachments: [
            {
              content: pdfFile.toString("base64"), // Convert PDF to base64
              filename: confirmPath, // Specify the filename for the attachment
              type: "application/pdf", // Set the content type
              disposition: "attachment", // Specify as an attachment
            },
          ],
        };
        const sendDoctorEmail = {
          to: existingAppointment.doctor.email,
          from: process.env.MAIL_FROM,
          subject: `Booking ${existingAppointment.status} from Psymate: #${existingAppointment.bookingId}`,
          html: generateBookingTemplate({
            patientName: existingAppointment.patient.displayName,
            patientNumber: existingAppointment.patient.phone,
            patientEmail: existingAppointment.patient.email,
            doctorName: `${existingAppointment.doctor.prefix} ${existingAppointment.doctor.displayName}`,
            appointmentId: existingAppointment.bookingId,
            appointmentSlot: slot,
            practiceName: existingAppointment.patient.email,
            paymentStatus: order.status?.toUpperCase(),
            bookingType: existingAppointment.status?.toUpperCase(),
          }),
          attachments: [
            {
              content: pdfFile.toString("base64"), // Convert PDF to base64
              filename: confirmPath, // Specify the filename for the attachment
              type: "application/pdf", // Set the content type
              disposition: "attachment", // Specify as an attachment
            },
          ],
        };

        // Send the email to patient and doctor
        await sendgrid.send(sendPatientEmail);
        await sendgrid.send(sendDoctorEmail);

        console.log("Email sent to doctor and patient with PDF attachment");
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
      });

    // Step 7: Update the appointment with the new details
    const time = new Timeline(timeline);
    await time.save();

    const updatedAppointment = await Appointment.findOneAndUpdate(
      { bookingId: bookingIdToCancel },
      { status: "cancelled", deleted: true },
      { new: true } // This option returns the updated document
    );

    if (!updatedAppointment) {
      // If appointment is not found, return a 404 Not Found response
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Return a response indicating successful cancellation
    res.status(200).json({
      message: "Appointment canceled successfully.",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while canceling the appointment." });
  }
});

module.exports = router;
