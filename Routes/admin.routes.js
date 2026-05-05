const express = require("express");
const { checkAdminExists, adminLogin, adminSignup, getAllUsers, getAllJobsdetails, getAllChats, getRecentActivity, getDashboardStats } = require("../Controllers/admin.controllers");

const router = express.Router()


router.get("/exists", checkAdminExists);
router.post("/login", adminLogin)
router.post("/signup", adminSignup)
router.get("/getallusers", getAllUsers)
router.get("/getalljobsdetails", getAllJobsdetails)
router.get("/getallchats", getAllChats)
router.get("/recentactivity", getRecentActivity)
router.get("/dashboardstats", getDashboardStats)

module.exports = router