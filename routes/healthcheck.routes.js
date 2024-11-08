const express = require("express")
const router = express.Router()

const healthCheckController = require("../controllers/healthCheck.controller")

router.get("/", healthCheckController.getStatus)

module.exports = router
