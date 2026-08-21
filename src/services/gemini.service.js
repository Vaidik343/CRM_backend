const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EVENT_PROMPTS = {
  birthday:  "You are designing a warm and cheerful birthday card.",
  promotion: "You are designing a professional and celebratory promotion announcement card.",
  office:    "You are designing a friendly office event announcement card.",
  trip:      "You are designing an exciting company trip announcement card.",
  fun_game:  "You are designing a fun and energetic office games/activity card.",
};

const generateEventCard = async ({ event_type, employee_name, message, ai_prompt }) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log("🚀 ~ generateEventCard ~ model:", model)

  const systemContext = EVENT_PROMPTS[event_type] || "You are designing an event card.";
  console.log("🚀 ~ generateEventCard ~ systemContext:", systemContext)

  const prompt = `
${systemContext}

Employee Name: ${employee_name}
Event Type: ${event_type}
Admin's custom prompt: ${ai_prompt || "Make it look great"}
Admin's message: ${message || ""}

Generate a JSON response with this exact structure (no markdown, pure JSON):
{
  "title": "Card heading text",
  "subtitle": "Card subheading",
  "message": "Personalized warm message for the employee",
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "text": "#hexcode"
  },
  "emojis": ["emoji1", "emoji2", "emoji3"],
  "style": "modern | classic | fun | elegant"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code blocks if Gemini wraps in ```json
  const clean = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");

  return JSON.parse(clean);
};

module.exports = { generateEventCard };