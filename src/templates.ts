// PixelForge — Pre-built Design Templates
// Each template creates actual canvas objects (shapes, text, etc.)

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
    description: 'Bold gaming-style thumbnail',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 720, fill: '#0f0f1a', name: 'Background' }));
      // Diagonal accent
      canvas.add(makeRect({ left: 700, top: 0, width: 600, height: 720, fill: '#ff0844', angle: -10, name: 'Accent Strip' }));
      canvas.add(makeRect({ left: 750, top: 0, width: 200, height: 800, fill: '#ffb199', angle: -10, opacity: 0.4, name: 'Accent Strip 2' }));
      // Title
      canvas.add(makeText('EPIC GAMING\nMOMENT', { left: 80, top: 200, fontFamily: 'Impact', fontSize: 110, fontWeight: '900', fill: '#ffffff', textAlign: 'left', lineHeight: 1.1, shadow: '4px 4px 0px #000000', name: 'Title' }));
      // Subtitle
      canvas.add(makeText('WATCH NOW', { left: 100, top: 550, fontFamily: 'Inter', fontSize: 36, fontWeight: '800', fill: '#ff0844', name: 'Subtitle' }));
      // Border accent
      canvas.add(makeRect({ left: 0, top: 690, width: 1280, height: 30, fill: '#ff0844', name: 'Bottom Bar' }));
    }
  },

  {
    id: 'yt-tutorial',
    name: 'Tutorial Thumbnail',
    category: 'youtube',
    width: 1280, height: 720,
    previewGradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    description: 'Clean tutorial/how-to thumbnail',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 720, fill: '#1a1a2e', name: 'Background' }));
      canvas.add(makeRect({ left: 0, top: 0, width: 1280, height: 720, fill: '#667eea', opacity: 0.15, name: 'Overlay' }));
      // Number badge
      canvas.add(makeEllipse({ left: 60, top: 40, rx: 55, ry: 55, fill: '#667eea', name: 'Badge Circle' }));
      canvas.add(makeText('5', { left: 83, top: 50, fontSize: 72, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', name: 'Badge Number' }));
      // Main title
      canvas.add(makeText('TIPS YOU\nMUST KNOW', { left: 60, top: 200, fontSize: 96, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', lineHeight: 1.1, name: 'Title' }));
      // Accent line
      canvas.add(makeLine([60, 530, 400, 530], { stroke: '#667eea', strokeWidth: 4, name: 'Accent Line' }));
      // Tag
      canvas.add(makeText('BEGINNER FRIENDLY', { left: 60, top: 560, fontSize: 24, fontWeight: '700', fill: '#667eea', fontFamily: 'Inter', name: 'Tag' }));
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
      // Burst shapes
      canvas.add(makeTriangle({ left: 500, top: -80, width: 400, height: 300, fill: '#f7971e', angle: 15, name: 'Burst 1' }));
      canvas.add(makeTriangle({ left: 800, top: 400, width: 500, height: 400, fill: '#ff6b35', angle: -20, opacity: 0.6, name: 'Burst 2' }));
      // Reaction text
      canvas.add(makeText('OMG!', { left: 100, top: 100, fontSize: 200, fontWeight: '900', fill: '#1a1a1a', fontFamily: 'Impact', name: 'Reaction' }));
      canvas.add(makeText('YOU WON\'T BELIEVE THIS', { left: 100, top: 450, fontSize: 48, fontWeight: '800', fill: '#1a1a1a', fontFamily: 'Inter', name: 'Subtitle' }));
      // Comic-style border
      canvas.add(makeRect({ left: 10, top: 10, width: 1260, height: 700, fill: 'transparent', stroke: '#1a1a1a', strokeWidth: 8, rx: 20, ry: 20, name: 'Border' }));
    }
  },

  // ═══ Album Covers ═══

  {
    id: 'album-dark',
    name: 'Dark Album',
    category: 'album',
    width: 3000, height: 3000,
    previewGradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    description: 'Dark moody album cover',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 3000, height: 3000, fill: '#0f0c29', name: 'Background' }));
      // Large accent circle
      canvas.add(makeEllipse({ left: 600, top: 600, rx: 900, ry: 900, fill: 'transparent', stroke: '#302b63', strokeWidth: 3, name: 'Ring 1' }));
      canvas.add(makeEllipse({ left: 700, top: 700, rx: 800, ry: 800, fill: 'transparent', stroke: '#24243e', strokeWidth: 2, name: 'Ring 2' }));
      canvas.add(makeEllipse({ left: 1100, top: 1100, rx: 400, ry: 400, fill: '#302b63', opacity: 0.3, name: 'Center Glow' }));
      // Artist name
      canvas.add(makeText('ARTIST NAME', { left: 1500, top: 600, fontSize: 140, fontWeight: '300', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Artist' }));
      // Album title
      canvas.add(makeText('MIDNIGHT\nECHOES', { left: 1500, top: 1200, fontSize: 260, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1, name: 'Title' }));
      // Divider
      canvas.add(makeLine([900, 1900, 2100, 1900], { stroke: '#ffffff', strokeWidth: 2, opacity: 0.3, name: 'Divider' }));
      // Advisory tag
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
    description: 'Colorful vibrant album cover',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 3000, height: 3000, fill: '#0a0a0f', name: 'Background' }));
      // Gradient shapes
      canvas.add(makeEllipse({ left: -200, top: -200, rx: 1200, ry: 1200, fill: '#a855f7', opacity: 0.4, name: 'Blob 1' }));
      canvas.add(makeEllipse({ left: 1500, top: 1500, rx: 1000, ry: 1000, fill: '#ec4899', opacity: 0.35, name: 'Blob 2' }));
      canvas.add(makeEllipse({ left: 2000, top: 200, rx: 700, ry: 700, fill: '#f43f5e', opacity: 0.25, name: 'Blob 3' }));
      // Title
      canvas.add(makeText('NEON\nDREAMS', { left: 1500, top: 1100, fontSize: 320, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 0.95, name: 'Title' }));
      // Subtitle
      canvas.add(makeText('THE ALBUM', { left: 1500, top: 1850, fontSize: 80, fontWeight: '500', fill: 'rgba(255,255,255,0.6)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Subtitle' }));
    }
  },

  {
    id: 'album-minimal',
    name: 'Minimal Album',
    category: 'album',
    width: 3000, height: 3000,
    previewGradient: 'linear-gradient(180deg, #fafafa, #e5e5e5)',
    description: 'Clean minimal album cover',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 3000, height: 3000, fill: '#fafafa', name: 'Background' }));
      // Single accent element
      canvas.add(makeEllipse({ left: 1100, top: 600, rx: 400, ry: 400, fill: '#1a1a1a', name: 'Main Shape' }));
      // Title
      canvas.add(makeText('silence', { left: 1500, top: 1700, fontSize: 180, fontWeight: '300', fill: '#1a1a1a', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Title' }));
      // Artist
      canvas.add(makeText('ARTIST NAME', { left: 1500, top: 1950, fontSize: 50, fontWeight: '700', fill: '#999999', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 400, name: 'Artist' }));
      // Corner marks
      canvas.add(makeLine([100, 100, 100, 250], { stroke: '#cccccc', strokeWidth: 2, name: 'Corner TL' }));
      canvas.add(makeLine([100, 100, 250, 100], { stroke: '#cccccc', strokeWidth: 2, name: 'Corner TL2' }));
      canvas.add(makeLine([2900, 2900, 2900, 2750], { stroke: '#cccccc', strokeWidth: 2, name: 'Corner BR' }));
      canvas.add(makeLine([2900, 2900, 2750, 2900], { stroke: '#cccccc', strokeWidth: 2, name: 'Corner BR2' }));
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
      canvas.add(makeEllipse({ left: -100, top: -100, rx: 400, ry: 400, fill: '#a855f7', opacity: 0.2, name: 'Gradient Orb' }));
      canvas.add(makeEllipse({ left: 700, top: 700, rx: 350, ry: 350, fill: '#ec4899', opacity: 0.15, name: 'Gradient Orb 2' }));
      // Quote mark
      canvas.add(makeText('"', { left: 80, top: 200, fontSize: 200, fontWeight: '900', fill: '#a855f7', opacity: 0.5, fontFamily: 'Georgia', name: 'Quote Mark' }));
      // Quote text
      canvas.add(makeText('Dream big.\nStart small.\nAct now.', { left: 540, top: 350, fontSize: 72, fontWeight: '700', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1.4, name: 'Quote' }));
      // Author
      canvas.add(makeText('— Unknown', { left: 540, top: 800, fontSize: 28, fontWeight: '500', fill: 'rgba(255,255,255,0.4)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Author' }));
      // Handle
      canvas.add(makeText('@yourhandle', { left: 540, top: 980, fontSize: 22, fontWeight: '600', fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Handle' }));
    }
  },

  {
    id: 'ig-promo',
    name: 'Promo Post',
    category: 'social',
    width: 1080, height: 1080,
    previewGradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    description: 'Product/event promo post',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 1080, fill: '#f59e0b', name: 'Background' }));
      // Main content area
      canvas.add(makeRect({ left: 60, top: 60, width: 960, height: 960, fill: '#1a1a1a', rx: 30, ry: 30, name: 'Content Card' }));
      // Sale badge
      canvas.add(makeEllipse({ left: 600, top: 80, rx: 120, ry: 120, fill: '#ef4444', name: 'Sale Badge' }));
      canvas.add(makeText('50%\nOFF', { left: 680, top: 120, fontSize: 52, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1, name: 'Sale Text' }));
      // Title
      canvas.add(makeText('MEGA\nSALE', { left: 540, top: 350, fontSize: 140, fontWeight: '900', fill: '#f59e0b', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1, name: 'Title' }));
      // Subtitle
      canvas.add(makeText('LIMITED TIME OFFER', { left: 540, top: 700, fontSize: 30, fontWeight: '700', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', letterSpacing: 300, name: 'Subtitle' }));
      // CTA
      canvas.add(makeRect({ left: 300, top: 800, width: 480, height: 70, fill: '#f59e0b', rx: 35, ry: 35, name: 'CTA Button' }));
      canvas.add(makeText('SHOP NOW', { left: 540, top: 812, fontSize: 28, fontWeight: '800', fill: '#1a1a1a', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'CTA Text' }));
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
      canvas.add(makeEllipse({ left: -200, top: 200, rx: 600, ry: 600, fill: '#6366f1', opacity: 0.5, name: 'Orb 1' }));
      canvas.add(makeEllipse({ left: 500, top: 800, rx: 500, ry: 500, fill: '#a855f7', opacity: 0.4, name: 'Orb 2' }));
      canvas.add(makeEllipse({ left: 200, top: 1300, rx: 600, ry: 600, fill: '#ec4899', opacity: 0.3, name: 'Orb 3' }));
      // Text
      canvas.add(makeText('SWIPE UP', { left: 540, top: 800, fontSize: 80, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'CTA' }));
      canvas.add(makeText('for more', { left: 540, top: 910, fontSize: 40, fontWeight: '400', fill: 'rgba(255,255,255,0.6)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Subtitle' }));
      // Arrow
      canvas.add(makeTriangle({ left: 490, top: 1600, width: 100, height: 60, fill: '#ffffff', angle: 180, opacity: 0.5, name: 'Arrow' }));
    }
  },

  // ═══ Posters ═══

  {
    id: 'poster-event',
    name: 'Event Poster',
    category: 'poster',
    width: 2480, height: 3508,
    previewGradient: 'linear-gradient(180deg, #1a1a2e, #16213e, #0f3460)',
    description: 'Concert/event poster',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 2480, height: 3508, fill: '#1a1a2e', name: 'Background' }));
      // Decorative lines
      for (let i = 0; i < 8; i++) {
        canvas.add(makeLine([0, 400 + i * 100, 2480, 400 + i * 100], { stroke: '#0f3460', strokeWidth: 1, opacity: 0.4, name: `Grid Line ${i}` }));
      }
      // Event name
      canvas.add(makeText('SUMMER\nFEST', { left: 1240, top: 800, fontSize: 400, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 0.9, name: 'Event Name' }));
      // Year
      canvas.add(makeText('2026', { left: 1240, top: 1700, fontSize: 200, fontWeight: '300', fill: '#0f3460', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Year' }));
      // Details
      canvas.add(makeLine([500, 2200, 1980, 2200], { stroke: '#ffffff', strokeWidth: 2, opacity: 0.3, name: 'Divider' }));
      canvas.add(makeText('JULY 15 — 17  •  CITY ARENA', { left: 1240, top: 2280, fontSize: 60, fontWeight: '600', fill: 'rgba(255,255,255,0.6)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Details' }));
      // Lineup
      canvas.add(makeText('ARTIST ONE  ·  ARTIST TWO  ·  ARTIST THREE', { left: 1240, top: 2500, fontSize: 45, fontWeight: '500', fill: 'rgba(255,255,255,0.4)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Lineup' }));
      // Tickets
      canvas.add(makeRect({ left: 840, top: 2800, width: 800, height: 120, fill: 'transparent', stroke: '#ffffff', strokeWidth: 3, rx: 60, ry: 60, name: 'Ticket Button' }));
      canvas.add(makeText('GET TICKETS', { left: 1240, top: 2825, fontSize: 50, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Ticket Text' }));
    }
  },

  // ═══ Business ═══

  {
    id: 'biz-card',
    name: 'Modern Business Card',
    category: 'business',
    width: 1050, height: 600,
    previewGradient: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
    description: 'Sleek modern business card',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1050, height: 600, fill: '#0a0a0a', rx: 20, ry: 20, name: 'Card' }));
      // Accent
      canvas.add(makeRect({ left: 0, top: 0, width: 10, height: 600, fill: '#6366f1', name: 'Left Accent' }));
      // Name
      canvas.add(makeText('JOHN DOE', { left: 60, top: 120, fontSize: 50, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', name: 'Name' }));
      // Title
      canvas.add(makeText('Creative Director', { left: 60, top: 190, fontSize: 24, fontWeight: '400', fill: '#6366f1', fontFamily: 'Inter', name: 'Title' }));
      // Contact
      canvas.add(makeText('john@company.com', { left: 60, top: 350, fontSize: 20, fontWeight: '500', fill: 'rgba(255,255,255,0.6)', fontFamily: 'Inter', name: 'Email' }));
      canvas.add(makeText('+1 (555) 123-4567', { left: 60, top: 390, fontSize: 20, fontWeight: '500', fill: 'rgba(255,255,255,0.6)', fontFamily: 'Inter', name: 'Phone' }));
      canvas.add(makeText('www.company.com', { left: 60, top: 430, fontSize: 20, fontWeight: '500', fill: 'rgba(255,255,255,0.6)', fontFamily: 'Inter', name: 'Website' }));
      // Logo placeholder
      canvas.add(makeRect({ left: 800, top: 200, width: 160, height: 160, fill: '#6366f1', rx: 20, ry: 20, name: 'Logo' }));
      canvas.add(makeText('LOGO', { left: 835, top: 255, fontSize: 30, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', name: 'Logo Text' }));
    }
  },

  {
    id: 'biz-flyer',
    name: 'Business Flyer',
    category: 'business',
    width: 1080, height: 1080,
    previewGradient: 'linear-gradient(135deg, #1e3a5f, #4a90d9)',
    description: 'Professional business flyer',
    build: (canvas: Canvas) => {
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 1080, fill: '#ffffff', name: 'Background' }));
      // Header stripe
      canvas.add(makeRect({ left: 0, top: 0, width: 1080, height: 280, fill: '#1e3a5f', name: 'Header' }));
      // Brand text
      canvas.add(makeText('YOUR BRAND', { left: 540, top: 60, fontSize: 70, fontWeight: '900', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Brand' }));
      canvas.add(makeText('Professional Services', { left: 540, top: 160, fontSize: 30, fontWeight: '400', fill: 'rgba(255,255,255,0.7)', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Tagline' }));
      // Service boxes
      const services = ['Strategy', 'Design', 'Marketing'];
      services.forEach((s, i) => {
        const x = 80 + i * 330;
        canvas.add(makeRect({ left: x, top: 340, width: 280, height: 200, fill: '#f5f5f5', rx: 15, ry: 15, name: `Service Box ${i}` }));
        canvas.add(makeText(s, { left: x + 140, top: 420, fontSize: 28, fontWeight: '700', fill: '#1e3a5f', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: `Service ${i}` }));
      });
      // Description
      canvas.add(makeText('We help businesses grow with\nstrategic solutions and creative design.', { left: 540, top: 620, fontSize: 28, fontWeight: '400', fill: '#333333', fontFamily: 'Inter', textAlign: 'center', originX: 'center', lineHeight: 1.5, name: 'Description' }));
      // CTA
      canvas.add(makeRect({ left: 340, top: 830, width: 400, height: 70, fill: '#1e3a5f', rx: 35, ry: 35, name: 'CTA Button' }));
      canvas.add(makeText('CONTACT US', { left: 540, top: 842, fontSize: 26, fontWeight: '800', fill: '#ffffff', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'CTA Text' }));
      // Footer
      canvas.add(makeText('info@yourbrand.com  |  (555) 000-0000', { left: 540, top: 1010, fontSize: 18, fontWeight: '500', fill: '#999999', fontFamily: 'Inter', textAlign: 'center', originX: 'center', name: 'Footer' }));
    }
  },
];

export function getTemplatesByCategory(category: string): DesignTemplate[] {
  return DESIGN_TEMPLATES.filter(t => t.category === category);
}
