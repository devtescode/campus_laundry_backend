const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let schema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phonenumber: { type: String, required: true },   // FIXED HERE
    password: { type: String, required: true },

    emailToken: { type: String },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const saltRounds = 10;

schema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


schema.methods.compareUser = async function (userPass) {
  try {
    return await bcrypt.compare(userPass, this.password);
  } catch (err) {
    console.log(err);
  }
};

const Userschema = mongoose.model("userlaundry", schema);
module.exports = { Userschema };
