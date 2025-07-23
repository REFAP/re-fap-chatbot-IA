const { Configuration, OpenAIApi } = require("openai");
const Airtable = require("airtable");

module.exports = async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY || !process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      throw new Error("Une ou plusieurs variables d’environnement sont manquantes.");
    }

    const userMessage = req.body.message;
    if (!userMessage || userMessage.trim() === "") {
      return res.status(400).json({ error: "Message utilisateur vide." });
    }

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    await base("CasDiagnostic").create([{ fields: { Message: userMessage } }]);

    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      messages: [
        { role: "system", content: "Tu es un expert automobile. Tu aides à poser un pré-diagnostic auto intelligent. Sois clair, professionnel et concis." },
        { role: "user", content: userMessage }
      ],
    });

    const output = completion.data.choices?.[0]?.message?.content;
    if (!output) throw new Error("Réponse GPT vide ou malformée.");

    res.status(200).json({ output });
  } catch (error) {
    console.error("Erreur API:", error);
    res.status(500).json({ error: "Erreur serveur : " + error.message });
  }
};
