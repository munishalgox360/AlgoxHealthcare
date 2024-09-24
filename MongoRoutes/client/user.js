const { User } = require("../../schemas/User");
const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { SiteSettings } = require("../../schemas/SiteSettings");
const { createQuery } = require("../../routes/payment/utils/Helper");
const { accessToken } = require("../../middleware/auth.js");
const TokenAuthModel = require("../../schemas/v2/TokenAuth.schema.js");
const config = process.env;

router.post("/getUser", (req, res, next) => {
  const userCredential = req.body.credential;
  const userType = req.query.type || req.body.type;
  const search = req.query.search;
  const keyword = req.query.keyword;
  if (!userType) {
    res.status(400).json({ status: 400, message: "Invalid User Credentials" });
  } else {
    if (userCredential) {
      User.findOne({
        $or: [
          { phone: userCredential },
          { email: userCredential },
          { _id: userCredential },
          { phoneNumber: userCredential },
        ],
        type: userType,
      })
        .then((success) => {
          if (success === null) {
            res
              .status(200)
              .json({ status: 200, message: "User does not exist" });
          } else {
            res.status(200).json({
              status: 200,
              message: `Successfull`,
              data: { ...success._doc },
            });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            status: 500,
            message: "Server error in processing your request",
          });
        });
    } else if (search) {
      User.find({ displayName: { $regex: search, $options: "i" } })
        .then((response) => {
          res.json({ status: 200, data: response, message: `Success` });
        })
        .catch((error) => {
          console.log(error);
          res.status(500).json({
            status: 500,
            message: "Server error in processing your request",
          });
        });
    } else if (keyword) {
      User.find({ displayName: keyword })
        .then((response) => {
          console.log("reached keyword");
          res.json({ status: 200, data: response, message: `Success` });
        })
        .catch((error) => {
          console.log(error);
          res.status(500).json({
            status: 500,
            message: "Server error in processing your request",
          });
        });
    } else {
      User.find()
        .then((success) => {
          if (success === null) {
            res
              .status(200)
              .json({ status: 200, message: "User does not exist" });
          } else {
            res.status(200).json({
              status: 200,
              message: `Success`,
              data: success,
            });
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
  }
});

router.post("/role", (req, res, next) => {
  const userCredential = req.body.credential || req.query.credential;
  const roleToAdd = req.query.role || req.body.role;
  const token = jwt.sign({ userId: req.query.credential }, config.JWT_SECRET, {
    expiresIn: "12h",
  });

  if (!userCredential) {
    res.status(400).json({ status: 400, message: "Invalid User Credentials" });
  } else {
    // Find the user by their credentials
    User.findOneAndUpdate(
      {
        $or: [{ phone: userCredential }, { email: userCredential }],
        // Check if the "academic" role doesn't already exist in the roles array
        roles: { $ne: roleToAdd },
      },
      {
        $addToSet: { roles: roleToAdd }, // Add the role if it doesn't exist
      },
      { new: true }
    )
      .then((result) => {
        if (result === null) {
          res.status(400).json({
            status: 400,
            message: "User does not exist or role already exists",
          });
        } else {
          res.status(200).json({
            status: 200,
            message: "Successfully updated user data",
            data: { ...result._doc, jwt: token },
            jwt: token,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json({
          status: 400,
          message: "Invalid user or role",
        });
      });
  }
});

router.put("/user/:id", async (req, res) => {
  const userId = req.params.id;
  const userData = req.body;

  if (!userId || !userData) {
    res.status(400).json({ status: 400, message: "Invalid details" });
  } else {
    try {
      const updateDoc = {
        $set: userData,
      };
      const result = await User.updateOne(
        { _id: new ObjectId(userId) },
        updateDoc
      );
      if (result) {
        const updatedResults = await User.find({ _id: new ObjectId(userId) });
        res.status(200).json({
          status: 200,
          message: "User details has been updated successfully",
          data: updatedResults,
        });
      }
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        status: 500,
        message: "Error while updating the user details",
      });
    }
  }
});

//Proper filter api
router.get("/getAllUsers", async (req, res) => {
  try {
    const userType = req.query.type;
    const doctorsId = req.query.id;

    const filters = {
      specialization: req.query.specialization,
      yearsOfExperience: req.query.yearsOfExperience,
      defaultPrice: req.query.price,
      languages: req.query.languages,
      availability: req.query.availability,
    };

    let queryWithFilters = { type : userType };

    for (const filterKey in filters) {
      const filterValue = filters[filterKey];
      if (filterValue) {
        switch (filterKey) {
          case "specialization":
            const specializations =
              typeof filterValue === "string"
                ? filterValue.split(",")
                : [filterValue];
            queryWithFilters.specialization = { $in: specializations };
            break;
          case "yearsOfExperience":
            const expRange = filterValue.includes("-")
              ? filterValue.split("-")
              : [filterValue];
            const [minExp, maxExp] = expRange.map(Number);
            queryWithFilters.yearsOfExperience = {
              $gte: minExp,
              $lte: maxExp,
            };
            break;
          case "defaultPrice":
            const num = parseInt(filterValue);
            queryWithFilters.defaultPrice = { $lte: num };
            break;
          case "languages":
            const languages =
              typeof filterValue === "string"
                ? filterValue.split(",")
                : [filterValue];
            queryWithFilters.languages = { $in: languages };
            break;
          case "availability":
            queryWithFilters.availability = parseInt(filterValue);
            break;
          default:
            break;
        }
      }
    }

    let users;

    if (doctorsId) {
      users = await User.find({ _id: doctorsId });
    } else {
      users = await User.find(queryWithFilters);
    }

    if (!userType) {
      return res
        .status(400)
        .json({ status: 400, message: "Invalid User Credentials" });
    }

    let updatedResponse;

    if (
      userType === "doctor" &&
      !doctorsId &&
      !Object.values(filters).some(Boolean)
    ) {
      const success = await User.find({ type: userType });
      updatedResponse = success.map((item) => ({
        ...item._doc,
      }));
    } else if (userType === "doctor" && Object.values(filters).some(Boolean)) {
      const success = await User.find(queryWithFilters);
      updatedResponse = success.map((item) => ({
        ...item._doc,
      }));
    } else if (userType === "doctor" && doctorsId) {
      const success = await User.find({ _id: doctorsId });
      updatedResponse = success.map((item) => ({
        ...item._doc,
      }));
    } else {
      const success = await User.find({ type: userType });
      updatedResponse = success.map((item) => ({
        ...item._doc,
      }));
    }

    updatedResponse.sort((a, b) => {
      if (req.query.sortOrder === "asc") {
        return a.rank - b.rank;
      } else if (req.query.sortOrder === "desc") {
        return b.rank - a.rank;
      } else {
        return a.rank - b.rank;
      }
    });

    if (userType === "doctor" && req.query.sortPrice) {
      updatedResponse.sort((c, d) => {
        if (req.query.sortPrice === "low") {
          return c.defaultPrice - d.defaultPrice;
        } else if (req.query.sortPrice === "high") {
          return d.defaultPrice - c.defaultPrice;
        }

        return 0;
      });
    }

    return res.status(200).json({
      status: 200,
      count: updatedResponse.length,
      message: "Success",
      data: [...updatedResponse],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Server error in processing your request",
    });
  }
});

//end

router.get("/users", async (req, res) => {
  const { search, searchBy, exact, id, page, limit, boolean } = req.query;
  const query = createQuery(search, searchBy, exact, boolean);

  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const skipItems = (pageNumber - 1) * itemsPerPage;

  try {
    const totalPatients = await User.countDocuments({
      deleted: false,
      ...query,
    });
    const totalPages = Math.ceil(totalPatients / itemsPerPage);

    const patients = await User.find({ ...query })
      .skip(skipItems)
      .limit(itemsPerPage);

    if (id && patients.length === 0) {
      return res
        .status(200)
        .json({ status: 200, message: "Patient does not exist" });
    } else {
      return res.status(200).json({
        status: 200,
        message: "Success",
        data: patients,
        total: totalPatients,
        totalPages: totalPages,
        currentPage: pageNumber,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Server error in processing your request",
    });
  }
});

router.post("/user", async (req, res) => {
  const userType = req.query.type;
  const userData = req.body.data;
  const count = await User.countDocuments();
  const psyId = `2021${String(count + 1).padStart(6, "0")}`;
  if (!userType || !userData) {
    res.status(400).json({ status: 400, message: "Invalid User Credentials" });
  } else {
    const newUid = uuidv4();
    const user = new User({
      ...userData,
      uid: newUid,
      type: userType,
      psyId: psyId,
    });
    
    user
      .save()
      .then((result) => {
        res.json({
          status: "200",
          message: "Success",
          data: { uid: newUid },
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Error. Please try again" });
      });
  }
});

router.delete("/user/delete", async (req, res) => {
  const userId = req.query.id;
  if (!userId) {
    res.json({ status: 400, message: "Incomplete User Credentials" });
  }
  try {
    const result = await User.deleteOne({ _id: new ObjectId(userId) });
    if (result) {
      res.status(200).json({
        status: 200,
        message: `Successfully deleted user`,
        data: result,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: "Server error in processing your request",
    });
  }
});

router.post("/lead", async (req, res) => {
  const leadData = req.body; // Assuming lead data is sent in the request body
  const uid = uuidv4();

  try {
    // Check if email or phone number already exists
    if (leadData.phone) {
      // Check if the provided Phone is unique
      const existingLeadWithPhone = await User.findOne({
        phone: leadData.phone,
      });

      if (existingLeadWithPhone) {
        return res.status(400).json({
          status: 400,
          message: "Phone is already taken.",
        });
      }
    }
    if (leadData.email) {
      // Check if the provided Email is unique
      const existingLeadWithEmail = await User.findOne({
        email: leadData.email,
      });

      if (existingLeadWithEmail) {
        return res.status(400).json({
          status: 400,
          message: "Email is already taken.",
        });
      }
    }

    const newLead = new User({
      ...leadData,
      uid: uid,
      created: false, // Set created to false for leads
    });

    await newLead.save();

    res.status(200).json({
      status: 200,
      message: "Successfully created lead",
      data: { ...newLead },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Server error in processing your request",
    });
  }
});

router.put("/lead/convert/:leadId", async (req, res) => {
  const leadId = req.params.leadId;
  const leadData = req.body; // Assuming lead data is sent in the request body

  const token = jwt.sign({ userId: leadId }, config.JWT_SECRET, {
    expiresIn: "12h",
  });
  console.log(req.body.type);
  if (!req.body.type) {
    return res.status(404).json({
      status: 404,
      message: "Type not found",
    });
  }

  let existingSettings = await SiteSettings.findOne();
  if (!existingSettings) {
    existingSettings = new SiteSettings();
  }

  existingSettings.psyID += 1;
  const psyID = existingSettings.psyID;

  try {
    const lead = await User.findOne({
      _id: new ObjectId(leadId),
      created: false,
    });

    if (!lead) {
      return res.status(404).json({
        status: 404,
        message: "Lead not found",
      });
    }

    lead.created = true;
    Object.assign(lead, leadData);
    Object.assign(psyID, psyID);

    await lead.save();

    res.status(200).json({
      status: 200,
      message: "Lead status updated successfully",
      data: { ...lead, jwt: token },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Server error in processing your request",
    });
  }
});

router.get("/userById/:id", async (req, res) => {
  const userID = req.params.id;

  if (!userID) {
    res.status(400).json({ status: 400, message: "Invalid user id" });
  }
  try {
    const result = await User.find({ _id: new ObjectId(userID) });
    if (result) {
      res.status(200).json({
        status: 200,
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error in fetching the user details by id",
    });
  }
});


// ---------------- Token Creation for Users -------------- 
router.post("/createUserToken", async (req,res) => {
  let {userName, userType } = req.body;
  let  userid = ObjectId(req.body.userId);

  //check exist or not
  const userTokenExist = await TokenAuthModel.findOne({userId : userid});
  if( (userTokenExist) && (userTokenExist.userId.equals(userid))){
    return res.status(200).json({status : 401, response : userTokenExist ,message : "User Token Already Exist"});
  }else{
    try{
      if(userid && userName && userType){
        const token = await accessToken(req.body);
        req.body.userAuthToken = token;
        const CreateResp = await TokenAuthModel.create(req.body);
        if(CreateResp){
          return res.status(200).json({status : 201, response : CreateResp, message : "User Token Successfully Created"});
        }else{
          return res.status(200).json({status : 401, response : CreateResp, message : "Toke Not Created" });
        }
      }
    }catch(err){
      res.status(400).json({status : 400, message : err.message});
    }
  }
});

router.get("/getAllToken", async (req,res) => {
  try{
    const getResp = await TokenAuthModel.find({});
    if(getResp.length > 0){
      return res.status(200).json({status : 201, response : getResp, message : "Token List including user's Id, Name, Type"});
    }else{
      return res.status(200).json({status : 401, response : getResp, message : "Empty Token List" });
    }
  }catch(err){
    res.send(400).json({ status: 400, message: err.message });
  }
});

router.put("/userTokenStatus", async (req, res) => {
  const active = req.body.active;
  const userid = ObjectId(req.query.userId);
  try {
    const UpdateResp = await TokenAuthModel.findOneAndUpdate({userId : userid}, {active : active}, {new: true});
    if (UpdateResp) {
      return res.status(200).json({status: 201, response: UpdateResp, message: "Token Status Successfully Updated"});
    } else {
      return res.status(200).json({ status: 401, response: UpdateResp, message: "Token Status Not Updated" });
    }
  } catch (err) {
    res.send(400).json({ status: 400, message: err.message });
  }
});

router.delete("/deleteOnlyToken", async(req,res) => {
  const tokenid = ObjectId(req.query.tokenId);
  try{
    const DeleteResp = await TokenAuthModel.findByIdAndDelete({_id : tokenid});
    if(DeleteResp){
      return res.status(200).json({status : 201, response : DeleteResp, message : "Token Deleted Successfully"});
    }else{
      return res.status(200).json({status : 401, response : DeleteResp, message : "Not Deleted" });
    }
  }catch(err){
    res.status(400).json({status : 400, response : err.message});
  }
});

router.delete("/deleteUserToken", async(req,res) => { 
  const tokenid = req.query.tokenId;
  try{
    const userTokenInfo = await TokenAuthModel.findById({ _id : ObjectId(tokenid) });
    if(userTokenInfo.userId){
      const userDeleteResp = await User.findByIdAndDelete({_id:ObjectId(userTokenInfo.userId)});
      if(userDeleteResp){
        const tokenDeleteResp = await TokenAuthModel.findByIdAndDelete({ _id : ObjectId(tokenid) });
        return res.status(200).json({status : 201, response : [{user: userDeleteResp}, {token: tokenDeleteResp}], message : "Token Deleted Successfully along with its User"});
      }else{
        return res.status(200).json({status : 401, response : userDeleteResp, message : "User not found" });
      }
    }else{
      return res.status(200).json({status : 401, response : getResp, message : "User Token Not Exist" });
    }
  }catch(err){
    res.send(400).json({ status: 400, message: err.message });
  }
});
/* 
in this context, i will delete User when perform (Token's delete operation) 
step 1 : Delete user, using userId(stored in document)
step 2 : Delete token, using tokenId(_id)
*/


module.exports = router;
