const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { User } = require("../database/models/users.model")
const emailService = require("../services/email.service")

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

    const user = await User.findOne({ where: { refreshToken: token } })
    if (!user || token !== user.refreshToken)
      return {
        success: false,
        message: "Invalid refresh token"
      }

    delete user.dataValues.password
    delete user.dataValues.refreshToken

    const tokenPayload = { user: user.dataValues }
    const { accessToken, refreshToken } = await _generateTokens(tokenPayload, user.id)

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
 * Finds a user and compares the hashed pw, then returns auth and refresh tokens.
 */
const signIn = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } })
    if (!user)
      return {
        success: false,
        statusCode: 401,
        message: "Invalid username or password"
      }

    const passwordHashMatch = await bcrypt.compare(password, user.password)
    if (!passwordHashMatch)
      return {
        success: false,
        statusCode: 401,
        message: "Invalid username or password"
      }

    delete user.dataValues.password
    delete user.dataValues.refreshToken

    const tokenPayload = { user: user.dataValues }
    const { accessToken, refreshToken } = await _generateTokens(tokenPayload, user.id)

    return {
      success: true,
      message: "Sign-in successful.",
      user: user.dataValues,
      accessToken,
      refreshToken
    }
  } catch (err) {
    console.log("Error signing in: ", err)
    return {
      success: false,
      statusCode: 500,
      message: err?.message || "Error signing in."
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
const _generateTokens = async (tokenPayload, userId) => {
  const accessTokenSecretKey = process.env.ACCESS_TOKEN_SECRET_KEY
  const refreshTokenSecretKey = process.env.REFRESH_TOKEN_SECRET_KEY

  const accessToken = jwt.sign(tokenPayload, accessTokenSecretKey, {
    expiresIn: "15m"
  })

  const refreshToken = jwt.sign(tokenPayload, refreshTokenSecretKey, {
    expiresIn: "30d"
  })

  await User.update({ refreshToken }, { where: { id: userId } })

  return {
    accessToken,
    refreshToken
  }
}

module.exports = {
  register,
  refreshAccessToken,
  signIn,
  signOut
}
