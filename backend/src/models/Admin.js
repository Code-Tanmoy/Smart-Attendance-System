const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true,
    sparse: true, //  if some don't have emails yet
    index: true
   },
  password: String,
  
 
  phone: { type: String },
  designation: { type: String, default: "Master Admin" }, // e.g., Principal, HOD, Director
  
  //FOR RESET PASSWORD
  resetPasswordToken: String,
  resetPasswordExpire: Date,//FOR ACCOUNT VERIFICATION TIME 
  
});

module.exports = mongoose.model("Admin", adminSchema);