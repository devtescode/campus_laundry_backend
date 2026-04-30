const express = require("express");
const { checkAdminExists, adminLogin, adminSignup, getAllUsers } = require("../Controllers/admin.controllers");

const router = express.Router()


router.get("/exists", checkAdminExists);
router.post("/login", adminLogin)
router.post("/signup", adminSignup)
router.get("/getallusers", getAllUsers)


module.exports = router