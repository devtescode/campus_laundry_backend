
const jwt = require("jsonwebtoken")
const env = require("dotenv")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const { default: axios } = require("axios")
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Userschema } = require("../Models/user.models");
const { default: jobPost } = require("../Models/jobPost")
const { default: Notification } = require("../Models/Notification")
// const ADMIN_SECRET_KEY = process.env.JWT_SECRET_KEY
const cloudinary = require('cloudinary').v2;
env.config()



// module.exports.userwelcome = async (req, res) => {
//     res.status(200).json({ message: "Welcome to Userlaundry" })
// }

module.exports.createpost = async (req, res) => {
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

module.exports.getuserpost = async (req, res) => {
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


module.exports.getsingleuserpost = async (req, res) => {
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


module.exports.delectuserpost = async (req, res) => {
  const jobId = req.params.id;
  try {
    const deletedJob = await jobPost.findByIdAndDelete(jobId);
    if (!deletedJob) return res.status(404).json({ message: "Job not found" });
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete job" });
  }
}




// module.exports.userapplyjob = async (req, res) => {
//   try {
//     const { jobId, userId } = req.body;

//     if (!jobId || !userId) {
//       return res.status(400).json({ message: "Job ID and User ID are required." });
//     }

//     const job = await jobPost.findById(jobId);

//     if (!job) {
//       return res.status(404).json({ message: "Job not found." });
//     }

//     if (job.userId.toString() === userId) {
//       return res.status(400).json({ message: "You cannot apply for your own job." });
//     }

//     if (job.status !== "Pending") {
//       return res.status(400).json({ message: `Job already ${job.status.toLowerCase()}.` });
//     }

//     job.status = "Applied";
//     job.applicant = userId;
//     console.log(job, "applied job");
//     console.log(job.applicant, "applicant job");
//     await job.save();

//     return res.status(200).json({ message: "You have successfully applied for this job.", job });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error.", error: error.message });
//   }
// };


// import jobPost from "../models/JobPost.js";
// import User from "../models/userlaundry.js";
// import Notification from "../models/Notification.js";

  // module.exports.userapplyjob = async (req, res) => {
  //   try {
  //     const { jobId, userId } = req.body;

  //     if (!jobId || !userId) {
  //       return res.status(400).json({ message: "Job ID and User ID are required." });
  //     }

  //     const job = await jobPost.findById(jobId);

  //     if (!job) {
  //       return res.status(404).json({ message: "Job not found." });
  //     }

  //     // Prevent applying to own job
  //     if (job.userId.toString() === userId) {
  //       return res.status(400).json({ message: "You cannot apply for your own job." });
  //     }

  //     // Job must be pending
  //     if (job.status !== "Pending") {
  //       return res.status(400).json({ message: `Job already ${job.status.toLowerCase()}.` });
  //     }

  //     // Update the job
  //     job.status = "Applied";
  //     job.applicant = userId;
  //     await job.save();

  //     // Get applicant details
  //     const applicant = await Userschema.findById(userId);
  //     const applicantName = applicant.fullname;

  //     console.log(job, "applied job");

  //     // Create notification for job owner
  //     const message = `${applicantName} applied for your ${job.type} job!`;

  //     console.log(message, "notification message");
  //     await Notification.create({
  //       userId: job.userId,
  //       message,
  //       unread: true
  //     });

  //     return res.status(200).json({
  //       message: "You have successfully applied for this job.",
  //       job,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ message: "Server error.", error: error.message });
  //   }
  // };



module.exports.userapplyjob = async (req, res) => {
  try {
    const { jobId, userId } = req.body;

    if (!jobId || !userId) {
      return res.status(400).json({ message: "Job ID and User ID are required." });
    }

    // Find the job
    const job = await jobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    // Prevent poster from applying
    if (job.userId.toString() === userId) {
      return res.status(400).json({ message: "You cannot apply for your own job." });
    }

    // Job must be pending
    if (job.status !== "Pending") {
      return res.status(400).json({ message: `Job already ${job.status.toLowerCase()}.` });
    }

    // Get applicant details
    const applicant = await Userschema.findById(userId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }
    const applicantName = applicant.fullname;
    job.status = "Applied";
    job.applicant = userId;        
    job.applicantName = applicantName; 
    await job.save();
    const message = `${applicantName} applied for your ${job.type} job!`;
    await Notification.create({
      userId: job.userId, 
      message,
      unread: true
    });

    return res.status(200).json({
      message: "You have successfully applied for this job.",
      job,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};



  module.exports.notifications = async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.params.userId })
        .sort({ createdAt: -1 });
        console.log(notifications, "notifications");

      res.status(200).json(notifications);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }


// GET jobs applied by washer
module.exports.getWasherJobs = async (req, res) => {
  try {
    const { washerId } = req.params;

    const jobs = await jobPost.find({
      applicant: washerId
    })
      .populate("userId", "fullname phonenumber") // job poster info
      .sort({ createdAt: -1 });

    res.status(200).json(jobs);
    console.log(jobs, "washer jobs");
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch washer jobs",
      error: error.message,
    });
  }
};


module.exports.completejob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { washerId } = req.body;

    const job = await jobPost.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Only the washer who applied can complete
    if (job.applicant?.toString() !== washerId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Cannot complete twice
    if (job.status === "Completed") {
      return res.status(400).json({ message: "Job already completed" });
    }

    job.status = "Completed";
    await job.save();

    return res.status(200).json({
      message: "Job marked as completed successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete job",
      error: error.message,
    });
  }
};


module.exports.getWasherHistory = async (req, res) => {
  try {
    const { washerId } = req.params;

    const jobs = await jobPost.find({
      applicant: washerId,
      status: "Completed",
    })
      .populate("userId", "fullname")
      .sort({ updatedAt: -1 });

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
};

