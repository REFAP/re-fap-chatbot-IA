import { Configuration, OpenAIApi } from "openai";
import Airtable from "airtable";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Airtable config
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  try {
    const userMessage = req.body.message;

    // Enregistrer le message utilisateur dans Airtable
    await base("CasDiagnostic").create([
      {
        fields: {
          Message: userMessage,
        },
      },
    ]);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "Tu es un expert automobile. Tu aides à poser un pré-diagnostic auto intelligent. Sois clair, professionnel et concis.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const output = completion.data.choices?.[0]?.message?.content;

    if (!output) {
      throw new Error("Réponse GPT vide ou malformée");
    }

    res.status(200).json({ output });
  } catch (error) {
    console.error("Erreur serveur :", error); // 💥 log de debug
    res.status(500).json({ error: "Erreur interne : " + error.message });
  }
}

