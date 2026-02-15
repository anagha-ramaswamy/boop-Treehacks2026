import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { image_urls } = await req.json();

        if (!image_urls || image_urls.length === 0) {
            return Response.json({ error: 'No images provided' }, { status: 400 });
        }

        // Step 1: Analyze the images to get mood and vibes
        const imageAnalysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze these baby photos and describe the overall mood, energy, and vibes. Consider:
- Baby's expressions and activities
- The overall feeling (joyful, peaceful, playful, curious)
- Energy level (calm, energetic, sleepy)
- Emotional tone

Provide a brief description that would help create matching background music.`,
            file_urls: image_urls,
            response_json_schema: {
                type: "object",
                properties: {
                    mood: { type: "string" },
                    energy_level: { type: "string", enum: ["low", "medium", "high"] },
                    description: { type: "string" }
                }
            }
        });

        // Step 2: Generate music using Suno TreeHacks API
        const sunoApiKey = Deno.env.get("SUNO_API_KEY");
        if (!sunoApiKey) {
            return Response.json({ error: 'Suno API key not configured' }, { status: 500 });
        }

        // Suno topic must be under 500 chars and descriptive
        const topic = `Happy uplifting instrumental music for baby photo slideshow with ${imageAnalysis.mood} vibes and ${imageAnalysis.energy_level} energy`;
        const tags = "instrumental, upbeat, happy, gentle, cute";

        // Create song generation request
        const generateResponse = await fetch('https://studio-api.prod.suno.com/api/v2/external/hackathons/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sunoApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: topic,
                tags: tags,
                make_instrumental: true
            })
        });

        if (!generateResponse.ok) {
            const error = await generateResponse.text();
            return Response.json({ 
                error: 'Failed to generate music', 
                details: error,
                status: generateResponse.status
            }, { status: generateResponse.status });
        }

        const clipData = await generateResponse.json();
        const clipId = clipData.id;

        if (!clipId) {
            return Response.json({ 
                error: 'No clip ID in response',
                response: clipData
            }, { status: 500 });
        }

        // Poll for audio URL (wait for streaming status)
        let audioUrl = null;
        let attempts = 0;
        const maxAttempts = 40; // 40 attempts * 2 seconds = 80 seconds max

        while (attempts < maxAttempts && !audioUrl) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const statusResponse = await fetch(`https://studio-api.prod.suno.com/api/v2/external/hackathons/clips?ids=${clipId}`, {
                headers: {
                    'Authorization': `Bearer ${sunoApiKey}`
                }
            });

            if (statusResponse.ok) {
                const clips = await statusResponse.json();
                const clip = clips[0];
                
                // Once status is "streaming" or "complete", audio_url is available
                if ((clip.status === 'streaming' || clip.status === 'complete') && clip.audio_url) {
                    audioUrl = clip.audio_url;
                    break;
                }
            }

            attempts++;
        }

        if (!audioUrl) {
            return Response.json({ 
                error: 'Music generation timed out',
                clip_id: clipId
            }, { status: 408 });
        }

        return Response.json({
            success: true,
            audio_url: audioUrl,
            mood: imageAnalysis.mood,
            description: imageAnalysis.description
        });

    } catch (error) {
        console.error('Error generating music:', error);
        return Response.json({ 
            error: 'Failed to generate music',
            details: error.message 
        }, { status: 500 });
    }
});