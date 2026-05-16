const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },

  // ⭐ IMPORTANT FOR RENDER / PRODUCTION STABILITY
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;