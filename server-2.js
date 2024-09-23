require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const app = express();
const port = 200;
const url = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@daphnis-cluster.pkoatzk.mongodb.net/psymate-development?retryWrites=true`;
const dbName = process.env.DB_NAME;

mongoose.connect(
  url,
  { useNewUrlParser: true, useUnifiedTopology: true,dbName },
  () => {
    console.log("Db connection successful");
  }
);

// middlewares

app.use(express.json({ extended: false }));
app.use(cors());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "application/json")
  res.setHeader(
    "Access-Control-Allow-Method",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  next();
});
const jwt = require("jsonwebtoken");

app.use((req, res, next) => {
  console.log(
    req.headers["x-origin"] == "http://localhost:3000" ||
      req.headers["x-origin"] == "http://localhost:3001" ||
      req.headers["x-origin"] == "https://www.staging.psymate.org" ||
      req.headers["x-origin"] == "https://www.psymate.org",
    req.path
  );
  if (
    req.path === "/login" ||
    req.path === "/login/register" ||
    req.path === "/login/resend-otp" ||
    req.path === "/login/email" ||
    req.path === "/file/upload" ||
    req.path === "/call/users" ||
    req.path === "/call/callDetails" ||
    req.path === "/login/verifyUser" ||
    req.headers["x-origin"] == "http://localhost:3000" ||
    req.headers["x-origin"] == "http://localhost:3001" ||
    req.headers["x-origin"] == "https://www.staging.psymate.org" ||
    req.headers["x-origin"] == "https://www.psymate.org" ||
    req.headers["x-origin"] == "https://www.karmamate.org"
  ) {
    // Skip the JWT verification for the login endpoint
    return next();
  }

  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    return res.status(401).json({ error: "Authorization header is missing" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token is missing" });
  }

  jwt.verify(token, "f6kvXh2sDPVCAWaT0TxPvJK3QwcCUzPy", (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token is invalid" });
    }

    req.userId = decoded.userId;
    next();
  });
});

// route included
app.use("/payment", require("./routes/payment"));
app.use("/sendSMS", require("./routes/sendSMS"));
app.use("/email", require("./routes/emailHandler"));
// app.use("/data", require("./MongoRoutes/client/externalFetch.js"));
app.use("/", require("./MongoRoutes/client/user"));
app.use("/user/likes", require("./MongoRoutes/siteSettings/Likes"));
app.use("/user/addresses", require("./MongoRoutes/siteSettings/Address"));
app.use(
  "/user/education",
  require("./MongoRoutes/siteSettings/user/Education")
);
app.use("/shiprocket/order", require("./shiprocket/order"));
app.use("/clinical_data", require("./MongoRoutes/clinc/clinical_data/index"));
app.use("/coupon", require("./MongoRoutes/coupon/index"));
app.use("/media", require("./MongoRoutes/client/media"));
app.use("/login", require("./MongoRoutes/login/login"));
app.use("/payment", require("./MongoRoutes/payment/payment"));
app.use("/transactions", require("./MongoRoutes/transactions"));
app.use("/assessments", require("./MongoRoutes/assessment"));
app.use("/migration", require("./migration-scripts/user"));
app.use("/disorder", require("./MongoRoutes/disorders.js"));
app.use("/article", require("./MongoRoutes/article/article"));
app.use("/feed", require("./MongoRoutes/feed/feed"));
app.use("/forms", require("./MongoRoutes/form/formData"));
app.use("/api/tools", require("./MongoRoutes/form/newForms"));
app.use("/offers", require("./MongoRoutes/siteSettings/Offers"));
app.use("/jobs", require("./MongoRoutes/siteSettings/jobs"));
app.use("/videos", require("./MongoRoutes/siteSettings/Videos"));
app.use("/courses", require("./MongoRoutes/siteSettings/Courses"));
app.use(
  "/wellnessPrograms",
  require("./MongoRoutes/siteSettings/wellnessPrograms")
);
app.use("/verticles", require("./MongoRoutes/siteSettings/verticles"));
app.use("/status", require("./MongoRoutes/siteSettings/status"));
app.use("/disorderpage", require("./MongoRoutes/siteSettings/disorderpage"));
app.use("/appointment", require("./MongoRoutes/siteSettings/Appointment"));
app.use("/cart", require("./MongoRoutes/siteSettings/cart"));
app.use("/permissions", require("./MongoRoutes/roles/permissions"));
app.use("/invoice", require("./MongoRoutes/siteSettings/invoice"));
app.use("/data", require("./MongoRoutes/siteSettings/Settings"));
app.use("/orders", require("./MongoRoutes/siteSettings/orders"));
app.use("/item", require("./MongoRoutes/ecommerce/Item"));
app.use("/salt", require("./MongoRoutes/ecommerce/salt"));
app.use("/prescriptions", require("./MongoRoutes/siteSettings/prescriptions"));
app.use("/timeline", require("./MongoRoutes/siteSettings/timeline"));
app.use(
  "/ProvisionalCodes",
  require("./MongoRoutes/siteSettings/ProvisionalCodes")
);
app.use("/call", require("./routes/call"));
app.use("/getMetaTags", require("./MongoRoutes/metaTags"));
app.use("/externalBlogs", require("./MongoRoutes/siteSettings/externalBlogs"));
app.use(
  "/specifier",
  require("./MongoRoutes/history/symptom/common/specifiers")
);
app.use("/symptoms", require("./MongoRoutes/history/symptom/common/symptoms"));
app.use(
  "/learnerStories",
  require("./MongoRoutes/siteSettings/LearnerStories")
);
app.use("/establishment", require("./MongoRoutes/siteSettings/Establishments"));
app.use(
  "/appointmentTemplates",
  require("./MongoRoutes/siteSettings/AppointmentTemplates")
);
app.use(
  "/academyCategories",
  require("./MongoRoutes/siteSettings/AcademyCategories")
);
app.use("/testimonials", require("./MongoRoutes/siteSettings/Testimonials"));
app.use("/establishment", require("./MongoRoutes/siteSettings/Establishments"));
app.use("/faq", require("./MongoRoutes/siteSettings/FAQ"));
app.use("/roles", require("./MongoRoutes/roles/roles"));
app.use("/medicine", require("./MongoRoutes/pharmacy/medicine"));
app.use("/templates", require("./MongoRoutes/siteSettings/templates"));
app.use("/pharmacy", require("./MongoRoutes/pharmacy/category"));
app.use("/zoho", require("./routes/zoho"));
app.use("/file", require("./routes/file"));
app.use("/pdfreader",require("./routes/pdfReader.js"));
app.use("/sessions", require("./MongoRoutes/appointment/doctor/sessions"));
app.use("/booking/appointment", require("./MongoRoutes/appointment/booking"));
app.use(
  "/booking/appointment/check",
  require("./MongoRoutes/appointment/booking/status/doctorCheckIn")
);
app.use("/pharmacycart", require("./MongoRoutes/pharmacy/cart"));
app.use("/booking", require("./routes/v2/booking"));
app.use("/blogs", require("./routes/v2/blogs"));
app.use("/news", require("./routes/v2/news"));
app.use("/articles", require("./routes/v2/articles"));
app.use("/podcast", require("./routes/v2/podcast"));
app.use("/gallery", require("./routes/v2/gallery"));
app.use("/v2/videos", require("./routes/v2/videos"));
app.use("/music", require("./routes/v2/music"));

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "file is too large",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "File limit reached",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "File must be an image",
      });
    }
  }
});

app.get("/", (req, res) => {
  res.send("Server running!");
});

app.listen(port, () => console.log(`server started on port ${port}`));
