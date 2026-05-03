const Admin = require("../Models/Admin");
const bcrypt = require("bcryptjs")
const env = require("dotenv")
env.config()
const jwt = require("jsonwebtoken");
const { Userschema } = require("../Models/user.models");
const { default: jobPost } = require("../Models/jobPost");

module.exports.checkAdminExists = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();

    res.json({
      adminExists: adminCount > 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to check admin" });
  }
};


module.exports.adminSignup = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
      return res.status(403).json({
        message: "Admin already exists. Signup disabled.",
      });
    }

    const { fullname, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      fullname,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Admin created successfully", admin });
    console.log(admin, "admin signup");
    
  } catch (err) {
    res.status(500).json({ message: "Admin signup failed" });
  }
};

module.exports.adminLogin = async (req, res) => {
    console.log(req.body);
    
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET_ADMIN,
      { expiresIn: "1hr" }
    );
    

    res.json({
      admin: {
        id: admin._id,
        fullname: admin.fullname,
        email: admin.email,
        role: "admin",
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};


// module.exports.getAllUsers = async (req, res) => {
//   const users = await Userschema.find();
//   res.json({ users });
// }
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await Userschema.find().lean();

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // 🧺 Jobs posted (Poster)
        const jobsPostedCount = await jobPost.countDocuments({
          userId: user._id,
        });

        // 🧼 Jobs where user applied as washer (REAL APPLIED)
        const washerAppliedCount = await jobPost.countDocuments({
          applicant: user._id,
          status: "Applied",
        });

        // 🧼 Jobs actually accepted/working/completed (REAL WORK DONE)
        const washerAcceptedCount = await jobPost.countDocuments({
          applicant: user._id,
          status: { $in: ["In Progress", "Completed"] },
        });

        // 📌 ROLE LOGIC (BASED ON REAL DATA)
        let role = "New User";

        if (jobsPostedCount > 0 && washerAcceptedCount > 0) {
          role = "Both";
        } else if (jobsPostedCount > 0) {
          role = "Poster";
        } else if (washerAcceptedCount > 0 || washerAppliedCount > 0) {
          role = "Washer";
        }

        return {
          ...user,

          // 📊 STATS
          jobs: jobsPostedCount,              // poster jobs
          washerApplied: washerAppliedCount,  // applied jobs
          jobsWashed: washerAcceptedCount,    

          // 🎯 ROLE
          role,
        };
      })
    );

    res.json({ users: usersWithStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


module.exports.getAllJobsdetails  = async (req, res) => {
try {
    const jobs = await jobPost.find()
      .populate("userId", "fullname email phonenumber")
      .populate("applicant", "fullname email phonenumber")
      .sort({ createdAt: -1 })
      .lean();

    const formattedJobs = jobs.map((job) => ({
      _id: job._id,

      // 🧺 JOB INFO
      type: job.type,
      quantity: job.quantity,
      price: job.price,
      status: job.status,
      description: job.description,

      // 📍 LOCATION INFO
      hostel: job.hostel,
      block: job.block,
      room: job.room,

      // 📅 TIMING
      pickupDate: job.pickupDate,
      pickupTime: job.pickupTime,
      deliveryDate: job.deliveryDate,
      deliveryTime: job.deliveryTime,

      // 👤 POSTER (FULL DETAILS)
      userId: job.userId
        ? {
            _id: job.userId._id,
            fullname: job.userId.fullname,
            email: job.userId.email,
            phone: job.userId.phonenumber,
          }
        : null,

      // 🧼 WASHER (FULL DETAILS)
      applicant: job.applicant
        ? {
            _id: job.applicant._id,
            fullname: job.applicant.fullname,
            email: job.applicant.email,
            phone: job.applicant.phonenumber,
          }
        : null,

      applicantName: job.applicantName || null,

      createdAt: job.createdAt,
    }));

    res.json({
      success: true,
      count: formattedJobs.length,
      jobs: formattedJobs,
    });
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    res.status(500).json({ message: err.message });
  }

}

