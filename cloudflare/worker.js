// Voyle — Updated Cloudflare Worker for image generation
// Supports both text-to-image AND image-to-image (img2img)
//
// POST / with JSON body:
//   Text-to-image: { prompt: "..." }
//   Image-to-image: { prompt: "...", image: "base64-encoded-jpeg" }
//
// Replace your current worker code with this, then Save and Deploy.

export default {
    async fetch(request, env) {
        const API_KEY = env.API_KEY;
        const url = new URL(request.url);
        const auth = request.headers.get("Authorization");

        // 🔐 Simple API key check
        if (auth !== `Bearer ${API_KEY}`) {
            return json({ error: "Unauthorized" }, 401);
        }

        // 🚫 Only allow POST requests to /
        if (request.method !== "POST" || url.pathname !== "/") {
            return json({ error: "Not allowed" }, 405);
        }

        try {
            const body = await request.json();
            const { prompt, image } = body;

            if (!prompt) return json({ error: "Prompt is required" }, 400);

            let result;

            if (image) {
                // 🖼️ Image-to-image mode
                // Decode base64 image into a Uint8Array
                const base64Data = image.includes(",")
                    ? image.split(",")[1]
                    : image;
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                result = await env.AI.run(
                    "@cf/runwayml/stable-diffusion-v1-5-img2img",
                    {
                        prompt,
                        image: bytes,
                        strength: 0.8,
                        num_steps: 20,
                    }
                );
            } else {
                // ✨ Text-to-image mode (default)
                result = await env.AI.run(
                    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
                    { prompt }
                );
            }

            return new Response(result, {
                headers: { "Content-Type": "image/jpeg" },
            });
        } catch (err) {
            return json({ error: "Failed to generate image", details: err.message }, 500);
        }
    },
};

// 📦 Function to return JSON responses
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}