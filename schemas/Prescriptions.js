const mongoose = require("mongoose");

const PrescriptionsSchema = new mongoose.Schema({
  user: mongoose.Mixed,
  createdBy: mongoose.Mixed,
  items: [mongoose.Mixed],
  payment: [mongoose.Mixed],
  estimatedCost: { type: mongoose.Mixed },
  company: { type: mongoose.Mixed },
  notes: { type: String },
  date: {
    type: Date,
    default: Date.now,
  },
  number: {
    type: String,
  },
  title: {
    type: String,
    default: "Paid for Prescription at Psymate",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Prescriptions = mongoose.model("Prescriptions", PrescriptionsSchema);

module.exports = { Prescriptions };
