const express = require("express")
const { verifyToken } = require("../middleware/auth.middleware")
const router = express.Router()

const authController = require("../controllers/auth.controller")

router.post("/sign-in", authController.signIn)
router.post("/sign-out", authController.signOut)
router.post("/register", authController.register)
router.post("/refresh-token", authController.refreshAccessToken)

module.exports = router
