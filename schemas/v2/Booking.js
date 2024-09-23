const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["academy", "pharmacy", "subscription"],
    required: true
  },
  status: {
    type: String,
    enum: ["active", "completed"],
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AcademyBookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "Courses",
    required: true
  },
  courseTitle: String,
  courseDescription: String,
  price: Number,
  transcationId : String,
  status: {
    type: String,
    enum: ["active", "completed"],
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PharmacyBookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId, 
    required: true
  },
  title: String,
  quantity: Number,
  price: Number,
  transcationId : String,
  status: {
    type: String,
    enum: ["active", "completed"],
    required: true
  },
  orderStatus: {
    type: String,
    enum: ["ORDERED", "READY_FOR_PICK", "DELIVERED"],
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PharmacyBooking = mongoose.model("PharmacyBooking", PharmacyBookingSchema);
const Booking = mongoose.model("Booking", BookingSchema);
const AcademyBooking = mongoose.model("AcademyBooking", AcademyBookingSchema);

module.exports = { Booking, AcademyBooking, PharmacyBooking };
