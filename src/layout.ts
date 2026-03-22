// PixelForge — HTML Layout Builder
// Generates the full application DOM structure

import { TEMPLATE_SIZES } from './types';
import { DESIGN_TEMPLATES } from './templates';

export function buildLayout(): string {
  return `
    ${buildTopbar()}
    <div id="app-layout">
      ${buildLeftToolbar()}
      <main id="canvas-area">
        <div id="canvas-wrapper">
          <canvas id="design-canvas"></canvas>
        </div>
      </main>
      ${buildRightPanel()}
    </div>
    ${buildNewProjectModal()}
    ${buildExportModal()}
    ${buildAIModal()}

    <div class="processing-overlay hidden" id="processingOverlay">
      <div class="processing-spinner"></div>
      <p id="processingText">Processing...</p>
    </div>
    <div id="toast" class="toast"></div>
  `;
}

function buildTopbar(): string {
  return `
  <header id="topbar">
    <div class="topbar-left">
      <div class="logo">
        <div class="logo-icon">◆</div>
        <span class="logo-text">PixelForge</span>
      </div>
      <div class="topbar-divider"></div>
      <div style="display:flex;align-items:center;gap:2px">
        <button class="top-btn" id="btnNew" title="New Project">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <span>New</span>
        </button>
        <button class="top-btn" id="btnImport" title="Import Image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Import</span>
        </button>
        <input type="file" id="importFileInput" accept="image/*" style="display:none" multiple>
      </div>
      <div class="topbar-divider"></div>
      <div style="display:flex;align-items:center;gap:2px">
        <button class="top-btn icon-only" id="btnUndo" title="Undo (Ctrl+Z)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
        <button class="top-btn icon-only" id="btnRedo" title="Redo (Ctrl+Y)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
        </button>
      </div>
    </div>
    <div class="topbar-center">
      <input type="text" id="projectName" value="Untitled Design" class="project-name-input">
    </div>
    <div class="topbar-right">
      <button class="top-btn" id="btnExport" title="Export Design">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Export</span>
      </button>
      <div class="zoom-controls">
        <button class="top-btn icon-only" id="btnZoomOut" title="Zoom Out">−</button>
        <span id="zoomLevel" class="zoom-label">100%</span>
        <button class="top-btn icon-only" id="btnZoomIn" title="Zoom In">+</button>
        <button class="top-btn icon-only" id="btnZoomFit" title="Fit to Screen">⊡</button>
      </div>
    </div>
  </header>`;
}

function toolBtn(tool: string, label: string, svg: string, active = false): string {
  return `<button class="tool-btn${active ? ' active' : ''}" data-tool="${tool}" title="${label}">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svg}</svg>
    <span class="tool-label">${label}</span>
  </button>`;
}

function buildLeftToolbar(): string {
  return `
  <aside id="left-toolbar">
    <div class="tool-group">
      ${toolBtn('select', 'Select', '<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>', true)}
      ${toolBtn('hand', 'Hand', '<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v6m0 0V4a2 2 0 0 0-4 0v8m16 2a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2h4"/>')}
    </div>
    <div class="tool-divider"></div>
    <div class="tool-group">
      ${toolBtn('text', 'Text', '<polyline points="4,7 4,4 20,4 20,7"/><line x1="9.5" y1="4" x2="9.5" y2="20"/><line x1="14.5" y1="4" x2="14.5" y2="20"/><line x1="7" y1="20" x2="17" y2="20"/>')}
      ${toolBtn('rect', 'Rect', '<rect x="3" y="3" width="18" height="18" rx="2"/>')}
      ${toolBtn('circle', 'Circle', '<circle cx="12" cy="12" r="10"/>')}
      ${toolBtn('triangle', 'Triangle', '<polygon points="12,2 22,22 2,22"/>')}
      ${toolBtn('line', 'Line', '<line x1="5" y1="19" x2="19" y2="5"/>')}
    </div>
    <div class="tool-divider"></div>
    <div class="tool-group">
      ${toolBtn('draw', 'Draw', '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>')}
      ${toolBtn('eraser', 'Eraser', '<path d="M20 20H7L3 16l9-9 8 8-4 4z"/><line x1="7" y1="20" x2="20" y2="20"/>')}
    </div>
    <div class="tool-divider"></div>
    <div class="tool-group">
      ${toolBtn('removebg', 'BG Remove', '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 15h18"/><path d="M3 9h6"/>')}
      ${toolBtn('mask', 'Mask', '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="5"/><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/>')}
    </div>
    <div class="tool-spacer"></div>
    <div class="color-picker-group">
      <div class="color-swatch-pair">
        <input type="color" id="fillColor" value="#3b82f6" title="Fill Color" class="color-swatch fill-swatch">
        <input type="color" id="strokeColor" value="#000000" title="Stroke Color" class="color-swatch stroke-swatch">
      </div>
      <button class="mini-btn" id="btnSwapColors" title="Swap Colors" style="font-size:12px">⇅</button>
    </div>
  </aside>`;
}

function buildRightPanel(): string {
  // Build pre-built design template cards
  const categories = [
    { key: 'youtube', label: '🎬 YouTube', icon: '▶' },
    { key: 'album', label: '🎵 Album Covers', icon: '♫' },
    { key: 'social', label: '📱 Social Media', icon: '◎' },
    { key: 'poster', label: '📄 Posters', icon: '☆' },
    { key: 'business', label: '💼 Business', icon: '▣' },
  ];

  const designTemplateCards = categories.map(cat => {
    const templates = DESIGN_TEMPLATES.filter(t => t.category === cat.key);
    if (!templates.length) return '';
    return `
      <h4 class="section-subtitle">${cat.label}</h4>
      <div class="design-templates-grid">
        ${templates.map(t => `
          <button class="design-template-card" data-design-template="${t.id}">
            <div class="design-template-preview" style="background:${t.previewGradient}"></div>
            <span class="template-name">${t.name}</span>
            <span class="template-size">${t.width} × ${t.height}</span>
          </button>
        `).join('')}
      </div>
    `;
  }).join('');

  // Simple canvas-size template cards
  const sizeCards = Object.entries(TEMPLATE_SIZES).map(([key, t]) =>
    `<button class="template-card" data-template="${key}">
      <div class="template-preview ${t.previewClass}"><span>${t.icon}</span></div>
      <span class="template-name">${t.name}</span>
      <span class="template-size">${t.w} × ${t.h}</span>
    </button>`
  ).join('');

  return `
  <aside id="right-panel">
    <div class="panel-tabs">
      <button class="panel-tab active" data-panel="properties">Props</button>
      <button class="panel-tab" data-panel="layers">Layers</button>
      <button class="panel-tab" data-panel="ai">✨ AI</button>
      <button class="panel-tab" data-panel="templates">Templates</button>
      <button class="panel-tab" data-panel="filters">Filters</button>
    </div>

    <!-- Properties -->
    <div class="panel-content active" id="panel-properties">
      <div id="noSelectionHint">
        <div class="empty-hint">
          <div class="empty-icon">◇</div>
          <p>Select an object on the canvas to edit its properties.</p>
        </div>
      </div>
      <div id="objectProperties" style="display:none">
        <h3 class="section-title">Transform</h3>
        <div class="prop-grid">
          <div class="prop-row"><label>X</label><input type="number" id="propX" class="prop-input" step="1"></div>
          <div class="prop-row"><label>Y</label><input type="number" id="propY" class="prop-input" step="1"></div>
          <div class="prop-row"><label>W</label><input type="number" id="propW" class="prop-input" step="1"></div>
          <div class="prop-row"><label>H</label><input type="number" id="propH" class="prop-input" step="1"></div>
          <div class="prop-row"><label>Rotation</label><input type="number" id="propAngle" class="prop-input" step="1"></div>
          <div class="prop-row"><label>Opacity</label><input type="range" id="propOpacity" class="prop-range" min="0" max="1" step="0.01" value="1"></div>
        </div>
        <h3 class="section-title">Fill & Stroke</h3>
        <div class="prop-grid">
          <div class="prop-row"><label>Fill</label><input type="color" id="propFill" class="prop-color"></div>
          <div class="prop-row"><label>Stroke</label><input type="color" id="propStroke" class="prop-color"></div>
          <div class="prop-row"><label>Stroke W</label><input type="number" id="propStrokeWidth" class="prop-input" min="0" step="1" value="0"></div>
          <div class="prop-row"><label>Corner R</label><input type="number" id="propCornerRadius" class="prop-input" min="0" step="1" value="0"></div>
          <div class="prop-row full"><label>Blending Mode</label>
            <select id="propBlendMode" class="prop-select">
              <option value="source-over">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="hard-light">Hard Light</option>
              <option value="soft-light">Soft Light</option>
              <option value="difference">Difference</option>
              <option value="exclusion">Exclusion</option>
            </select>
          </div>
        </div>
        <h3 class="section-title" id="textPropsTitle" style="display:none">Text</h3>
        <div class="prop-grid" id="textProps" style="display:none">
          <div class="prop-row full"><label>Font</label>
            <select id="propFontFamily" class="prop-select">
              <option value="Inter">Inter</option><option value="Space Grotesk">Space Grotesk</option>
              <option value="Arial">Arial</option><option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option>
              <option value="Impact">Impact</option><option value="Courier New">Courier New</option>
            </select>
          </div>
          <div class="prop-row"><label>Size</label><input type="number" id="propFontSize" class="prop-input" min="8" max="500" step="1" value="32"></div>
          <div class="prop-row"><label>Weight</label>
            <select id="propFontWeight" class="prop-select">
              <option value="normal">Normal</option><option value="bold">Bold</option>
              <option value="300">Light</option><option value="500">Medium</option>
              <option value="600">SemiBold</option><option value="900">Black</option>
            </select>
          </div>
          <div class="prop-row"><label>L-Spacing</label><input type="number" id="propCharSpacing" class="prop-input" step="10" value="0"></div>
          <div class="prop-row"><label>L-Height</label><input type="number" id="propLineHeight" class="prop-input" step="0.1" value="1.16"></div>
          <div class="prop-row full"><label>Align</label>
            <div class="btn-group">
              <button class="mini-btn" data-align="left">◧</button>
              <button class="mini-btn" data-align="center">◫</button>
              <button class="mini-btn" data-align="right">◨</button>
            </div>
          </div>
          <div class="prop-row full"><label>Style</label>
            <div class="btn-group">
              <button class="mini-btn" id="btnBold"><b>B</b></button>
              <button class="mini-btn" id="btnItalic"><i>I</i></button>
              <button class="mini-btn" id="btnUnderline"><u>U</u></button>
            </div>
          </div>
          <div class="prop-row full"><label>Effects</label>
             <div class="btn-group">
              <button class="mini-btn" id="btnShadow" title="Toggle Shadow">Shadow</button>
              <button class="mini-btn" id="btnGlow" title="Toggle Glow">Glow</button>
            </div>
          </div>
        </div>
        <h3 class="section-title">Actions</h3>
        <div class="action-buttons">
          <button class="action-btn" id="btnDuplicate">Duplicate</button>
          <button class="action-btn" id="btnBringFront">Bring Front</button>
          <button class="action-btn" id="btnSendBack">Send Back</button>
          <button class="action-btn" id="btnTextBehind" style="display:none">Text Behind</button>
          <button class="action-btn" id="btnApplyMask" style="display:none">🎭 Apply Mask</button>
          <button class="action-btn" id="btnRemoveMask" style="display:none">✕ Remove Mask</button>
          <button class="action-btn danger" id="btnDeleteObj">Delete</button>
        </div>
      </div>
    </div>

    <!-- Layers -->
    <div class="panel-content" id="panel-layers">
      <div class="layers-header">
        <h3 class="section-title">Layers</h3>
        <div class="layer-actions-top">
          <button class="mini-btn" id="btnLayerUp" title="Move Up">↑</button>
          <button class="mini-btn" id="btnLayerDown" title="Move Down">↓</button>
        </div>
      </div>
      <div id="layersList" class="layers-list"></div>
    </div>

    <!-- AI Generate -->
    <div class="panel-content" id="panel-ai">
      <div class="ai-header">
        <div class="ai-badge">✨ AI Studio</div>
      </div>

      <h3 class="section-title">Generate Image</h3>
      <div class="ai-section">
        <textarea id="aiPrompt" class="ai-prompt" placeholder="Describe what you want to create...&#10;&#10;Examples:&#10;• Dark cosmic album cover titled &quot;Midnight&quot;&#10;• Neon gaming thumbnail with text &quot;EPIC WIN&quot;&#10;• Gradient background with warm sunset colors&#10;• Minimal poster with geometric shapes" rows="5"></textarea>

        <label class="ai-label">Style</label>
        <select id="aiStyle" class="prop-select ai-select">
          <option value="auto">🔮 Auto-Detect</option>
          <option value="realistic">📸 Realistic / Photo</option>
          <option value="portrait">👤 Portrait / Face</option>
          <option value="abstract">🌊 Abstract</option>
          <option value="gradient">🌈 Gradient</option>
          <option value="geometric">🔷 Geometric</option>
          <option value="neon">💡 Neon Glow</option>
          <option value="minimal">◻️ Minimal</option>
          <option value="vaporwave">🌅 Vaporwave</option>
          <option value="cosmic">🌌 Cosmic</option>
          <option value="grunge">💀 Grunge</option>
          <option value="retro">📻 Retro</option>
        </select>

        <button class="ai-generate-btn" id="btnAIGenerate">
          <span class="ai-btn-icon">✦</span>
          <span>Generate Background</span>
        </button>
        <button class="ai-gemini-btn" id="btnGeminiLayout">
          <span class="ai-btn-icon">💎</span>
          <span>Smart Design Sketch</span>
        </button>
      </div>

      <h3 class="section-title">AI Edit Selected</h3>
      <div class="ai-section">
        <textarea id="aiEditPrompt" class="ai-prompt" placeholder="Describe how to edit the selected image...&#10;&#10;Examples:&#10;• Make it warmer and add vignette&#10;• Apply vintage film look with grain&#10;• Add neon glow effect&#10;• Make it darker and more dramatic" rows="4"></textarea>
        <button class="ai-edit-btn" id="btnAIEdit">
          <span class="ai-btn-icon">✎</span>
          <span>Edit with AI</span>
        </button>
      </div>

      <h3 class="section-title">AI Add Element</h3>
      <div class="ai-section">
        <input type="text" id="aiElementPrompt" class="modal-input" placeholder="e.g. red circle, big title GAME OVER, golden star..." style="margin-bottom:8px; font-size:12px; padding:10px 12px;">
        <button class="ai-element-btn" id="btnAIAddElement">
          <span class="ai-btn-icon">🪄</span>
          <span>Add Element with AI</span>
        </button>
        <div class="ai-element-quick" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; margin-top:8px;">
          <button class="ai-quick-btn ai-eq" data-element="Large bold title saying 'HELLO'">📝 Title</button>
          <button class="ai-quick-btn ai-eq" data-element="A vibrant red circle badge">🔴 Circle</button>
          <button class="ai-quick-btn ai-eq" data-element="A blue rectangle banner">🟦 Banner</button>
          <button class="ai-quick-btn ai-eq" data-element="A golden star shape">⭐ Star</button>
          <button class="ai-quick-btn ai-eq" data-element="A thin white horizontal divider line">➖ Divider</button>
          <button class="ai-quick-btn ai-eq" data-element="A subtitle text saying 'Subscribe Now'">💬 CTA</button>
        </div>
      </div>

      <h3 class="section-title">AI Graphic Elements</h3>
      <div class="ai-section">
        <input type="text" id="aiVectorPrompt" class="modal-input" placeholder="e.g. fire flame, golden trophy, cute monster, neon logo..." style="margin-bottom:8px; font-size:12px; padding:10px 12px;">
        <button class="ai-vector-btn" id="btnAIVector">
          <span class="ai-btn-icon">🎨</span>
          <span>Generate AI Graphic</span>
        </button>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:4px; margin-top:8px;">
          <button class="ai-quick-btn ai-vq" data-vector="realistic fire flame burning bright orange">🔥 Fire</button>
          <button class="ai-quick-btn ai-vq" data-vector="golden trophy cup award shiny metallic">🏆 Trophy</button>
          <button class="ai-quick-btn ai-vq" data-vector="cartoon rocket ship launching with smoke">🚀 Rocket</button>
          <button class="ai-quick-btn ai-vq" data-vector="3D red glossy heart with light reflection">❤️ Heart</button>
          <button class="ai-quick-btn ai-vq" data-vector="royal gold crown with jewels and gems">👑 Crown</button>
          <button class="ai-quick-btn ai-vq" data-vector="electric lightning bolt neon blue energy">⚡ Bolt</button>
          <button class="ai-quick-btn ai-vq" data-vector="sparkling diamond gem crystal 3D render">💎 Diamond</button>
          <button class="ai-quick-btn ai-vq" data-vector="gaming controller neon glow RGB lights">🎮 Gaming</button>
        </div>
      </div>

      <h3 class="section-title">Quick Generate</h3>
      <div class="ai-quick-grid">
        <button class="ai-quick-btn" data-aiprompt="cosmic galaxy background with stars" data-aistyle="cosmic">🌌 Galaxy BG</button>
        <button class="ai-quick-btn" data-aiprompt="neon grid cyberpunk cityscape" data-aistyle="neon">💡 Neon City</button>
        <button class="ai-quick-btn" data-aiprompt="warm sunset gradient orange pink" data-aistyle="gradient">🌅 Sunset</button>
        <button class="ai-quick-btn" data-aiprompt="dark abstract music cover" data-aistyle="abstract">🎵 Music BG</button>
        <button class="ai-quick-btn" data-aiprompt="vaporwave retro 80s aesthetic" data-aistyle="vaporwave">📼 Vaporwave</button>
        <button class="ai-quick-btn" data-aiprompt="geometric minimal shapes" data-aistyle="geometric">🔷 Geometric</button>
        <button class="ai-quick-btn" data-aiprompt="grunge dark distorted texture" data-aistyle="grunge">💀 Grunge</button>
        <button class="ai-quick-btn" data-aiprompt="vintage retro halftone warm" data-aistyle="retro">📻 Retro</button>
      </div>
    </div>

    <!-- Templates -->
    <div class="panel-content" id="panel-templates">
      <h3 class="section-title">Design Templates</h3>
      <p class="filter-hint">Pick a pre-designed template. Everything is editable!</p>
      ${designTemplateCards}

      <h3 class="section-title" style="margin-top:24px">Blank Canvas Sizes</h3>
      <div class="templates-grid">${sizeCards}</div>
    </div>

    <!-- Filters -->
    <div class="panel-content" id="panel-filters">
      <h3 class="section-title">Image Adjustments</h3>
      <p class="filter-hint">Select an image on canvas to apply filters.</p>
      <div class="filter-controls">
        ${filterRow('Brightness', -1, 1, 0.01, 0)}
        ${filterRow('Contrast', -1, 1, 0.01, 0)}
        ${filterRow('Saturation', -1, 1, 0.01, 0)}
        ${filterRow('Blur', 0, 1, 0.01, 0)}
        ${filterRow('Hue', -1, 1, 0.01, 0)}
        ${filterRow('Noise', 0, 1000, 10, 0)}
        ${filterRow('Pixelate', 1, 20, 1, 1)}
      </div>
      <h3 class="section-title">Quick Presets</h3>
      <div class="preset-grid">
        <button class="preset-btn" data-preset="none">Original</button>
        <button class="preset-btn" data-preset="grayscale">B&W</button>
        <button class="preset-btn" data-preset="sepia">Sepia</button>
        <button class="preset-btn" data-preset="vintage">Vintage</button>
        <button class="preset-btn" data-preset="cold">Cold</button>
        <button class="preset-btn" data-preset="warm">Warm</button>
        <button class="preset-btn" data-preset="dramatic">Dramatic</button>
        <button class="preset-btn" data-preset="invert">Invert</button>
      </div>
      <button class="action-btn full-width" id="btnApplyFilters">Apply Filters</button>
      <button class="action-btn full-width" id="btnResetFilters">Reset All</button>
    </div>
  </aside>`;
}

function filterRow(name: string, min: number, max: number, step: number, defaultVal: number): string {
  return `<div class="filter-row">
    <label>${name} <span class="filter-val" id="val${name}">${defaultVal}</span></label>
    <input type="range" id="filter${name}" min="${min}" max="${max}" step="${step}" value="${defaultVal}" class="filter-range">
  </div>`;
}

function buildNewProjectModal(): string {
  return `
  <div class="modal-overlay hidden" id="newProjectModal">
    <div class="modal">
      <div class="modal-header"><h2>Create New Design</h2><button class="modal-close" id="closeNewModal">✕</button></div>
      <div class="modal-body">
        <div class="size-presets">
          <button class="size-preset active" data-w="1280" data-h="720"><span class="preset-label">YouTube Thumbnail</span><span class="preset-dim">1280 × 720</span></button>
          <button class="size-preset" data-w="3000" data-h="3000"><span class="preset-label">Album Cover</span><span class="preset-dim">3000 × 3000</span></button>
          <button class="size-preset" data-w="1080" data-h="1080"><span class="preset-label">Instagram Post</span><span class="preset-dim">1080 × 1080</span></button>
          <button class="size-preset" data-w="1080" data-h="1920"><span class="preset-label">Instagram Story</span><span class="preset-dim">1080 × 1920</span></button>
          <button class="size-preset" data-w="1920" data-h="1080"><span class="preset-label">Full HD</span><span class="preset-dim">1920 × 1080</span></button>
          <button class="size-preset" data-w="820" data-h="312"><span class="preset-label">Facebook Cover</span><span class="preset-dim">820 × 312</span></button>
        </div>
        <div class="custom-size"><h3>Custom Size</h3>
          <div class="custom-size-inputs">
            <div><label>Width (px)</label><input type="number" id="customWidth" value="1280" min="100" max="10000"></div>
            <span class="x-label">×</span>
            <div><label>Height (px)</label><input type="number" id="customHeight" value="720" min="100" max="10000"></div>
          </div>
          <div class="bg-color-row"><label>Background</label>
            <div class="bg-options">
              <button class="bg-opt active" data-bg="#ffffff" style="background:#fff"></button>
              <button class="bg-opt" data-bg="#000000" style="background:#000"></button>
              <button class="bg-opt" data-bg="#1a1a2e" style="background:#1a1a2e"></button>
              <button class="bg-opt transparent-bg" data-bg="transparent" title="Transparent"></button>
              <input type="color" id="customBgColor" value="#ffffff" class="bg-color-picker">
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary" id="cancelNewModal">Cancel</button>
        <button class="modal-btn primary" id="createNewProject">Create Design</button>
      </div>
    </div>
  </div>`;
}

function buildExportModal(): string {
  return `
  <div class="modal-overlay hidden" id="exportModal">
    <div class="modal">
      <div class="modal-header"><h2>Export Design</h2><button class="modal-close" id="closeExportModal">✕</button></div>
      <div class="modal-body">
        <div class="export-options">
          <div class="export-format"><label>Format</label>
            <div class="format-btns">
              <button class="format-btn active" data-format="png">PNG</button>
              <button class="format-btn" data-format="jpeg">JPEG</button>
              <button class="format-btn" data-format="svg">SVG</button>
            </div>
          </div>
          <div class="export-quality" id="qualityRow"><label>Quality</label>
            <input type="range" id="exportQuality" min="0.1" max="1" step="0.05" value="1">
            <span id="qualityVal">100%</span>
          </div>
          <div class="export-scale"><label>Scale</label>
            <select id="exportScale" class="prop-select">
              <option value="0.5">0.5x (Half)</option>
              <option value="1" selected>1x (Original)</option>
              <option value="2">2x (Double)</option>
              <option value="3">3x (Triple)</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary" id="cancelExportModal">Cancel</button>
        <button class="modal-btn primary" id="doExport">Download</button>
      </div>
    </div>
  </div>`;
}

function buildAIModal(): string {
  return `
  <div class="modal-overlay hidden" id="aiAdvancedModal">
    <div class="modal">
      <div class="modal-header"><h2>✨ AI Image Studio</h2><button class="modal-close" id="closeAIModal">✕</button></div>
      <div class="modal-body">
        <div class="ai-section">
          <label class="ai-label">Prompt</label>
          <textarea id="aiModalPrompt" class="ai-prompt" placeholder="Describe your design in detail..." rows="4"></textarea>
          <div class="prop-grid" style="margin-top:12px">
            <div class="prop-row">
              <label>Width</label>
              <input type="number" id="aiModalWidth" class="prop-input" value="1280" min="100" max="5000">
            </div>
            <div class="prop-row">
              <label>Height</label>
              <input type="number" id="aiModalHeight" class="prop-input" value="720" min="100" max="5000">
            </div>
          </div>
          <label class="ai-label" style="margin-top:12px">Style</label>
          <select id="aiModalStyle" class="prop-select ai-select">
            <option value="auto">🔮 Auto-Detect</option>
            <option value="abstract">🌊 Abstract</option>
            <option value="gradient">🌈 Gradient</option>
            <option value="geometric">🔷 Geometric</option>
            <option value="neon">💡 Neon Glow</option>
            <option value="minimal">◻️ Minimal</option>
            <option value="vaporwave">🌅 Vaporwave</option>
            <option value="cosmic">🌌 Cosmic</option>
            <option value="grunge">💀 Grunge</option>
            <option value="retro">📻 Retro</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary" id="cancelAIModal">Cancel</button>
        <button class="modal-btn primary" id="doAIGenerate">✦ Generate</button>
      </div>
    </div>
  </div>`;
}
