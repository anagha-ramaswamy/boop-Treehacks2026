import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Generate procedural lullaby audio based on mood
const generateLullabyAudio = async (mood, base44) => {
  // Use LLM to get audio parameters based on mood
  const audioParams = await base44.integrations.Core.InvokeLLM({
    prompt: `You are generating audio parameters for a short (10 second) baby lullaby. Based on the mood "${mood}", provide JSON with:
- frequency (Hz): base pitch (low: 150-200, medium: 220-280, high: 300-400)
- intensity (0.15-0.35): how loud

Examples:
- sleepy: {"frequency": 196, "intensity": 0.2}
- happy: {"frequency": 280, "intensity": 0.3}

Return only the JSON object, no other text.`,
    response_json_schema: {
      type: "object",
      properties: {
        frequency: { type: "number" },
        intensity: { type: "number" }
      }
    }
  });

  const sampleRate = 22050;
  const duration = 10; // 10 seconds
  const samples = sampleRate * duration;
  const frequency = audioParams.frequency || 220;
  const intensity = audioParams.intensity || 0.2;
  
  // Create audio samples
  const audioBuffer = [];
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const value = Math.sin(2 * Math.PI * frequency * t);
    
    // Fade in/out
    let envelope = 1;
    if (t < 0.3) envelope = t / 0.3;
    if (t > duration - 0.3) envelope = (duration - t) / 0.3;
    
    // Add subtle variation
    const variation = Math.sin(0.5 * t) * 0.1;
    const sample = Math.floor((value * (1 + variation) * envelope * intensity) * 32767);
    
    audioBuffer.push(sample & 0xffff);
  }
  
  // Create WAV header
  const wavSize = 36 + audioBuffer.length * 2;
  const wavHeader = new Uint8Array(44);
  const view = new DataView(wavHeader.buffer);
  
  view.setUint32(0, 0x46464952, true); // "RIFF"
  view.setUint32(4, wavSize, true);
  view.setUint32(8, 0x45564157, true); // "WAVE"
  view.setUint32(12, 0x20746d66, true); // "fmt "
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, 1, true); // num channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  view.setUint32(36, 0x61746164, true); // "data"
  view.setUint32(40, audioBuffer.length * 2, true);
  
  // Combine header and audio data
  const wavData = new Uint8Array(44 + audioBuffer.length * 2);
  wavData.set(wavHeader);
  
  for (let i = 0; i < audioBuffer.length; i++) {
    const sample = audioBuffer[i];
    wavData[44 + i * 2] = sample & 0xff;
    wavData[44 + i * 2 + 1] = (sample >> 8) & 0xff;
  }
  
  // Convert to base64
  let binary = '';
  for (let i = 0; i < wavData.length; i++) {
    binary += String.fromCharCode(wavData[i]);
  }
  const base64 = btoa(binary);
  return `data:audio/wav;base64,${base64}`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mood } = await req.json();
    
    if (!mood || typeof mood !== 'string') {
      return Response.json({ error: 'Mood is required' }, { status: 400 });
    }

    // Generate lullaby using LLM-guided procedural audio
    const audioUrl = await generateLullabyAudio(mood, base44);
    return Response.json({ audio_url: audioUrl, mood, source: 'llm' });

  } catch (error) {
    console.error('Lullaby generation error:', error.message);
    return Response.json({ error: 'Failed to generate lullaby' }, { status: 500 });
  }
});