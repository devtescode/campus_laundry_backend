
const jwt = require("jsonwebtoken")
const env = require("dotenv")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const { default: axios } = require("axios")
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Userschema } = require("../Models/user.models");
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
    }
});


module.exports.signup = async (req, res) => {
    console.log(req.body)
    try {
        const { fullname, email, phonenumber, password } = req.body;

        const existing = await Userschema.findOne({ email });
        if (existing) return res.status(400).json({ msg: "Email already exists" });

        const token = crypto.randomBytes(32).toString("hex");

        const user = await Userschema.create({
            fullname,
            email,
            phonenumber,
            password,
            emailToken: token,
            isVerified: false
        });
        console.log(user);


        const frontendUrl = process.env.FRONTEND_URL;
        const verifyLink = `${frontendUrl}/verify-email/${token}`; // ✅ path param style

        // const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

        await transporter.sendMail({
            from: `"LaundryHub" <${process.env.App_Email}>`,
            to: user.email,
            subject: "Verify Your Email",
            html: `
                <h2>Verify Your Email</h2>
                <p>Click the link below to verify your account:</p>
                <a href="${verifyLink}" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
                    Verify Email
                </a>
            `
        });

        res.json({ msg: "User created. Verification email sent." });

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
        const { token } = req.params; // ✅ get token from URL path

        const user = await Userschema.findOne({ emailToken: token });
        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired token" });
        }

        // Mark verified
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

        // Send email

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
            from: `"LaundryHub" <${process.env.App_Email}>`,
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
