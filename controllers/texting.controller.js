const textingService = require("../services/texting.service")

const handleIncomingTextWebhook = async (req, res) => {
  const result = await textingService.handleIncomingTextWebhook(req.body)

  if (result.success) {
    if (result.systemReply) res.type("text/xml").status(201).send(result.systemReply)
    else res.status(201).send(result)
  } else {
    res.status(500).send(result)
  }
}

const handleOutgoingTextWebhook = async (req, res) => {
  const result = await textingService.handleOutgoingTextWebhook(req.body)

  if (result.success) {
    res.status(201).send(result)
  } else {
    res.status(500).send(result)
  }
}

const optIn = async (req, res) => {
  const { phoneNumber, userId } = req.body

  const result = await textingService.optIn(phoneNumber, userId)

  if (result.success) res.status(200).send(result)
  else res.status(500).send(result)
}

const sendText = async (req, res) => {
  const { userId } = req.user
  const { to, body } = req.body
  const from = process.env.TEXTING_PHONE_NUMBER

  const result = await textingService.sendText({ to, from, body, userId })

  if (result.success) res.status(201).send(result)
  else res.status(500).send(result)
}

module.exports = {
  handleIncomingTextWebhook,
  handleOutgoingTextWebhook,
  sendText,
  optIn
}
