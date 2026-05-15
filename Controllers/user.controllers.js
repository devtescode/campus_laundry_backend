
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



module.exports.userwelcome = async (req, res) => {
    res.status(200).json({ message: "Welcome to Userlaundry" })
}



const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.App_Email,
        pass: process.env.App_Password,
    },
     tls: {
        rejectUnauthorized: false,
    },
});




module.exports.usersignup = async (req, res) => {
    console.log(req.body);
    console.log("hitttttttttttttt signup");

    try {
        const { fullname, email, phonenumber, password, gender } = req.body;

        const frontendUrl = process.env.FRONTEND_URL; // ✅ MOVE HERE (GLOBAL in function)
        console.log(frontendUrl, "frontendurl");


        const existing = await Userschema.findOne({ email });

        // IF VERIFIED USER EXISTS
        if (existing && existing.isVerified) {
            return res.status(400).json({
                msg: "Email already exists",
            });
        }

        // IF EXISTS BUT NOT VERIFIED
        if (existing && !existing.isVerified) {
            const token = crypto.randomBytes(32).toString("hex");

            existing.emailToken = token;
            existing.fullname = fullname;
            existing.phonenumber = phonenumber;
            existing.gender = gender;
            existing.password = password;

            await existing.save();

            const verifyLink = `${frontendUrl}/verify-email/${token}`;
            console.log(verifyLink, "verifylink");

            await transporter.sendMail({
                from: `"ClinqHub" <${process.env.App_Email}>`,
                to: existing.email,
                subject: "Verify Your Email",
                html: `<a href="${verifyLink}">Verify Email</a>`,
            });

            return res.json({
                msg: "Verification email resent. Please check your inbox.",
            });
        }

        // CREATE NEW USER
        const token = crypto.randomBytes(32).toString("hex");

        const user = await Userschema.create({
            fullname,
            email,
            phonenumber,
            password,
            emailToken: token,
            isVerified: false,
            gender,
        });

        const verifyLink = `${frontendUrl}/verify-email/${token}`;

        await transporter.sendMail({
            from: `"ClinqHub" <${process.env.App_Email}>`,
            to: user.email,
            subject: "Verify Your Email",
            html: `<a href="${verifyLink}">Verify Email</a>`,
        });

        res.json({
            msg: "User created. Verification email sent.",
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Server error" });
    }
};





module.exports.login = async (req, res) => {

    try {
        const { email, password } = req.body;

        // Check if user exists (email or phone)
        const user = await Userschema.findOne({
            $or: [{ email }, { phonenumber: email }]
        });

        if (!user)
            return res.status(400).json({ message: "User not found" });

        // Check if email is verified
        if (!user.isVerified)
            return res.status(400).json({ message: "Email is not verified" });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid password" });

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                phonenumber: user.phonenumber,
                gender: user.gender,
                applicant: user.applicant,
                token
            }

        });
        console.log(user, "user");

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await Userschema.findOne({ emailToken: token });
        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired token" });
        }

        user.isVerified = true;
        user.emailToken = null;
        await user.save();

        return res.json({ msg: "Email verified successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
};


module.exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await Userschema.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

        // Generate new token
        const emailToken = crypto.randomBytes(32).toString("hex");
        user.emailToken = emailToken;
        await user.save();


        // const url = `${frontendUrl}/verify-email/${emailToken}`;


        const frontendUrl = process.env.FRONTEND_URL;

        const url = `${frontendUrl}/verify-email/${emailToken}`; // frontend verification page
        console.log(url);

        // await transporter.sendMail({
        //     to: user.email,
        //     subject: "Verify your email",
        //     html: `Click <a href="${url}">here</a> to verify your email.`,
        // });


        await transporter.sendMail({
            from: `"ClinqHub" <${process.env.App_Email}>`,
            to: user.email,
            subject: "Verify Your Email",
            html: `
                <h2>Verify Your Email</h2>
                <p>Click the link below to verify your account:</p>
                <a href="${url}" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
                    Verify Email
                </a>
            `
        });

        res.status(200).json({ message: "Verification email sent" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports.getPosterStats = async (req, res) => {
    try {
        const userId = req.params.userId;

        // 🧺 Jobs posted by this user
        const jobsPosted = await jobPost.countDocuments({
            userId,
        });

        // ⏳ Pending jobs
        const pendingJobs = await jobPost.countDocuments({
            userId,
            status: "Pending",
        });

        // ✅ Completed jobs
        const completedJobs = await jobPost.countDocuments({
            userId,
            status: "Completed",
        });

        // 💰 Total spent (ONLY completed jobs)
        const totalSpentData = await jobPost.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    status: "Completed",
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$price" },
                },
            },
        ]);

        const totalSpent = totalSpentData[0]?.total || 0;

        // ⭐ Replace rating with pending count (your requirement)
        const averageRating = pendingJobs;

        res.json({
            jobsPosted,
            pendingJobs,
            completedJobs,
            totalSpent,
            averageRating,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

module.exports.forgotPassword = async (req, res) => {
    try {
        const FRONTEND_URL = process.env.FRONTEND_URL
        const { email } = req.body;
        const user = await Userschema.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 1000 * 60 * 10;
        await user.save();
        const resetLink = `${FRONTEND_URL}/resetpassword/${resetToken}`;

        await transporter.sendMail({
            from: process.env.App_Email,
            to: email,
            subject: "Password Reset",
            html: `
            <h2 style="color:#111827;">Reset Your Password</h2>

                <p style="color:#4b5563; font-size:14px; line-height:1.6;">
                  We received a request to reset your password. If you made this request, click the button below to set a new password.
                </p>
                
                <div style="margin:20px 0;">
                  <a 
                    href="${resetLink}" 
                    style="
                      display:inline-block;
                      padding:12px 20px;
                      background:#4f46e5;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:8px;
                      font-weight:600;
                      font-size:14px;
                    "
                  >
                    Reset Password
                  </a>
                </div>
                
                <p style="color:#6b7280; font-size:12px; line-height:1.5;">
                  If you did not request this, you can safely ignore this email. Your password will remain unchanged.
                </p>
                
                <p style="color:#9ca3af; font-size:11px; margin-top:20px;">
                  This link will expire in 10 minutes for security reasons.
                </p>
            `,
        });

        res.json({
            message: "Password reset link sent to your email",
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: "Server Error",
        });
    }
};



module.exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await Userschema.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired token",
            });
        }

        // 🔥 CHECK IF NEW PASSWORD IS SAME AS OLD PASSWORD
        const isSamePassword = await bcrypt.compare(password, user.password);

        if (isSamePassword) {
            return res.status(400).json({
                message: "You cannot use your previous password",
            });
        }

        // set new password (will be hashed by pre-save middleware)
        user.password = password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({
            message: "Password reset successful",
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: "Server Error",
        });
    }
};