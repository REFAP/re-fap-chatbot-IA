const { Configuration, OpenAIApi } = require("openai");
const Airtable = require("airtable");

// 🔧 Airtable config
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID);
const tableName = "CasDiagnostic";

// 🔧 OpenAI config
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 💬 Fonction API
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message invalide ou manquant" });
    }

    // ✅ 1. Stocker dans Airtable
    try {
      await base(tableName).create([
        {
          fields: {
            Message: message,
            Horodatage: new Date().toISOString(),
          },
        },
      ]);
    } catch (airtableError) {
      console.error("Erreur Airtable :", airtableError.message);
      // On continue même si Airtable échoue
    }

    // ✅ 2. Envoyer à ChatGPT
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un mécano expérimenté, parle avec bon sens, sois clair et concis. Ne donne pas de fausse certitude. Pose des questions si nécessaire.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
    });

    const reply = completion?.data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({ error: "Réponse vide de l'IA" });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Erreur API :", error?.response?.data || error.message);
    return res.status(500).json({
      error: "Erreur serveur",
      details: error?.response?.data || error.message,
    });
  }
};

