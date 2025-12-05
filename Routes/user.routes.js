const express = require("express")
const { userwelcome, signup, verifyEmail, login, resendVerification } = require("../Controllers/user.controllers")
const router = express.Router()


router.get("/userwelcome", userwelcome)
router.post("/signup", signup)
router.get("/verify-email/:token", verifyEmail)
router.post("/login", login)
router.post("/resend-verification", resendVerification)


module.exports = router