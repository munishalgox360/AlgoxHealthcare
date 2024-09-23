const mongoose = require("mongoose");

const AcademyBookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  courseTitle: String,
  courseDescription: String,
  price: String,
  transcationId : String,
  status: {
    type: String,
    enum: ["pending", "confirmed"],
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AcademyBooking = mongoose.model("AcademyBooking", AcademyBookingSchema);

module.exports = { AcademyBooking };
