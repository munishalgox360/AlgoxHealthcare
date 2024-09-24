const mongoose = require("mongoose");

//@ Token Authorization Schema for Vendor/user
const TokenAuthorizationSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref :"User"
    },
    userName : {
        type : String,
        trim : true,
        required : [true, "username is required"]
    },
    userType : {
        type : String,
        trim : true,
        required : [true, "user type is required"]
    },
    userAuthToken : {
        type : String,
        trim : true,
        required : [true, " JWT Token is Required"]
    },
    active : {
        type : Boolean,
        default : true
    },
    createdAt: { type: Date, default: Date.now() },
    updatedAt: { type: Date, default: Date.now() }
});

//@  Model for Token Authorization Schema
const TokenAuthModel = new mongoose.model("TokenAuth", TokenAuthorizationSchema);
module.exports = TokenAuthModel;