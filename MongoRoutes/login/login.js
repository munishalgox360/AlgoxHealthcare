const express = require("express");
const router = express.Router();
const { User } = require("../../schemas/User");
const otpGenerator = require("otp-generator");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const config = process.env;
const jwt = require("jsonwebtoken");
const { SiteSettings } = require("../../schemas/SiteSettings");
const qr = require("qrcode");
const fs = require("fs"); // Import the built-in 'fs' library to read the PDF file
const { s3Uploadv2 } = require("../../routes/service/s3Service");
const { sendPatientEmail } = require("../../routes/payment/utils/Helper");
const { generateOTPTemplate } = require("../../templates/otpTemplate");
const testingNumbers = [
  "1111111111"
];

router.get("/", (req, res) => {
  const phone = req.query.credential;
  let otp = otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  const url = `https://2factor.in/API/V1/${process.env.API_KEY_2FACTOR}/SMS/${phone}/${otp}/OtpSMS1`;
  if (!phone) {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  } else {
    User.findOne({
      $or: [{ phone: phone }, { phoneNumber: phone }],
    })
      .then((result) => {
        if (testingNumbers.indexOf(phone) !== -1) {
          otp = "000000";
        }
        console.log(result);
        if (result === null) {
          axios
            .get(url)
            .then((success) => {
              res.status(200).json({
                status: 200,
                login: false,
                message: otp,
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({
                status: 500,
                message: "Server error in processing your request",
              });
            });
        } else {
          if (testingNumbers.includes(phone)) {
            const token = jwt.sign(
              { userId: result._doc.uid },
              config.JWT_SECRET,
              {
                expiresIn: "12h",
              }
            );
            res.status(200).json({
              status: 200,
              login: true,
              message: otp,
              userData: { ...result._doc, jwt: token },
            });
          } else {
            axios
            .get(url)
            .then((success) => {
              console.log(success);
              const token = jwt.sign(
                { userId: result._doc.uid },
                config.JWT_SECRET,
                {
                  expiresIn: "12h",
                }
              );
              res.status(200).json({
                status: 200,
                login: true,
                message: otp,
                userData: { ...result._doc, jwt: token },
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({
                status: 500,
                message: "Server error in processing your request",
              });
            });
          }
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

router.post("/register", async (req, res) => {
  const userData = req.body.data;
  const type = req.query.type;
  const uid = uuidv4();
  const token = jwt.sign({ userId: uid }, config.JWT_SECRET, {
    expiresIn: "12h",
  });

  try {
    // Check if email or phone number already exists

    if (userData.phone) {
      // Check if the provided Phone is unique
      const existingUserWithPhone = await User.findOne({
        phone: userData.phone,
      });

      if (existingUserWithPhone) {
        return res.status(400).json({
          status: 400,
          message: "Phone is already taken.",
        });
      }
    }
    if (userData.email) {
      // Check if the provided userId is unique
      const existingUserWithEmail = await User.findOne({
        email: userData.email,
      });

      if (existingUserWithEmail) {
        return res.status(400).json({
          status: 400,
          message: "Email is already taken.",
        });
      }
    }
    if (userData.userId) {
      // Check if the provided userId is unique
      const existingUserWithuserId = await User.findOne({
        userId: userData.userId,
      });

      if (existingUserWithuserId) {
        return res.status(400).json({
          status: 400,
          message: "User ID is already taken.",
        });
      }
    }

    let existingSettings = await SiteSettings.findOne();
    if (!existingSettings) {
      existingSettings = new SiteSettings();
    }
    existingSettings.psyID += 1;
    const psyID = existingSettings.psyID;

    if (!type || !userData) {
      return res.status(401).json({
        status: 401,
        message: "Invalid User Credentials",
      });
    }

    const newUser = new User({
      ...userData,
      type: type,
      uid: uid,
      balance: 0,
      psyID: psyID,
    });

    const doctorId = newUser._id.toString();

    const pageURL = `https://www.psymate.org/profile/${doctorId}?service=checkIn`;

    if (type === "doctor") {
      const qrCodeData = await qr.toDataURL(pageURL);

      // Convert the QR code data URL to a Buffer
      const qrCodeBuffer = Buffer.from(
        qrCodeData.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );

      // Create a unique file name
      const imagePath = `qr_${uuidv4()}.png`;

      // Save the QR code image to a file
      await fs.promises.writeFile(imagePath, qrCodeBuffer);

      // Upload the image to Amazon S3
      const uploadToS3 = await s3Uploadv2([
        {
          originalname: imagePath,
          buffer: qrCodeBuffer,
        },
      ]);
      newUser.qr = uploadToS3[0].Location;
      console.log("Uploaded to S3:", uploadToS3[0].Location);

      // Send a WhatsApp message with the PDF attachment
      axios
        .post(
          `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=91${newUser.phone}`,
          {
            template_name: "registeration_doctor",
            broadcast_name: "registeration_doctor",
            parameters: [
              {
                name: "doctor_name",
                value: newUser.displayName,
              },
              {
                name: "doctor_qr_url",
                value: uploadToS3[0].Location,
              },
            ],
          },
          {
            headers: {
              ["Authorization"]:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
            },
          }
        )
        .then((res) => {
          console.log(
            "WhatsApp Message Sent to the registered whats app no. " +
              newUser.phone
          );
        })
        .catch((err) => {
          console.log(
            "Error in sending WhatsApp Message to the registered whats app no. " +
              newUser.phone
          );
        });
    }

    await existingSettings.save();
    await newUser.save();

    res.status(200).json({
      status: 200,
      message: "Successfully created user",
      data: { ...newUser, jwt: token },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Server error in processing your request",
    });
  }
});

router.get("/resend-otp", (req, res) => {
  const phone = req.query.credential;
  if (phone) {
    let otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const url = `https://2factor.in/API/V1/${process.env.API_KEY_2FACTOR}/SMS/${phone}/${otp}/OtpSMS1`;

    axios
      .get(url)
      .then((success) => {
        res.status(200).json({
          status: 200,
          message: otp,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  } else {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  }
});

router.get("/send-otp/:credential", async (req, res) => {
  const credential = req.params.credential;

  const existingUserWithcredential = await User.findOne({
    $or: [{ email: credential }, { phone: credential }],
  });

  if (existingUserWithcredential) {
    let otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

 
    if (existingUserWithcredential.email) {
      const invoiceEmailTemplate = generateOTPTemplate(otp);
      sendPatientEmail(
        existingUserWithcredential.email,
        "Psymate Healthcare, OTP Verification",
        invoiceEmailTemplate
      );
    } else if (existingUserWithcredential.phone) {
      const url = `https://2factor.in/API/V1/${process.env.API_KEY_2FACTOR}/SMS/${credential}/${otp}/OtpSMS1`;
      axios
        .get(url)
        .then((success) => {
          res.status(200).json({
            status: 200,
            message: otp,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            status: 500,
            message: "Server error in processing your request",
          });
        });
    }
  } else {
    res.status(401).json({ status: 401, message: "Invalid User Credentials" });
  }
});

router.post("/email", (req, res) => {
  const userId = req.body.userId;
  const password = req.body.password;

  User.findOne({
    userId: userId,
    password: password,
  }).then((result) => {
    if (result === null) {
      res.status(404).json({ status: 401, message: "User does not exist" });
    } else {
      if (result._doc) {
        if (password != result._doc.password) {
          res.status(500).json({
            status: 500,
            message: "incorrect password",
          });
        }
        const token = jwt.sign({ userId: result._doc.uid }, config.JWT_SECRET, {
          expiresIn: "12h",
        });
        res.status(200).json({
          status: 200,
          data: { ...result._doc, jwt: token },
          jwt: token,
        });
      } else {
        res.status(401).json({
          status: 404,
          message: "User password not assigned/activated yet",
        });
      }
    }
  });
});

router.get("/verifyUser", (req, res) => {
  const phoneNumber = req.query.phoneNumber;
  if (!phoneNumber) {
    res
      .status(401)
      .json({ status: 401, message: "Kindly provide the phone number" });
  }
  User.findOne({
    $or: [{ phone: phoneNumber }],
  }).then((result) => {
    if (result === null) {
      res.status(404).json({
        status: 404,
        message: "User doesn't exist",
      });
    }
    const { firstName = "John", lastName = "Mathey" } = result;
    res.status(200).json({
      status: 200,
      message: "User Already Exist",
      data: { firstName, lastName },
    });
  });
});

module.exports = router;
