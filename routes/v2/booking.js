const express = require("express");
const router = express.Router();
const { Feed } = require("../../schemas/Feed");
const { AcademyBooking, PharmacyBooking } = require("../../schemas/v2/Booking");
const { Booking } = require("../../schemas/v2/Booking");
const { User } = require("../../schemas/User");
const { FEEDS_DATA } = require("../../utils/constants");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

router.post("/academy", async (req, res) => {
  const bookingData = req.body;

  if (!bookingData) {
    res.status(400).json({ status: 400, message: "Invalid data" });
  }
  try {
    const { userId, status } = bookingData;
    const result = await AcademyBooking.create(bookingData);
    if (result) {
      const { _id } = result;
      await Booking.create({
        bookingId: _id,
        type: "academy",
        status,
        userId,
      });
      res.status(200).json({
        status: 200,
        message: "Academy Booking has been created successfully",
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the academy booking data",
    });
  }
});

router.post("/pharmacy", async (req, res) => {
  const bookingData = req.body;

  if (!bookingData) {
    res.status(400).json({ status: 400, message: "Invalid data" });
  }
  try {
    const { userId, status, medicineId } = bookingData;
    const result = await PharmacyBooking.create({
      ...bookingData,
      userId: new ObjectId(userId),
      medicineId: new ObjectId(medicineId),
    });
    if (result) {
      const { _id } = result;
      await Booking.create({
        bookingId: new ObjectId(_id),
        userId: new ObjectId(userId),
        type: "pharmacy",
        status,
      });
      res.status(200).json({
        status: 200,
        message: "Pharmacy Booking has been created successfully",
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error in creating the pharmacy booking data",
    });
  }
});

router.get("/pharmacy/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const pipeline = [
      { $match: { userId: userId, status : req.query.status } },
      {
        $lookup: {
          from: "items",
          localField: "medicineId",
          foreignField: "_id",
          as: "medicines_Details",
        },
      },
    ];

    const result = await PharmacyBooking.aggregate(pipeline);
    if (result.length > 0) {
      res.status(200).json({
        status: 200,
        message: "Successfull",
        data: result,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "No data found for the given medicineId",
      });
    }
  } catch (error) {
    console.error("Error retrieving joined orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/pharmacy", async (req, res) => {
  try {
    const result = await PharmacyBooking.find();
    if (result) {
      res.status(200).json({
        status: 200,
        count: result.length,
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error in fetching the pharmacy booking data by user id",
    });
  }
});

module.exports = router;
