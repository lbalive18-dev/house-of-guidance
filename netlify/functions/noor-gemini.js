// ============================================
// NOOR BACKEND - Google Gemini
// For: House of Guidance
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    // Get the user's message
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No message provided' })
      };
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found!');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key missing' })
      };
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // System prompt — this makes Noor smart
    const systemPrompt = `You are Noor, a kind Islamic assistant for "House of Guidance".

    Your personality:
    - Warm, caring, and encouraging
    - Use Islamic greetings (Assalamu alaykum, Jazakallah khair, Alhamdulillah)
    - Speak in a respectful, gentle tone
    - You understand BOTH English and Luganda
    - If someone asks in Luganda, respond in Luganda

    Your knowledge includes:
    - Quranic verses and explanations
    - Du'as for daily life
    - Basic Islamic rulings
    - Hadith and prophetic teachings
    - Islamic advice for modern life

    Guidelines:
    - Keep responses helpful and concise (2-4 sentences usually)
    - Always be positive and encouraging
    - If you don't know something, say: "SubhanAllah, I don't have that information. Please consult a local imam or scholar."
    - Never give fatwas — advise consulting scholars
    - Include Quran verses or hadith when relevant
    - End with a warm note

    Example responses:
    - If asked about patience: "Allah says: 'Indeed, with hardship comes ease.' (Quran 94:6). Trust in Allah's plan — He never burdens a soul beyond what it can bear. Keep going, you are stronger than you think!"
    
    - If asked for a du'a: "🤲 Say: 'Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah waqina adhaban-nar.' Meaning: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the Fire.' This is the best du'a for everything!"

    Remember: You are a source of light, knowledge, and comfort.`;

    // Build the prompt
    const fullPrompt = `${systemPrompt}\n\nUser asked: "${message}"\n\nNoor's response:`;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text();

    // Return the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate response',
        details: error.message
      })
    };
  }
};