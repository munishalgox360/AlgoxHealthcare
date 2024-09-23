// Setting up Imports
const jwt = require("jsonwebtoken");
// ENV config
const config = process.env;

const verifyToken = (req, res, next) => {
  // checking if the token exists from the request body in headers body or query
  const token =
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"] ||
    req.headers["authorization"];
  // return auth error if no token
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    // verifying the auth token
    const decoded = jwt.verify(token, "f6kvXh2sDPVCAWaT0TxPvJK3QwcCUzPy");
    console.log(decoded);
    req.user = decoded;
  } catch (err) {
    // sending error response
    // return res.status(401).send("Invalid Token");
  }
  return next();
};
// exporting modules
module.exports = verifyToken;
