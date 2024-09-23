require("dotenv").config();

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { s3Uploadv2 } = require("./service/s3Service");
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // if (file.mimetype.split("/")[0] === "image") {
      cb(null, true);
    // } else {
      // cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    // }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1000000000, files: 2 },
});

router.post("/upload", upload.array("file"), async (req, res) => {
   try {
    const results = await s3Uploadv2(req.files);
    console.log(results);
    return res.json({ status: "success", results });
   }catch(err) {
     console.log(err);
   }
})
module.exports = router;