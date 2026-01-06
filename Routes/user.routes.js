const express = require("express")
const { userwelcome, signup, verifyEmail, login, resendVerification } = require("../Controllers/user.controllers")
const { createpost, getcreatepost, getuserpost, getsingleuserpost, delectuserpost, userapplyjob, notifications, getWasherJobs, completejob, getWasherHistory, getMessages, sendMessage } = require("../Controllers/userpost")
const auth = require("../auth")
const router = express.Router()


router.get("/userwelcome", userwelcome)
router.post("/signup", signup)
router.get("/verify-email/:token", verifyEmail)
router.post("/login", login)
router.post("/resend-verification", resendVerification)
router.post("/createpost", createpost)
router.get("/getcreatepost", getcreatepost)
router.get("/getuserpost/:id", getuserpost)
router.get("/getsingleuserpost/:id", getsingleuserpost)
router.delete("/delectuserpost/:id", delectuserpost)
router.post("/userapplyjob", userapplyjob)
router.get("/notifications/:userId", notifications)
router.get("/getWasherJobs/:washerId", getWasherJobs)
router.patch("/completejob/:jobId", completejob)
router.get("/getWasherHistory/:washerId", getWasherHistory) // Reusing getWasherJobs for history as well
router.get("/getmessages/:jobId", auth, getMessages)
router.post("/sendmessages", sendMessage)


module.exports = router