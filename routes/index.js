const express = require("express")
const router = express.Router()

const authRoutes = require("./auth.routes")
const healthCheckRoutes = require("./healthcheck.routes")
const textingRoutes = require("./texting.routes")

router.use("/auth", authRoutes)
router.use("/texting", textingRoutes)
router.use("/status", healthCheckRoutes)

module.exports = router
