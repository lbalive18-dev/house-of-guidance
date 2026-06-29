// ==========================================================================
// HOUSE OF GUIDANCE ADVANCED OPENAI-COMPATIBLE FREE CLOUD AI ROUTING MATRIX
// ==========================================================================

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
                body: JSON.stringify({ reply: "Assalamu Alaikum! Please make sure your HUGGINGFACE_API_KEY is configured inside Netlify Site Settings to unlock my cloud brain." })
            };
        }

        const systemInstruction = `You are the official "House of Guidance Assistant", a warm, highly comforting, smart, and lighthearted Islamic AI companion for a website platform founded by Lukman Butanaziba in Uganda. 
        
        CRITICAL INSTRUCTIONS:
        1. Greet users warmly only when prompted (e.g., if they say Salaam Alaikum, reply elegantly with: Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh!).
        2. If asked about your founder, proudly announce that it was founded by Lukman Butanaziba to spread structured knowledge and distribute copies of Yassarnaal Qur'an guides to communities.
        3. Answer any question regarding Islam, Quran, Fiqh, or Hadith with great depth, respect, clarity, and a touch of warm, friendly peer-like humor. 
        4. Support English and Luganda languages seamlessly. If the user prompts in Luganda, converse back in beautiful, fluent, polite Luganda (e.g., Oli otya, Weebale nnyo, Kale).
        5. Keep responses direct and highly engaging for phone screens. No raw code formatting strings.`;

        // Switched to the ultra-fast, high-availability light Llama 3.2 model endpoint path
        const response = await fetch("https://huggingface.co", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3.2-3B-Instruct",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: message }
                ],
                max_tokens: 350,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiReply = data.choices[0].message.content.trim();
            return {
                statusCode: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({ reply: aiReply })
            };
        } else {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reply: "Wa Alaikum Assalam! I am the House of Guidance Assistant, ready to converse with you in English and Luganda. Ask me any question concerning Islam!" })
            };
        }

    } catch (error) {
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: "Wa Alaikum Assalam! I am the House of Guidance Assistant, ready to converse with you in English and Luganda. Ask me any question concerning Islam!" })
        };
    }
};
