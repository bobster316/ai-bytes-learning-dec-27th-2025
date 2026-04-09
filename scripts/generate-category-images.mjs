/**
 * Generates realistic thumbnail images for each category using DALL-E 3,
 * uploads them to Supabase Storage, and prints the resulting URLs.
 *
 * Run: node scripts/generate-category-images.mjs
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const CATEGORIES = [
  {
    id: 'ai-foundations',
    label: 'AI Foundations',
    prompt: 'Real photograph of a university professor standing in front of a whiteboard covered in neural network diagrams and mathematical equations, modern computer science lecture hall, students seated, bright academic lighting, DSLR photo',
  },
  {
    id: 'generative-ai',
    label: 'Generative AI & LLMs',
    prompt: 'Real photograph of a young professional at a desk using ChatGPT on a MacBook Pro in a modern open-plan office, soft natural window light, shallow depth of field, candid documentary style, DSLR photo',
  },
  {
    id: 'prompt-engineering',
    label: 'Prompt Engineering',
    prompt: 'Real photograph of a person\'s hands on a laptop keyboard, the laptop screen clearly showing a ChatGPT or Claude AI chat interface with a long detailed prompt being typed, coffee on the desk, home office setting, DSLR photo',
  },
  {
    id: 'ai-tools',
    label: 'AI Tools & Apps',
    prompt: 'Real photograph of a person holding a smartphone showing an AI assistant app with voice waveform on the screen, modern minimalist home or cafe setting, natural daylight, lifestyle photography, DSLR photo',
  },
  {
    id: 'business-ai',
    label: 'AI for Business',
    prompt: 'Real photograph of a diverse executive team in a glass-walled boardroom watching a large screen showing AI-powered sales forecasting charts and dashboards, professional business environment, DSLR photo',
  },
  {
    id: 'ai-agents',
    label: 'AI Agents & Automation',
    prompt: 'Real photograph of modern industrial robotic arms on a factory production line performing automated assembly tasks, bright factory floor lighting, workers monitoring screens in background, documentary industrial photography, DSLR photo',
  },
  {
    id: 'nlp',
    label: 'NLP & Conversational AI',
    prompt: 'Real photograph of a woman speaking naturally to an Amazon Echo or Google Nest smart speaker on a kitchen counter, warm home interior, candid lifestyle moment, natural light from window, DSLR photo',
  },
  {
    id: 'computer-vision',
    label: 'Computer Vision',
    prompt: 'Real photograph of a security analyst monitoring multiple CCTV screens in a control room, screens showing live camera feeds with person detection boxes highlighted, low light control room atmosphere, DSLR photo',
  },
  {
    id: 'industry-ai',
    label: 'AI in Industry',
    prompt: 'Real photograph of a doctor and radiologist reviewing AI diagnostic software on a medical workstation, MRI brain scans on screen with AI-highlighted regions, modern hospital radiology department, DSLR photo',
  },
  {
    id: 'data-ai',
    label: 'Data & AI Fundamentals',
    prompt: 'Real photograph of a data scientist at a dual-monitor workstation showing Python code and colorful data visualisation charts, open-plan tech office, casual work attire, DSLR photo',
  },
  {
    id: 'ai-ethics',
    label: 'AI Ethics & Governance',
    prompt: 'Real photograph of a panel discussion at a government or academic conference on AI regulation, speakers at a long table with microphones, audience in background, professional event photography, DSLR photo',
  },
  {
    id: 'ai-product',
    label: 'AI Product Dev',
    prompt: 'Real photograph of a small startup team gathered around a standing desk covered in sticky notes and a laptop showing an AI product prototype interface, whiteboard with wireframe sketches behind them, modern co-working space, DSLR photo',
  },
];

async function generateAndUpload(cat) {
  console.log(`\n[${cat.id}] Generating...`);
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: cat.prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const imageUrl = response.data[0].url;
    console.log(`[${cat.id}] Generated. Downloading...`);

    // Download the image
    const imgRes = await fetch(imageUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Upload to Supabase Storage
    const storagePath = `categories/${cat.id}.jpg`;
    const { error } = await supabase.storage
      .from('course-images')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`[${cat.id}] Upload failed:`, error.message);
      return null;
    }

    const { data } = supabase.storage.from('course-images').getPublicUrl(storagePath);
    console.log(`[${cat.id}] ✓ ${data.publicUrl}`);
    return { id: cat.id, url: data.publicUrl };
  } catch (err) {
    console.error(`[${cat.id}] Failed:`, err.message);
    return null;
  }
}

async function main() {
  console.log('Generating category images with DALL-E 3...\n');
  const results = [];

  // Generate sequentially to avoid rate limits
  for (const cat of CATEGORIES) {
    const result = await generateAndUpload(cat);
    if (result) results.push(result);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n\n=== RESULTS — paste into CATEGORIES array in app/page.tsx ===\n');
  results.forEach(r => {
    console.log(`  { id: "${r.id}", image: "${r.url}" },`);
  });
  console.log('\nDone.');
}

main().catch(console.error);
