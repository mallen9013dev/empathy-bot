const express = require("express")
const { verifyToken } = require("../middleware/auth.middleware")
const router = express.Router()

const textingController = require("../controllers/texting.controller")

router.post("/opt-in", verifyToken, textingController.optIn)
router.post("/send", verifyToken, textingController.sendText)
router.get("/get-number", verifyToken, textingController.getPhoneNumber)
router.post("/webhooks/outgoing-text", textingController.handleOutgoingTextWebhook)
router.post("/webhooks/incoming-text", textingController.handleIncomingTextWebhook)

module.exports = router
