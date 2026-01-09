const Admin = require("../Models/Admin");
const bcrypt = require("bcryptjs")
const env = require("dotenv")
env.config()
const jwt = require("jsonwebtoken")

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
    // console.log(token, "admintoken");
    

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

