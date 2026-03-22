// PixelForge Type Definitions

export type ToolName = 
  | 'select' | 'hand' | 'text' | 'rect' | 'circle' 
  | 'triangle' | 'line' | 'draw' | 'eraser' | 'crop' | 'removebg' | 'mask';

export type PanelName = 'properties' | 'layers' | 'templates' | 'filters';

export type ExportFormat = 'png' | 'jpeg' | 'svg';

export type PresetName = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'cold' | 'warm' | 'dramatic' | 'invert';

export interface TemplateSize {
  w: number;
  h: number;
  name: string;
  previewClass: string;
  icon: string;
}

export interface AppState {
  currentTool: ToolName;
  canvasWidth: number;
  canvasHeight: number;
  canvasBgColor: string;
  zoomLevel: number;
  historyStack: string[];
  historyIndex: number;
  isDrawingShape: boolean;
  shapeOrigin: { x: number; y: number } | null;
}

export const TEMPLATE_SIZES: Record<string, TemplateSize> = {
  'yt-thumbnail':   { w: 1280, h: 720,  name: 'YouTube Thumbnail', previewClass: 'yt-preview',     icon: '▶' },
  'album-cover':    { w: 3000, h: 3000, name: 'Album Cover',       previewClass: 'album-preview',  icon: '♫' },
  'ig-post':        { w: 1080, h: 1080, name: 'Instagram Post',    previewClass: 'ig-preview',     icon: '◎' },
  'ig-story':       { w: 1080, h: 1920, name: 'Instagram Story',   previewClass: 'story-preview',  icon: '▯' },
  'poster':         { w: 2480, h: 3508, name: 'Poster',            previewClass: 'poster-preview', icon: '☆' },
  'fb-cover':       { w: 820,  h: 312,  name: 'Facebook Cover',    previewClass: 'fb-preview',     icon: '⬒' },
  'twitter-header': { w: 1500, h: 500,  name: 'Twitter Header',    previewClass: 'twitter-preview',icon: '≡' },
  'business-card':  { w: 1050, h: 600,  name: 'Business Card',     previewClass: 'biz-preview',    icon: '▣' },
};

export const MAX_HISTORY = 50;
