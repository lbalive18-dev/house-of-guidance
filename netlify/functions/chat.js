// ==========================================================================
// HOUSE OF GUIDANCE ADVANCED OPENAI BACKEND ROUTING NETLIFY FUNCTION MATRIX
// ==========================================================================
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    // Only permit secure incoming POST request parameters
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { message } = JSON.parse(event.body);
        const apiKey = process.env.OPENAI_API_KEY;

        // Verify that your Netlify site settings have the environment variable configured correctly
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ reply: "Configuration Error: The administration has not configured the secure cloud environment variable tokens yet inside Netlify." })
            };
        }

        // Secure endpoint routing targeting OpenAI's fast context engine (gpt-4o-mini)
        const response = await fetch("https://openai.com", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are the official "House of Guidance Assistant", a warm, highly comforting, smart, and lighthearted Islamic AI companion for a website platform founded by Lukman Butanaziba in Uganda. 
                        
                        CRITICAL INSTRUCTIONS:
                        1. Welcome messages are managed locally. Natively greet users warmly only when they prompt you first (e.g., if they say Salaam Alaikum, reply elegantly with the proper full return blessing: Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh!).
                        2. If asked about your founder or who setup the site, proudly announce that it was founded by Lukman Butanaziba to spread structured knowledge and distribute copies of Yassarnaal Qur'an guides to communities.
                        3. Answer any question regarding Islam, Quran, Fiqh, or Hadith with great depth, respect, clarity, and a touch of warm, friendly peer-like humor. 
                        4. Support English and Luganda languages seamlessly. If the user prompts in Luganda, converse back in beautiful, fluent, polite Luganda (Luganda template phrases: Oli otya, Weebale nnyo, Kale).
                        5. Keep formatting clean with simple paragraphs or standard bold text nodes. Keep responses direct and highly engaging for phone screens.`
                    },
                    { role: "user", content: message }
                ],
                max_tokens: 450,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0].message) {
            const aiReply = data.choices[0].message.content;
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reply: aiReply })
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ reply: "SubhanAllah, my cloud connection dropped for a quick second! Please try prompting me again." })
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ reply: "Error: My backend framework encountered a data retrieval processing timeout error." })
        };
    }
};
