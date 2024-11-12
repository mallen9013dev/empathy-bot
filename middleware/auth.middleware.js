const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1]
    if (!accessToken) throw new Error("Invalid auth token.")

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY)
    req.user = decoded.user

    next()
  } catch (err) {
    res.status(401).send({
      success: false,
      message: err?.message || "Invalid auth token."
    })
  }
}

module.exports = {
  verifyToken
}
