// ==========================================================================
// HOUSE OF GUIDANCE ADVANCED OPENAI BACKEND ROUTING NETLIFY FUNCTION MATRIX
// ==========================================================================
const https = require('https');

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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reply: "Configuration Error: The administration has not configured the secure cloud environment variable tokens yet inside Netlify." })
            };
        }

        // Wrap the OpenAI API connection securely inside a native background request loop
        return new Promise((resolve, reject) => {
            const requestData = JSON.stringify({
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
            });

            const options = {
                hostname: '://openai.com',
                port: 443,
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestData)
                }
            };

            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => { responseBody += chunk; });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(responseBody);
                        if (parsedData.choices && parsedData.choices[0].message) {
                            resolve({
                                statusCode: 200,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: parsedData.choices[0].message.content })
                            });
                        } else {
                            resolve({
                                statusCode: 500,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: "SubhanAllah, the cloud AI brain returned an empty value. Please try again." })
                            });
                        }
                    } catch (e) {
                        resolve({ statusCode: 500, body: JSON.stringify({ reply: "Processing error parsing data." }) });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    statusCode: 500,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reply: "Connection failed to reach OpenAI cloud databases." })
                });
            });

            req.write(requestData);
            req.end();
        });

    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: "Error: My backend framework encountered an execution timeout error." })
        };
    }
};
