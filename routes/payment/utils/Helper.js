const { default: axios } = require("axios");
const sendgrid = require("@sendgrid/mail");
const { ObjectId } = require("mongodb");


function generateRandomId(type, length) {
  let characters;

  if (type === "number") {
    characters = "0123456789";
  } else if (type === "mixed") {
    characters =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  } else {
    throw new Error("Invalid type specified");
  }

  let randomId = "";
  for (let i = 0; i < length; i++) {
    randomId += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return randomId;
}
async function sendWhatsAppMessage(whatsappNumber, message) {
  try {
    const response = await axios.post(
      `https://live-server-114170.wati.io/api/v1/sendTemplateMessage?whatsappNumber=${whatsappNumber}`,
      message,
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmIyMDNiMy1mOGU0LTQ3YTItYjY2Mi0wMjdjZWZjNmIzOWEiLCJ1bmlxdWVfbmFtZSI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwibmFtZWlkIjoieWFzaGphaW5AcHN5bWF0ZS5vcmciLCJlbWFpbCI6Inlhc2hqYWluQHBzeW1hdGUub3JnIiwiYXV0aF90aW1lIjoiMDkvMjUvMjAyMyAxMDo1NzowMSIsImRiX25hbWUiOiIxMTQxNzAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOlsiQlJPQURDQVNUX01BTkFHRVIiLCJURU1QTEFURV9NQU5BR0VSIiwiREVWRUxPUEVSIiwiQVVUT01BVElPTl9NQU5BR0VSIl0sImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.KU-ziz4HsTTb1-nyceoOJeRGS6QimtWr8luaGI1yf24", // Replace with your Wati Authorization Token
        },
      }
    );

    console.log("WhatsApp Message Sent:", response.data.result);
  } catch (error) {
    console.error("WhatsApp Message Sending Error:", error);
  }
}

function paginateQuery(query, page = 1, limit = 10, sort) {
  const skip = (page - 1) * limit;
  return query
    .sort(sort ? sort : { createdAt: -1 })
    .skip(skip)
    .limit(limit);
}

const processContent = (reportTemplate, content) => {
  // Replace variables in the report
  const processedReport = reportTemplate.replace(
    /{{\s*([\w.]+)\s*}}/g,
    (match, variableName) => {
      return content[variableName] || match;
    }
  );

  return processedReport;
};
function getAllUniqueTagsLowercased(dataArray, index) {
  const tagsSet = new Set();

  dataArray?.forEach((item) => {
    const tag = item?.tag?.toLowerCase().split(",")[index];
    tagsSet.add(tag && tag);
  });

  return Array.from(tagsSet);
}

const createQuery = (search, searchBy, exact, boolean) => {
  const query = {};
  if (search && searchBy) {
    if (exact === "true") {
      if (searchBy == "_id") {
        query[searchBy] = new ObjectId(search);
      } else {
        query[searchBy] = search;
      }
    } else {
      if (boolean === "true") {
        query[searchBy] = search === "true" ? true : false;
      } else {
        query[searchBy] = { $regex: search, $options: "i" };
      }
    }
  }
  return query;
};

const sendPatientEmail = async (email, subject, template) => {
  try {
    if (!email) {
      throw new Error("Email is missing");
    }

    const emailOptions = {
      to: email,
      from: process.env.MAIL_FROM,
      subject: subject,
      html: template,
    };

    await sendgrid.send(emailOptions);
    console.log(`Email sent to patient without PDF attachment to ${email}`);
  } catch (err) {
    console.error(
      `Error in sending email to patient with PDF attachment to ${email}`,
      err
    );
    throw err; // Re-throw the error for handling at the higher level
  }
};

module.exports = {
  generateRandomId,
  paginateQuery,
  sendPatientEmail,
  processContent,
  getAllUniqueTagsLowercased,
  createQuery,
  sendWhatsAppMessage,
};
