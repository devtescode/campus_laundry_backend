const express = require("express")
const { userwelcome, signup, verifyEmail, login } = require("../Controllers/user.controllers")
const router = express.Router()


router.get("/userwelcome", userwelcome)
router.post("/signup", signup)
router.get("/verify-email", verifyEmail)
router.post("/login", login)


module.exports = router