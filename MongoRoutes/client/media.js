const express = require("express");
const router = express.Router();
const { Media } = require("../../schemas/User");

router.get("/", (req, res) => {
  const type = req.query.type;
  Media.find().then((result) => {
    if (result.length > 0) {
      if (type) {
        const newData = result.filter((item) => item.type === type);
        res.status(200).json({
          status: 200,
          message: "Success",
          data: newData
        });
      } else {
        res.status(200).json({
          status: 200,
          message: "Success",
          data: result
        });
      }
    } else {
      res.status(200).json({ status: 200, message: "Media does not exist" });
    }
  });
});

module.exports = router;
