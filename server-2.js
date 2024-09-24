require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const https = require("https");
const multer = require("multer");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT;
const { verifyToken } = require("./middleware/auth.js");


// Load SSL certificates
const privateKey = fs.readFileSync('/etc/letsencrypt/live/kambojproperty.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/kambojproperty.com/fullchain.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/kambojproperty.com/chain.pem', 'utf8'); 

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

const dbName = process.env.DB_NAME;
const url = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@daphnis-cluster.pkoatzk.mongodb.net/psymate-development?retryWrites=true`;
// const url = "mongodb://127.0.0.1:27017/Psymate_Locale_Suraj";

mongoose.connect(
  url,
  { useNewUrlParser: true, useUnifiedTopology: true, dbName },
  () => { 
    console.log("Db connection successful");
  }
);


// middlewares
app.use(express.json({ extended: false }));
app.use(
  express.urlencoded({
    extended: true,
  })
);

//WhiteListing
// const corsOptions = {
//   origin: "https://www.psymate.org",
//   methods: "OPTIONS, GET, POST, PUT, PATCH, DELETE",
//   allowedHeaders: ["Content-Type", "Authorization", "x-origin"],
//   credentials: true,  
//   optionsSuccessStatus: 204,
// }
// app.use(cors(corsOptions));

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


app.get("/", (req, res) => {
  res.send("!!Server Running...");
});

// route included
app.use("/payment", verifyToken, require("./routes/payment"));
app.use("/sendSMS", verifyToken, require("./routes/sendSMS"));
app.use("/email", verifyToken, require("./routes/emailHandler"));
app.use("/user", verifyToken, require("./MongoRoutes/client/user"));
app.use("/user/likes", verifyToken, require("./MongoRoutes/siteSettings/Likes"));
app.use("/user/addresses", verifyToken, require("./MongoRoutes/siteSettings/Address"));
app.use(
  "/user/education", verifyToken,
  require("./MongoRoutes/siteSettings/user/Education")
);
app.use("/shiprocket/order", verifyToken, require("./shiprocket/order"));
app.use("/clinical_data", verifyToken, require("./MongoRoutes/clinc/clinical_data/index"));
app.use("/coupon", verifyToken, require("./MongoRoutes/coupon/index"));
app.use("/media", verifyToken, require("./MongoRoutes/client/media"));
app.use("/login", require("./MongoRoutes/login/login"));
app.use("/payment", verifyToken, require("./MongoRoutes/payment/payment"));
app.use("/transactions", verifyToken, require("./MongoRoutes/transactions"));
app.use("/assessments", verifyToken, require("./MongoRoutes/assessment"));
app.use("/migration", verifyToken, require("./migration-scripts/user"));
app.use("/disorder", verifyToken, require("./MongoRoutes/disorders.js"));
app.use("/article", verifyToken, require("./MongoRoutes/article/article"));
app.use("/feed", verifyToken, require("./MongoRoutes/feed/feed"));
app.use("/forms", verifyToken, require("./MongoRoutes/form/formData"));
app.use("/api/tools", verifyToken, require("./MongoRoutes/form/newForms"));
app.use("/offers", verifyToken, require("./MongoRoutes/siteSettings/Offers"));
app.use("/jobs", verifyToken, require("./MongoRoutes/siteSettings/jobs"));
app.use("/videos", verifyToken, require("./MongoRoutes/siteSettings/Videos"));
app.use("/courses", verifyToken, require("./MongoRoutes/siteSettings/Courses"));
app.use(
  "/wellnessPrograms", verifyToken, 
  require("./MongoRoutes/siteSettings/wellnessPrograms")
);
app.use("/verticles", verifyToken, require("./MongoRoutes/siteSettings/verticles"));
app.use("/status", verifyToken, require("./MongoRoutes/siteSettings/status"));
app.use("/disorderpage", verifyToken, require("./MongoRoutes/siteSettings/disorderpage"));
app.use("/appointment", verifyToken, require("./MongoRoutes/siteSettings/Appointment"));
app.use("/cart", verifyToken, require("./MongoRoutes/siteSettings/cart"));
app.use("/permissions", verifyToken, require("./MongoRoutes/roles/permissions"));
app.use("/invoice", verifyToken, require("./MongoRoutes/siteSettings/invoice"));
app.use("/data", verifyToken, require("./MongoRoutes/siteSettings/Settings"));
app.use("/orders", verifyToken, require("./MongoRoutes/siteSettings/orders"));
app.use("/item", verifyToken, require("./MongoRoutes/ecommerce/Item"));
app.use("/salt", verifyToken, require("./MongoRoutes/ecommerce/salt"));
app.use("/prescriptions", verifyToken, require("./MongoRoutes/siteSettings/prescriptions"));
app.use("/timeline", verifyToken, require("./MongoRoutes/siteSettings/timeline"));
app.use(
  "/ProvisionalCodes", verifyToken,
  require("./MongoRoutes/siteSettings/ProvisionalCodes")
);
app.use("/call", verifyToken, require("./routes/call"));
app.use("/getMetaTags", verifyToken, require("./MongoRoutes/metaTags"));
app.use("/externalBlogs", verifyToken, require("./MongoRoutes/siteSettings/externalBlogs"));
app.use(
  "/specifier", verifyToken,
  require("./MongoRoutes/history/symptom/common/specifiers")
);
app.use("/symptoms", verifyToken, require("./MongoRoutes/history/symptom/common/symptoms"));
app.use(
  "/learnerStories", verifyToken,
  require("./MongoRoutes/siteSettings/LearnerStories")
);
app.use("/establishment", verifyToken, require("./MongoRoutes/siteSettings/Establishments"));
app.use(
  "/appointmentTemplates", verifyToken,
  require("./MongoRoutes/siteSettings/AppointmentTemplates")
);
app.use(
  "/academyCategories", verifyToken,
  require("./MongoRoutes/siteSettings/AcademyCategories")
);
app.use("/testimonials", verifyToken, require("./MongoRoutes/siteSettings/Testimonials"));
app.use("/establishment", verifyToken, require("./MongoRoutes/siteSettings/Establishments"));
app.use("/faq", verifyToken, require("./MongoRoutes/siteSettings/FAQ"));
app.use("/roles", verifyToken, require("./MongoRoutes/roles/roles"));
app.use("/medicine", verifyToken, require("./MongoRoutes/pharmacy/medicine"));
app.use("/templates", verifyToken, require("./MongoRoutes/siteSettings/templates"));
app.use("/pharmacy", verifyToken, require("./MongoRoutes/pharmacy/category"));
app.use("/zoho", verifyToken, require("./routes/zoho"));
app.use("/file", verifyToken, require("./routes/file"));
app.use("/sessions", verifyToken, require("./MongoRoutes/appointment/doctor/sessions"));
app.use("/booking/appointment", verifyToken, require("./MongoRoutes/appointment/booking"));
app.use(
  "/booking/appointment/check", verifyToken,
  require("./MongoRoutes/appointment/booking/status/doctorCheckIn")
);
app.use("/pharmacycart", verifyToken, require("./MongoRoutes/pharmacy/cart"));
app.use("/booking", verifyToken, require("./routes/v2/booking"));
app.use("/blogs", verifyToken, require("./routes/v2/blogs"));
app.use("/news", verifyToken, require("./routes/v2/news"));
app.use("/articles", verifyToken, require("./routes/v2/articles"));
app.use("/podcast", verifyToken, require("./routes/v2/podcast"));
app.use("/gallery", verifyToken, require("./routes/v2/gallery"));
app.use("/v2/videos", verifyToken, require("./routes/v2/videos"));

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


https.createServer(credentials, app).listen(port, () => {
  console.log(`<h1>Express listening on port ${port}</h1>`);
});
