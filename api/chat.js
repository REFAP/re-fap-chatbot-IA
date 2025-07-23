// api/chat.js

import { Configuration, OpenAIApi } from "openai";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

// Configuration OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Configuration Airtable
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_TABLE_NAME = "CasDiagnostic"; // Modifie si tu as nommé ta table autrement

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { message, session_id: existingSessionId } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message manquant ou vide" });
  }

  const session_id = existingSessionId || uuidv4();

  // Ton prompt de mécano
  const prompt = `
Tu es un mécano expérimenté. Tu poses toujours des questions précises pour affiner le diagnostic moteur d’un client comme si tu étais en atelier.
Tu es cash, crédible et bienveillant. Ne donne pas encore de conclusion définitive : pose les bonnes questions.
Voici la demande du client : "${message}"
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4", // tu peux changer par "gpt-3.5-turbo" si tu veux économiser
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const botReply = completion.data.choices[0].message.content.trim();

    // Envoi à Airtable
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          question: message,
          reponse: botReply,
          timestamp: new Date().toISOString(),
          session_id: session_id,
        },
      }),
    });

    // Réponse au frontend
    res.status(200).json({ reply: botReply, session_id });
  } catch (error) {
    console.error("Erreur API :", error.response?.data || error.message);
    res.status(500).json({ error: "Une erreur est survenue lors du traitement." });
  }
}


    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Erreur serveur OpenAI:", error);
    return res.status(500).json({ error: "Erreur serveur OpenAI" });
  }
}
