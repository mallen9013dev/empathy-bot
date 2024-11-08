const nodemailer = require("nodemailer")

/**
 * Sends an email via nodemailer SMTP.
 */
const sendEmail = async (mailOptions) => {
  let email
  if (process.env.MOCK_SEND_EMAIL === "true") {
    email = {
      accepted: ["sender@email.com"],
      rejected: [],
      envelope: {
        from: "recipient@email.com",
        to: ["sender@email.com"]
      },
      messageId: "<2eadff2b-7805-35d3-2714-8bed2d677377@email.com>"
    }
  } else {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_PROVIDER,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT === "465" ? true : false,
      secure: false,
      auth: {
        user: process.env.SYSTEM_EMAIL,
        pass: process.env.SYSTEM_EMAIL_PW
      }
    })
    email = await transporter.sendMail(mailOptions)
  }

  console.log(JSON.stringify(email)) // TODO: can remove after sure fully understand responses

  return email
}

module.exports = {
  sendEmail
}
