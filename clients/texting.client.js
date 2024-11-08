const twilio = require("twilio")
const { MessagingResponse } = twilio.twiml

/**
 * Generates Twilio Markup Language XML.
 */
const generateTwimlResponse = (content) => {
  const twiml = new MessagingResponse()
  twiml.message(content)
  return twiml.toString()
}

/**
 * Utilizes Twilio SDK to send text messages.
 */
const sendText = async (to, from, body) => {
  try {
    const { TEXTING_ACCOUNT_SID, TEXTING_AUTH_TOKEN } = process.env

    const client = twilio(TEXTING_ACCOUNT_SID, TEXTING_AUTH_TOKEN)
    const payload = {
      to,
      from,
      body,
      statusCallback: process.env.TEXTING_MESSAGE_STATUS_CALLBACK_URL
    }
    const newMessage = await client.messages.create(payload)

    return {
      success: true,
      message: "Text sent to provider successfully.",
      newMessage
    }
  } catch (err) {
    console.log("Failed to send text message to provider.", err)
    return {
      success: false,
      message: err?.message || "Failed to send text message to provider.",
      error: err
    }
  }
}

module.exports = {
  generateTwimlResponse,
  sendText
}
