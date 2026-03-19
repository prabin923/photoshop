// PixelForge — Core Canvas Editor Engine (TypeScript)
// Built for Fabric.js v7 API

import {
  Canvas, Rect, Ellipse, Triangle, Line, IText, FabricImage,
  PencilBrush, Pattern, FabricObject, ActiveSelection,
} from 'fabric';
import * as fabricFilters from 'fabric';
import type { ToolName, PresetName } from './types';
import { TEMPLATE_SIZES, MAX_HISTORY } from './types';
import { generateAIImage } from './ai';
import type { AIStyle } from './ai';
import { DESIGN_TEMPLATES } from './templates';

// ─── Utility ───
function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}
function $input(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}
function $select(id: string): HTMLSelectElement {
  return document.getElementById(id) as HTMLSelectElement;
}

// ─── Toast ───
let toastTimer: ReturnType<typeof setTimeout>;
function showToast(msg: string): void {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ─── State ───
let canvas: Canvas;
let currentTool: ToolName = 'select';
let canvasWidth = 1280;
let canvasHeight = 720;
let canvasBgColor = '#ffffff';
let zoomLevel = 1;
let historyStack: string[] = [];
let historyIndex = -1;
let isDrawingShape = false;
let shapeOrigin: { x: number; y: number } | null = null;
let tempShape: FabricObject | null = null;

// ─── Canvas ───
function createCanvas(w: number, h: number, bg: string): void {
  canvasWidth = w;
  canvasHeight = h;
  canvasBgColor = bg;

  if (canvas) canvas.dispose();

  const el = $('design-canvas') as HTMLCanvasElement;
  el.width = w;
  el.height = h;

  canvas = new Canvas('design-canvas', {
    width: w,
    height: h,
    backgroundColor: bg === 'transparent' ? undefined : bg,
    preserveObjectStacking: true,
    selection: true,
    controlsAboveOverlay: true,
  });

  if (bg === 'transparent') setTransparentBg();

  // Custom control styling — highly visible selection
  FabricObject.ownDefaults.transparentCorners = false;
  FabricObject.ownDefaults.cornerColor = '#6366f1';
  FabricObject.ownDefaults.cornerStrokeColor = '#ffffff';
  FabricObject.ownDefaults.borderColor = '#6366f1';
  FabricObject.ownDefaults.cornerSize = 14;
  FabricObject.ownDefaults.cornerStyle = 'circle';
  FabricObject.ownDefaults.padding = 6;
  FabricObject.ownDefaults.borderScaleFactor = 2.5;
  FabricObject.ownDefaults.borderDashArray = [6, 3];
  FabricObject.ownDefaults.borderOpacityWhenMoving = 0.6;

  // Active selection (multi-select) styling
  (canvas as any).selectionColor = 'rgba(99,102,241,0.12)';
  (canvas as any).selectionBorderColor = '#6366f1';
  (canvas as any).selectionLineWidth = 2;
  (canvas as any).selectionDashArray = [5, 5];

  canvas.renderAll();
  fitCanvasToView();
  historyStack = [];
  historyIndex = -1;
  saveHistory();
  updateLayers();
}

function setTransparentBg(): void {
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 20;
  patternCanvas.height = 20;
  const ctx = patternCanvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 20, 20);
  ctx.fillStyle = '#e5e5e5';
  ctx.fillRect(0, 0, 10, 10);
  ctx.fillRect(10, 10, 10, 10);
  const pattern = new Pattern({ source: patternCanvas, repeat: 'repeat' });
  canvas.set('backgroundColor', pattern as any);
  canvas.renderAll();
}

// ─── Zoom ───
function fitCanvasToView(): void {
  const area = $('canvas-area');
  const scaleX = (area.clientWidth - 60) / canvasWidth;
  const scaleY = (area.clientHeight - 60) / canvasHeight;
  zoomLevel = Math.min(scaleX, scaleY, 1);
  applyZoom();
}

function applyZoom(): void {
  const wrapper = $('canvas-wrapper');
  wrapper.style.transform = `scale(${zoomLevel})`;
  wrapper.style.transformOrigin = 'center center';
  $('zoomLevel').textContent = Math.round(zoomLevel * 100) + '%';
}

// ─── History ───
function saveHistory(): void {
  const json = JSON.stringify(canvas.toJSON());
  if (historyIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, historyIndex + 1);
  }
  historyStack.push(json);
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
  historyIndex = historyStack.length - 1;
}

function undo(): void {
  if (historyIndex <= 0) return;
  historyIndex--;
  canvas.loadFromJSON(historyStack[historyIndex]).then(() => {
    canvas.renderAll();
    updateLayers();
    updateProperties();
  });
}

function redo(): void {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex++;
  canvas.loadFromJSON(historyStack[historyIndex]).then(() => {
    canvas.renderAll();
    updateLayers();
    updateProperties();
  });
}

// ─── Tool System ───
function setTool(tool: ToolName): void {
  currentTool = tool;
  document.querySelectorAll<HTMLElement>('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });

  canvas.isDrawingMode = false;
  canvas.selection = true;
  canvas.defaultCursor = 'default';
  canvas.hoverCursor = 'move';

  switch (tool) {
    case 'select':
      canvas.forEachObject((o: FabricObject) => { o.selectable = true; o.evented = true; });
      break;
    case 'hand':
      canvas.defaultCursor = 'grab';
      canvas.hoverCursor = 'grab';
      canvas.selection = false;
      canvas.forEachObject((o: FabricObject) => { o.selectable = false; o.evented = false; });
      break;
    case 'draw':
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = $input('fillColor').value;
      canvas.freeDrawingBrush.width = 3;
      break;
    case 'eraser':
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = canvasBgColor === 'transparent' ? 'rgba(0,0,0,0)' : canvasBgColor;
      canvas.freeDrawingBrush.width = 20;
      break;
    case 'text':
    case 'rect':
    case 'circle':
    case 'triangle':
    case 'line':
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      canvas.selection = false;
      break;
    case 'removebg':
      removeBackground();
      setTool('select');
      break;
    default: break;
  }
}

// ─── Canvas Events ───
function bindCanvasEvents(): void {
  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:up', onMouseUp);
  canvas.on('selection:created', () => updateProperties());
  canvas.on('selection:updated', () => updateProperties());
  canvas.on('selection:cleared', () => clearProperties());
  canvas.on('object:modified', () => { saveHistory(); updateProperties(); updateLayers(); });
  canvas.on('object:added', () => updateLayers());
  canvas.on('object:removed', () => updateLayers());
}

function onMouseDown(opt: any): void {
  const e = opt.e as MouseEvent;
  const pointer = canvas.getScenePoint(e);

  const fill = $input('fillColor').value;
  const stroke = $input('strokeColor').value;

  if (['rect', 'circle', 'triangle', 'line'].includes(currentTool)) {
    isDrawingShape = true;
    shapeOrigin = { x: pointer.x, y: pointer.y };

    if (currentTool === 'rect') {
      tempShape = new Rect({ left: pointer.x, top: pointer.y, width: 0, height: 0, fill, stroke, strokeWidth: 1 });
      (tempShape as any).name = 'Rectangle';
    } else if (currentTool === 'circle') {
      tempShape = new Ellipse({ left: pointer.x, top: pointer.y, rx: 0, ry: 0, fill, stroke, strokeWidth: 1 });
      (tempShape as any).name = 'Ellipse';
    } else if (currentTool === 'triangle') {
      tempShape = new Triangle({ left: pointer.x, top: pointer.y, width: 0, height: 0, fill, stroke, strokeWidth: 1 });
      (tempShape as any).name = 'Triangle';
    } else if (currentTool === 'line') {
      tempShape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], { stroke, strokeWidth: 2 });
      (tempShape as any).name = 'Line';
    }

    if (tempShape) {
      canvas.add(tempShape);
      canvas.renderAll();
    }
  }

  if (currentTool === 'text') {
    const text = new IText('Your Text', {
      left: pointer.x, top: pointer.y, fontFamily: 'Inter',
      fontSize: 42, fontWeight: 'bold', fill,
    });
    (text as any).name = 'Text';
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    saveHistory();
    setTool('select');
  }
}

function onMouseMove(opt: any): void {
  if (!isDrawingShape || !tempShape || !shapeOrigin) return;
  const e = opt.e as MouseEvent;
  const pointer = canvas.getScenePoint(e);

  if (currentTool === 'rect' || currentTool === 'triangle') {
    tempShape.set({
      left: Math.min(pointer.x, shapeOrigin.x),
      top: Math.min(pointer.y, shapeOrigin.y),
      width: Math.abs(pointer.x - shapeOrigin.x),
      height: Math.abs(pointer.y - shapeOrigin.y),
    });
  } else if (currentTool === 'circle') {
    (tempShape as Ellipse).set({
      left: Math.min(pointer.x, shapeOrigin.x),
      top: Math.min(pointer.y, shapeOrigin.y),
      rx: Math.abs(pointer.x - shapeOrigin.x) / 2,
      ry: Math.abs(pointer.y - shapeOrigin.y) / 2,
    });
  } else if (currentTool === 'line') {
    (tempShape as Line).set({ x2: pointer.x, y2: pointer.y });
  }
  canvas.renderAll();
}

function onMouseUp(): void {
  if (isDrawingShape && tempShape) {
    isDrawingShape = false;
    const bounds = tempShape.getBoundingRect();
    if (bounds.width < 3 && bounds.height < 3) {
      canvas.remove(tempShape);
    } else {
      canvas.setActiveObject(tempShape);
    }
    tempShape = null;
    saveHistory();
  }

  if (canvas.isDrawingMode) {
    const objects = canvas.getObjects();
    const lastObj = objects[objects.length - 1];
    if (lastObj && lastObj.type === 'path' && !(lastObj as any).name) {
      (lastObj as any).name = 'Brush Stroke';
      saveHistory();
    }
  }
}

// ─── Background Removal ───
function removeBackground(): void {
  const activeObj = canvas.getActiveObject();
  if (!activeObj || activeObj.type !== 'image') {
    showToast('Please select an image first to remove its background.');
    return;
  }

  $('processingOverlay').classList.remove('hidden');
  setTimeout(() => {
    try {
      const imgEl = (activeObj as FabricImage).getElement() as HTMLImageElement;
      const tc = document.createElement('canvas');
      const ctx = tc.getContext('2d')!;
      tc.width = imgEl.naturalWidth || imgEl.width;
      tc.height = imgEl.naturalHeight || imgEl.height;
      ctx.drawImage(imgEl, 0, 0);

      const imageData = ctx.getImageData(0, 0, tc.width, tc.height);
      const d = imageData.data;

      const px = (x: number, y: number) => {
        const i = (y * tc.width + x) * 4;
        return { r: d[i], g: d[i + 1], b: d[i + 2] };
      };
      const corners = [px(0, 0), px(tc.width - 1, 0), px(0, tc.height - 1), px(tc.width - 1, tc.height - 1)];
      const bgColor = {
        r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
        g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
        b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
      };

      const threshold = 55;
      for (let i = 0; i < d.length; i += 4) {
        const diff = Math.abs(d[i] - bgColor.r) + Math.abs(d[i + 1] - bgColor.g) + Math.abs(d[i + 2] - bgColor.b);
        if (diff < threshold) d[i + 3] = 0;
        else if (diff < threshold + 30) d[i + 3] = Math.round(((diff - threshold) / 30) * 255);
      }

      ctx.putImageData(imageData, 0, 0);
      const newImg = new Image();
      newImg.onload = () => {
        const fabricImg = new FabricImage(newImg, {
          left: activeObj.left, top: activeObj.top,
          scaleX: activeObj.scaleX, scaleY: activeObj.scaleY,
          angle: activeObj.angle,
        });
        (fabricImg as any).name = ((activeObj as any).name || 'Image') + ' (BG Removed)';
        canvas.remove(activeObj);
        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.renderAll();
        saveHistory();
        $('processingOverlay').classList.add('hidden');
        showToast('Background removed!');
      };
      newImg.src = tc.toDataURL();
    } catch {
      $('processingOverlay').classList.add('hidden');
      showToast('Failed to remove background.');
    }
  }, 100);
}

// ─── Properties Panel ───
function updateProperties(): void {
  const obj = canvas.getActiveObject();
  if (!obj) { clearProperties(); return; }

  $('noSelectionHint').style.display = 'none';
  $('objectProperties').style.display = 'block';

  $input('propX').value = String(Math.round(obj.left || 0));
  $input('propY').value = String(Math.round(obj.top || 0));
  $input('propW').value = String(Math.round(obj.getScaledWidth()));
  $input('propH').value = String(Math.round(obj.getScaledHeight()));
  $input('propAngle').value = String(Math.round(obj.angle || 0));
  $input('propOpacity').value = String(obj.opacity ?? 1);

  if (typeof obj.fill === 'string') $input('propFill').value = obj.fill;
  if (obj.stroke && typeof obj.stroke === 'string') $input('propStroke').value = obj.stroke;
  $input('propStrokeWidth').value = String(obj.strokeWidth || 0);
  $input('propCornerRadius').value = String((obj as any).rx || 0);

  const isText = ['i-text', 'text', 'textbox'].includes(obj.type!);
  $('textPropsTitle').style.display = isText ? 'block' : 'none';
  $('textProps').style.display = isText ? 'grid' : 'none';

  if (isText) {
    const t = obj as IText;
    $select('propFontFamily').value = t.fontFamily || 'Inter';
    $input('propFontSize').value = String(t.fontSize || 32);
    $select('propFontWeight').value = String(t.fontWeight || 'normal');
  }
  updateLayers();
}

function clearProperties(): void {
  $('noSelectionHint').style.display = 'block';
  $('objectProperties').style.display = 'none';
}

// ─── Layers ───
function updateLayers(): void {
  if (!canvas) return;
  const list = $('layersList');
  list.innerHTML = '';
  const objects = canvas.getObjects();
  const activeObj = canvas.getActiveObject();

  [...objects].reverse().forEach((obj: FabricObject) => {
    const item = document.createElement('div');
    item.className = 'layer-item' + (obj === activeObj ? ' active' : '');

    let icon = '◻';
    const t = obj.type;
    if (t === 'i-text' || t === 'text' || t === 'textbox') icon = 'T';
    else if (t === 'rect') icon = '▬';
    else if (t === 'circle' || t === 'ellipse') icon = '●';
    else if (t === 'triangle') icon = '▲';
    else if (t === 'line') icon = '╱';
    else if (t === 'image') icon = '🖼';
    else if (t === 'path') icon = '✎';

    const name = (obj as any).name || obj.type || 'Object';
    item.innerHTML = `
      <span class="layer-icon">${icon}</span>
      <span class="layer-name">${name}</span>
      <button class="layer-vis ${obj.visible === false ? 'off' : ''}" title="Toggle">${obj.visible !== false ? '👁' : '👁‍🗨'}</button>
    `;
    item.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.layer-vis')) {
        obj.set('visible', !obj.visible); canvas.renderAll(); updateLayers(); return;
      }
      canvas.setActiveObject(obj); canvas.renderAll(); updateProperties();
    });
    list.appendChild(item);
  });
}

// ─── Filters ───
function applyFilters(): void {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') { showToast('Select an image to apply filters.'); return; }

  const img = obj as FabricImage;
  const f: any[] = [];
  const { filters: F } = fabricFilters;

  const b = parseFloat($input('filterBrightness').value);
  if (b !== 0) f.push(new F.Brightness({ brightness: b }));
  const c = parseFloat($input('filterContrast').value);
  if (c !== 0) f.push(new F.Contrast({ contrast: c }));
  const s = parseFloat($input('filterSaturation').value);
  if (s !== 0) f.push(new F.Saturation({ saturation: s }));
  const bl = parseFloat($input('filterBlur').value);
  if (bl > 0) f.push(new F.Blur({ blur: bl }));
  const h = parseFloat($input('filterHue').value);
  if (h !== 0) f.push(new F.HueRotation({ rotation: h }));
  const n = parseInt($input('filterNoise').value);
  if (n > 0) f.push(new F.Noise({ noise: n }));
  const p = parseInt($input('filterPixelate').value);
  if (p > 1) f.push(new F.Pixelate({ blocksize: p }));

  img.filters = f;
  img.applyFilters();
  canvas.renderAll();
  saveHistory();
  showToast('Filters applied!');
}

function resetFilters(): void {
  ['Brightness', 'Contrast', 'Saturation', 'Blur', 'Hue'].forEach(n => {
    $input(`filter${n}`).value = '0'; $(`val${n}`).textContent = '0';
  });
  $input('filterNoise').value = '0'; $('valNoise').textContent = '0';
  $input('filterPixelate').value = '1'; $('valPixelate').textContent = '1';
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

  const obj = canvas.getActiveObject();
  if (obj && obj.type === 'image') {
    (obj as FabricImage).filters = [];
    (obj as FabricImage).applyFilters();
    canvas.renderAll(); saveHistory();
  }
}

function applyPreset(name: PresetName): void {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') { showToast('Select an image to apply a preset.'); return; }

  const img = obj as FabricImage;
  const { filters: F } = fabricFilters;
  const f: any[] = [];

  switch (name) {
    case 'grayscale': f.push(new F.Grayscale()); break;
    case 'sepia': f.push(new F.Sepia()); break;
    case 'vintage':
      f.push(new F.Sepia()); f.push(new F.Brightness({ brightness: 0.05 })); f.push(new F.Contrast({ contrast: -0.15 })); break;
    case 'cold':
      f.push(new F.HueRotation({ rotation: -0.15 })); f.push(new F.Brightness({ brightness: 0.05 })); break;
    case 'warm':
      f.push(new F.HueRotation({ rotation: 0.08 })); f.push(new F.Saturation({ saturation: 0.15 })); break;
    case 'dramatic':
      f.push(new F.Contrast({ contrast: 0.3 })); f.push(new F.Brightness({ brightness: -0.1 })); break;
    case 'invert': f.push(new F.Invert()); break;
    default: break;
  }

  img.filters = f; img.applyFilters(); canvas.renderAll(); saveHistory();
  if (name !== 'none') showToast(`Applied "${name}" preset`);
}

// ─── Export ───
function exportDesign(): void {
  const format = document.querySelector<HTMLElement>('.format-btn.active')?.dataset.format || 'png';
  const quality = parseFloat($input('exportQuality').value);
  const scale = parseFloat($select('exportScale').value);
  const projectName = $input('projectName').value || 'design';

  canvas.discardActiveObject(); canvas.renderAll();

  if (format === 'svg') {
    const svgData = canvas.toSVG();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    downloadFile(URL.createObjectURL(blob), `${projectName}.svg`);
    $('exportModal').classList.add('hidden');
    showToast('SVG exported!');
    return;
  }

  const dataURL = canvas.toDataURL({ format: format as 'png' | 'jpeg', quality, multiplier: scale });
  downloadFile(dataURL, `${projectName}.${format}`);
  $('exportModal').classList.add('hidden');
  showToast(`Exported as ${format.toUpperCase()}!`);
}

function downloadFile(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

// ─── Delete ───
function deleteSelected(): void {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  if (obj.type === 'activeSelection') {
    (obj as ActiveSelection).forEachObject((o: FabricObject) => canvas.remove(o));
    canvas.discardActiveObject();
  } else {
    canvas.remove(obj);
  }
  canvas.renderAll(); saveHistory(); clearProperties();
}

// ═══════════════════════════════════════
//     INIT — BIND ALL EVENT LISTENERS
// ═══════════════════════════════════════
export function initEditor(): void {
  createCanvas(canvasWidth, canvasHeight, canvasBgColor);
  bindCanvasEvents();

  // Toolbar
  document.querySelectorAll<HTMLElement>('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool as ToolName));
  });
  $('btnSwapColors').addEventListener('click', () => {
    const fill = $input('fillColor'); const stroke = $input('strokeColor');
    [fill.value, stroke.value] = [stroke.value, fill.value];
  });
  $input('fillColor').addEventListener('input', (e) => {
    if (canvas.isDrawingMode && currentTool === 'draw' && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = (e.target as HTMLInputElement).value;
    }
  });

  // Top bar
  $('btnNew').addEventListener('click', () => $('newProjectModal').classList.remove('hidden'));
  $('btnImport').addEventListener('click', () => $input('importFileInput').click());

  $input('importFileInput').addEventListener('change', (e) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        FabricImage.fromURL(ev.target!.result as string, { crossOrigin: 'anonymous' }).then((img: FabricImage) => {
          const maxDim = Math.max(canvasWidth, canvasHeight) * 0.8;
          if (img.width! > maxDim || img.height! > maxDim) {
            const scale = maxDim / Math.max(img.width!, img.height!);
            img.scaleToWidth(img.width! * scale);
          }
          img.set({ left: canvasWidth / 2 - img.getScaledWidth() / 2, top: canvasHeight / 2 - img.getScaledHeight() / 2 });
          (img as any).name = file.name.replace(/\.[^.]+$/, '');
          canvas.add(img); canvas.setActiveObject(img); canvas.renderAll(); saveHistory();
        });
      };
      reader.readAsDataURL(file);
    });
    (e.target as HTMLInputElement).value = '';
  });

  $('btnUndo').addEventListener('click', undo);
  $('btnRedo').addEventListener('click', redo);
  $('btnExport').addEventListener('click', () => $('exportModal').classList.remove('hidden'));
  $('btnZoomIn').addEventListener('click', () => { zoomLevel = Math.min(zoomLevel + 0.1, 5); applyZoom(); });
  $('btnZoomOut').addEventListener('click', () => { zoomLevel = Math.max(zoomLevel - 0.1, 0.1); applyZoom(); });
  $('btnZoomFit').addEventListener('click', fitCanvasToView);

  // Panel tabs
  document.querySelectorAll<HTMLElement>('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $(`panel-${tab.dataset.panel}`).classList.add('active');
    });
  });

  // Property inputs
  const propChange = (id: string, setter: (obj: FabricObject, val: number) => void) => {
    $input(id).addEventListener('change', (e) => {
      const obj = canvas.getActiveObject();
      if (obj) { setter(obj, parseFloat((e.target as HTMLInputElement).value)); canvas.renderAll(); saveHistory(); }
    });
  };
  propChange('propX', (o, v) => o.set('left', v));
  propChange('propY', (o, v) => o.set('top', v));
  propChange('propW', (o, v) => o.scaleToWidth(v));
  propChange('propH', (o, v) => o.scaleToHeight(v));
  propChange('propAngle', (o, v) => o.set('angle', v));
  propChange('propStrokeWidth', (o, v) => o.set('strokeWidth', v));
  propChange('propCornerRadius', (o, v) => { if (o.type === 'rect') (o as Rect).set({ rx: v, ry: v }); });

  $input('propOpacity').addEventListener('input', (e) => {
    const obj = canvas.getActiveObject();
    if (obj) { obj.set('opacity', parseFloat((e.target as HTMLInputElement).value)); canvas.renderAll(); }
  });
  $input('propOpacity').addEventListener('change', saveHistory);

  $input('propFill').addEventListener('input', (e) => {
    const obj = canvas.getActiveObject();
    if (obj) { obj.set('fill', (e.target as HTMLInputElement).value); canvas.renderAll(); }
  });
  $input('propFill').addEventListener('change', saveHistory);
  $input('propStroke').addEventListener('input', (e) => {
    const obj = canvas.getActiveObject();
    if (obj) { obj.set('stroke', (e.target as HTMLInputElement).value); canvas.renderAll(); }
  });
  $input('propStroke').addEventListener('change', saveHistory);

  // Text
  $select('propFontFamily').addEventListener('change', (e) => {
    const obj = canvas.getActiveObject();
    if (obj) { (obj as IText).set('fontFamily', (e.target as HTMLSelectElement).value); canvas.renderAll(); saveHistory(); }
  });
  $input('propFontSize').addEventListener('change', (e) => {
    const obj = canvas.getActiveObject();
    if (obj) { (obj as IText).set('fontSize', parseInt((e.target as HTMLInputElement).value)); canvas.renderAll(); saveHistory(); }
  });
  $select('propFontWeight').addEventListener('change', (e) => {
    const obj = canvas.getActiveObject();
    if (obj) { (obj as IText).set('fontWeight', (e.target as HTMLSelectElement).value); canvas.renderAll(); saveHistory(); }
  });
  document.querySelectorAll<HTMLElement>('[data-align]').forEach(btn => {
    btn.addEventListener('click', () => {
      const obj = canvas.getActiveObject();
      if (obj) { (obj as IText).set('textAlign', btn.dataset.align!); canvas.renderAll(); saveHistory(); }
    });
  });
  $('btnBold').addEventListener('click', () => {
    const obj = canvas.getActiveObject() as IText | null;
    if (obj) { obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold'); canvas.renderAll(); saveHistory(); }
  });
  $('btnItalic').addEventListener('click', () => {
    const obj = canvas.getActiveObject() as IText | null;
    if (obj) { obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic'); canvas.renderAll(); saveHistory(); }
  });
  $('btnUnderline').addEventListener('click', () => {
    const obj = canvas.getActiveObject() as IText | null;
    if (obj) { obj.set('underline', !obj.underline); canvas.renderAll(); saveHistory(); }
  });

  // Actions
  $('btnDuplicate').addEventListener('click', () => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.clone().then((cloned: FabricObject) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      (cloned as any).name = ((obj as any).name || 'Object') + ' Copy';
      canvas.add(cloned); canvas.setActiveObject(cloned); canvas.renderAll(); saveHistory();
    });
  });
  $('btnBringFront').addEventListener('click', () => { const o = canvas.getActiveObject(); if (o) { canvas.bringObjectToFront(o); saveHistory(); updateLayers(); } });
  $('btnSendBack').addEventListener('click', () => { const o = canvas.getActiveObject(); if (o) { canvas.sendObjectToBack(o); saveHistory(); updateLayers(); } });
  $('btnDeleteObj').addEventListener('click', deleteSelected);

  // Layers
  $('btnLayerUp').addEventListener('click', () => { const o = canvas.getActiveObject(); if (o) { canvas.bringObjectForward(o); saveHistory(); updateLayers(); } });
  $('btnLayerDown').addEventListener('click', () => { const o = canvas.getActiveObject(); if (o) { canvas.sendObjectBackwards(o); saveHistory(); updateLayers(); } });

  // Templates
  document.querySelectorAll<HTMLElement>('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const t = TEMPLATE_SIZES[card.dataset.template!];
      if (!t) return;
      createCanvas(t.w, t.h, '#ffffff');
      bindCanvasEvents();
      $input('projectName').value = t.name;
      showToast(`Created: ${t.name} (${t.w}×${t.h})`);
      document.querySelectorAll('.panel-tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
      document.querySelector('[data-panel="properties"]')!.classList.add('active');
      $('panel-properties').classList.add('active');
    });
  });

  // Filters
  ['Brightness', 'Contrast', 'Saturation', 'Blur', 'Hue', 'Noise', 'Pixelate'].forEach(name => {
    const el = $input(`filter${name}`);
    const valEl = $(`val${name}`);
    el?.addEventListener('input', () => { valEl.textContent = parseFloat(el.value).toFixed(name === 'Noise' || name === 'Pixelate' ? 0 : 2); });
  });
  $('btnApplyFilters').addEventListener('click', applyFilters);
  $('btnResetFilters').addEventListener('click', resetFilters);
  document.querySelectorAll<HTMLElement>('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyPreset(btn.dataset.preset as PresetName);
    });
  });

  // New Project Modal
  let selectedBg = '#ffffff';
  $('closeNewModal').addEventListener('click', () => $('newProjectModal').classList.add('hidden'));
  $('cancelNewModal').addEventListener('click', () => $('newProjectModal').classList.add('hidden'));
  document.querySelectorAll<HTMLElement>('.size-preset').forEach(preset => {
    preset.addEventListener('click', () => {
      document.querySelectorAll('.size-preset').forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
      $input('customWidth').value = preset.dataset.w!;
      $input('customHeight').value = preset.dataset.h!;
    });
  });
  document.querySelectorAll<HTMLElement>('.bg-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.bg-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active'); selectedBg = opt.dataset.bg!;
    });
  });
  $input('customBgColor').addEventListener('input', (e) => {
    selectedBg = (e.target as HTMLInputElement).value;
    document.querySelectorAll('.bg-opt').forEach(o => o.classList.remove('active'));
  });
  $('createNewProject').addEventListener('click', () => {
    const w = parseInt($input('customWidth').value) || 1280;
    const h = parseInt($input('customHeight').value) || 720;
    createCanvas(w, h, selectedBg); bindCanvasEvents();
    $input('projectName').value = 'Untitled Design';
    $('newProjectModal').classList.add('hidden');
    showToast(`New canvas: ${w}×${h}`);
  });

  // Export Modal
  $('closeExportModal').addEventListener('click', () => $('exportModal').classList.add('hidden'));
  $('cancelExportModal').addEventListener('click', () => $('exportModal').classList.add('hidden'));
  document.querySelectorAll<HTMLElement>('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('qualityRow').style.display = btn.dataset.format === 'jpeg' ? 'flex' : 'none';
    });
  });
  $input('exportQuality').addEventListener('input', (e) => {
    $('qualityVal').textContent = Math.round(parseFloat((e.target as HTMLInputElement).value) * 100) + '%';
  });
  $('doExport').addEventListener('click', exportDesign);

  // ── AI Generation ──
  const doAIGenerate = async (prompt: string, style: AIStyle) => {
    if (!prompt.trim()) { showToast('Enter a prompt to generate.'); return; }
    $('processingText').textContent = 'AI is generating your design...';
    $('processingOverlay').classList.remove('hidden');
    try {
      const dataURL = await generateAIImage({
        prompt, width: canvasWidth, height: canvasHeight,
        style, mode: 'generate',
      });
      await FabricImage.fromURL(dataURL, { crossOrigin: 'anonymous' }).then((img: FabricImage) => {
        img.set({ left: 0, top: 0 });
        img.scaleToWidth(canvasWidth);
        (img as any).name = 'AI Generated: ' + prompt.slice(0, 30);
        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
        saveHistory();
        updateLayers();
      });
      showToast('\u2728 AI image generated!');
    } catch (err) {
      showToast('AI generation failed.');
      console.error(err);
    } finally {
      $('processingOverlay').classList.add('hidden');
    }
  };

  $('btnAIGenerate').addEventListener('click', () => {
    const prompt = ($('aiPrompt') as HTMLTextAreaElement).value;
    const style = $select('aiStyle').value as AIStyle;
    doAIGenerate(prompt, style);
  });

  $('btnAIEdit').addEventListener('click', async () => {
    const prompt = ($('aiEditPrompt') as HTMLTextAreaElement).value;
    if (!prompt.trim()) { showToast('Enter an edit description.'); return; }
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'image') { showToast('Select an image to edit with AI.'); return; }

    $('processingText').textContent = 'AI is editing your image...';
    $('processingOverlay').classList.remove('hidden');
    try {
      const imgEl = (obj as FabricImage).getElement() as HTMLImageElement;
      const tc = document.createElement('canvas');
      tc.width = imgEl.naturalWidth || imgEl.width;
      tc.height = imgEl.naturalHeight || imgEl.height;
      tc.getContext('2d')!.drawImage(imgEl, 0, 0);
      const sourceDataURL = tc.toDataURL();

      const resultURL = await generateAIImage({
        prompt, width: tc.width, height: tc.height,
        style: 'auto', mode: 'edit', sourceImageData: sourceDataURL,
      });

      await FabricImage.fromURL(resultURL, { crossOrigin: 'anonymous' }).then((newImg: FabricImage) => {
        newImg.set({ left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY, angle: obj.angle });
        (newImg as any).name = ((obj as any).name || 'Image') + ' (AI Edited)';
        canvas.remove(obj);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        canvas.renderAll();
        saveHistory();
        updateLayers();
      });
      showToast('\u270e AI edit applied!');
    } catch (err) {
      showToast('AI edit failed.');
      console.error(err);
    } finally {
      $('processingOverlay').classList.add('hidden');
    }
  });

  // Quick Generate buttons
  document.querySelectorAll<HTMLElement>('.ai-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.aiprompt || '';
      const style = (btn.dataset.aistyle || 'auto') as AIStyle;
      doAIGenerate(prompt, style);
    });
  });

  // AI Advanced Modal
  $('closeAIModal')?.addEventListener('click', () => $('aiAdvancedModal').classList.add('hidden'));
  $('cancelAIModal')?.addEventListener('click', () => $('aiAdvancedModal').classList.add('hidden'));
  $('doAIGenerate')?.addEventListener('click', () => {
    const prompt = ($('aiModalPrompt') as HTMLTextAreaElement).value;
    const style = $select('aiModalStyle').value as AIStyle;
    const w = parseInt($input('aiModalWidth').value) || canvasWidth;
    const h = parseInt($input('aiModalHeight').value) || canvasHeight;
    createCanvas(w, h, '#ffffff');
    bindCanvasEvents();
    doAIGenerate(prompt, style);
    $('aiAdvancedModal').classList.add('hidden');
  });

  // ── Design Templates (pre-built) ──
  document.querySelectorAll<HTMLElement>('.design-template-card').forEach(card => {
    card.addEventListener('click', () => {
      const templateId = card.dataset.designTemplate;
      const template = DESIGN_TEMPLATES.find(t => t.id === templateId);
      if (!template) return;

      createCanvas(template.width, template.height, '#ffffff');
      bindCanvasEvents();
      template.build(canvas);
      canvas.renderAll();
      saveHistory();
      updateLayers();
      $input('projectName').value = template.name;
      showToast(`Template loaded: ${template.name}`);

      // Switch to properties tab
      document.querySelectorAll('.panel-tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
      document.querySelector('[data-panel="properties"]')!.classList.add('active');
      $('panel-properties').classList.add('active');
    });
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj && (activeObj as IText).isEditing) return;
    const key = e.key.toLowerCase();

    if (key === 'v') setTool('select');
    if (key === 'h') setTool('hand');
    if (key === 't') setTool('text');
    if (key === 'r') setTool('rect');
    if (key === 'c' && !e.metaKey && !e.ctrlKey) setTool('circle');
    if (key === 'l') setTool('line');
    if (key === 'b') setTool('draw');
    if (key === 'e') setTool('eraser');

    if ((e.ctrlKey || e.metaKey) && key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    if ((e.ctrlKey || e.metaKey) && key === 'y') { e.preventDefault(); redo(); }
    if (key === 'delete' || key === 'backspace') { if (!activeObj || (activeObj as IText).isEditing) return; e.preventDefault(); deleteSelected(); }
    if ((e.ctrlKey || e.metaKey) && key === 'd') { e.preventDefault(); $('btnDuplicate').click(); }
    if (key === '=' || key === '+') { zoomLevel = Math.min(zoomLevel + 0.1, 5); applyZoom(); }
    if (key === '-') { zoomLevel = Math.max(zoomLevel - 0.1, 0.1); applyZoom(); }
    if (key === '0') fitCanvasToView();
    if (key === 'escape') { canvas.discardActiveObject(); canvas.renderAll(); setTool('select'); clearProperties(); }
  });

  window.addEventListener('resize', fitCanvasToView);
  fitCanvasToView();
}
