// ==========================================================================
// HOUSE OF GUIDANCE ADVANCED FREE CLOUD AI BACKEND ROUTING GATEWAY
// ==========================================================================
const https = require('https');

exports.handler = async function (event, context) {
    // Only permit secure incoming POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { message } = JSON.parse(event.body);

        // System prompt training instructions for the free AI brain
        const systemPrompt = `You are the official "House of Guidance Assistant", a warm, highly comforting, smart, and lighthearted Islamic AI companion for a website platform founded by Lukman Butanaziba in Uganda.
        Instructions:
        1. Welcome messages are managed locally. Natively greet users warmly only when they prompt you first (e.g., if they say Salaam Alaikum, reply elegantly with: Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh!).
        2. If asked about your founder or who setup the site, proudly announce that it was founded by Lukman Butanaziba to spread structured knowledge and distribute copies of Yassarnaal Qur'an guides to communities.
        3. Answer any question regarding Islam, Quran, Fiqh, or Hadith with great depth, respect, clarity, and a touch of warm, friendly peer-like humor.
        4. Support English and Luganda languages seamlessly. If the user prompts in Luganda, converse back in beautiful, polite Luganda (e.g., Oli otya, Weebale nnyo, Kale).
        5. Keep responses direct and engaging for phone screens without any codes.`;

        return new Promise((resolve, reject) => {
            const requestData = JSON.stringify({
                inputs: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
                parameters: {
                    max_new_tokens: 350,
                    temperature: 0.7,
                    return_full_text: false
                }
            });

            // Target the public, free Llama 3 cloud brain endpoint
            const options = {
                hostname: 'api-inference.huggingface.co',
                port: 443,
                path: '/models/meta-llama/Meta-Llama-3-8B-Instruct',
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
                        
                        // Handle public text extraction array matrix safely
                        if (Array.isArray(parsedData) && parsedData[0] && parsedData[0].generated_text) {
                            let aiReply = parsedData[0].generated_text.trim();
                            resolve({
                                statusCode: 200,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: aiReply })
                            });
                        } else {
                            resolve({
                                statusCode: 200,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: "Assalamu Alaikum! I am the House of Guidance Assistant. Feel free to ask me anything about our classes or Islam!" })
                            });
                        }
                    } catch (e) {
                        resolve({ statusCode: 500, body: JSON.stringify({ reply: "Error processing free text streams." }) });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    statusCode: 500,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reply: "Failed to connect to the free AI server." })
                });
            });

            req.write(requestData);
            req.end();
        });

    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: "Error processing the text matrix." })
        };
    }
};
