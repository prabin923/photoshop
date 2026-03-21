// PixelForge — Google Gemini AI Integration Engine
// Built-in API key for seamless AI design experience

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Built-in Gemini API key — no configuration needed
const BUILT_IN_KEY = 'AIzaSyAy82P4IllYzFYoSUbw59evlZa73BXNEiw';

export interface GeminiResponse {
  text: string;
  json?: any;
}

// Built-in key is the default; localStorage can override if user sets a custom one
function getStoredKey(): string {
  const stored = localStorage.getItem('pixelforge_gemini_key');
  // Ignore old invalid keys that got stuck in localStorage
  if (stored && stored.startsWith('AIza') && stored !== 'AIzaSyDTaj0LCq5cLPxNQ3kG3vmlSKyvpWjobYw') {
    return stored;
  }
  return BUILT_IN_KEY;
}

let apiKey: string = getStoredKey();

export function setGeminiApiKey(key: string): void {
  apiKey = key;
  localStorage.setItem('pixelforge_gemini_key', key);
}

export function hasGeminiKey(): boolean {
  return !!apiKey;
}

async function geminiRequest(prompt: string, expectJson: boolean = false): Promise<GeminiResponse> {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing.');
  }

  const payload: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 16384
    }
  };

  const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `API error: ${response.status}`;
    console.error('Gemini API Error:', errorData);
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (expectJson) {
    try {
      return { text, json: JSON.parse(text) };
    } catch {
      // Try extracting JSON array
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try { return { text, json: JSON.parse(arrayMatch[0]) }; } catch { /* fall through */ }
      }
      // Try extracting JSON object
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try { return { text, json: JSON.parse(objMatch[0]) }; } catch { /* fall through */ }
      }
      throw new Error('Could not parse Gemini response as JSON');
    }
  }

  return { text };
}

/**
 * Generates a full canvas layout as Fabric.js-compatible object configs
 */
export async function generateSmartLayout(prompt: string): Promise<any[]> {
  const systemPrompt = `You are an expert graphic designer. Generate a professional design layout.
Output ONLY a valid JSON array (no markdown, no explanation, just the array).
Each element must be a JSON object with these properties:

For shapes (rect/circle/triangle):
{"type":"rect","left":0,"top":0,"width":1280,"height":720,"fill":"#1a1a2e","opacity":1}

For text:
{"type":"i-text","text":"HELLO","left":100,"top":100,"fontSize":72,"fontFamily":"Impact","fontWeight":"bold","fill":"#ffffff"}

Rules:
- Canvas is 1280x720
- Use hex colors
- Background elements first, text last
- Make it look professional and modern
- Use fonts: Impact, Inter, Arial

Design request: "${prompt}"

Respond with ONLY the JSON array, nothing else.`;

  const result = await geminiRequest(systemPrompt, true);
  return Array.isArray(result.json) ? result.json : [result.json];
}

/**
 * Refines a simple user prompt into a highly descriptive prompt
 */
export async function refineDesignPrompt(prompt: string): Promise<string> {
  const systemPrompt = `Convert this simple design prompt into a highly descriptive, cinematic artistic prompt for an AI image generator. Focus on lighting, style, composition, and mood. Keep it to one paragraph. Only output the refined prompt, nothing else.

Prompt: "${prompt}"`;

  const result = await geminiRequest(systemPrompt);
  return result.text.trim();
}

/**
 * Analyzes the current design and suggests improvements
 */
export async function suggestDesignEdits(prompt: string, currentObjectsCount: number): Promise<string> {
  const systemPrompt = `Analyze this design request and the fact that we have ${currentObjectsCount} objects on canvas.
Provide 3 specific professional design tips to make this design look better (colors, typography, spacing).

User Request: "${prompt}"
Keep it brief and professional.`;

  const result = await geminiRequest(systemPrompt);
  return result.text;
}

/**
 * Generates a SINGLE design element based on the user's description.
 * Returns exactly one Fabric.js-compatible object config.
 */
export async function generateSingleElement(prompt: string, canvasW: number, canvasH: number): Promise<any> {
  const systemPrompt = `You are a design assistant. The user wants to add ONE element to their ${canvasW}x${canvasH} canvas.
Based on their request, output ONLY a single JSON object (not an array) for a Fabric.js object.

Supported types and their required properties:

Rectangle: {"type":"rect","left":100,"top":100,"width":200,"height":150,"fill":"#6366f1","opacity":1,"rx":0,"ry":0}
Circle/Ellipse: {"type":"circle","left":200,"top":200,"width":150,"height":150,"fill":"#ec4899","opacity":1}
Triangle: {"type":"triangle","left":300,"top":200,"width":150,"height":130,"fill":"#f59e0b","opacity":1}
Text: {"type":"i-text","text":"YOUR TEXT","left":100,"top":100,"fontSize":64,"fontFamily":"Impact","fontWeight":"bold","fill":"#ffffff","opacity":1}
Line: {"type":"line","left":50,"top":360,"width":500,"height":0,"stroke":"#ffffff","strokeWidth":3}
Star/Polygon: {"type":"rect","left":200,"top":200,"width":100,"height":100,"fill":"#fbbf24","angle":45,"opacity":1}

Rules:
- Position the element centered or well-placed within the ${canvasW}x${canvasH} canvas
- Use vibrant, modern hex colors
- For text, pick appropriate fonts: Impact for bold/gaming, Inter for clean, Arial for neutral
- Make sizes proportional to the canvas (not too tiny, not overflowing)
- Only output the JSON object, no markdown or explanation

User request: "${prompt}"

Respond with ONLY the JSON object.`;

  const result = await geminiRequest(systemPrompt, true);
  return result.json;
}

/**
 * Generates a high-quality graphic element for the canvas.
 * Strategy: Lexica AI art → Lorem Picsum stock → Gemini SVG rendered to PNG.
 */
export async function generateVectorGraphic(prompt: string): Promise<string> {
  // Step 1: Use Gemini to extract search keywords
  let searchKeywords = prompt;
  try {
    const result = await geminiRequest(
      `Extract 1-2 short English keywords for an image search matching: "${prompt}". 
Output ONLY the keywords, nothing else. Example: "golden trophy" → "trophy gold"`
    );
    searchKeywords = result.text.trim().replace(/[^a-zA-Z0-9 ]/g, '') || prompt;
  } catch {
    searchKeywords = prompt.split(' ').slice(0, 2).join(' ');
  }

  // Step 2: Try Lexica.art (high-quality AI art, CORS-friendly)
  try {
    const lexicaResp = await fetch(`https://lexica.art/api/v1/search?q=${encodeURIComponent(searchKeywords)}`);
    if (lexicaResp.ok) {
      const data = await lexicaResp.json();
      if (data.images && data.images.length > 0) {
        // Pick a random image from top 5 results
        const pick = data.images[Math.floor(Math.random() * Math.min(5, data.images.length))];
        const imgUrl = pick.srcSmall || pick.src;
        const loaded = await loadImageWithTimeout(imgUrl, 8000);
        if (loaded) return loaded;
      }
    }
  } catch { /* continue */ }

  // Step 3: Try Lorem Picsum (always works, CORS-friendly, random photo)
  try {
    const seed = encodeURIComponent(searchKeywords.replace(/\s+/g, '-'));
    const picsumUrl = `https://picsum.photos/seed/${seed}/512/512`;
    const loaded = await loadImageWithTimeout(picsumUrl, 8000);
    if (loaded) return loaded;
  } catch { /* continue */ }

  // Step 4: Gemini SVG → render to PNG (most reliable fallback)
  return await generateSVGasPNG(prompt);
}

function loadImageWithTimeout(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { img.src = ''; reject(new Error('Timeout')); }, timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      if (img.naturalWidth >= 50 && img.naturalHeight >= 50) {
        resolve(url);
      } else {
        reject(new Error('Image too small'));
      }
    };
    img.onerror = () => { clearTimeout(timer); reject(new Error('Load failed')); };
    img.src = url;
  });
}

/**
 * Generates SVG via Gemini, renders it to an offscreen canvas, and returns a PNG data URL.
 * This avoids Fabric.js SVG parsing issues entirely.
 */
async function generateSVGasPNG(prompt: string): Promise<string> {
  const result = await geminiRequest(
    `Create a beautiful SVG graphic for: "${prompt}".
Output ONLY the SVG code, no markdown, no backticks, no explanation.
Requirements:
- Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
- Use linearGradient or radialGradient for rich colors
- Use simple shapes (circle, rect, ellipse, polygon, path)
- Keep under 1200 characters total
- End with </svg>`
  );
  
  const svgMatch = result.text.match(/<svg[\s\S]*<\/svg>/i);
  if (!svgMatch) throw new Error('Could not generate graphic.');
  
  let svg = svgMatch[0]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
  
  // Ensure xmlns is present for proper rendering
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Render SVG to canvas → PNG data URL (avoids Fabric SVG parsing issues)
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 400, 400);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG render failed.'));
    };
    img.src = url;
  });
}
