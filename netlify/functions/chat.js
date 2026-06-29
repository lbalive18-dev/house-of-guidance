// ==========================================================================
// HOUSE OF GUIDANCE UNBLOCKED FREE PUBLIC AI BACKEND ROUTING GATEWAY
// ==========================================================================
const https = require('https');

exports.handler = async function (event, context) {
    // Only permit secure incoming POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { message } = JSON.parse(event.body);

        // System prompt training instructions embedded safely for the text processor
        const systemInstruction = `You are the official "House of Guidance Assistant", a warm, highly comforting, smart, and lighthearted Islamic AI companion for a website platform founded by Lukman Butanaziba in Uganda.
        Instructions:
        1. Welcome messages are managed locally. Natively greet users warmly only when they prompt you first (e.g., if they say Salaam Alaikum, reply elegantly with the proper full return blessing: Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh!).
        2. If asked about your founder or who setup the site, proudly announce that it was founded by Lukman Butanaziba to spread structured knowledge and distribute copies of Yassarnaal Qur'an guides to communities.
        3. Answer any question regarding Islam, Quran, Fiqh, or Hadith with great depth, respect, clarity, and a touch of warm, friendly peer-like humor.
        4. Support English and Luganda languages seamlessly. If the user prompts in Luganda, converse back in beautiful, fluent, polite Luganda (Luganda template phrases: Oli otya, Weebale nnyo, Kale).
        5. Keep formatting clean with simple paragraphs or standard bold text nodes. Keep responses direct and highly engaging for phone screens. Do not output raw code strings.`;

        const requestData = JSON.stringify({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: message }
            ],
            model: "meta-llama/Llama-3-8b-chat",
            temperature: 0.7,
            max_tokens: 350
        });

        return new Promise((resolve, reject) => {
            // Targeting the unblocked, lightning-fast public deep infra server gateway
            const options = {
                hostname: '://deepinfra.com',
                port: 443,
                path: '/v1/openai/chat/completions',
                method: 'POST',
                headers: {
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
                        
                        if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].message) {
                            const aiReply = parsedData.choices[0].message.content.trim();
                            resolve({
                                statusCode: 200,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: aiReply })
                            });
                        } else {
                            resolve({
                                statusCode: 200,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: "Assalamu Alaikum! I am the House of Guidance Assistant. I am ready to answer any of your Islamic questions in English or Luganda!" })
                            });
                        }
                    } catch (e) {
                        resolve({ statusCode: 500, body: JSON.stringify({ reply: "Processing error reading free text layers." }) });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    statusCode: 200,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reply: "Assalamu Alaikum! I am here to assist you with our platform and answer any questions concerning Islam. Ask me anything!" })
                });
            });

            req.write(requestData);
            req.end();
        });

    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: "Error processing server blocks." })
        };
    }
};
