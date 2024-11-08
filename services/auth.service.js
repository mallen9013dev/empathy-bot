const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { User } = require("../database/models/users.model")
const emailService = require("../services/email.service")
/**
 * Finds a user and compares the hashed pw, then returns auth and refresh tokens.
 */
const login = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email }, attributes: ["id", "password"] })
    if (!user)
      return {
        success: false,
        message: "Invalid username or password"
      }

    const passwordHashMatch = await bcrypt.compare(password, user.password)
    if (!passwordHashMatch)
      return {
        success: false,
        message: "Invalid username or password"
      }

    const tokenPayload = {
      userId: user.id
    }
    const { accessToken, refreshToken } = await _generateTokens(tokenPayload)

    return {
      success: true,
      message: "Login successful.",
      accessToken,
      refreshToken
    }
  } catch (err) {
    console.log("Error logging in: ", err)
    return {
      success: false,
      message: err?.message || "Error logging in."
    }
  }
}

/**
 * Stores provided info and hashed password if it does not already exist.
 */
const register = async (email, password) => {
  try {
    const hash = await bcrypt.hash(password, 12)
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: { password: hash }
    })
    if (!created)
      return {
        success: false,
        userAlreadyExists: true,
        message: "User already exists."
      }

    emailService.sendWelcomeEmail(user.email)

    const returnUser = {
      id: user.id,
      email: user.email
    }
    return {
      success: true,
      message: "New user created successfully.",
      user: returnUser
    }
  } catch (err) {
    console.log("Error creating user:", err)
    return {
      success: false,
      message: err?.message || "Error creating user."
    }
  }
}

/**
 * Compares to stored token to make sure not revoked, then returns new access and refresh tokens.
 */
const refreshAccessToken = async (token) => {
  try {
    if (!token)
      return {
        success: false,
        message: "Invalid refresh token"
      }

    const user = await User.findOne({ where: { refreshToken: token }, attributes: ["id", "refreshToken"] })
    if (!user || token !== user.refreshToken)
      return {
        success: false,
        message: "Invalid refresh token"
      }

    const payload = {
      userId: user.id,
      accountId: user.accountId
    }
    const { accessToken, refreshToken } = await _generateTokens(payload)

    return {
      success: true,
      message: "Successfully refreshed access token",
      accessToken,
      refreshToken
    }
  } catch (err) {
    console.log("Error refreshing access token.", err)
    return {
      success: false,
      message: err?.message || "Error refreshing access token."
    }
  }
}

/**
 * Removes a refresh token from the database, so a user will have to re-authenticate on the frontend.
 */
const signOut = async (userId) => {
  try {
    await User.update({ refreshToken: null }, { where: { id: userId } })

    return {
      success: true,
      message: "Signed out successfully."
    }
  } catch (err) {
    console.log("Error signing out.", err)
    return {
      success: false,
      message: "Error signing out."
    }
  }
}

/**
 * Internal method for generating an access (15 min) and refresh token (30 day).
 */
const _generateTokens = async (user) => {
  const accessTokenSecretKey = process.env.ACCESS_TOKEN_SECRET_KEY
  const refreshTokenSecretKey = process.env.REFRESH_TOKEN_SECRET_KEY

  const accessTokenPayload = { user }
  const accessToken = jwt.sign(accessTokenPayload, accessTokenSecretKey, {
    expiresIn: "15m"
  })

  const refreshTokenPayload = {}
  const refreshToken = jwt.sign(refreshTokenPayload, refreshTokenSecretKey, {
    expiresIn: "30d"
  })

  await User.update({ refreshToken }, { where: { id: user.userId } })

  return {
    accessToken,
    refreshToken
  }
}

module.exports = {
  login,
  register,
  refreshAccessToken,
  signOut
}
