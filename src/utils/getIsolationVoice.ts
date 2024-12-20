import { ElevenLabsClient, play, ElevenLabsError } from 'elevenlabs';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

async function getIsolationVoice(
  path: string,
  fileName: string,
): Promise<Buffer> {
  try {
    const file = await fs.createReadStream(path);

    const audioStream = await client.audioIsolation.audioIsolation({
      audio: file,
    });

    const chunks = [];

    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = await Buffer.concat(chunks);

    return audioBuffer;
  } catch (err) {
    if (err instanceof ElevenLabsError) {
      if (err.statusCode === 401) {
        throw new Error('Превышен лимит');
      }
    }

    throw new Error('Failed to isolate voice.');
  }
}

export default getIsolationVoice;
