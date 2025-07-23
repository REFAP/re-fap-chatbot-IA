console.log("🔑 Clé API chargée :", process.env.OPENAI_API_KEY ? "✅ OUI" : "❌ NON");

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message invalide ou manquant" });
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // ou "gpt-4" si dispo
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
    });

    const reply = completion.data.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Erreur API OpenAI :", error.response?.data || error.message);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: error.response?.data || error.message,
    });
  }
};

