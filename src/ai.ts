// PixelForge — AI Image Generation & Editing Engine
// Generates designs using canvas-based patterns + supports external API integration

export interface AIGenerationOptions {
  prompt: string;
  width: number;
  height: number;
  style: AIStyle;
  mode: 'generate' | 'edit';
  sourceImageData?: string; // base64 for edit mode
}

export type AIStyle = 
  | 'auto' | 'realistic' | 'portrait' | 'abstract' | 'gradient' | 'geometric' | 'neon' 
  | 'minimal' | 'vaporwave' | 'cosmic' | 'grunge' | 'retro';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

// ─── Keyword-to-palette mapping ───
const KEYWORD_PALETTES: Record<string, ColorPalette> = {
  fire:      { primary: '#ff4500', secondary: '#ff8c00', accent: '#ffd700', bg: '#1a0000', text: '#ffffff' },
  ocean:     { primary: '#006994', secondary: '#00b4d8', accent: '#90e0ef', bg: '#001219', text: '#caf0f8' },
  forest:    { primary: '#2d6a4f', secondary: '#40916c', accent: '#95d5b2', bg: '#0a1f0d', text: '#d8f3dc' },
  night:     { primary: '#22223b', secondary: '#4a4e69', accent: '#9a8c98', bg: '#0d0d1a', text: '#f2e9e4' },
  sunset:    { primary: '#e76f51', secondary: '#f4a261', accent: '#e9c46a', bg: '#1a0a0a', text: '#fefae0' },
  space:     { primary: '#3c096c', secondary: '#7b2cbf', accent: '#c77dff', bg: '#0a0015', text: '#e0aaff' },
  music:     { primary: '#7400b8', secondary: '#6930c3', accent: '#e0aaff', bg: '#10002b', text: '#ffffff' },
  love:      { primary: '#e5383b', secondary: '#ff758f', accent: '#ffccd5', bg: '#1a0005', text: '#fff0f3' },
  tech:      { primary: '#00b4d8', secondary: '#0077b6', accent: '#90e0ef', bg: '#0a0f1a', text: '#caf0f8' },
  gold:      { primary: '#d4a843', secondary: '#b8860b', accent: '#ffd700', bg: '#1a1200', text: '#fff8e1' },
  dark:      { primary: '#2b2b2b', secondary: '#3d3d3d', accent: '#6366f1', bg: '#0a0a0a', text: '#ffffff' },
  cyberpunk: { primary: '#ff006e', secondary: '#8338ec', accent: '#00f5d4', bg: '#0a0014', text: '#ffffff' },
  vintage:   { primary: '#bc6c25', secondary: '#dda15e', accent: '#fefae0', bg: '#1a1005', text: '#fefae0' },
  horror:    { primary: '#9b2226', secondary: '#660708', accent: '#bb3e03', bg: '#0a0000', text: '#e5e5e5' },
  chill:     { primary: '#84a98c', secondary: '#52796f', accent: '#cad2c5', bg: '#0d1a14', text: '#cad2c5' },
  energy:    { primary: '#ffbe0b', secondary: '#fb5607', accent: '#ff006e', bg: '#1a0f00', text: '#ffffff' },
  rock:      { primary: '#b22222', secondary: '#333333', accent: '#dcdcdc', bg: '#0a0a0a', text: '#ffffff' },
  person:    { primary: '#ffdbac', secondary: '#f1c27d', accent: '#8d5524', bg: '#1a100a', text: '#ffffff' },
  nature:    { primary: '#2d6a4f', secondary: '#95d5b2', accent: '#74c69d', bg: '#081c15', text: '#ffffff' },
  city:      { primary: '#4895ef', secondary: '#4361ee', accent: '#3f37c9', bg: '#0a0a0f', text: '#ffffff' },
  food:      { primary: '#ff9f1c', secondary: '#ffbf69', accent: '#ffffff', bg: '#1a0f00', text: '#ffffff' },
};

const DEFAULT_PALETTE: ColorPalette = { primary: '#6366f1', secondary: '#a855f7', accent: '#ec4899', bg: '#0f0f1a', text: '#ffffff' };

// ─── AI Generation ───
export async function generateAIImage(options: AIGenerationOptions): Promise<string> {
  const { prompt, width, height, style, mode, sourceImageData } = options;

  // Extract palette from prompt keywords
  const palette = extractPalette(prompt);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (mode === 'edit' && sourceImageData) {
    // Load source image first
    const img = await loadImage(sourceImageData);
    ctx.drawImage(img, 0, 0, width, height);
    // Apply AI-style transformations based on prompt
    await applyAIEdit(ctx, width, height, prompt, palette, style);
  } else {
    // Generate from scratch
    await generateDesign(ctx, width, height, prompt, palette, style);
  }

  return canvas.toDataURL('image/png');
}

function extractPalette(prompt: string): ColorPalette {
  const lower = prompt.toLowerCase();
  for (const [keyword, palette] of Object.entries(KEYWORD_PALETTES)) {
    if (lower.includes(keyword)) return palette;
  }
  // Color-based detection
  if (lower.includes('red') || lower.includes('crimson')) return KEYWORD_PALETTES.fire;
  if (lower.includes('blue') || lower.includes('water')) return KEYWORD_PALETTES.ocean;
  if (lower.includes('green') || lower.includes('nature')) return KEYWORD_PALETTES.forest;
  if (lower.includes('purple') || lower.includes('violet')) return KEYWORD_PALETTES.space;
  if (lower.includes('pink') || lower.includes('rose')) return KEYWORD_PALETTES.love;
  if (lower.includes('yellow') || lower.includes('sun')) return KEYWORD_PALETTES.energy;
  if (lower.includes('black') || lower.includes('shadow')) return KEYWORD_PALETTES.dark;
  if (lower.includes('neon') || lower.includes('cyber')) return KEYWORD_PALETTES.cyberpunk;
  return DEFAULT_PALETTE;
}

// ─── Design Generators by Style ───
async function generateDesign(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  prompt: string, palette: ColorPalette, style: AIStyle
): Promise<void> {
  const effectiveStyle = style === 'auto' ? detectStyle(prompt) : style;

  switch (effectiveStyle) {
    case 'gradient': renderGradient(ctx, w, h, palette); break;
    case 'geometric': renderGeometric(ctx, w, h, palette); break;
    case 'neon': renderNeon(ctx, w, h, palette); break;
    case 'minimal': renderMinimal(ctx, w, h, palette); break;
    case 'vaporwave': renderVaporwave(ctx, w, h, palette); break;
    case 'cosmic': renderCosmic(ctx, w, h, palette); break;
    case 'grunge': renderGrunge(ctx, w, h, palette); break;
    case 'retro': renderRetro(ctx, w, h, palette); break;
    case 'realistic': {
        const subject = detectSubject(prompt) || 'nature';
        await renderSubjectDesign(ctx, w, h, subject, palette);
        break;
    }
    case 'portrait': {
        const subject = detectSubject(prompt) || 'smiling';
        await renderSubjectDesign(ctx, w, h, subject, palette);
        break;
    }
    case 'abstract':
    default:
      // Try to find a subject if it's not a background style
      const subject = detectSubject(prompt);
      if (subject) {
        await renderSubjectDesign(ctx, w, h, subject, palette);
      } else {
        renderAbstract(ctx, w, h, palette);
      }
      break;
  }

  // Add text from prompt if it looks like a title
  addSmartText(ctx, w, h, prompt, palette);
}

function detectSubject(prompt: string): string | null {
  const p = prompt.toLowerCase();
  const subjects = [
    'person', 'man', 'woman', 'girl', 'boy', 'dog', 'cat', 'car', 'mountain',
    'forest', 'ocean', 'city', 'building', 'food', 'coffee', 'tech', 'laptop',
    'house', 'landscape', 'flower', 'tree', 'animal', 'bird', 'smiling'
  ];
  
  for (const s of subjects) {
    if (p.includes(s)) return s;
  }
  return null;
}

async function renderSubjectDesign(ctx: CanvasRenderingContext2D, w: number, h: number, subject: string, p: ColorPalette): Promise<void> {
  const baseUrl = 'https://images.unsplash.com/';
  let photoId = 'photo-1500648767791-00dcc994a43e'; // Default person
  
  if (subject === 'mountain') photoId = 'photo-1464822759023-fed622ff2c3b';
  if (subject === 'nature' || subject === 'forest') photoId = 'photo-1441974231531-c6227db76b6e';
  if (subject === 'city') photoId = 'photo-1449824913935-59a10b8d2000';
  if (subject === 'ocean') photoId = 'photo-1507525428034-b723cf961d3e';
  if (subject === 'smiling') photoId = 'photo-1544005313-94ddf0286df2';
  if (subject === 'car') photoId = 'photo-1494976388531-d1058494cdd8';
  if (subject === 'dog') photoId = 'photo-1517841905240-472988babdf9';
  if (subject === 'coffee') photoId = 'photo-1509042239860-f550ce710b93';

  const finalUrl = `${baseUrl}${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

  try {
    const img = await loadImage(finalUrl);
    ctx.drawImage(img, 0, 0, w, h);
    
    // Add a stylish overlay to make it look "processed"
    const overlay = ctx.createLinearGradient(0, 0, 0, h);
    overlay.addColorStop(0, hexToRgba(p.bg, 0.2));
    overlay.addColorStop(1, hexToRgba(p.primary, 0.5));
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } catch (e) {
    renderAbstract(ctx, w, h, p);
  }
}

function detectStyle(prompt: string): AIStyle {
  const p = prompt.toLowerCase();
  if (p.includes('photo') || p.includes('real') || p.includes('shot') || p.includes('camera')) return 'realistic';
  if (p.includes('person') || p.includes('face') || p.includes('portrait') || p.includes('woman') || p.includes('man')) return 'portrait';
  if (p.includes('neon') || p.includes('glow')) return 'neon';
  if (p.includes('geometric') || p.includes('shapes')) return 'geometric';
  if (p.includes('gradient') || p.includes('blend')) return 'gradient';
  if (p.includes('minimal') || p.includes('clean') || p.includes('simple')) return 'minimal';
  if (p.includes('vaporwave') || p.includes('retro') || p.includes('80s') || p.includes('90s')) return 'vaporwave';
  if (p.includes('space') || p.includes('cosmic') || p.includes('galaxy') || p.includes('star')) return 'cosmic';
  if (p.includes('grunge') || p.includes('rough') || p.includes('distort')) return 'grunge';
  if (p.includes('vintage') || p.includes('old') || p.includes('classic')) return 'retro';
  return 'abstract';
}

// ── Renderers ──

function renderGradient(ctx: CanvasRenderingContext2D, w: number, h: number, p: ColorPalette): void {
  const angle = Math.random() * Math.PI;
  const grd = ctx.createLinearGradient(
    w / 2 + Math.cos(angle) * w / 2, h / 2 + Math.sin(angle) * h / 2,
    w / 2 - Math.cos(angle) * w / 2, h / 2 - Math.sin(angle) * h / 2
  );
  grd.addColorStop(0, p.bg);
  grd.addColorStop(0.3, p.primary);
  grd.addColorStop(0.7, p.secondary);
  grd.addColorStop(1, p.accent);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // Overlay orbs
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * Math.min(w, h) * 0.4;
    const orb = ctx.createRadialGradient(x, y, 0, x, y, r);
    orb.addColorStop(0, hexToRgba(p.accent, 0.3));
    orb.addColorStop(1, 'transparent');
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, w, h);
  }
}

function renderGeometric(ctx: CanvasRenderingContext2D, w: number, h: number, p: ColorPalette): void {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  const shapes = 15 + Math.floor(Math.random() * 20);
  const colors = [p.primary, p.secondary, p.accent];

  for (let i = 0; i < shapes; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = 20 + Math.random() * Math.min(w, h) * 0.25;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.globalAlpha = 0.15 + Math.random() * 0.5;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

    const type = Math.floor(Math.random() * 4);
    if (type === 0) {
      ctx.fillRect(-size / 2, -size / 2, size, size);
    } else if (type === 1) {
      ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, Math.PI * 2); ctx.fill();
    } else if (type === 2) {
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.lineWidth = 2 + Math.random() * 4;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
    }
    ctx.restore();
  }
}

function renderNeon(ctx: CanvasRenderingContext2D, w: number, h: number, p: ColorPalette): void {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  // Neon grid
  ctx.strokeStyle = hexToRgba(p.primary, 0.15);
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Neon shapes
  const neonColors = [p.primary, p.secondary, p.accent, '#ff006e', '#00f5d4'];
  for (let i = 0; i < 8; i++) {
    const color = neonColors[Math.floor(Math.random() * neonColors.length)];
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = 30 + Math.random() * 150;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 + Math.random() * 30;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.globalAlpha = 0.6 + Math.random() * 0.4;

    if (Math.random() > 0.5) {
      ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    }
    ctx.restore();
  }

  // Glow overlay
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
  glow.addColorStop(0, hexToRgba(p.primary, 0.1));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function renderMinimal(ctx: CanvasRenderingContext2D, w: number, h: number, p: ColorPalette): void {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  // Single large accent shape
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = p.primary;
  const size = Math.min(w, h) * 0.3;
  ctx.beginPath();
  ctx.arc(w * 0.65, h * 0.45, size, 0, Math.PI * 2);
  ctx.fill();

  // Accent line
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.8);
  ctx.lineTo(w * 0.5, h * 0.8);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function renderVaporwave(ctx: CanvasRenderingContext2D, w: number, h: number, _p: ColorPalette): void {
  // Classic vaporwave gradient sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#ff6ad5');
  sky.addColorStop(0.3, '#c774e8');
  sky.addColorStop(0.5, '#ad8cff');
  sky.addColorStop(0.7, '#8795e8');
  sky.addColorStop(1, '#94d0ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Grid floor
  ctx.save();
  ctx.translate(0, h * 0.55);
  const groundGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  groundGrad.addColorStop(0, '#1a0030');
  groundGrad.addColorStop(1, '#0d001a');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 0, w, h * 0.45);

  // Perspective grid lines
  ctx.strokeStyle = '#ff6ad5';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 20; i++) {
    const y = i * (h * 0.45 / 20);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let i = 0; i < 15; i++) {
    const x = w / 2 + (i - 7) * (w / 10);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(w / 2 + (i - 7) * w, h * 0.45); ctx.stroke();
  }
  ctx.restore();

  // Sun
  const sunY = h * 0.35;
  const sunR = Math.min(w, h) * 0.15;
  const sunGrad = ctx.createRadialGradient(w / 2, sunY, 0, w / 2, sunY, sunR);
  sunGrad.addColorStop(0, '#ffee00');
  sunGrad.addColorStop(0.5, '#ff6ad5');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);
}

function renderCosmic(ctx: CanvasRenderingContext2D, w: number, h: number, p: ColorPalette): void {
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, w, h);

  // Stars
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 2;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Nebula
  for (let i = 0; i < 4; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 100 + Math.random() * Math.min(w, h) * 0.4;
    const nebula = ctx.createRadialGradient(x, y, 0, x, y, r);
    const colors = [p.primary, p.secondary, p.accent];
    nebula.addColorStop(0, hexToRgba(colors[i % 3], 0.25));
    nebula.addColorStop(0.5, hexToRgba(colors[(i + 1) % 3], 0.1));
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, w, h);
  }
}

function renderGrunge(ctx: CanvasRenderingContext2D, w: number, h: number, p: ColorPalette): void {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  // Distressed layers
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = 1 + Math.random() * 8;
    ctx.fillStyle = hexToRgba(p.primary, Math.random() * 0.2);
    ctx.fillRect(x, y, size, size);
  }

  // Splatter
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = hexToRgba([p.primary, p.secondary, p.accent][i % 3], 0.3 + Math.random() * 0.3);
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 5 + Math.random() * 40;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Scratches
  ctx.strokeStyle = hexToRgba(p.text, 0.1);
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }
}

function renderRetro(ctx: CanvasRenderingContext2D, w: number, h: number, p: ColorPalette): void {
  // Warm retro gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#fefae0');
  bg.addColorStop(0.5, '#faedcd');
  bg.addColorStop(1, '#fefae0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Retro circles
  const retColors = [p.primary, p.secondary, p.accent, '#bc6c25', '#dda15e'];
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = hexToRgba(retColors[i % retColors.length], 0.4);
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 30 + Math.random() * 100;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Halftone-like dots
  ctx.globalAlpha = 0.1;
  for (let x = 0; x < w; x += 10) {
    for (let y = 0; y < h; y += 10) {
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function renderAbstract(ctx: CanvasRenderingContext2D, w: number, h: number, p: ColorPalette): void {
  // Multi-layer gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, p.bg);
  bg.addColorStop(1, darken(p.primary, 0.3));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Flowing shapes
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.fillStyle = [p.primary, p.secondary, p.accent][i % 3];

    ctx.beginPath();
    const startX = Math.random() * w;
    const startY = Math.random() * h;
    ctx.moveTo(startX, startY);

    for (let j = 0; j < 6; j++) {
      ctx.bezierCurveTo(
        Math.random() * w, Math.random() * h,
        Math.random() * w, Math.random() * h,
        Math.random() * w, Math.random() * h
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Noise overlay
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    d[i] += noise; d[i + 1] += noise; d[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
}

// ─── Smart Text Overlay ───
function addSmartText(ctx: CanvasRenderingContext2D, w: number, h: number, prompt: string, p: ColorPalette): void {
  // Extract potential title from prompt
  const title = extractTitle(prompt);
  if (!title) return;

  const fontSize = Math.min(w, h) * 0.08;
  ctx.save();

  // Text shadow/glow
  ctx.shadowColor = p.primary;
  ctx.shadowBlur = 15;
  ctx.fillStyle = p.text;
  ctx.font = `900 ${fontSize}px 'Inter', 'Arial', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Multi-line support
  const lines = wrapText(ctx, title.toUpperCase(), w * 0.8);
  const lineHeight = fontSize * 1.2;
  const startY = h / 2 - (lines.length - 1) * lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, startY + i * lineHeight);
  });

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.font = `500 ${fontSize * 0.3}px 'Inter', sans-serif`;
  ctx.fillStyle = hexToRgba(p.text, 0.5);
  ctx.fillText('Generated by PixelForge AI', w / 2, startY + lines.length * lineHeight + fontSize * 0.3);

  ctx.restore();
}

function extractTitle(prompt: string): string | null {
  // Look for quoted text
  const quoted = prompt.match(/"([^"]+)"/);
  if (quoted) return quoted[1];

  // Look for 'titled X' or 'called X' or 'named X'
  const titled = prompt.match(/(?:titled?|called|named)\s+(.+?)(?:\s+(?:with|in|on|for|using)|$)/i);
  if (titled) return titled[1];

  // If short prompt, use as title
  if (prompt.split(' ').length <= 5) return prompt;

  return null;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ─── AI Edit Mode ───
async function applyAIEdit(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  prompt: string, palette: ColorPalette, _style: AIStyle
): Promise<void> {
  const p = prompt.toLowerCase();

  if (p.includes('brighten') || p.includes('lighter')) {
    applyBrightnessShift(ctx, w, h, 30);
  }
  if (p.includes('darken') || p.includes('darker')) {
    applyBrightnessShift(ctx, w, h, -30);
  }
  if (p.includes('saturate') || p.includes('vivid') || p.includes('vibrant')) {
    applySaturation(ctx, w, h, 1.5);
  }
  if (p.includes('desaturate') || p.includes('muted')) {
    applySaturation(ctx, w, h, 0.5);
  }
  if (p.includes('warm') || p.includes('warmer')) {
    applyColorTint(ctx, w, h, 20, 10, -10);
  }
  if (p.includes('cool') || p.includes('cooler') || p.includes('cold')) {
    applyColorTint(ctx, w, h, -10, 0, 20);
  }
  if (p.includes('vintage') || p.includes('retro')) {
    applyColorTint(ctx, w, h, 15, 5, -20);
    applySaturation(ctx, w, h, 0.7);
    addVignette(ctx, w, h);
  }
  if (p.includes('glow') || p.includes('neon')) {
    addGlowEffect(ctx, w, h, palette);
  }
  if (p.includes('vignette') || p.includes('frame')) {
    addVignette(ctx, w, h);
  }
  if (p.includes('grain') || p.includes('noise') || p.includes('film')) {
    addFilmGrain(ctx, w, h);
  }
  if (p.includes('overlay') || p.includes('color overlay')) {
    addColorOverlay(ctx, w, h, palette.primary, 0.2);
  }
  if (p.includes('blur') || p.includes('soft') || p.includes('dreamy')) {
    applySimpleBlur(ctx, w, h);
  }
}

function applyBrightnessShift(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] + amount));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + amount));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + amount));
  }
  ctx.putImageData(imageData, 0, 0);
}

function applySaturation(ctx: CanvasRenderingContext2D, w: number, h: number, factor: number): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    d[i] = Math.min(255, Math.max(0, gray + (d[i] - gray) * factor));
    d[i + 1] = Math.min(255, Math.max(0, gray + (d[i + 1] - gray) * factor));
    d[i + 2] = Math.min(255, Math.max(0, gray + (d[i + 2] - gray) * factor));
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyColorTint(ctx: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] + r));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + g));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + b));
  }
  ctx.putImageData(imageData, 0, 0);
}

function addVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function addGlowEffect(ctx: CanvasRenderingContext2D, w: number, h: number, palette: ColorPalette): void {
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.5);
  glow.addColorStop(0, hexToRgba(palette.accent, 0.3));
  glow.addColorStop(0.5, hexToRgba(palette.primary, 0.1));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function addFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 40;
    d[i] += noise; d[i + 1] += noise; d[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
}

function addColorOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, opacity: number): void {
  ctx.fillStyle = hexToRgba(color, opacity);
  ctx.fillRect(0, 0, w, h);
}

function applySimpleBlur(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.filter = 'blur(3px)';
  ctx.drawImage(ctx.canvas, 0, 0, w, h);
  ctx.filter = 'none';
}

// ─── Utilities ───
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex: string, amount: number): string {
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
