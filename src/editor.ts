import { 
  Canvas, Rect, Ellipse, Triangle, Line, IText, FabricImage, 
  PencilBrush, ActiveSelection, FabricObject, Pattern, filters as fabricFilters
} from 'fabric';
import { generateAIImage } from './ai';
import type { AIStyle } from './ai';
import { hasGeminiKey, refineDesignPrompt, generateSmartLayout, generateSingleElement, generateVectorGraphic } from './gemini';
import { DESIGN_TEMPLATES } from './templates';
import type { ToolName, PresetName } from './types';
import { TEMPLATE_SIZES, MAX_HISTORY } from './types';

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
    case 'mask':
      showToast('Select an image, then a shape above it, and click Apply Mask in properties.');
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

function applyTextBehind(): void {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'image') { showToast('Select an image subject.'); return; }

  $('processingText').textContent = 'Separating subject and placing text...';
  $('processingOverlay').classList.remove('hidden');

  setTimeout(async () => {
    try {
      const img = obj as FabricImage;
      const imgEl = img.getElement() as HTMLImageElement;
      const tc = document.createElement('canvas');
      tc.width = imgEl.naturalWidth || imgEl.width;
      tc.height = imgEl.naturalHeight || imgEl.height;
      const ctx = tc.getContext('2d')!;
      ctx.drawImage(imgEl, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, tc.width, tc.height);
      const d = imageData.data;
      const threshold = 60;
      const bg = { r: d[0], g: d[1], b: d[2] };
      for (let i = 0; i < d.length; i += 4) {
        const diff = Math.abs(d[i]-bg.r) + Math.abs(d[i+1]-bg.g) + Math.abs(d[i+2]-bg.b);
        if (diff < threshold) d[i+3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);

      const dataURL = tc.toDataURL();
      await FabricImage.fromURL(dataURL, { crossOrigin: 'anonymous' }).then((subjectImg: FabricImage) => {
        subjectImg.set({ 
          left: img.left, top: img.top, 
          scaleX: img.scaleX, scaleY: img.scaleY, 
          angle: img.angle 
        });
        (subjectImg as any).name = 'Subject (Foreground)';

        const text = new IText('TEXT BEHIND', {
          left: (img.left || 0) + (img.getScaledWidth() / 2),
          top: (img.top || 0) + (img.getScaledHeight() * 0.4),
          fontSize: 140,
          fontFamily: 'Impact',
          fill: '#ffffff',
          originX: 'center',
          textAlign: 'center'
        });
        (text as any).name = 'Background Text';

        canvas.add(text);
        canvas.add(subjectImg);
        
        canvas.bringObjectToFront(subjectImg);
        canvas.setActiveObject(text);
        canvas.renderAll();
        saveHistory();
        updateLayers();
      });
      showToast('Text placed behind subject!');
    } catch (err) {
      showToast('Subject separation failed.');
      console.error(err);
    } finally {
      $('processingOverlay').classList.add('hidden');
    }
  }, 1000);
}

// ─── Masking ───
function canApplyMask(): boolean {
  const objects = canvas.getObjects();
  if (objects.length < 2) return false;
  const active = canvas.getActiveObject();
  if (!active) return false;
  if (active.type === 'activeSelection') {
    const sel = active as ActiveSelection;
    const items = sel.getObjects();
    if (items.length !== 2) return false;
    const hasImage = items.some(o => o.type === 'image');
    const hasShape = items.some(o => ['rect','ellipse','circle','triangle','path'].includes(o.type!));
    return hasImage && hasShape;
  }
  if (active.type === 'image') {
    const idx = objects.indexOf(active);
    if (idx < objects.length - 1) {
      const above = objects[idx + 1];
      return ['rect','ellipse','circle','triangle','path'].includes(above.type!);
    }
  }
  return false;
}

function applyMask(): void {
  const objects = canvas.getObjects();
  let imageObj: FabricImage | null = null;
  let maskObj: FabricObject | null = null;
  const active = canvas.getActiveObject();
  if (!active) { showToast('Select an image and a shape to mask.'); return; }

  if (active.type === 'activeSelection') {
    const items = (active as ActiveSelection).getObjects();
    imageObj = items.find(o => o.type === 'image') as FabricImage || null;
    maskObj = items.find(o => ['rect','ellipse','circle','triangle','path'].includes(o.type!)) || null;
  } else if (active.type === 'image') {
    imageObj = active as FabricImage;
    const idx = objects.indexOf(active);
    if (idx < objects.length - 1) {
      const above = objects[idx + 1];
      if (['rect','ellipse','circle','triangle','path'].includes(above.type!)) maskObj = above;
    }
  }

  if (!imageObj || !maskObj) { showToast('Need an image and a shape to create a mask.'); return; }

  $('processingText').textContent = 'Applying clipping mask...';
  $('processingOverlay').classList.remove('hidden');

  setTimeout(() => {
    try {
      const imgEl = imageObj!.getElement() as HTMLImageElement;
      const tc = document.createElement('canvas');
      const imgW = imageObj!.getScaledWidth();
      const imgH = imageObj!.getScaledHeight();
      tc.width = imgW;
      tc.height = imgH;
      const ctx = tc.getContext('2d')!;

      ctx.save();
      const mLeft = (maskObj!.left || 0) - (imageObj!.left || 0);
      const mTop = (maskObj!.top || 0) - (imageObj!.top || 0);

      ctx.beginPath();
      if (maskObj!.type === 'rect') {
        const rx = (maskObj! as Rect).rx || 0;
        const mw = maskObj!.getScaledWidth();
        const mh = maskObj!.getScaledHeight();
        if (rx > 0) {
          ctx.moveTo(mLeft + rx, mTop);
          ctx.arcTo(mLeft + mw, mTop, mLeft + mw, mTop + mh, rx);
          ctx.arcTo(mLeft + mw, mTop + mh, mLeft, mTop + mh, rx);
          ctx.arcTo(mLeft, mTop + mh, mLeft, mTop, rx);
          ctx.arcTo(mLeft, mTop, mLeft + mw, mTop, rx);
        } else {
          ctx.rect(mLeft, mTop, mw, mh);
        }
      } else if (maskObj!.type === 'ellipse' || maskObj!.type === 'circle') {
        const mw = maskObj!.getScaledWidth();
        const mh = maskObj!.getScaledHeight();
        ctx.ellipse(mLeft + mw / 2, mTop + mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
      } else if (maskObj!.type === 'triangle') {
        const mw = maskObj!.getScaledWidth();
        const mh = maskObj!.getScaledHeight();
        ctx.moveTo(mLeft + mw / 2, mTop);
        ctx.lineTo(mLeft + mw, mTop + mh);
        ctx.lineTo(mLeft, mTop + mh);
      } else {
        const mw = maskObj!.getScaledWidth();
        const mh = maskObj!.getScaledHeight();
        ctx.rect(mLeft, mTop, mw, mh);
      }
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(imgEl, 0, 0, imgW, imgH);
      ctx.restore();

      const dataURL = tc.toDataURL('image/png');
      const newImg = new Image();
      newImg.onload = () => {
        const fabricImg = new FabricImage(newImg, {
          left: imageObj!.left,
          top: imageObj!.top,
          scaleX: 1,
          scaleY: 1,
          angle: imageObj!.angle,
        });
        (fabricImg as any).name = ((imageObj! as any).name || 'Image') + ' (Masked)';
        (fabricImg as any)._pf_maskData = {
          origSrc: imgEl.src,
          origLeft: imageObj!.left,
          origTop: imageObj!.top,
          origScaleX: imageObj!.scaleX,
          origScaleY: imageObj!.scaleY,
          origAngle: imageObj!.angle,
          origName: (imageObj! as any).name || 'Image',
        };

        canvas.discardActiveObject();
        canvas.remove(imageObj!);
        canvas.remove(maskObj!);
        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.renderAll();
        saveHistory();
        updateLayers();
        updateProperties();
        showToast('🎭 Clipping mask applied!');
        $('processingOverlay').classList.add('hidden');
      };
      newImg.src = dataURL;
    } catch (err) {
      console.error(err);
      showToast('Mask failed.');
      $('processingOverlay').classList.add('hidden');
    }
  }, 100);
}

function removeMask(): void {
  const obj = canvas.getActiveObject();
  if (!obj || !(obj as any)._pf_maskData) { showToast('No mask to remove.'); return; }

  const data = (obj as any)._pf_maskData;
  $('processingText').textContent = 'Removing mask...';
  $('processingOverlay').classList.remove('hidden');

  FabricImage.fromURL(data.origSrc, { crossOrigin: 'anonymous' }).then((img: FabricImage) => {
    img.set({
      left: data.origLeft,
      top: data.origTop,
      scaleX: data.origScaleX,
      scaleY: data.origScaleY,
      angle: data.origAngle,
    });
    (img as any).name = data.origName;
    canvas.remove(obj);
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
    saveHistory();
    updateLayers();
    updateProperties();
    showToast('Mask removed!');
    $('processingOverlay').classList.add('hidden');
  }).catch(() => {
    showToast('Could not restore original image.');
    $('processingOverlay').classList.add('hidden');
  });
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
  const isImage = obj.type === 'image';
  const isMasked = !!(obj as any)._pf_maskData;
  const canMask = canApplyMask();
  
  $('textPropsTitle').style.display = isText ? 'block' : 'none';
  $('textProps').style.display = isText ? 'grid' : 'none';
  $('btnTextBehind').style.display = isImage ? 'block' : 'none';
  $('btnApplyMask').style.display = canMask ? 'block' : 'none';
  $('btnRemoveMask').style.display = isMasked ? 'block' : 'none';

  $select('propBlendMode').value = (obj as any).globalCompositeOperation || 'source-over';

  if (isText) {
    const t = obj as IText;
    $select('propFontFamily').value = t.fontFamily || 'Inter';
    $input('propFontSize').value = String(t.fontSize || 32);
    $select('propFontWeight').value = String(t.fontWeight || 'normal');
    $input('propCharSpacing').value = String(t.charSpacing || 0);
    $input('propLineHeight').value = String(t.lineHeight || 1.16);
    
    $('btnBold').classList.toggle('active', t.fontWeight === 'bold' || t.fontWeight === 900);
    $('btnItalic').classList.toggle('active', t.fontStyle === 'italic');
    $('btnUnderline').classList.toggle('active', t.underline);
    
    // Shadow/Glow state indicators
    const hasShadow = !!obj.shadow && (obj.shadow as any).color !== 'rgba(99,102,241,0.8)';
    const hasGlow = !!obj.shadow && (obj.shadow as any).color === 'rgba(99,102,241,0.8)';
    $('btnShadow').classList.toggle('active', hasShadow);
    $('btnGlow').classList.toggle('active', hasGlow);
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
  const F = fabricFilters;

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
  const F = fabricFilters;
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
    const val = (e.target as HTMLInputElement).value;
    const obj = canvas.getActiveObject();
    if (obj) { obj.set('opacity', parseFloat(val)); canvas.renderAll(); }
  });
  $input('propOpacity').addEventListener('change', saveHistory);

  $select('propBlendMode').addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    const obj = canvas.getActiveObject();
    if (obj) { (obj as any).set('globalCompositeOperation', val); canvas.renderAll(); saveHistory(); }
  });

  $input('propCharSpacing').addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value) || 0;
    const obj = canvas.getActiveObject();
    if (obj && (obj instanceof IText)) { obj.set('charSpacing', val); canvas.renderAll(); }
  });
  $input('propCharSpacing').addEventListener('change', () => saveHistory());

  $input('propLineHeight').addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value) || 1.16;
    const obj = canvas.getActiveObject();
    if (obj && (obj instanceof IText)) { obj.set('lineHeight', val); canvas.renderAll(); }
  });
  $input('propLineHeight').addEventListener('change', () => saveHistory());

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
  $('btnShadow').addEventListener('click', () => {
    const obj = canvas.getActiveObject();
    if (obj) {
      if (obj.shadow) {
        obj.set('shadow', null);
        $('btnShadow').classList.remove('active');
      } else {
        obj.set('shadow', { color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 5, offsetY: 5 } as any);
        $('btnShadow').classList.add('active');
      }
      canvas.renderAll(); saveHistory();
    }
  });

  $('btnGlow').addEventListener('click', () => {
    const obj = canvas.getActiveObject();
    if (obj) {
      if (obj.shadow && (obj.shadow as any).color === 'rgba(99,102,241,0.8)') {
        obj.set('shadow', null);
        $('btnGlow').classList.remove('active');
      } else {
        obj.set('shadow', { color: 'rgba(99,102,241,0.8)', blur: 25, offsetX: 0, offsetY: 0 } as any);
        $('btnGlow').classList.add('active');
      }
      canvas.renderAll(); saveHistory();
    }
  });

  $('btnDuplicate').addEventListener('click', () => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.clone().then((cloned: FabricObject) => {
      canvas.discardActiveObject();
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = canvas;
        (cloned as ActiveSelection).forEachObject((o: FabricObject) => canvas.add(o));
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }
      canvas.setActiveObject(cloned);
      canvas.renderAll(); saveHistory();
    });
  });

  $('btnTextBehind').addEventListener('click', applyTextBehind);
  $('btnApplyMask').addEventListener('click', applyMask);
  $('btnRemoveMask').addEventListener('click', removeMask);
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

  const doAIGenerate = async (prompt: string, style: AIStyle) => {
    if (!prompt.trim()) { showToast('Enter a prompt to generate.'); return; }
    
    let refinedPrompt = prompt;
    const overlay = $('processingOverlay');
    const textEl = $('processingText');

    if (hasGeminiKey()) {
      textEl.textContent = 'Gemini is refining your prompt...';
      overlay.classList.remove('hidden');
      try {
        refinedPrompt = await refineDesignPrompt(prompt);
      } catch (e) {
        console.warn('Gemini optimization skipped:', e);
      }
    }

    textEl.textContent = 'Generating your design...';
    overlay.classList.remove('hidden');
    
    try {
      const dataURL = await generateAIImage({
        prompt: refinedPrompt, width: canvasWidth, height: canvasHeight,
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
      showToast('\u2728 Design generated!');
    } catch (err: any) {
      showToast('AI generation failed: ' + (err.message || 'Error'));
      console.error(err);
    } finally {
      overlay.classList.add('hidden');
    }
  };

  $('btnAIGenerate').addEventListener('click', () => {
    const prompt = ($('aiPrompt') as HTMLTextAreaElement).value;
    const style = $select('aiStyle').value as AIStyle;
    doAIGenerate(prompt, style);
  });

  $('btnGeminiLayout').addEventListener('click', async () => {
    const prompt = ($('aiPrompt') as HTMLTextAreaElement).value;
    if (!prompt.trim()) { showToast('Enter a prompt for Gemini.'); return; }
    if (!hasGeminiKey()) { showToast('Configure Gemini API first \u2699\ufe0f'); return; }

    $('processingText').textContent = 'Gemini is designing your layout...';
    $('processingOverlay').classList.remove('hidden');
    try {
      const objects = await generateSmartLayout(prompt);
      if (Array.isArray(objects)) {
        // Clear background images if it's a "fresh" start (optional)
        // canvas.clear(); // User might not want this
        
        for (const config of objects) {
          let obj: FabricObject | null = null;
          const common = {
            left: config.left || Math.random() * (canvasWidth - 100),
            top: config.top || Math.random() * (canvasHeight - 100),
            fill: config.fill || '#6366f1',
            opacity: config.opacity !== undefined ? config.opacity : 1,
            angle: config.angle || 0,
            shadow: config.shadow || null,
          };

          if (config.type === 'rect') {
            obj = new Rect({ ...common, width: config.width || 100, height: config.height || 100 });
          } else if (config.type === 'circle') {
            obj = new Ellipse({ ...common, rx: (config.width || 100) / 2, ry: (config.height || 100) / 2 });
          } else if (config.type === 'triangle') {
            obj = new Triangle({ ...common, width: config.width || 100, height: config.height || 100 });
          } else if (config.type === 'i-text') {
            obj = new IText(config.text || 'Design Element', {
              ...common,
              fontSize: config.fontSize || 40,
              fontFamily: config.fontFamily || 'Inter',
              fontWeight: config.fontWeight || 'bold'
            });
          } else if (config.type === 'image' && config.subject) {
            // Fetch subject image from Unsplash
            const url = `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80`;
            await FabricImage.fromURL(url).then(img => {
              img.set({ ...common, left: config.left, top: config.top });
              if (config.width) img.scaleToWidth(config.width);
              canvas.add(img);
            });
            continue;
          }

          if (obj) canvas.add(obj);
        }
        canvas.renderAll();
        saveHistory();
        updateLayers();
        showToast('\u2728 Gemini design applied!');
      }
    } catch (err: any) {
      showToast('Gemini design failed: ' + err.message);
      console.error(err);
    } finally {
      $('processingOverlay').classList.add('hidden');
    }
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

  // ── AI Add Single Element ──
  const addAIElement = async (prompt: string) => {
    if (!prompt.trim()) { showToast('Describe the element you want to add.'); return; }
    if (!hasGeminiKey()) { showToast('Gemini API not available.'); return; }

    $('processingText').textContent = 'Creating your element...';
    $('processingOverlay').classList.remove('hidden');
    try {
      const config = await generateSingleElement(prompt, canvasWidth, canvasHeight);
      let obj: FabricObject | null = null;
      const common = {
        left: config.left ?? canvasWidth / 2 - 50,
        top: config.top ?? canvasHeight / 2 - 50,
        fill: config.fill || '#6366f1',
        opacity: config.opacity !== undefined ? config.opacity : 1,
        angle: config.angle || 0,
        stroke: config.stroke || undefined,
        strokeWidth: config.strokeWidth || 0,
        shadow: config.shadow || null,
      };

      if (config.type === 'rect') {
        obj = new Rect({ ...common, width: config.width || 200, height: config.height || 150, rx: config.rx || 0, ry: config.ry || 0 });
      } else if (config.type === 'circle' || config.type === 'ellipse') {
        obj = new Ellipse({ ...common, rx: (config.width || 150) / 2, ry: (config.height || 150) / 2 });
      } else if (config.type === 'triangle') {
        obj = new Triangle({ ...common, width: config.width || 150, height: config.height || 130 });
      } else if (config.type === 'i-text' || config.type === 'text') {
        obj = new IText(config.text || 'Text', {
          ...common,
          fontSize: config.fontSize || 48,
          fontFamily: config.fontFamily || 'Inter',
          fontWeight: config.fontWeight || 'bold',
        });
      } else if (config.type === 'line') {
        obj = new Line([0, 0, config.width || 400, 0], {
          ...common,
          stroke: config.stroke || '#ffffff',
          strokeWidth: config.strokeWidth || 3,
          fill: '',
        });
      } else {
        // Default to rectangle for unknown types
        obj = new Rect({ ...common, width: config.width || 200, height: config.height || 150 });
      }

      if (obj) {
        (obj as any).name = 'AI: ' + prompt.slice(0, 25);
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
        saveHistory();
        updateLayers();
        showToast('🪄 Element added!');
      }
    } catch (err: any) {
      showToast('Failed to add element: ' + (err.message || 'Error'));
      console.error(err);
    } finally {
      $('processingOverlay').classList.add('hidden');
    }
  };

  $('btnAIAddElement').addEventListener('click', () => {
    const prompt = ($('aiElementPrompt') as HTMLInputElement).value;
    addAIElement(prompt);
  });

  // Enter key support for element input
  $('aiElementPrompt').addEventListener('keydown', (e: Event) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const prompt = ($('aiElementPrompt') as HTMLInputElement).value;
      addAIElement(prompt);
    }
  });

  // Quick element preset buttons
  document.querySelectorAll<HTMLElement>('.ai-eq').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.element || '';
      if (prompt) addAIElement(prompt);
    });
  });

  // ── AI Graphic Generation ──
  const addAIVectorGraphic = async (prompt: string) => {
    if (!prompt.trim()) { showToast('Describe the graphic you want.'); return; }

    $('processingText').textContent = 'AI is generating your graphic...';
    $('processingOverlay').classList.remove('hidden');
    try {
      const imageUrl = await generateVectorGraphic(prompt);
      await FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img: FabricImage) => {
        // Scale to a good visible size
        const targetWidth = Math.min(350, canvasWidth * 0.4);
        img.scaleToWidth(targetWidth);
        img.set({
          left: (canvasWidth - targetWidth) / 2,
          top: (canvasHeight - (img.height! * img.scaleY!)) / 2,
        });
        (img as any).name = '🎨 ' + prompt.slice(0, 25);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveHistory();
        updateLayers();
        showToast('🎨 AI graphic added!');
      });
    } catch (err: any) {
      showToast('Graphic generation failed: ' + (err.message || 'Error'));
      console.error(err);
    } finally {
      $('processingOverlay').classList.add('hidden');
    }
  };

  $('btnAIVector').addEventListener('click', () => {
    const prompt = ($('aiVectorPrompt') as HTMLInputElement).value;
    addAIVectorGraphic(prompt);
  });

  $('aiVectorPrompt').addEventListener('keydown', (e: Event) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const prompt = ($('aiVectorPrompt') as HTMLInputElement).value;
      addAIVectorGraphic(prompt);
    }
  });

  // Quick vector preset buttons
  document.querySelectorAll<HTMLElement>('.ai-vq').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.vector || '';
      if (prompt) addAIVectorGraphic(prompt);
    });
  });

  // Quick Generate buttons (background presets)
  document.querySelectorAll<HTMLElement>('.ai-quick-btn:not(.ai-eq):not(.ai-vq)').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.aiprompt || '';
      const style = (btn.dataset.aistyle || 'auto') as AIStyle;
      if (prompt) doAIGenerate(prompt, style);
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
