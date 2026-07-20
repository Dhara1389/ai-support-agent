// testEmbeddings.ts — test HuggingFace
import { HuggingFaceInferenceEmbeddings } from 
  '@langchain/community/embeddings/hf';
import * as dotenv from 'dotenv';

dotenv.config();

async function testHuggingFace() {
  console.log('Testing HuggingFace embeddings...');
  console.log(
    'HF Key:', 
    process.env.HUGGINGFACE_API_KEY?.substring(0, 8)
  );

  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY!,
    model: 'sentence-transformers/all-MiniLM-L6-v2'
  });

  try {
    const result = await embeddings.embedQuery("Hello world test");
    console.log('✅ HuggingFace embeddings work!');
    console.log('Vector length:', result.length);
    console.log('First 3 values:', result.slice(0, 3));
  } catch (error) {
    console.error('❌ HuggingFace failed:', error);
  }
}

testHuggingFace();