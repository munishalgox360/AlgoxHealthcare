require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const externalFetchRouter = require("./routes/client/externalFetch");
const couponRouter = require("./routes/coupons/coupons");
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
  res.setHeader(
    "Access-Control-Allow-Method",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type",
    "Authorization"
  );
  next();
});
// route included
app.use("/payment", require("./routes/payment"));
app.use("/sendSMS", require("./routes/sendSMS"));
app.use("/email", require("./routes/emailHandler"));
app.use("/data", externalFetchRouter);
app.use("/", require("./routes/client/user"));
app.use("/media", require("./routes/client/media"));
app.use("/coupon", couponRouter);
app.use("/payment", require("./routes/payment/payment"));
app.use("/login", require("./routes/login"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.listen(port, () => console.log(`server started on port ${port}`));
