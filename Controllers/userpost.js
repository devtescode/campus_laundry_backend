
const jwt = require("jsonwebtoken")
const env = require("dotenv")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const { default: axios } = require("axios")
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Userschema } = require("../Models/user.models");
const { default: jobPost } = require("../Models/jobPost")
// const ADMIN_SECRET_KEY = process.env.JWT_SECRET_KEY
const cloudinary = require('cloudinary').v2;
env.config()



// module.exports.userwelcome = async (req, res) => {
//     res.status(200).json({ message: "Welcome to Userlaundry" })
// }

module.exports.createpost = async(req, res)=>{
    try {
    const job = new jobPost(req.body);
    await job.save();

    console.log(job, "jobsssssss");
    

    res.status(201).json({
      message: "Job posted successfully!",
      job,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports.getcreatepost = async (req, res) => {
  try {
    const jobs = await jobPost
      .find()
      .populate("userId", "fullname") // 👈 pull full name only
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.getuserpost = async(req, res)=>{
   try {
    const { id } = req.params;

    const jobs = await jobPost.find({ userId: id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      jobs,
    });

  } catch (error) {
    console.log("Error fetching user jobs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


module.exports.getsingleuserpost = async(req, res)=>{
   try {
    const job = await jobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      job,
    });

  } catch (err) {
    console.log("Error fetching job:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }

}
