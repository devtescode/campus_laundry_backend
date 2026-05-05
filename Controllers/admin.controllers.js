const Admin = require("../Models/Admin");
const bcrypt = require("bcryptjs")
const env = require("dotenv")
env.config()
const jwt = require("jsonwebtoken");
const { Userschema } = require("../Models/user.models");
const { default: jobPost } = require("../Models/jobPost");
const messageSchema = require("../Models/messageSchema");

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
  } catch (err) {
    res.status(500).json({ message: "Admin signup failed" });
  }
};

module.exports.adminLogin = async (req, res) => {    
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


module.exports.getAllChats = async (req, res) => {
  try {
    const messages = await messageSchema.find()
      .populate("sender", "fullname email")
      .populate("receiver", "fullname email")
      .populate({
        path: "jobId",
        populate: [
          { path: "userId", select: "fullname" }, 
          { path: "applicant", select: "fullname" }, 
        ],
      })
      .sort({ createdAt: 1 });

    // group by job
    const chats = {};

    messages.forEach((msg) => {
      const jobId = msg.jobId?._id;

      if (!chats[jobId]) {
        chats[jobId] = {
          job: msg.jobId,
          messages: [],
        };
      }

      chats[jobId].messages.push(msg);
    });

    res.json({ chats: Object.values(chats) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}


module.exports.getRecentActivity = async (req, res) => {
  try {
    // 🆕 Latest Users
    const users = await Userschema.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // 🧺 Latest Jobs (Posters)
    const jobs = await jobPost.find()
      .populate("userId", "fullname")
      .sort({ createdAt: -1 })
      .limit(5);

    // 🧼 Washer Activity (Accepted jobs)
    const washers = await jobPost.find({
      applicant: { $ne: null },
    })
      .populate("applicant", "fullname")
      .populate("userId", "fullname")
      .sort({ updatedAt: -1 })
      .limit(5);

    // 🔥 Combine all into one activity array
    const activity = [
      // USERS
      ...users.map((user) => ({
        id: user._id,
        type: "user",
        action: "New user registered",
        user: user.fullname,
        time: user.createdAt,
      })),

      // JOB POSTERS
      ...jobs.map((job) => ({
        id: job._id,
        type: "job",
        action: "New job posted",
        user: job.userId?.fullname,
        time: job.createdAt,
      })),

      // WASHERS
      ...washers.map((job) => ({
        id: job._id + "_washer",
        type: "washer",
        action: "Washer accepted a job",
        user: job.applicant?.fullname,
        time: job.updatedAt,
      })),
    ];

    // 🔥 Sort everything by time (latest first)
    const sortedActivity = activity.sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );

    res.json({ activity: sortedActivity.slice(0, 5) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};



module.exports.getDashboardStats = async (req, res) => {
  try {
    // 👥 Total users
    const totalUsers = await Userschema.countDocuments();

    // 🧺 Total jobs
    const totalJobs = await jobPost.countDocuments();

    // 🔥 Active jobs
    const activeJobs = await jobPost.countDocuments({
      status: { $in: ["Pending", "In Progress"] },
    });

    // 💰 Revenue (sum of ALL job prices)
    const revenueData = await jobPost.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // ⚠️ Reported jobs (example: disputed)
    const reportedPosts = await jobPost.countDocuments({
      status: "Disputed",
    });

    res.json({
      totalUsers,
      totalJobs,
      activeJobs,
      totalRevenue,
      reportedPosts,

      // optional
      monthlyGrowth: 12.5, // you can calculate later
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};