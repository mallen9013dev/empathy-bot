const authService = require("../services/auth.service")

const login = async (req, res) => {
  const { email, password } = req.body
  const result = await authService.login(email, password)

  if (result.success) {
    const cookieSettings = {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
    const response = {
      success: result.success,
      message: result.message,
      accessToken: result.accessToken
    }
    res.cookie("refreshToken", result.refreshToken, cookieSettings).status(200).send(response)
  } else res.status(401).send(result)
}

const register = async (req, res) => {
  const { email, password } = req.body

  const result = await authService.register(email, password)
  if (!result.success) return res.status(500).send(registerResult)

  return res.status(200).send(result)
}

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.cookies
  const result = await authService.refreshAccessToken(refreshToken)

  if (result.success) {
    const cookieSettings = {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true" ? true : false,
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
    const response = {
      success: result.success,
      message: result.message,
      accessToken: result.accessToken
    }
    res.cookie("refreshToken", result.refreshToken, cookieSettings).status(200).send(response)
  } else res.status(401).send(result)
}

const signOut = async (req, res) => {
  const { userId } = req.body
  const result = await authService.signOut(userId)

  if (result.success) res.status(200).send(result)
  else res.status(500).send(result)
}

module.exports = {
  login,
  register,
  refreshAccessToken,
  signOut
}
