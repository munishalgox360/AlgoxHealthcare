const express = require("express");
// const { firestore } = require("firebase-admin");
const router = express.Router();
const firebase = require("../../lib/firebase.prod.js");
const FieldValue = require("firebase-admin").firestore.FieldValue;
const { v4: uuidv4 } = require("uuid");

router.post("/verify", (req, res) => {
  const code = req.body.code || "";
  const user = req.body.uid;
  if (!user || user == "") {
    return res.json({
      status: 400,
      message: "No user to redeem code on",
      data: { found: false },
    });
  } else {
    firebase.fs
      .firestore()
      .collection("coupons")
      .where("code", "==", code)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          res.json({
            status: 400,
            message: "No such coupon exists",
            data: { found: false },
          });
        } else {
          const data = snapshot.docs.map((contentObj) => ({
            ...contentObj.data(),
          }));

          if (data[0].status !== "active") {
            res.json({
              status: 400,
              message: "Coupon expired",
              data: { found: false },
            });
          } else {
            if (data[0].singleUser && data[0].usedBy && !data[0].usedBy[user]) {
              res.json({
                status: 400,
                message: "Coupon expired",
                data: { found: false },
              });
            } else if (data[0].usedBy && data[0].usedBy[user]) {
              if (
                data[0].usedBy[user].status !== "active" ||
                data[0].usedBy[user].uses == 0
              ) {
                res.json({
                  status: 400,
                  message: "Coupon expired",
                  data: { found: false },
                });
              } else {
                res.status(200).json({
                  status: 200,
                  message: "Token verified",
                  data: {
                    found: true,
                    uses: data[0].usedBy[user].uses,
                    status: data[0].usedBy[user].status,
                  },
                });
              }
            } else {
              res.status(200).json({
                status: 200,
                message: "Token verified",
                data: {
                  found: true,
                  uses: data[0].uses,
                  status: data[0].status,
                },
              });
            }
          }
        }
      })

      .catch((err) => {
        console.log(err);
        res.json({
          status: 500,
          message: "Server error in processing your request",
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
      data: { found: false },
    });
  } else {
    firebase.fs
      .firestore()
      .collection("coupons")
      .where("code", "==", code)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          res.json({
            status: 400,
            message: "No such coupon exists",
            data: { found: false },
          });
        } else {
          const data = snapshot.docs.map((contentObj) => ({
            ...contentObj.data(),
          }));

          if (data[0].status !== "active") {
            res.json({
              status: 400,
              message: "Coupon expired",
              data: { found: false },
            });
          } else {
            if (data[0].singleUser && data[0].usedBy && !data[0].usedBy[user]) {
              res.json({
                status: 400,
                message: "Coupon expired",
                data: { found: false },
              });
            } else if (data[0].usedBy && data[0].usedBy[user]) {
              if (
                data[0].usedBy[user].status !== "active" ||
                data[0].usedBy[user].uses == 0
              ) {
                res.json({
                  status: 400,
                  message: "Coupon expired",
                  data: { found: false },
                });
              } else {
                var newCouponStatus = data[0];
                if (data[0].usedBy[user].uses == 1) {
                  newCouponStatus.usedBy[user].uses = 0;
                  newCouponStatus.usedBy[user].status = "inactive";
                  // newCouponStatus.usedBy[user].usedOn.push(new Date().now());
                } else {
                  newCouponStatus.usedBy[user].uses =
                    data[0].usedBy[user].uses - 1;
                  // newCouponStatus.usedBy[user].usedOn.push(new Date().now());
                }
                newCouponStatus.usedBy[user].usedOn.push(
                  new Date().toISOString()
                );
                firebase.fs
                  .firestore()
                  .collection("coupons")
                  .doc(data[0].uid)
                  .update(newCouponStatus)
                  .then(() => {
                    firebase.fs
                      .firestore()
                      .collection("user-patients")
                      .doc(user)
                      .update({
                        credits: FieldValue.increment(data[0].value),
                      })
                      .then(() => {
                        res.status(200).json({
                          status: 200,
                          message: "Token verified and redeemed",
                          data: {
                            found: true,
                            uses: newCouponStatus.usedBy[user].uses,
                            status: newCouponStatus.usedBy[user].status,
                          },
                        });
                      })
                      .catch((error) => {
                        console.log(error);
                        res.json({
                          status: 500,
                          message: "Server error in processing your request",
                        });
                      });
                  })
                  .catch((error) => {
                    console.log(error);
                    res.json({
                      status: 500,
                      message: "Server error in processing your request",
                    });
                  });
              }
            } else {
              var newCouponStatus = data[0];
              newCouponStatus.usedBy[user] = {
                uses: 0,
                status: "active",
                usedOn: [],
              };
              if (data[0].uses == 1) {
                newCouponStatus.usedBy[user].uses = 0;
                newCouponStatus.usedBy[user].status = "inactive";
                // newCouponStatus.usedBy[user].usedOn.push(new Date().now());
              } else {
                newCouponStatus.usedBy[user].uses = data[0].uses - 1;
                // newCouponStatus.usedBy[user].usedOn.push(new Date().now());
              }
              newCouponStatus.usedBy[user].usedOn.push(
                new Date().toISOString()
              );
              firebase.fs
                .firestore()
                .collection("coupons")
                .doc(data[0].uid)
                .update(newCouponStatus)
                .then((success) => {
                  firebase.fs
                    .firestore()
                    .collection("user-patients")
                    .doc(user)
                    .update({
                      credits: FieldValue.increment(data[0].value),
                    })
                    .then(() => {
                      res.status(200).json({
                        status: 200,
                        message: "Token verified and redeemed",
                        data: {
                          found: true,
                          uses: newCouponStatus.usedBy[user].uses,
                          status: newCouponStatus.usedBy[user].status,
                        },
                      });
                    })
                    .catch((error) => {
                      console.log(error);
                      res.json({
                        status: 500,
                        message: "Server error in processing your request",
                      });
                    });
                })
                .catch((error) => {
                  console.log(error);
                  res.json({
                    status: 500,
                    message: "Server error in processing your request",
                  });
                });
            }
          }
        }
      })

      .catch((err) => {
        console.log(err);
        res.json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  }
  //  else {
  //   res.json({
  //     status: 400,
  //     message: "Please provide valid field code ID to delete"
  //   });
  // }
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
    usedBy: {},
  };
  if (code && amount) {
    firebase.fs
      .firestore()
      .collection("coupons")
      .where("code", "==", code)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          firebase.fs
            .firestore()
            .collection("coupons")
            .doc(uid)
            .set(newCoupon)
            .then((success) => {
              res.json({ status: 200, message: "Success" });
            })
            .catch((error) => {
              console.log(error);
              res.json({
                status: 500,
                message: "Server error in processing your request",
              });
            });
        } else {
          res.json({
            status: 400,
            message: "Coupon code already exists",
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  } else {
    res.json({
      status: 400,
      message: "Please provide a valid code and amount",
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
    status: status,
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
    console.log(req.body, updateCoupon, codeID);
    res.json({
      status: 400,
      message: "Please provide valid field values to update",
    });
  } else {
    firebase.fs
      .firestore()
      .collection("coupons")
      .doc(codeID)
      .update(updateCoupon)
      .then(() => {
        res.json({ status: 200, message: "Success" });
      })
      .catch((error) => {
        console.log(error);
        res.json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  }
});
router.post("/delete", (req, res) => {
  const codeID = req.body.codeID;
  if (codeID) {
    firebase.fs
      .firestore()
      .collection("coupons")
      .doc(codeID)
      .delete()
      .then(() => {
        res.json({ status: 200, message: "Success" });
      })
      .catch((error) => {
        console.log(error);
        res.json({
          status: 500,
          message: "Server error in processing your request",
        });
      });
  } else {
    res.json({
      status: 400,
      message: "Please provide valid field code ID to delete",
    });
  }
});

module.exports = router;
