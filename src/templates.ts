// PixelForge — Premium Design Templates
// Each template creates actual canvas objects with rich, layered compositions

import { Canvas, Rect, Ellipse, IText, Line, Triangle } from 'fabric';

export interface DesignTemplate {
  id: string;
  name: string;
  category: 'youtube' | 'album' | 'social' | 'poster' | 'business';
  width: number;
  height: number;
  previewGradient: string;
  description: string;
  build: (canvas: Canvas) => void;
}

// ── Helpers ──
function makeRect(opts: Record<string, any>): Rect {
  const r = new Rect(opts);
  if (opts.name) (r as any).name = opts.name;
  return r;
}
function makeText(text: string, opts: Record<string, any>): IText {
  const t = new IText(text, opts);
  if (opts.name) (t as any).name = opts.name;
  return t;
}
function makeEllipse(opts: Record<string, any>): Ellipse {
  const e = new Ellipse(opts);
  if (opts.name) (e as any).name = opts.name;
  return e;
}
function makeLine(pts: [number, number, number, number], opts: Record<string, any>): Line {
  const l = new Line(pts, opts);
  if (opts.name) (l as any).name = opts.name;
  return l;
}
function makeTriangle(opts: Record<string, any>): Triangle {
  const t = new Triangle(opts);
  if (opts.name) (t as any).name = opts.name;
  return t;
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [

  // ═══ YouTube Thumbnails ═══

  {
    id: 'yt-gaming',
    name: 'Gaming Thumbnail',
    category: 'youtube',
    width: 1280, height: 720,
    previewGradient: 'linear-gradient(135deg, #ff0844, #ffb199)',
    description: 'Bold gaming-style thumbnail with dynamic slashes',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 720, fill: '#0a0a12', name: 'Background' }));
      // Dramatic diagonal slashes
      canvas.add(makeRect({ left: 650, top: -80, width: 300, height: 900, fill: '#ff0844', angle: -15, name: 'Slash 1' }));
      canvas.add(makeRect({ left: 780, top: -80, width: 120, height: 900, fill: '#ff3366', angle: -15, opacity: 0.6, name: 'Slash 2' }));
      canvas.add(makeRect({ left: 900, top: -80, width: 60, height: 900, fill: '#ff6699', angle: -15, opacity: 0.3, name: 'Slash 3' }));
      // Glow orb
      canvas.add(makeEllipse({ left: 500, top: 100, rx: 250, ry: 250, fill: '#ff0844', opacity: 0.08, name: 'Glow' }));
      // Top bar
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 6, fill: '#ff0844', name: 'Top Accent' }));
      // Title block
      canvas.add(makeText('EPIC GAMING', { left: 70, top: 180, fontFamily: 'Impact', fontSize: 120, fontWeight: '900', fill: '#ffffff', textAlign: 'left', lineHeight: 1, shadow: '0 4px 30px rgba(255,8,68,0.5)', name: 'Title Line 1' }));
      canvas.add(makeText('MOMENT', { left: 70, top: 310, fontFamily: 'Impact', fontSize: 120, fontWeight: '900', fill: '#ff0844', textAlign: 'left', lineHeight: 1, name: 'Title Line 2' }));
      // Subtitle pill
      canvas.add(makeRect({ left: 70, top: 480, width: 250, height: 48, fill: '#ff0844', rx: 24, ry: 24, name: 'CTA BG' }));
      canvas.add(makeText('▶  WATCH NOW', { left: 110, top: 490, fontFamily: 'Inter', fontSize: 20, fontWeight: '800', fill: '#ffffff', name: 'CTA' }));
      // Bottom gradient bar
      canvas.add(makeRect({ left: 0, top: 690, width: 1280, height: 30, fill: '#ff0844', name: 'Bottom Bar' }));
      canvas.add(makeRect({ left: 0, top: 695, width: 640, height: 25, fill: '#ffb199', opacity: 0.5, name: 'Bottom Accent' }));
    }
  },

  {
    id: 'yt-tutorial',
    name: 'Tutorial Thumbnail',
    category: 'youtube',
    width: 1280, height: 720,
    previewGradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    description: 'Clean tutorial/how-to thumbnail with number badge',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 720, fill: '#0f0f1e', name: 'Background' }));
      // Subtle grid pattern
      for (let i = 0; i < 13; i++) {
        canvas.add(makeLine([i * 100, 0, i * 100, 720], { stroke: '#667eea', strokeWidth: 1, opacity: 0.04, name: `VGrid ${i}` }));
      }
      for (let i = 0; i < 8; i++) {
        canvas.add(makeLine([0, i * 100, 1280, i * 100], { stroke: '#667eea', strokeWidth: 1, opacity: 0.04, name: `HGrid ${i}` }));
      }
      // Glow orbs
      canvas.add(makeEllipse({ left: -100, top: -100, rx: 300, ry: 300, fill: '#667eea', opacity: 0.1, name: 'Glow TL' }));
      canvas.add(makeEllipse({ left: 900, top: 400, rx: 250, ry: 250, fill: '#764ba2', opacity: 0.08, name: 'Glow BR' }));
      // Number badge
      canvas.add(makeEllipse({ left: 50, top: 30, rx: 50, ry: 50, fill: '#667eea', shadow: '0 4px 20px rgba(102,126,234,0.5)', name: 'Badge' }));
      canvas.add(makeText('5', { left: 77, top: 38, fontSize: 64, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', name: 'Badge Number' }));
      // Title
      canvas.add(makeText('TIPS YOU', { left: 55, top: 200, fontSize: 100, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', lineHeight: 1, name: 'Title 1' }));
      canvas.add(makeText('MUST KNOW', { left: 55, top: 305, fontSize: 100, fontWeight: '900', fill: '#667eea', fontFamily: 'Inter', lineHeight: 1, name: 'Title 2' }));
      // Accent line
      canvas.add(makeLine([55, 440, 350, 440], { stroke: '#667eea', strokeWidth: 4, name: 'Accent Line' }));
      // Tag
      canvas.add(makeRect({ left: 55, top: 470, width: 220, height: 36, fill: 'transparent', stroke: '#667eea', strokeWidth: 2, rx: 18, ry: 18, name: 'Tag BG' }));
      canvas.add(makeText('BEGINNER FRIENDLY', { left: 85, top: 477, fontSize: 15, fontWeight: '800', fill: '#667eea', fontFamily: 'Inter', name: 'Tag' }));
    }
  },

  {
    id: 'yt-reaction',
    name: 'Reaction Thumbnail',
    category: 'youtube',
    width: 1280, height: 720,
    previewGradient: 'linear-gradient(135deg, #f7971e, #ffd200)',
    description: 'Energetic reaction/vlog thumbnail',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 720, fill: '#ffd200', name: 'Background' }));
      // Energy burst shapes
      canvas.add(makeTriangle({ left: 400, top: -100, width: 500, height: 350, fill: '#f7971e', angle: 12, name: 'Burst 1' }));
      canvas.add(makeTriangle({ left: 750, top: 350, width: 600, height: 500, fill: '#ff6b35', angle: -18, opacity: 0.5, name: 'Burst 2' }));
      canvas.add(makeTriangle({ left: -50, top: 400, width: 400, height: 300, fill: '#ff9500', angle: 25, opacity: 0.4, name: 'Burst 3' }));
      // Comic border
      canvas.add(makeRect({ left: 15, top: 15, width: 1250, height: 690, fill: 'transparent', stroke: '#1a1a1a', strokeWidth: 8, rx: 20, ry: 20, name: 'Border' }));
      // Reaction text with shadow
      canvas.add(makeText('OMG!', { left: 80, top: 80, fontSize: 220, fontWeight: '900', fill: '#1a1a1a', fontFamily: 'Impact', shadow: '6px 6px 0px rgba(0,0,0,0.15)', name: 'Reaction' }));
      canvas.add(makeText("YOU WON'T BELIEVE THIS", { left: 80, top: 420, fontSize: 50, fontWeight: '800', fill: '#1a1a1a', fontFamily: 'Inter', name: 'Subtitle' }));
      // Emoji-like circle
      canvas.add(makeEllipse({ left: 950, top: 350, rx: 90, ry: 90, fill: '#ff4444', opacity: 0.9, name: 'Emoji BG' }));
      canvas.add(makeText('🔥', { left: 985, top: 380, fontSize: 80, name: 'Emoji' }));
    }
  },

  {
    id: 'yt-cinematic',
    name: 'Cinematic Thumbnail',
    category: 'youtube',
    width: 1280, height: 720,
    previewGradient: 'linear-gradient(135deg, #0c0c1d, #1a237e, #00bcd4)',
    description: 'Cinematic movie-style thumbnail with dramatic lighting',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 720, fill: '#0c0c1d', name: 'Background' }));
      // Cinematic light beams
      canvas.add(makeTriangle({ left: 300, top: -200, width: 800, height: 600, fill: '#1a237e', opacity: 0.3, angle: 5, name: 'Light Beam' }));
      canvas.add(makeEllipse({ left: 400, top: 150, rx: 350, ry: 200, fill: '#00bcd4', opacity: 0.06, name: 'Ambient Light' }));
      // Letterbox bars
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 60, fill: '#000000', name: 'Letterbox Top' }));
      canvas.add(makeRect({ left: 0, top: 660, width: 1280, height: 60, fill: '#000000', name: 'Letterbox Bottom' }));
      // Title
      canvas.add(makeText('THE UNTOLD', { left: 640, top: 220, fontSize: 90, fontWeight: '300', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 800, opacity: 0.7, name: 'Title Pre' }));
      canvas.add(makeText('STORY', { left: 640, top: 320, fontSize: 140, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', shadow: '0 0 60px rgba(0,188,212,0.4)', name: 'Title' }));
      // Bottom info
      canvas.add(makeText('COMING SOON  •  2026', { left: 640, top: 520, fontSize: 18, fontWeight: '600', fill: '#00bcd4', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 400, name: 'Info' }));
    }
  },

  // ═══ Album Covers ═══

  {
    id: 'album-dark',
    name: 'Dark Album',
    category: 'album',
    width: 3000, height: 3000,
    previewGradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    description: 'Dark moody album cover with concentric rings',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 3000, height: 3000, fill: '#0f0c29', name: 'Background' }));
      // Concentric rings
      for (let i = 5; i >= 1; i--) {
        canvas.add(makeEllipse({ left: 1500 - i * 200, top: 1500 - i * 200, rx: i * 200, ry: i * 200, fill: 'transparent', stroke: '#302b63', strokeWidth: 1 + (6 - i), opacity: 0.15 + i * 0.05, name: `Ring ${i}` }));
      }
      // Center glow
      canvas.add(makeEllipse({ left: 1100, top: 1100, rx: 400, ry: 400, fill: '#302b63', opacity: 0.25, name: 'Center Glow' }));
      canvas.add(makeEllipse({ left: 1250, top: 1250, rx: 250, ry: 250, fill: '#6366f1', opacity: 0.08, name: 'Inner Glow' }));
      // Artist name
      canvas.add(makeText('ARTIST NAME', { left: 1500, top: 550, fontSize: 100, fontWeight: '300', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 600, opacity: 0.6, name: 'Artist' }));
      // Album title
      canvas.add(makeText('MIDNIGHT', { left: 1500, top: 1200, fontSize: 280, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1, name: 'Title 1' }));
      canvas.add(makeText('ECHOES', { left: 1500, top: 1480, fontSize: 280, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1, opacity: 0.4, name: 'Title 2' }));
      // Divider
      canvas.add(makeLine([1000, 1850, 2000, 1850], { stroke: '#ffffff', strokeWidth: 2, opacity: 0.2, name: 'Divider' }));
      // Advisory
      canvas.add(makeRect({ left: 130, top: 2700, width: 350, height: 120, fill: 'transparent', stroke: '#ffffff', strokeWidth: 2, name: 'Advisory Box' }));
      canvas.add(makeText('EXPLICIT', { left: 190, top: 2730, fontSize: 48, fontWeight: '700', fill: '#ffffff', fontFamily: 'Inter', name: 'Advisory' }));
    }
  },

  {
    id: 'album-vibrant',
    name: 'Vibrant Album',
    category: 'album',
    width: 3000, height: 3000,
    previewGradient: 'linear-gradient(135deg, #a855f7, #ec4899, #f43f5e)',
    description: 'Colorful vibrant album cover with gradient blobs',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 3000, height: 3000, fill: '#0a0a0f', name: 'Background' }));
      // Gradient blobs
      canvas.add(makeEllipse({ left: -300, top: -300, rx: 1200, ry: 1200, fill: '#a855f7', opacity: 0.35, name: 'Blob 1' }));
      canvas.add(makeEllipse({ left: 1600, top: 1400, rx: 1000, ry: 1000, fill: '#ec4899', opacity: 0.3, name: 'Blob 2' }));
      canvas.add(makeEllipse({ left: 2000, top: 100, rx: 700, ry: 700, fill: '#f43f5e', opacity: 0.2, name: 'Blob 3' }));
      canvas.add(makeEllipse({ left: 500, top: 2000, rx: 600, ry: 600, fill: '#6366f1', opacity: 0.15, name: 'Blob 4' }));
      // Noise texture dots
      for (let i = 0; i < 30; i++) {
        canvas.add(makeEllipse({ left: Math.random() * 2800, top: Math.random() * 2800, rx: 3 + Math.random() * 8, ry: 3 + Math.random() * 8, fill: '#ffffff', opacity: 0.05 + Math.random() * 0.1, name: `Dot ${i}` }));
      }
      // Title
      canvas.add(makeText('NEON', { left: 1500, top: 1050, fontSize: 360, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 0.95, shadow: '0 0 80px rgba(168,85,247,0.5)', name: 'Title 1' }));
      canvas.add(makeText('DREAMS', { left: 1500, top: 1380, fontSize: 360, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 0.95, opacity: 0.7, name: 'Title 2' }));
      // Subtitle
      canvas.add(makeText('THE ALBUM', { left: 1500, top: 1820, fontSize: 70, fontWeight: '500', fill: 'rgba(255,255,255,0.4)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 500, name: 'Subtitle' }));
    }
  },

  {
    id: 'album-minimal',
    name: 'Minimal Album',
    category: 'album',
    width: 3000, height: 3000,
    previewGradient: 'linear-gradient(180deg, #fafafa, #e5e5e5)',
    description: 'Clean minimal album cover with elegant typography',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 3000, height: 3000, fill: '#fafafa', name: 'Background' }));
      // Single bold circle
      canvas.add(makeEllipse({ left: 1100, top: 500, rx: 400, ry: 400, fill: '#1a1a1a', name: 'Main Shape' }));
      // Thin ring
      canvas.add(makeEllipse({ left: 1050, top: 450, rx: 450, ry: 450, fill: 'transparent', stroke: '#e0e0e0', strokeWidth: 2, name: 'Ring' }));
      // Title
      canvas.add(makeText('silence', { left: 1500, top: 1650, fontSize: 200, fontWeight: '200', fill: '#1a1a1a', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Title' }));
      // Artist
      canvas.add(makeText('ARTIST NAME', { left: 1500, top: 1920, fontSize: 50, fontWeight: '700', fill: '#999999', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 500, name: 'Artist' }));
      // Corner marks
      canvas.add(makeLine([100, 100, 100, 280], { stroke: '#cccccc', strokeWidth: 2, name: 'Corner TL V' }));
      canvas.add(makeLine([100, 100, 280, 100], { stroke: '#cccccc', strokeWidth: 2, name: 'Corner TL H' }));
      canvas.add(makeLine([2900, 2900, 2900, 2720], { stroke: '#cccccc', strokeWidth: 2, name: 'Corner BR V' }));
      canvas.add(makeLine([2900, 2900, 2720, 2900], { stroke: '#cccccc', strokeWidth: 2, name: 'Corner BR H' }));
    }
  },

  // ═══ Social Media ═══

  {
    id: 'ig-quote',
    name: 'Quote Post',
    category: 'social',
    width: 1080, height: 1080,
    previewGradient: 'linear-gradient(135deg, #f43f5e, #ec4899, #a855f7)',
    description: 'Instagram quote/motivational post',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 1080, fill: '#0f0f1a', name: 'Background' }));
      canvas.add(makeEllipse({ left: -150, top: -150, rx: 400, ry: 400, fill: '#a855f7', opacity: 0.15, name: 'Orb 1' }));
      canvas.add(makeEllipse({ left: 650, top: 650, rx: 400, ry: 400, fill: '#ec4899', opacity: 0.12, name: 'Orb 2' }));
      // Quote mark
      canvas.add(makeText('"', { left: 70, top: 180, fontSize: 240, fontWeight: '900', fill: '#a855f7', opacity: 0.3, fontFamily: 'Georgia', name: 'Quote Mark' }));
      // Quote text
      canvas.add(makeText('Dream big.\nStart small.\nAct now.', { left: 540, top: 330, fontSize: 76, fontWeight: '700', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1.5, name: 'Quote' }));
      // Author line
      canvas.add(makeLine([390, 770, 690, 770], { stroke: '#a855f7', strokeWidth: 2, opacity: 0.5, name: 'Author Line' }));
      canvas.add(makeText('— Unknown', { left: 540, top: 800, fontSize: 28, fontWeight: '500', fill: 'rgba(255,255,255,0.35)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Author' }));
      // Handle
      canvas.add(makeText('@yourhandle', { left: 540, top: 980, fontSize: 22, fontWeight: '600', fill: 'rgba(255,255,255,0.2)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Handle' }));
    }
  },

  {
    id: 'ig-promo',
    name: 'Promo Post',
    category: 'social',
    width: 1080, height: 1080,
    previewGradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    description: 'Product/event promo post with sale badge',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 1080, fill: '#f59e0b', name: 'Background' }));
      canvas.add(makeRect({ left: 50, top: 50, width: 980, height: 980, fill: '#1a1a1a', rx: 30, ry: 30, name: 'Card' }));
      // Sale badge
      canvas.add(makeEllipse({ left: 620, top: 70, rx: 110, ry: 110, fill: '#ef4444', shadow: '0 4px 20px rgba(239,68,68,0.4)', name: 'Sale Badge' }));
      canvas.add(makeText('50%', { left: 695, top: 105, fontSize: 56, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Sale Pct' }));
      canvas.add(makeText('OFF', { left: 695, top: 165, fontSize: 32, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Sale Off' }));
      // Title
      canvas.add(makeText('MEGA', { left: 540, top: 320, fontSize: 150, fontWeight: '900', fill: '#f59e0b', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Title 1' }));
      canvas.add(makeText('SALE', { left: 540, top: 470, fontSize: 150, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Title 2' }));
      // Subtitle
      canvas.add(makeText('LIMITED TIME OFFER', { left: 540, top: 680, fontSize: 24, fontWeight: '700', fill: 'rgba(255,255,255,0.5)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 400, name: 'Subtitle' }));
      // CTA button
      canvas.add(makeRect({ left: 290, top: 790, width: 500, height: 70, fill: '#f59e0b', rx: 35, ry: 35, name: 'CTA BG' }));
      canvas.add(makeText('SHOP NOW →', { left: 540, top: 802, fontSize: 26, fontWeight: '800', fill: '#1a1a1a', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'CTA' }));
    }
  },

  {
    id: 'story-gradient',
    name: 'Gradient Story',
    category: 'social',
    width: 1080, height: 1920,
    previewGradient: 'linear-gradient(180deg, #6366f1, #a855f7, #ec4899)',
    description: 'Beautiful gradient Instagram story',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 1920, fill: '#0a0a0f', name: 'Background' }));
      canvas.add(makeEllipse({ left: -250, top: 150, rx: 650, ry: 650, fill: '#6366f1', opacity: 0.45, name: 'Orb 1' }));
      canvas.add(makeEllipse({ left: 450, top: 750, rx: 500, ry: 500, fill: '#a855f7', opacity: 0.35, name: 'Orb 2' }));
      canvas.add(makeEllipse({ left: 150, top: 1250, rx: 650, ry: 650, fill: '#ec4899', opacity: 0.25, name: 'Orb 3' }));
      // Text
      canvas.add(makeText('SWIPE UP', { left: 540, top: 800, fontSize: 80, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'CTA' }));
      canvas.add(makeText('for more', { left: 540, top: 910, fontSize: 40, fontWeight: '400', fill: 'rgba(255,255,255,0.5)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Sub' }));
      // Arrow
      canvas.add(makeTriangle({ left: 490, top: 1600, width: 100, height: 60, fill: '#ffffff', angle: 180, opacity: 0.4, name: 'Arrow' }));
    }
  },

  {
    id: 'ig-aesthetic',
    name: 'Aesthetic Post',
    category: 'social',
    width: 1080, height: 1080,
    previewGradient: 'linear-gradient(135deg, #1a1a2e, #e94560, #0f3460)',
    description: 'Aesthetic dark post with neon accent',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 1080, fill: '#0a0a14', name: 'Background' }));
      // Neon accent lines
      canvas.add(makeRect({ left: 100, top: 100, width: 880, height: 880, fill: 'transparent', stroke: '#e94560', strokeWidth: 2, opacity: 0.4, name: 'Outer Frame' }));
      canvas.add(makeRect({ left: 130, top: 130, width: 820, height: 820, fill: 'transparent', stroke: '#e94560', strokeWidth: 1, opacity: 0.15, name: 'Inner Frame' }));
      // Glow
      canvas.add(makeEllipse({ left: 300, top: 300, rx: 250, ry: 250, fill: '#e94560', opacity: 0.06, name: 'Glow' }));
      // Text content
      canvas.add(makeText('CREATE', { left: 540, top: 350, fontSize: 110, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Title 1' }));
      canvas.add(makeText('YOUR', { left: 540, top: 460, fontSize: 110, fontWeight: '900', fill: '#e94560', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Title 2' }));
      canvas.add(makeText('LEGACY', { left: 540, top: 570, fontSize: 110, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Title 3' }));
      // Small detail
      canvas.add(makeText('2026 COLLECTION', { left: 540, top: 760, fontSize: 18, fontWeight: '700', fill: 'rgba(233,69,96,0.6)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 600, name: 'Detail' }));
    }
  },

  // ═══ Posters ═══

  {
    id: 'poster-event',
    name: 'Event Poster',
    category: 'poster',
    width: 2480, height: 3508,
    previewGradient: 'linear-gradient(180deg, #1a1a2e, #16213e, #0f3460)',
    description: 'Concert/event poster with grid lines',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 2480, height: 3508, fill: '#0c0c1e', name: 'Background' }));
      // Decorative grid
      for (let i = 0; i < 10; i++) {
        canvas.add(makeLine([0, 350 + i * 90, 2480, 350 + i * 90], { stroke: '#1a237e', strokeWidth: 1, opacity: 0.25, name: `Grid ${i}` }));
      }
      // Glow
      canvas.add(makeEllipse({ left: 700, top: 600, rx: 600, ry: 600, fill: '#0f3460', opacity: 0.15, name: 'Glow' }));
      // Event name
      canvas.add(makeText('SUMMER', { left: 1240, top: 750, fontSize: 420, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 0.9, name: 'Title 1' }));
      canvas.add(makeText('FEST', { left: 1240, top: 1150, fontSize: 420, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 0.9, opacity: 0.3, name: 'Title 2' }));
      // Year
      canvas.add(makeText('2026', { left: 1240, top: 1700, fontSize: 180, fontWeight: '200', fill: '#0f3460', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 800, name: 'Year' }));
      // Divider
      canvas.add(makeLine([500, 2100, 1980, 2100], { stroke: '#ffffff', strokeWidth: 2, opacity: 0.2, name: 'Divider' }));
      // Details
      canvas.add(makeText('JULY 15 — 17  •  CITY ARENA', { left: 1240, top: 2180, fontSize: 55, fontWeight: '600', fill: 'rgba(255,255,255,0.5)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Details' }));
      // Lineup
      canvas.add(makeText('ARTIST ONE  ·  ARTIST TWO  ·  ARTIST THREE', { left: 1240, top: 2400, fontSize: 42, fontWeight: '500', fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Lineup' }));
      // CTA
      canvas.add(makeRect({ left: 840, top: 2700, width: 800, height: 120, fill: 'transparent', stroke: '#ffffff', strokeWidth: 3, rx: 60, ry: 60, name: 'CTA BG' }));
      canvas.add(makeText('GET TICKETS', { left: 1240, top: 2725, fontSize: 48, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'CTA' }));
    }
  },

  // ═══ Business ═══

  {
    id: 'biz-card',
    name: 'Modern Business Card',
    category: 'business',
    width: 1050, height: 600,
    previewGradient: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
    description: 'Sleek dark business card with accent stripe',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1050, height: 600, fill: '#0a0a0a', rx: 20, ry: 20, name: 'Card' }));
      canvas.add(makeRect({ left: 0, top: 0, width: 8, height: 600, fill: '#6366f1', name: 'Accent' }));
      // Name
      canvas.add(makeText('JOHN DOE', { left: 55, top: 120, fontSize: 48, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', name: 'Name' }));
      canvas.add(makeText('Creative Director', { left: 55, top: 185, fontSize: 22, fontWeight: '400', fill: '#6366f1', fontFamily: 'Inter', name: 'Title' }));
      // Contact
      canvas.add(makeText('john@company.com', { left: 55, top: 340, fontSize: 18, fontWeight: '500', fill: 'rgba(255,255,255,0.5)', fontFamily: 'Inter', name: 'Email' }));
      canvas.add(makeText('+1 (555) 123-4567', { left: 55, top: 380, fontSize: 18, fontWeight: '500', fill: 'rgba(255,255,255,0.5)', fontFamily: 'Inter', name: 'Phone' }));
      canvas.add(makeText('www.company.com', { left: 55, top: 420, fontSize: 18, fontWeight: '500', fill: 'rgba(255,255,255,0.5)', fontFamily: 'Inter', name: 'Web' }));
      // Logo area
      canvas.add(makeRect({ left: 800, top: 200, width: 160, height: 160, fill: '#6366f1', rx: 20, ry: 20, name: 'Logo BG' }));
      canvas.add(makeText('LOGO', { left: 835, top: 255, fontSize: 30, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', name: 'Logo' }));
    }
  },

  {
    id: 'biz-flyer',
    name: 'Business Flyer',
    category: 'business',
    width: 1080, height: 1080,
    previewGradient: 'linear-gradient(135deg, #1e3a5f, #4a90d9)',
    description: 'Professional business flyer with service boxes',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 1080, fill: '#ffffff', name: 'Background' }));
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 300, fill: '#1e3a5f', name: 'Header' }));
      // Subtle pattern in header
      canvas.add(makeEllipse({ left: 800, top: -50, rx: 200, ry: 200, fill: '#2a4f7a', opacity: 0.3, name: 'Header Orb' }));
      // Brand
      canvas.add(makeText('YOUR BRAND', { left: 540, top: 70, fontSize: 65, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Brand' }));
      canvas.add(makeText('Professional Services', { left: 540, top: 165, fontSize: 26, fontWeight: '400', fill: 'rgba(255,255,255,0.6)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Tagline' }));
      // Service boxes
      const services = ['Strategy', 'Design', 'Marketing'];
      services.forEach((s, i) => {
        const x = 75 + i * 330;
        canvas.add(makeRect({ left: x, top: 350, width: 280, height: 200, fill: '#f5f5f5', rx: 15, ry: 15, name: `Box ${i}` }));
        canvas.add(makeRect({ left: x, top: 350, width: 280, height: 5, fill: '#1e3a5f', rx: 3, ry: 3, name: `Box Accent ${i}` }));
        canvas.add(makeText(s, { left: x + 140, top: 430, fontSize: 26, fontWeight: '700', fill: '#1e3a5f', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: `Service ${i}` }));
      });
      // Description
      canvas.add(makeText('We help businesses grow with\nstrategic solutions and creative design.', { left: 540, top: 640, fontSize: 26, fontWeight: '400', fill: '#444444', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1.6, name: 'Description' }));
      // CTA
      canvas.add(makeRect({ left: 340, top: 830, width: 400, height: 65, fill: '#1e3a5f', rx: 33, ry: 33, name: 'CTA BG' }));
      canvas.add(makeText('CONTACT US', { left: 540, top: 843, fontSize: 22, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'CTA' }));
      // Footer
      canvas.add(makeText('info@yourbrand.com  |  (555) 000-0000', { left: 540, top: 1010, fontSize: 16, fontWeight: '500', fill: '#aaaaaa', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Footer' }));
    }
  },
];

export function getTemplatesByCategory(category: string): DesignTemplate[] {
  return DESIGN_TEMPLATES.filter(t => t.category === category);
}
