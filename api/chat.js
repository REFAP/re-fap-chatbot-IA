const { Configuration, OpenAIApi } = require("openai");
const Airtable = require("airtable");

// Log de démarrage de la fonction
console.log("📡 API /chat appelée");

module.exports = async (req, res) => {
  try {
    // Méthode autorisée ?
    if (req.method !== "POST") {
      console.log("❌ Méthode refusée :", req.method);
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    // Lecture du body
    const { message } = req.body;
    console.log("🔧 Message reçu :", message);

    if (!message || typeof message !== "string") {
      console.log("⚠️ Message vide ou invalide");
      return res.status(400).json({ error: "Message invalide ou manquant" });
    }

    // Airtable - Initialisation
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    console.log("🔍 Clés récupérées :", {
      AIRTABLE_API_KEY: airtableApiKey ? "✅" : "❌",
      AIRTABLE_BASE_ID: airtableBaseId ? "✅" : "❌",
      OPENAI_API_KEY: openaiApiKey ? "✅" : "❌"
    });

    // Init Airtable
    const airtable = new Airtable({ apiKey: airtableApiKey });
    const base = airtable.base(airtableBaseId);

    // Enregistrement dans Airtable (try/catch séparé)
    try {
      await base("CasDiagnostic").create([
        {
          fields: {
            Message: message,
            Horodatage: new Date().toISOString()
          },
        },
      ]);
      console.log("✅ Message enregistré dans Airtable");
    } catch (e) {
      console.error("❌ Erreur Airtable :", e.message);
    }

    // OpenAI - Configuration
    const configuration = new Configuration({ apiKey: openaiApiKey });
    const openai = new OpenAIApi(configuration);

    // Appel OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un mécano expérimenté qui aide les clients à comprendre leur souci moteur avec un ton clair et direct.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
    });

    const reply = completion?.data?.choices?.[0]?.message?.content;

    console.log("🧠 Réponse IA :", reply);

    if (!reply) {
      return res.status(502).json({ error: "Réponse vide de l'IA" });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("🔥 Erreur serveur :", err.message, err.stack);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      stack: err.stack,
    });
  }
};

