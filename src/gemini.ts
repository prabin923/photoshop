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
  if (stored && stored.startsWith('AIza')) {
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
export async function generateSmartLayout(prompt: string, canvasW: number = 1280, canvasH: number = 720): Promise<any[]> {
  const safeLeft = Math.floor(canvasW * 0.9);
  const safeTop = Math.floor(canvasH * 0.9);
  const centerX = Math.floor(canvasW / 2);
  
  const systemPrompt = `You are "nanobanana", an expert image generation software which can create social media posts and YouTube thumbnails with ease. You are creating a stunning, professional design layout.
Output ONLY a valid JSON array (no markdown, no backticks, no explanation).

CANVAS SIZE: ${canvasW} x ${canvasH} pixels.

STRICT POSITIONING RULES (CRITICAL — elements MUST NOT go outside the canvas):
- All "left" values MUST be between 0 and ${safeLeft} (leave space from right edge)
- All "top" values MUST be between 0 and ${safeTop} (leave space from bottom edge)
- For text: left + (text length × fontSize × 0.5) must be < ${canvasW}
- For shapes: left + width must be ≤ ${canvasW}, top + height must be ≤ ${canvasH}
- Center important text horizontally: use left = ${centerX} with originX = "center"
- Keep a safe margin from all edges

ELEMENT TYPES:
Shape: {"type":"rect","left":0,"top":0,"width":${canvasW},"height":${canvasH},"fill":"#1a1a2e","opacity":1,"rx":0,"ry":0}
Circle: {"type":"circle","left":100,"top":100,"width":200,"height":200,"fill":"#6366f1","opacity":0.3}
Text: {"type":"i-text","text":"HELLO","left":${centerX},"top":${Math.floor(canvasH*0.4)},"fontSize":72,"fontFamily":"Impact","fontWeight":"bold","fill":"#ffffff","originX":"center","textAlign":"center"}

DESIGN RULES:
1. ALWAYS start with a full-canvas background rect (left:0, top:0, width:${canvasW}, height:${canvasH})
2. Use dark, rich backgrounds: #0a0a12, #0f0f1a, #1a1a2e, #0c0c1d (NOT white or light colors)
3. Add 2-3 decorative shapes (circles, rects) with low opacity (0.1-0.3) for depth
4. Use a curated color palette — pick 2-3 harmonious accent colors
5. Title text should be large, bold, and use Impact or Inter font
6. Subtitle text should be smaller, lighter weight, and slightly transparent
7. Use shadows on text for glow effects: {"color":"rgba(99,102,241,0.5)","blur":20,"offsetX":0,"offsetY":0}
8. Background elements first, then decorative shapes, then text LAST
9. Keep text short and impactful — use 1-4 words per text element
10. Add accent lines or small shapes for visual interest

EXAMPLE OUTPUT for "gaming thumbnail":
[
  {"type":"rect","left":0,"top":0,"width":${canvasW},"height":${canvasH},"fill":"#0a0a12","opacity":1},
  {"type":"rect","left":Math.floor(${canvasW}*0.5),"top":-50,"width":Math.floor(${canvasW}*0.3),"height":${canvasH + 100},"fill":"#ff0844","opacity":0.9,"angle":-12},
  {"type":"circle","left":100,"top":50,"width":Math.floor(${canvasH}*0.6),"height":Math.floor(${canvasH}*0.6),"fill":"#ff0844","opacity":0.08},
  {"type":"rect","left":0,"top":0,"width":${canvasW},"height":5,"fill":"#ff0844","opacity":1},
  {"type":"i-text","text":"EPIC","left":80,"top":Math.floor(${canvasH}*0.3),"fontSize":Math.floor(${canvasH}*0.15),"fontFamily":"Impact","fontWeight":"bold","fill":"#ffffff","shadow":{"color":"rgba(255,8,68,0.4)","blur":30,"offsetX":0,"offsetY":0}},
  {"type":"i-text","text":"GAMING","left":80,"top":Math.floor(${canvasH}*0.45),"fontSize":Math.floor(${canvasH}*0.15),"fontFamily":"Impact","fontWeight":"bold","fill":"#ff0844"},
  {"type":"i-text","text":"▶ WATCH NOW","left":80,"top":Math.floor(${canvasH}*0.75),"fontSize":Math.floor(${canvasH}*0.04),"fontFamily":"Inter","fontWeight":"800","fill":"#ffffff","opacity":0.8},
  {"type":"rect","left":0,"top":Math.floor(${canvasH}-25),"width":${canvasW},"height":25,"fill":"#ff0844","opacity":1}
]

Design request: "${prompt}"

Respond with ONLY the JSON array.`;

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
  const systemPrompt = `You are "nanobanana", an expert image generation software. The user wants to add ONE element to their ${canvasW}x${canvasH} canvas.
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
 * Strategy: Uses Gemini to map the prompt to a specific Iconify SVG icon and color.
 */
export async function generateVectorGraphic(prompt: string): Promise<string> {
  // Step 1: Use Gemini to pick the best icon and color
  let iconName = 'mdi:star';
  let iconColor = 'currentColor';

  try {
    const systemPrompt = `You are "nanobanana", a strict graphic design API and image generation software. The user wants to add an icon graphic: "${prompt}".
Find the single most appropriate SVG icon from standard icon sets (mdi, ph, tabler, fluent, lucide).
Also choose a fitting vibrant hex color for it.

Output MUST be a JSON object with EXACTLY two keys:
{"icon": "collection:name", "color": "#hexcode"}

Examples:
"golden trophy" -> {"icon": "mdi:trophy", "color": "#fbbf24"}
"fire flame" -> {"icon": "ph:fire-fill", "color": "#ef4444"}
"cute monster" -> {"icon": "mdi:space-invaders", "color": "#8b5cf6"}
"blue heart" -> {"icon": "mdi:heart", "color": "#3b82f6"}

Output ONLY the JSON object, absolutely NO markdown or backticks.`;

    const result = await geminiRequest(systemPrompt, true);
    if (result.json && result.json.icon) {
      iconName = result.json.icon;
      iconColor = result.json.color || '#6366f1';
    }
  } catch (err) {
    console.warn('Gemini icon selection failed, falling back to keywords.', err);
    iconName = 'radix-icons:image';
    iconColor = '#6366f1';
  }

  // Step 2: Fetch the actual raw SVG code from Iconify API
  try {
    const [prefix, name] = iconName.split(':');
    const svgResp = await fetch(`https://api.iconify.design/${prefix}/${name}.svg?color=${encodeURIComponent(iconColor)}&width=200&height=200`);
    
    if (svgResp.ok) {
      let svgText = await svgResp.text();
      // Ensure it renders well
      if (!svgText.includes('xmlns=')) {
        svgText = svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      // Convert SVG to PNG via blob to avoid Fabric's path parsing issues
      return new Promise((resolve, reject) => {
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, 200, 200);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('SVG icon render failed'));
        };
        img.src = url;
      });
    }
  } catch (err) {
    console.error('Failed to fetch icon from Iconify', err);
  }

  // Step 3: Fallback if everything else fails
  return await generateSVGasPNG(prompt);
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
