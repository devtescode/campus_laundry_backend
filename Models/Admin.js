const mongoose = require("mongoose");
const AdminSchema = new mongoose.Schema(
  {
    fullname: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("admin", AdminSchema);
