const express = require("express")
const { userwelcome, signup, verifyEmail, login, resendVerification } = require("../Controllers/user.controllers")
const { createpost, getcreatepost } = require("../Controllers/userpost")
const router = express.Router()


router.get("/userwelcome", userwelcome)
router.post("/signup", signup)
router.get("/verify-email/:token", verifyEmail)
router.post("/login", login)
router.post("/resend-verification", resendVerification)
router.post("/createpost", createpost)
router.get("/getcreatepost", getcreatepost)

module.exports = router