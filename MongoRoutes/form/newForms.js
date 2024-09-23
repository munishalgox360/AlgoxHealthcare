const express = require("express");
const router = express.Router();
const { NewForms } = require("../../schemas/NewForms");
const { ObjectId } = require("mongodb");
const { generateRandomId } = require("../../routes/payment/utils/Helper");

router.get("/", (req, res) => {
  const search = req.query.search;
  const searchTerm = req.query.searchTerm;
  const keyword = req.query.keyword;
  const id = req.query.id;
  const limit =
    req.query.limit && /^\d+$/.test(req.query.limit)
      ? parseInt(req.query.limit)
      : null; // check if limit is provided and is a positive integer
  let query = NewForms.find();

  if (id) {
    query = NewForms.findOne({ _id: id });
  } else if (search) {
    query = NewForms.find({ [searchTerm]: { $regex: search, $options: "i" } });
  } else if (keyword) {
    query = NewForms.find({ displayName: keyword });
  }
  if (limit) {
    query = query.limit(limit);
  }

  query
    .then((success) => {
      if (!success) {
        res.status(200).json({ status: 200, message: "Form does not exist" });
      } else {
        res.status(200).json({
          status: 200,
          message: "Success",
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
});

router.post("/", (req, res) => {
  const data = req.body.data;
  if (!data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    const form = new NewForms(data);
    form
      .save()
      .then((result) => {
        res.json({
          status: "200",
          message: "Success",
          data: { forms: form },
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Error. Please try again" });
      });
  }
});

router.post("/inputs", async (req, res) => {
  try {
    const updatedUser = await NewForms.findOneAndUpdate(
      { _id: new ObjectId(req.body._id) },
      {
        $push: {
          items: { ...req.body.item, id: generateRandomId("number", 10) },
        },
      }, // Use $push to push the new item into the 'items' array
      { returnOriginal: false }
    );

    // Extract only the necessary data from the updatedUser object to avoid circular references
    const responseData = {
      _id: updatedUser._id,
      items: updatedUser.items,
      // Add other properties that you want to include in the response
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/", (req, res) => {
  const id = req.query.id;
  const data = req.body.data;
  if (!id || !data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    NewForms.findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .then((result) => {
        if (result === null) {
          res
            .status(400)
            .json({ status: 400, message: "NewForms does not exist" });
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
router.put("/hard/save", (req, res) => {
  const id = req.query.id;
  const data = req.body.data;

  if (!id || !data) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    NewForms.findOneAndUpdate({ _id: id }, { ...data }, { new: true })
      .then((result) => {
        if (result === null) {
          res
            .status(400)
            .json({ status: 400, message: "NewForms does not exist" });
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
router.put("/inputs", async (req, res) => {
  try {
    const { id } = req.query;
    // Use findOneAndUpdate with $set to update the specific item in the 'items' array
    const updatedUser = await NewForms.findOneAndUpdate(
      { "items.id": id },
      { $set: { "items.$[elem]": req.body } },
      {
        returnOriginal: false,
        arrayFilters: [{ "elem.id": id }],
      }
    );

    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({
        code: 404,
        error: "User with the provided ID not found",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update item" });
  }
});
router.delete("/", (req, res) => {
  const id = req.query.id;
  if (!id) {
    res.status(401).json({ status: 401, message: "Invalid details" });
  } else {
    NewForms.findOneAndDelete({ _id: id })
      .then((success) => {
        if (success === null) {
          res
            .status(200)
            .json({ status: 200, message: "NewForms does not exist" });
        } else {
          res.status(200).json({
            status: 200,
            message: `Successfully deleted NewForms`,
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
router.delete("/inputs", async (req, res) => {
  try {
    const { id } = req.query;
    // Use findOneAndUpdate with $set to update the specific item in the 'items' array
    const updatedUser = await NewForms.findOneAndUpdate(
      { "items.id": id },
      { $pull: { items: { id: id } } },
      { returnOriginal: false }
    );

    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({
        code: 404,
        error: "User with the provided ID not found",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to update item" });
  }
});
module.exports = router;
