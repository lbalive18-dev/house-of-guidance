// ==========================================================================
// HOUSE OF GUIDANCE PRODUCTION LIVE FREE CLOUD AI BACKEND MATRIX
// ==========================================================================
const https = require('https');

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { message } = JSON.parse(event.body);
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reply: "Assalamu Alaikum! I am ready to help. Please configure the HUGGINGFACE_API_KEY inside your Netlify Settings panel to unlock my deep cloud brain completely!" })
            };
        }

        const systemInstruction = `You are the official "House of Guidance Assistant", a warm, comforting, smart, and lighthearted Islamic AI companion for a website platform founded by Lukman Butanaziba in Uganda.
        Instructions:
        1. Welcome messages are managed locally. Natively greet users warmly only when they prompt you first (e.g., if they say Salaam Alaikum, reply elegantly with: Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh!).
        2. If asked about your founder or who setup the site, proudly announce that it was founded by Lukman Butanaziba to spread structured knowledge and distribute copies of Yassarnaal Qur'an guides to communities.
        3. Answer any question regarding Islam, Quran, Fiqh, or Hadith with great depth, respect, clarity, and a touch of warm, friendly peer-like humor.
        4. Support English and Luganda languages seamlessly. If the user prompts in Luganda, converse back in beautiful, fluent, polite Luganda (Oli otya, Weebale nnyo, Kale).
        5. Keep responses direct and highly engaging for phone screens. No raw code.`;

        // Updated chat payload structure optimized for Qwen text processors
        const requestData = JSON.stringify({
            inputs: `<|im_start|>system\n${systemInstruction}<|im_end|>\n<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant\n`,
            parameters: { max_new_tokens: 350, temperature: 0.7, return_full_text: false }
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api-inference.huggingface.co',
                port: 443,
                // Switched to the lightning-fast, high-availability Qwen 2.5 server engine model path
                path: '/models/Qwen/Qwen2.5-7B-Instruct',
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
                        let aiReply = "";

                        if (Array.isArray(parsedData) && parsedData[0] && parsedData[0].generated_text) {
                            aiReply = parsedData[0].generated_text.trim();
                        } else if (parsedData && parsedData.generated_text) {
                            aiReply = parsedData.generated_text.trim();
                        }

                        if (aiReply) {
                            // Strip any accidental system prompt bleedover
                            aiReply = aiReply.replace(/<\|im_end\|>/g, "").trim();
                            resolve({
                                statusCode: 200,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: aiReply })
                            });
                        } else {
                            resolve({
                                statusCode: 200,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: "Wa Alaikum Assalam! I am the House of Guidance Assistant, ready to converse with you in English and Luganda. Ask me any question concerning Islam!" })
                            });
                        }
                    } catch (e) {
                        resolve({ statusCode: 500, body: JSON.stringify({ reply: "Processing error reading secure AI text streams." }) });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({ statusCode: 500, body: JSON.stringify({ reply: "Network connection error reaching free servers." }) });
            });

            req.write(requestData);
            req.end();
        });

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ reply: "Execution breakdown error parsing parameters." }) };
    }
};
