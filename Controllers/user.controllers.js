
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
// const resend = require("../utils/resend");
const transporter = require("../utils/mailer");
const sendEmail = require("../utils/sendEmail");
env.config()












module.exports.userwelcome = async (req, res) => {
    res.status(200).json({ message: "Welcome to Userlaundry" })
}







module.exports.usersignup = async (req, res) => {
  console.log("hit signup");

  try {
    const { fullname, email, phonenumber, password, gender } = req.body;

    const frontendUrl = process.env.FRONTEND_URL;
    const cleanEmail = email.toLowerCase();

    const existing = await Userschema.findOne({ email: cleanEmail });

    // USER EXISTS & VERIFIED
    if (existing && existing.isVerified) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // USER EXISTS BUT NOT VERIFIED
    if (existing && !existing.isVerified) {
      const token = crypto.randomBytes(32).toString("hex");

      existing.emailToken = token;
      existing.fullname = fullname;
      existing.phonenumber = phonenumber;
      existing.gender = gender;
      existing.password = password;

      await existing.save();

      const verifyLink = `${frontendUrl}/verify-email/${token}`;

      try {
        await sendEmail(
          existing.email,
          "Verify Your Email",
          `
            <div style="font-family: Arial; padding: 20px;">
              <h2>Verify Your Email</h2>
              <p>Your account exists but is not verified yet.</p>

              <a href="${verifyLink}"
                style="display:inline-block;padding:12px 20px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;">
                Verify Email
              </a>
            </div>
          `
        );

        console.log("Verification email sent (existing user)", existing.email);
      } catch (emailErr) {
        console.log("EMAIL ERROR:", emailErr);
      }

      return res.json({
        msg: "Verification email resent. Please check your inbox.",
      });
    }

    // CREATE NEW USER
    const token = crypto.randomBytes(32).toString("hex");

    const user = await Userschema.create({
      fullname,
      email: cleanEmail,
      phonenumber,
      password,
      emailToken: token,
      isVerified: false,
      gender,
    });

    const verifyLink = `${frontendUrl}/verify-email/${token}`;

    try {
      await sendEmail(
        user.email,
        "Welcome to ClinqHub 👋 Verify Your Email",
        `
          <div style="font-family: Arial; padding: 20px;">
            <h2>Welcome to ClinqHub 👋</h2>
            <p>Click below to verify your account:</p>

            <a href="${verifyLink}"
              style="display:inline-block;padding:12px 20px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;">
              Verify Email
            </a>
          </div>
        `
      );

      console.log("Welcome email sent to", user.email);
    } catch (emailErr) {
      console.log("EMAIL ERROR (new user):", emailErr);
    }

    return res.json({
      msg: "User created. Verification email sent.",
    });

  } catch (err) {
    console.log("SIGNUP ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};



// module.exports.usersignup = async (req, res) => {
//   console.log("hitttttttttttttt signup");

//   try {
//     const { fullname, email, phonenumber, password, gender } = req.body;

//     const frontendUrl = process.env.FRONTEND_URL;
//     console.log(frontendUrl, "frontendurl");

//     // Normalize email
//     const cleanEmail = email.toLowerCase();

//     const existing = await Userschema.findOne({ email: cleanEmail });

//     // ================================
//     // USER EXISTS & VERIFIED
//     // ================================
//     if (existing && existing.isVerified) {
//       return res.status(400).json({
//         msg: "Email already exists",
//       });
//     }

//     // ================================
//     // USER EXISTS BUT NOT VERIFIED
//     // ================================
//     if (existing && !existing.isVerified) {
//       const token = crypto.randomBytes(32).toString("hex");

//       existing.emailToken = token;
//       existing.fullname = fullname;
//       existing.phonenumber = phonenumber;
//       existing.gender = gender;
//       existing.password = password;

//       await existing.save();

//       const verifyLink = `${frontendUrl}/verify-email/${token}`;
//       console.log(verifyLink, "verifylink");

//       // ✅ RESEND EMAIL
//       try {
//         await resend.emails.send({
//           from: "ClinqHub <onboarding@resend.dev>",
//           to: existing.email,
//           subject: "Verify Your Email",
//           html: `
//             <div style="font-family: Arial; padding: 20px;">
//               <h2>Verify Your Email</h2>
//               <p>Your account exists but is not verified yet.</p>

//               <a href="${verifyLink}"
//                 style="
//                   display:inline-block;
//                   padding:12px 20px;
//                   background:#4f46e5;
//                   color:white;
//                   border-radius:8px;
//                   text-decoration:none;
//                 ">
//                 Verify Email
//               </a>
//             </div>
//           `,
//         });
//       } catch (emailErr) {
//         console.log("EMAIL ERROR:", emailErr);
//       }

//       return res.json({
//         msg: "Verification email resent. Please check your inbox.",
//       });
//     }

//     // ================================
//     // CREATE NEW USER
//     // ================================
//     const token = crypto.randomBytes(32).toString("hex");

//     const user = await Userschema.create({
//       fullname,
//       email: cleanEmail,
//       phonenumber,
//       password,
//       emailToken: token,
//       isVerified: false,
//       gender,
//     });

//     const verifyLink = `${frontendUrl}/verify-email/${token}`;

//     // ✅ RESEND EMAIL
//     try {
//       await resend.emails.send({
//         from: "ClinqHub <onboarding@resend.dev>",
//         to: user.email,
//         subject: "Verify Your Email",
//         html: `
//           <div style="font-family: Arial; padding: 20px;">
//             <h2>Welcome to ClinqHub 👋</h2>
//             <p>Click below to verify your account:</p>

//             <a href="${verifyLink}"
//               style="
//                 display:inline-block;
//                 padding:12px 20px;
//                 background:#4f46e5;
//                 color:white;
//                 border-radius:8px;
//                 text-decoration:none;
//               ">
//               Verify Email
//             </a>
//           </div>
//         `,
//       });
//     } catch (emailErr) {
//       console.log("EMAIL ERROR:", emailErr);
//     }

//     res.json({
//       msg: "User created. Verification email sent.",
//     });

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// };





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


// module.exports.resendVerification = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const cleanEmail = email.toLowerCase();

//     const user = await Userschema.findOne({ email: cleanEmail });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({ message: "Email already verified" });
//     }

//     // Generate new token
//     const emailToken = crypto.randomBytes(32).toString("hex");
//     user.emailToken = emailToken;
//     await user.save();

//     const frontendUrl = process.env.FRONTEND_URL;
//     const url = `${frontendUrl}/verify-email/${emailToken}`;

//     console.log(url, "verification url");

//     // ✅ RESEND EMAIL
//     try {
//       await resend.emails.send({
//         from: "ClinqHub <onboarding@resend.dev>",
//         to: user.email,
//         subject: "Verify Your Email",
//         html: `
//           <div style="font-family: Arial; padding: 20px;">
//             <h2>Verify Your Email</h2>

//             <p>
//               Click the button below to verify your account.
//             </p>

//             <a href="${url}"
//               style="
//                 display:inline-block;
//                 padding:12px 20px;
//                 background:#4f46e5;
//                 color:white;
//                 border-radius:6px;
//                 text-decoration:none;
//               ">
//               Verify Email
//             </a>
//           </div>
//         `,
//       });
//     } catch (emailErr) {
//       console.log("EMAIL ERROR:", emailErr);
//       return res.status(500).json({
//         message: "Failed to send verification email",
//       });
//     }

//     return res.status(200).json({
//       message: "Verification email sent",
//     });

//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };





module.exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const cleanEmail = email.toLowerCase();

    const user = await Userschema.findOne({
      email: cleanEmail,
    });

    // USER NOT FOUND
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ALREADY VERIFIED
    if (user.isVerified) {
      return res.status(400).json({
        message: "Email already verified",
      });
    }

    // GENERATE NEW TOKEN
    const emailToken = crypto.randomBytes(32).toString("hex");

    user.emailToken = emailToken;

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;

    const verifyLink = `${frontendUrl}/verify-email/${emailToken}`;

    console.log(verifyLink, "verification url");

    // SEND EMAIL WITH BREVO API
    try {
      await sendEmail(
        user.email,
        "Verify Your Email",
        `
          <div style="font-family: Arial; padding: 20px;">
            <h2>Verify Your Email</h2>

            <p>
              Click the button below to verify your account.
            </p>

            <a href="${verifyLink}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#4f46e5;
                color:white;
                border-radius:6px;
                text-decoration:none;
              ">
              Verify Email
            </a>
          </div>
        `
      );

      console.log(
        "Verification email sent to",
        user.email
      );

    } catch (emailErr) {
      console.log("EMAIL ERROR:", emailErr);

      return res.status(500).json({
        message: "Failed to send verification email",
      });
    }

    return res.status(200).json({
      message: "Verification email sent",
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
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



// module.exports.forgotPassword = async (req, res) => {
//   try {
//     const FRONTEND_URL = process.env.FRONTEND_URL;
//     const { email } = req.body;

//     const cleanEmail = email.toLowerCase();

//     const user = await Userschema.findOne({ email: cleanEmail });

//     // ❌ USER NOT FOUND
//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     // ❌ EMAIL NOT VERIFIED (IMPORTANT SECURITY CHECK)
//     if (!user.isVerified) {
//       return res.status(400).json({
//         message: "Please verify your email before resetting password",
//       });
//     }

//     // Create reset token
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = Date.now() + 1000 * 60 * 10; // 10 mins

//     await user.save();

//     const resetLink = `${FRONTEND_URL}/resetpassword/${resetToken}`;

//     console.log(resetLink, "reset link");

//     // ✅ RESEND EMAIL
//     try {
//       await resend.emails.send({
//         from: "ClinqHub <onboarding@resend.dev>",
//         to: user.email,
//         subject: "Password Reset Request",
//         html: `
//           <div style="font-family: Arial; padding: 20px; max-width:600px;">
            
//             <h2 style="color:#111827;">
//               Reset Your Password
//             </h2>

//             <p style="color:#4b5563; font-size:14px;">
//               We received a request to reset your password. Click below to continue.
//             </p>

//             <div style="margin:25px 0;">
//               <a href="${resetLink}"
//                 style="
//                   display:inline-block;
//                   padding:12px 20px;
//                   background:#4f46e5;
//                   color:#fff;
//                   text-decoration:none;
//                   border-radius:8px;
//                   font-weight:600;
//                 ">
//                 Reset Password
//               </a>
//             </div>

//             <p style="color:#6b7280; font-size:12px;">
//               If you did not request this, ignore this email.
//             </p>

//             <p style="color:#9ca3af; font-size:11px;">
//               This link expires in 10 minutes.
//             </p>

//           </div>
//         `,
//       });
//     } catch (emailErr) {
//       console.log("EMAIL ERROR:", emailErr);
//       return res.status(500).json({
//         message: "Failed to send reset email",
//       });
//     }

//     return res.json({
//       message: "Password reset link sent to your email",
//     });

//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({
//       message: "Server Error",
//     });
//   }
// };




module.exports.forgotPassword = async (req, res) => {
  try {
    const FRONTEND_URL = process.env.FRONTEND_URL;

    const { email } = req.body;

    const cleanEmail = email.toLowerCase();

    const user = await Userschema.findOne({
      email: cleanEmail,
    });

    // USER NOT FOUND
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // EMAIL NOT VERIFIED
    if (!user.isVerified) {
      return res.status(400).json({
        message:
          "Please verify your email before resetting password",
      });
    }

    // GENERATE RESET TOKEN
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    user.resetPasswordToken = resetToken;

    user.resetPasswordExpires =
      Date.now() + 1000 * 60 * 10;

    await user.save();

    const resetLink =
      `${FRONTEND_URL}/resetpassword/${resetToken}`;

    console.log(resetLink, "reset link");

    // SEND RESET EMAIL WITH BREVO API
    try {
      await sendEmail(
        user.email,
        "Password Reset Request",
        `
          <div style="font-family: Arial; padding: 20px; max-width:600px;">

            <h2 style="color:#111827;">
              Reset Your Password
            </h2>

            <p style="color:#4b5563; font-size:14px;">
              We received a request to reset your password.
              Click the button below to continue.
            </p>

            <div style="margin:25px 0;">
              <a href="${resetLink}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#4f46e5;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                  font-weight:600;
                ">
                Reset Password
              </a>
            </div>

            <p style="color:#6b7280; font-size:12px;">
              If you did not request this,
              you can safely ignore this email.
            </p>

            <p style="color:#9ca3af; font-size:11px;">
              This link expires in 10 minutes.
            </p>

          </div>
        `
      );

      console.log(
        "Reset password email sent to",
        user.email
      );

    } catch (emailErr) {
      console.log("EMAIL ERROR:", emailErr);

      return res.status(500).json({
        message: "Failed to send reset email",
      });
    }

    return res.json({
      message:
        "Password reset link sent to your email",
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);

    return res.status(500).json({
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