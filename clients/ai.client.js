const OpenAI = require("openai")

/**
 * Generates AI chat completions via OpenAI SDK
 */
const generateAiResponse = async (prompt, history = [], systemMessages = []) => {
  const client = new OpenAI({ apiKey: process.env.AI_API_KEY })

  const completionDetails = {
    model: process.env.AI_MODEL,
    messages: [...systemMessages, ...history, { role: "user", content: prompt }],
    temperature: 1,
    max_tokens: 500,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      type: "text"
    }
  }
  const completion = await client.chat.completions.create(completionDetails)

  console.log(JSON.stringify(completion)) // TODO: can remove after sure fully understand responses

  return completion
}

module.exports = {
  generateAiResponse
}
