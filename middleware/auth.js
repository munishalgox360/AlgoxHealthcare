// Setting up Imports
const jwt = require("jsonwebtoken");
const TokenAuthModel = require("../schemas/v2/TokenAuth.schema.js");
const { ObjectId } = require("mongodb");
// ENV config
const config = process.env;

const verifyToken = async (req, res, next) => {
  
  // checking if the token exists from the request body in headers body or query
  const bearerToken = (req.headers["authorization"] || req.headers["x-access-token"] || req.body.token || req.query.token);
  // return auth error if no token
  if (!bearerToken) {
    return res.status(403).json({ status: 403, message: "Token is necessary"});
  }
  try {
    const token = bearerToken.split(" ")[1];
    const decoded = await jwt.verify(token, config.JWT_SECRET);
       
    //check status
    if(decoded){
      const userToken = await TokenAuthModel.findOne({userId : ObjectId(decoded.id)});
      if(userToken == null){
        return res.status(200).json({status : 401, message : "User Not Found along with token"});
      }else if(Boolean(userToken.active)){
        req.user = decoded;
      }else{
        return res.status(200).json({status : 401, message : "User Account is In-Active "});
      }
    }
  } catch (err) {
    // sending error response
    return res.status(401).json({message : "Invalid Token"});
  }
  return next();
};

//Access Token [Create Token with 1 Year Session/Validity]
const accessToken = async (user) => {
 return new Promise((resolve,reject) => {
  const payload = {
    id: user._id,
    userName: user.displayName,
    userType :user.userType
  };

  const options = {
    issuer: "psymate",
    expiresIn: "1y",
  };
    const token =  jwt.sign(payload, config.JWT_SECRET, options);
    resolve(token);
 })
};


// exporting modules
module.exports = { accessToken, verifyToken };
