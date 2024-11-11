const authService = require("../services/auth.service")

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
      user: result.user,
      accessToken: result.accessToken
    }
    res.cookie("refreshToken", result.refreshToken, cookieSettings).status(200).send(response)
  } else res.status(401).send(result)
}

const register = async (req, res) => {
  const { email, password } = req.body

  const result = await authService.register(email, password)
  if (result.userAlreadyExists) return res.status(409).send(result)
  else if (!result.success) return res.status(500).send(result)

  return res.status(200).send(result)
}

const signIn = async (req, res) => {
  const { email, password } = req.body
  const result = await authService.signIn(email, password)

  if (result.success) {
    const cookieSettings = {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
    const response = {
      success: result.success,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken
    }
    res.cookie("refreshToken", result.refreshToken, cookieSettings).status(200).send(response)
  } else res.status(result.statusCode).send(result)
}

const signOut = async (req, res) => {
  const { id } = req.user
  const result = await authService.signOut(id)

  if (result.success) res.status(200).send(result)
  else res.status(500).send(result)
}

module.exports = {
  refreshAccessToken,
  register,
  signIn,
  signOut
}
