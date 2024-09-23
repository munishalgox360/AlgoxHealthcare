const axios = require("axios");

const INTERAKT_API_BASE_URL = process.env.INTERAKT_BASE_URL;
const INTERAKT_CREATE_USER = `${INTERAKT_API_BASE_URL}/track/users/`;
const INTERAKT_CREATE_EVENT = `${INTERAKT_API_BASE_URL}/track/events/`;
const firebase = require("../../../lib/firebase.prod.js");
const token = process.env.INTERAKT_AUTH_TOKEN;
const sendWhatsappMessage = (user, bookingData, userType) => {
  return new Promise((resolve, reject) => {
    firebase.fs
      .firestore()
      .collection("user-patients")
      .doc(user)
      .get()
      .then((success) => {
        if (success.empty) {
          reject({ status: 0, message: "User does not exist" });
        } else {
          const userData = success.data();
          let data;
          let userDataPayload;

          if (userType === "doctor") {
            data = {
              userId: user,
              phoneNumber: userData.phoneNumber,
              countryCode: "+91",
              event: "Appointment Booked",
              traits: bookingData
            };
            userDataPayload = {
              userId: userData.uid,
              phoneNumber: userData.phoneNumber,
              countryCode: "+91",
              traits: {
                name: userData.firstName + " " + userData.lastName,
                email: userData.email,
                type: userData.type,
                isAdmin: null,
                gender: userData.gender,
                uid: userData.uid,
                phone: userData.credential,
                dateOfBirth: userData.dateOfBirth,
                firstName: userData.firstName,
                lastName: userData.lastName,
                category: [],
                displayName: userData.displayName
              }
            };
          } else {
            data = {
              userId: user,
              phoneNumber: userData.phone,
              countryCode: "+91",
              event: "Appointment Booked",
              traits: bookingData
            };
            userDataPayload = {
              userId: userData.uid,
              phoneNumber: userData.phone,
              countryCode: "+91",
              traits: {
                name: userData.firstName + " " + userData.lastName,
                email: userData.email,
                type: userData.type,
                isAdmin: null,
                gender: userData.gender,
                uid: userData.uid,
                phone: userData.credential,
                dateOfBirth: userData.dateOfBirth,
                firstName: userData.firstName,
                lastName: userData.lastName,
                category: [],
                displayName: userData.displayName
              }
            };
          }

          axios
            .post(INTERAKT_CREATE_USER, userDataPayload, {
              headers: {
                Authorization: "Basic " + token,
                "Content-Type": "application/json"
              }
            })
            .then(() => {
              axios
                .post(INTERAKT_CREATE_EVENT, data, {
                  headers: {
                    Authorization: "Basic " + token,
                    "Content-Type": "application/json"
                  }
                })
                .then(() => {
                  resolve({ status: 1, message: "Success" });
                })
                .catch((err) => {
                  console.log(err);
                  reject({
                    status: 0,
                    message: "Error in creating Interakt Event"
                  });
                });
            })
            .catch((err) => {
              console.log(err);
              reject({ status: 0, message: "Error in creating Interakt user" });
            });
        }
      });
  });
};
module.exports = sendWhatsappMessage;
