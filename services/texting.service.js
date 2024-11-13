const textingClient = require("../clients/texting.client")
const textingConstants = require("../constants/texting.constants")
const aiService = require("./ai.service")
const { PhoneNumber, TextMessage } = require("../database/models/texting.model")

/**
 * Add a new active phone number associated with a user. Deactivates all other numbers.
 */
const addPhoneNumber = async (newPhoneNumber, userId) => {
  try {
    await PhoneNumber.update({ active: false }, { where: { userId } })

    const [phoneNumber] = await PhoneNumber.upsert({
      phoneNumber: newPhoneNumber,
      userId,
      active: true,
      optedIn: true,
      optDate: new Date()
    })

    if (process.env.MOCK_TEXT_CLIENT !== "true") {
      await textingClient.sendText(newPhoneNumber, process.env.TEXTING_PHONE_NUMBER, textingConstants.SYSTEM_KEYWORDS.REPLIES.START)
    }

    return {
      success: true,
      message: "Successfully added phone number",
      phoneNumber: phoneNumber.phoneNumber
    }
  } catch (err) {
    console.log("Error adding phone number:", err)
    return {
      success: false,
      message: err?.message || "Error adding phone number."
    }
  }
}

/**
 * Gets the users one active phone number based on user id.
 */
const getPhoneNumber = async (userId) => {
  try {
    const phoneNumber = await PhoneNumber.findOne({ where: { userId, active: true }, attributes: ["phoneNumber"] })
    return {
      success: true,
      message: "Successfully found phone number",
      phoneNumber: phoneNumber?.phoneNumber
    }
  } catch (err) {
    console.log("Error getting phone number:", err)
    return {
      success: false,
      message: err?.message || "Error getting phone number."
    }
  }
}

/**
 * Webhook method that finds or creates ph# record, then sends system keyword reply not opted-in message. System replies are not logged in database.
 * If number is previously opted in, trigger methods to check if auto-reply is warranted based on the app.
 */
const handleIncomingTextWebhook = async (message) => {
  try {
    let appAutoReply, systemReply

    const [fromPhoneNumber, fromNumberIsNew] = await PhoneNumber.findOrCreate({
      where: { phoneNumber: message.From },
      defaults: { phoneNumber: message.From }
    })

    const isSystemKeyword = ["START", "STOP", "HELP"].includes(message.Body.trim().toUpperCase())
    const numberNotOpted = (fromNumberIsNew && message.Body.toUpperCase() !== "START") || !fromPhoneNumber?.optedIn || !fromPhoneNumber?.userId

    if (isSystemKeyword) {
      systemReply = await _handleSystemReply(message.Body.trim().toUpperCase(), message.From)
    } else if (numberNotOpted) {
      systemReply = textingClient.generateTwimlResponse(textingConstants.NOT_OPTED_IN_MSG)
    } else {
      appAutoReply = await _handleNonSystemReply(message, fromPhoneNumber?.userId)
    }
    return {
      success: true,
      message: "Text received successfully.",
      appAutoReply,
      systemReply
    }
  } catch (err) {
    console.log("Error receiving text:", err)
    return {
      success: false,
      message: err?.message || "Error receiving text."
    }
  }
}

/**
 * Webhook method that updates the text message status from Twilio in case it fails.
 */
const handleOutgoingTextWebhook = async (message) => {
  try {
    const payload = {
      status: message.MessageStatus,
      errorCode: message.ErrorCode,
      errorMessage: message.ErrorMessage
    }
    await TextMessage.update(payload, { where: { messageId: message.MessageSid } })

    return {
      success: true,
      message: "Text status update received successfully."
    }
  } catch (err) {
    console.log("Error receiving text status update:", err)
    return {
      success: false,
      message: `Error receiving text status update. ${err?.message}`
    }
  }
}

/**
 * Updates the opt-in flag to true for the provided phone number.
 */
const optIn = async (phoneNumber) => {
  try {
    await PhoneNumber.findOrCreate({
      where: { phoneNumber },
      defaults: {
        optedIn: true,
        optDate: new Date()
      }
    })

    const payload = {
      optedIn: true,
      optDate: new Date()
    }
    await PhoneNumber.update(payload, { where: { phoneNumber } })

    return {
      success: true,
      message: "Phone number successfully opted-in"
    }
  } catch (err) {
    console.log("Error opting-in phone number:", err)
    return {
      success: false,
      message: err.message || "Error opting-in phone number."
    }
  }
}

/**
 * Updates the opt-in flag to false for the provided phone number. Can be used for text opt or web opt.
 */
const optOut = async (phoneNumber) => {
  try {
    const payload = {
      optedIn: false,
      optDate: new Date()
    }

    await PhoneNumber.update(payload, { where: { phoneNumber } })

    return {
      success: true,
      message: "Opt-out completed successfully."
    }
  } catch (err) {
    console.log("Error opting-out phone number:", err)
    return {
      success: false,
      message: err.message || "Error opting-out phone number."
    }
  }
}

/**
 * Sends a message after ensuring to ph# is opted in.
 */
const sendText = async ({ to, from, body, userId }) => {
  try {
    const toPhoneNumber = await PhoneNumber.findOne({ where: { phoneNumber: to }, attributes: ["optedIn"] })
    if (!toPhoneNumber?.optedIn)
      return {
        success: false,
        message: "Unable to send message due to recipient not opted-in.",
        phoneNumber: to
      }

    let clientResult
    if (process.env.MOCK_TEXT_CLIENT === "true") {
      clientResult = {
        newMessage: {
          sid: Math.random() * 10000,
          numSegments: 2,
          status: "sent"
        }
      }
    } else {
      clientResult = await textingClient.sendText(to, from, body)
      if (!clientResult.success) {
        if (clientResult.error?.code === 21610) {
          await optOut(to)
        }
        return messageResult
      }
    }

    const { newMessage } = clientResult
    const textPayload = {
      to,
      from,
      body,
      direction: "outbound",
      numSegments: newMessage.numSegments,
      messageId: newMessage.sid,
      status: newMessage.status,
      userId
    }
    const textMessage = await TextMessage.create(textPayload)

    return {
      success: true,
      message: "Text queued successfully.",
      textMessage
    }
  } catch (err) {
    console.log("Error queuing text:", err)
    return {
      success: false,
      message: err?.message || "Error queuing text."
    }
  }
}

/**
 * Saves an incoming message/conversation and then generates/ sends AI reply
 */
const _handleNonSystemReply = async (message, userId) => {
  const textPayload = {
    to: message.To,
    from: message.From,
    body: message.Body,
    direction: "inbound",
    numSegments: message.NumSegments,
    messageId: message.MessageSid,
    userId,
    status: "received"
  }
  await TextMessage.create(textPayload)

  const aiResponse = await aiService.generateAiResponse(message.Body, userId)
  if (!aiResponse.success) return

  const replyMsg = aiResponse.aiCompletion.response
  sendText({ to: message.From, from: message.To, body: replyMsg, userId })

  return replyMsg
}

/**
 * Generates TwiML in response to system keywords such as "START", "STOP", and "HELP". Handles calls opt methods as well.
 */
const _handleSystemReply = async (keyword, phoneNumber) => {
  const reply = textingConstants.SYSTEM_KEYWORDS.REPLIES[keyword]
  const twiml = textingClient.generateTwimlResponse(reply)

  if (keyword === "START") {
    const result = await optIn(phoneNumber)
    if (!result.success) return null
  }

  if (keyword === "STOP") {
    const result = await optOut(phoneNumber)
    if (!result.success) return null
  }

  return twiml
}

module.exports = {
  addPhoneNumber,
  getPhoneNumber,
  handleIncomingTextWebhook,
  handleOutgoingTextWebhook,
  optIn,
  optOut,
  sendText
}
