const appConstants = require("../constants/app.constants")
const emailClient = require("../clients/email.client")
const fs = require("fs")
const handlebars = require("handlebars")
const path = require("path")

/**
 * Sends a new user welcome email.
 */
const sendWelcomeEmail = async (toEmailAddress) => {
  try {
    const appName = appConstants.APP_NAME

    const html = _generateEmailContent("welcome.handlebars", { appName })

    const mailOptions = {
      from: `"${appName}" <${process.env.SYSTEM_EMAIL}>`,
      to: toEmailAddress,
      subject: `Welcome to ${appName}!`,
      html
    }
    await emailClient.sendEmail(mailOptions)

    return {
      success: true,
      message: "Welcome email sent successfully."
    }
  } catch (err) {
    console.log("Error sending welcome email:", err)
    return {
      success: false,
      message: err.message || "Error sending welcome email"
    }
  }
}

/**
 * Helper method to generate HTML email by inserting the content into a master template.
 */
const _generateEmailContent = (templateName, templateData) => {
  const contentSource = fs.readFileSync(path.join(__dirname, `../emails/templates/${templateName}`), "utf-8")
  const contentTemplate = handlebars.compile(contentSource)
  const contentHTML = contentTemplate(templateData)

  mainData = {
    appName: appConstants.APP_NAME,
    supportEmail: appConstants.SUPPORT_EMAIL,
    website: appConstants.WEBSITE,
    content: contentHTML
  }
  const mainSource = fs.readFileSync(path.join(__dirname, `../emails/main.handlebars`), "utf-8")
  const mainTemplate = handlebars.compile(mainSource)
  const finalHTML = mainTemplate(mainData)

  return finalHTML
}

module.exports = {
  sendWelcomeEmail
}
