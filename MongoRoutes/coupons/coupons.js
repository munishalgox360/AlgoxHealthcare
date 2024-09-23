const express = require("express");
const router = express.Router();
const { Coupon, User } = require("../../schemas/User");
const { v4: uuidv4 } = require("uuid");

router.get("/", (req, res) => {
  Coupon.find()
    .then((response) => {
      res.json({ status: 200, data: response, message: `Success` });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        status: 500,
        message: "Server error in processing your request"
      });
    });
});

router.post("/verify", (req, res) => {
  const code = req.body.code || "";
  const user = req.body.uid;
  if (!user || user == "") {
    return res.json({
      status: 400,
      message: "No user to redeem code on",
      data: { found: false }
    });
  } else {
    Coupon.findOne({ code: code })
      .then((result) => {
        if (result === null) {
          res.json({
            status: 400,
            message: "No such coupon exists",
            data: { found: false }
          });
        } else {
          if (result._doc.status !== "active") {
            res.json({
              status: 400,
              message: "Coupon expired",
              data: { found: false }
            });
          } else {
            if (
              result._doc.singleUser &&
              result._doc.usedBy &&
              !result._doc.usedBy[user]
            ) {
              res.json({
                status: 400,
                message: "Coupon expired",
                data: { found: false }
              });
            } else if (result._doc.usedBy && result._doc.usedBy[user]) {
              if (
                result._doc.usedBy[user].status !== "active" ||
                result._doc.usedBy[user].uses == 0
              ) {
                res.json({
                  status: 400,
                  message: "Coupon expired",
                  data: { found: false }
                });
              } else {
                res.status(200).json({
                  status: 200,
                  message: "Token verified",
                  data: {
                    found: true,
                    uses: result._doc.usedBy[user].uses,
                    status: result._doc.usedBy[user].status
                  }
                });
              }
            } else {
              res.status(200).json({
                status: 200,
                message: "Token verified",
                data: {
                  found: true,
                  uses: result._doc.uses,
                  status: result._doc.status
                }
              });
            }
          }
        }
      })
      .catch((err) => {
        console.log(err);
        res.json({
          status: 500,
          message: "Server error in processing your request"
        });
      });
  }
});

router.post("/redeem", (req, res) => {
  const code = req.body.code || "";
  const user = req.body.uid;
  if (!user || user == "") {
    return res.json({
      status: 400,
      message: "No user to redeem code on",
      data: { found: false }
    });
  } else {
    Coupon.findOne({ code: code })
      .then((result) => {
        if (result === null) {
          res.json({
            status: 400,
            message: "No such coupon exists",
            data: { found: false }
          });
        } else {
          if (result._doc.status !== "active") {
            res.json({
              status: 400,
              message: "Coupon expired",
              data: { found: false }
            });
          } else {
            if (
              result._doc.singleUser &&
              result._doc.usedBy &&
              !result._doc.usedBy[user]
            ) {
              res.json({
                status: 400,
                message: "Coupon expired",
                data: { found: false }
              });
            } else if (result._doc.usedBy && result._doc.usedBy[user]) {
              if (
                result._doc.usedBy[user].status !== "active" ||
                result._doc.usedBy[user].uses == 0
              ) {
                res.json({
                  status: 400,
                  message: "Coupon expired",
                  data: { found: false }
                });
              } else {
                var newCouponStatus = result._doc;
                if (result._doc.usedBy[user].uses == 1) {
                  newCouponStatus.usedBy[user].uses = 0;
                  newCouponStatus.usedBy[user].status = "inactive";
                  // newCouponStatus.usedBy[user].usedOn.push(new Date().now());
                } else {
                  newCouponStatus.usedBy[user].uses =
                    result._doc.usedBy[user].uses - 1;
                  // newCouponStatus.usedBy[user].usedOn.push(new Date().now());
                }
                newCouponStatus.usedBy[user].usedOn.push(
                  new Date().toISOString()
                );
                Coupon.findOneAndUpdate(
                  { uid: result._doc.uid },
                  { ...newCouponStatus }
                )
                  .then(() => {
                    User.findOneAndUpdate(
                      { uid: user },
                      { $inc: { credits: result._doc.value } }
                    )
                      .then(() => {
                        res.status(200).json({
                          status: 200,
                          message: "Token verified and redeemed",
                          data: {
                            found: true,
                            uses: newCouponStatus.usedBy[user].uses,
                            status: newCouponStatus.usedBy[user].status
                          }
                        });
                      })
                      .catch((error) => {
                        console.log(error);
                        res.json({
                          status: 500,
                          message: "Server error in processing your request"
                        });
                      });
                  })
                  .catch((error) => {
                    console.log(error);
                    res.json({
                      status: 500,
                      message: "Server error in processing your request"
                    });
                  });
              }
            } else {
              var newCouponStatus = result._doc;
              newCouponStatus.usedBy[user] = {
                uses: 0,
                status: "active",
                usedOn: []
              };
              if (result._doc.uses == 1) {
                newCouponStatus.usedBy[user].uses = 0;
                newCouponStatus.usedBy[user].status = "inactive";
                // newCouponStatus.usedBy[user].usedOn.push(new Date().now());
              } else {
                newCouponStatus.usedBy[user].uses = result._doc.uses - 1;
                // newCouponStatus.usedBy[user].usedOn.push(new Date().now());
              }
              newCouponStatus.usedBy[user].usedOn.push(
                new Date().toISOString()
              );
              Coupon.findOneAndUpdate(
                { uid: result._doc.uid },
                { ...newCouponStatus }
              )
                .then(() => {
                  User.findOneAndUpdate(
                    { uid: user },
                    { $inc: { credits: result._doc.value } }
                  ).then(() => {
                    res.status(200).json({
                      status: 200,
                      message: "Token verified and redeemed",
                      data: {
                        found: true,
                        uses: newCouponStatus.usedBy[user].uses,
                        status: newCouponStatus.usedBy[user].status
                      }
                    });
                  });
                })
                .catch((error) => {
                  console.log(error);
                  res.json({
                    status: 500,
                    message: "Server error in processing your request"
                  });
                });
            }
          }
        }
      })
      .catch((error) => {
        console.log(error);
        res.json({
          status: 500,
          message: "Server error in processing your request"
        });
      });
  }
});

router.post("/", (req, res) => {
  const code = req.body.code;
  const amount = req.body.value;
  const uses = req.body.uses || 1;
  const singleUser = req.body.singleUser || false;
  const uid = uuidv4();
  const newCoupon = {
    code: code,
    status: "active",
    uses: uses,
    value: amount,
    singleUser: singleUser,
    uid: uid,
    usedBy: {}
  };
  if (code && amount) {
    Coupon.findOne({ code: code })
      .then((result) => {
        if (result === null) {
          const couponInsert = new Coupon({ ...newCoupon });
          couponInsert
            .save()
            .then(() => {
              res.json({ status: 200, message: "Success" });
            })
            .catch((error) => {
              console.log(error);
              res.json({
                status: 500,
                message: "Server error in processing your request"
              });
            });
        } else {
          res.json({
            status: 400,
            message: "Coupon code already exists"
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json({
          status: 500,
          message: "Server error in processing your request"
        });
      });
  } else {
    res.json({
      status: 400,
      message: "Please provide a valid code and amount"
    });
  }
});

router.put("/", (req, res) => {
  const codeID = req.body.codeID;
  const value = req.body.value;
  const uses = req.body.uses;
  const singleUser = req.body.singleUser;
  const status = req.body.status;
  const updateCoupon = {
    uses: uses,
    value: value,
    singleUser: singleUser,
    status: status
  };
  if (!uses) {
    delete updateCoupon.uses;
  }
  if (!value) {
    delete updateCoupon.value;
  }
  if (!singleUser) {
    delete updateCoupon.singleUser;
  }
  if (!status) {
    delete updateCoupon.status;
  }
  if (Object.keys(updateCoupon).length === 0 || !codeID) {
    res.json({
      status: 400,
      message: "Please provide valid field values to update"
    });
  } else {
    Coupon.findOneAndUpdate({ uid: codeID }, { ...updateCoupon })
      .then(() => {
        res.json({ status: 200, message: "Success" });
      })
      .catch((error) => {
        console.log(error);
        res.json({
          status: 500,
          message: "Server error in processing your request"
        });
      });
  }
});
router.post("/delete", (req, res) => {
  const codeID = req.body.codeID;
  if (codeID) {
    Coupon.findOneAndDelete({ uid: codeID })
      .then(() => {
        res.json({ status: 200, message: "Success" });
      })
      .catch((error) => {
        console.log(error);
        res.json({
          status: 500,
          message: "Server error in processing your request"
        });
      });
  } else {
    res.json({
      status: 400,
      message: "Please provide valid field code ID to delete"
    });
  }
});

module.exports = router;
