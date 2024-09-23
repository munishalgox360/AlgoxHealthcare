const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { default: mongoose } = require("mongoose");

router.get("/", async (req, res) => {
  const { search, exact, searchBy, collection } = req.query;
  const Collection = mongoose.connection.collection(collection);
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  let query = {};

  if (search && searchBy) {
    if (exact === "true") {
      if (searchBy == "_id") {
        query[searchBy] = new ObjectId(search);
      } else {
        query[searchBy] = search;
      }
    } else {
      query[searchBy] = { $regex: search, $options: "i" };
    }
  }

  try {
    if (exact) {
      const totalDocuments = await Collection.countDocuments();
      const data = await Collection.find(query).toArray();

      res.status(200).json({
        status: 200,
        message: "Success",
        data: data,
        total: totalDocuments,
        totalPages: 1,
        currentPage: 1,
      });
      return;
    }
    const totalDocuments = await Collection.countDocuments(query);
    const totalPages = Math.ceil(totalDocuments / limit);

    if (page > totalPages) {
      return res.status(404).json({
        status: 404,
        message: "Page not found",
      });
    }

    const data = await Collection.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.status(200).json({
      status: 200,
      message: "Success",
      data: data,
      total: totalDocuments,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Server error in processing your request",
    });
  }
});

router.post("/", async (req, res) => {
  const collection = req.query.collection; // Assuming you provide the collection in the query
  const Collection = mongoose.connection.collection(collection);

  const data = req.body.data;
  console.log(data);
  if (!data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    try {
      const result = await Collection.insertOne(data);

      res.json({
        status: 200,
        message: "Success",
        data: result,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error. Please try again" });
    }
  }
});

router.put("/", async (req, res) => {
  const { find, findBy, collection } = req.query;
  const data = req.body.data;

  const Collection = mongoose.connection.collection(collection);

  if (!find || !data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    try {
      data._id && delete data._id;
      const result = await Collection.findOneAndUpdate(
        { [findBy]: findBy == "_id" ? new ObjectId(find) : find },
        { $set: data }
        // { new: true } // Add useFindAndModify option
      );
      console.log(result);
      if (!result) {
        res.status(400).json({ status: 400, message: "Data does not exist" });
      } else {
        res.status(200).json({
          status: 200,
          message: "Successfully updated data",
          data: result,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: 500, message: "Error. Please try again" });
    }
  }
});

router.delete("/", async (req, res) => {
  const { collection, find, findBy } = req.query; // Assuming you provide the collection in the query
  const Collection = mongoose.connection.collection(collection);

  if (!find) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    try {
      const result = await Collection.findOneAndDelete({
        [findBy]: findBy == "_id" ? new ObjectId(find) : find,
      });

      if (!result) {
        res.status(200).json({ status: 200, message: "Data does not exist" });
      } else {
        res.status(200).json({
          status: 200,
          message: `Successfully deleted data`,
          data: result,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: 500, message: "Server error" });
    }
  }
});

module.exports = router;
