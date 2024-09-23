const express = require("express");
const router = express.Router();
const { Courses } = require("../../schemas/Courses");
const { AcademyBooking } = require("../../schemas/v2/Booking");
const { ObjectId } = require("mongodb");

router.get("/all/:userId", (req, res) => {
  const search = req.query.search;
  const userId = req.params.userId;
  if (search) {
    Courses.find({ title: { $regex: search, $options: "i" } })
      .then((response) => {
        res.json({ status: 200, data: response, message: `Success` });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  } else {
    Courses.aggregate([
      {
        $lookup: {
          from: "academybookings",
          localField: "_id",
          foreignField: "courseId",
          as: "record",
        },
      },
      { $unwind: "$record" },
      { $match: { "record.userId": userId } },
      {
        $project: {
          _id: 1, displayName: 1,  description: 1,  price: 1,  duration: 1, studentsEnrolled: 1, topics: 1,
          photoUrl: 1,  __v: 1,  access: 1, certificate: 1,  createdAt: 1, instructor: 1, language: 1,
          lessons: 1, thumbnail: 1, updatedAt: 1,  overview: 1, agenda: 1, record: 1, agenda:1,
          isLocked : { $literal: "false" }}}])
      .then((courses) => {
        res.status(200).json({ status: 200, data: courses });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  }
});

router.get("/", (req, res) => {
  const search = req.query.search;
  const keyword = req.query.keyword;
  const type = req.query.type;
  const userId = req.query.userId;
  if (id) {
    Courses.findOne({ _id: id })
      .then((success) => {
        if (success === null) {
          res
            .status(200)
            .json({ status: 200, message: "Courses does not exist" });
        } else {
          res.status(200).json({
            status: 200,
            message: `Success`,
            data: { ...success._doc },
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
  } else if (search) {
    Courses.find({ displayName: { $regex: search, $options: "i" } })
      .then((response) => {
        res.json({ status: 200, data: response, message: `Success` });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  } else if (keyword) {
    Courses.find({ displayName: keyword })
      .then((response) => {
        console.log("reached keyword");
        res.json({ status: 200, data: response, message: `Success` });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  } else {
    Courses.find()
      .then((success) => {
        if (success === null) {
          res
            .status(200)
            .json({ status: 200, message: "Courses does not exist" });
        } else {
          res.status(200).json({
            status: 200,
            message: `Success`,
            data: success,
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
// get course by id
router.get("/:id", async (req, res) => {
  const courseId = req.params.id;

  if (!courseId) {
    res.status(400).json({ status: 400, message: "Invalid course id id" });
  }
  try {
    const result = await Courses.find({ _id: new ObjectId(courseId) });
    if (result) {
      res.status(200).json({
        status: 200,
        data: result,
        count: result.length,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error in fetching the details details data by id",
    });
  }
});

// get course by user id
router.get("/coursesByUserId/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).json({ status: 400, message: "Invalid user id" });
  }

  try {
    const courseDetails = await Courses.find();
    if (courseDetails.length > 0) {
      const getUserPurchasedCourses = await AcademyBooking.find({
        userId: new ObjectId(userId),
      });

      if (getUserPurchasedCourses.length > 0) {
        const courseIds = getUserPurchasedCourses.map(
          (item) => item._doc.courseId
        );
        if (courseIds.length > 0) {
          const updatedResponse = courseDetails.map((item) => {
            return {
              ...item._doc,
              // isLocked: !courseIds.includes(item._doc._id),
              isLocked : !courseIds.map((ids)=> ids.toString()).includes(item._doc._id.toString())
            };
          });
          res.status(200).json({
            status: 200,
            data: updatedResponse,
          });
        }
      } else {
        const updatedResponse = courseDetails.map((item) => {
          return {
            ...item._doc,
            isLocked: true,
          };
        });
        res.status(200).json({
          status: 200,
          data: updatedResponse,
        });
      }
    } else {
      res.status(200).json({
        status: 200,
        message: "There are no courses available",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error in fetching the details details data by id",
    });
  }
});

// get course by user id
router.get("/courseById/:id", async (req, res) => {
  const courseId = req.params.id;
  const userId = req.query.userId;

  if (!userId && !courseId) {
    res
      .status(400)
      .json({ status: 400, message: "Invalid course id  and user id" });
  }
  try {
    const courseDetails = await Courses.find({ _id: new ObjectId(courseId) });
    if (courseDetails) {
      const getUserPurchasedCourses = await AcademyBooking.find({
        userId: new ObjectId(userId),
        courseId: new ObjectId(courseId),
      });

      if (getUserPurchasedCourses.length > 0) {
        const updatedResponse = courseDetails.map((item) => {
          return {
            ...item._doc,
            isLocked: false,
          };
        });
        res.status(200).json({
          status: 200,
          data: updatedResponse,
        });
      } else {
        res.status(200).json({
          status: 200,
          data: courseDetails,
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Error. Please try again" });
  }
});

router.post("/", (req, res) => {
  const data = req.body.data;
  if (!data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    const form = new Courses(data);
    form
      .save()
      .then((result) => {
        res.json({
          status: "200",
          message: "Success",
          data: { Courses: form },
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Error. Please try again" });
      });
  }
});

router.put("/", (req, res) => {
  const id = req.query.id;
  const data = req.body.data;
  if (!id || !data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    Courses.findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .then((result) => {
        if (result === null) {
          res.status(400).json({
            status: 400,
            message: "Courses does not exist",
          });
        } else {
          res.status(200).json({
            status: 200,
            message: "Successfully updated form data",
            data: { ...result._doc },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          status: 500,
          message: "Error. Please try again",
        });
      });
  }
});

router.delete("/", (req, res) => {
  const id = req.query.id;
  if (!id) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    Courses.findOneAndDelete({ _id: new ObjectId(id) })
      .then((success) => {
        if (success === null) {
          res.status(200).json({
            status: 200,
            message: "Courses does not exist",
          });
        } else {
          res.status(200).json({
            status: 200,
            message: `Successfully deleted Courses`,
            data: { ...success._doc },
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

router.get("/getAllCoursesByUserId/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const getResp = await AcademyBooking.find({ userId: userId }).populate({
      path: "courseId",
    });
    if (getResp.length > 0) {
      res.status(200).json({
        status: 201,
        message: "Fetch Successfully",
        response: getResp,
      });
    } else {
      res
        .status(200)
        .json({ status: 401, message: "Not Found", response: getResp });
    }
  } catch (error) {
    res.status(400).json({ status: 400, message: error.stack });
  }
});


module.exports = router;
