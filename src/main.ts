// PixelForge — Entry Point

import './style.css';
import { buildLayout } from './layout';
import { initEditor } from './editor';

function bootstrap(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = buildLayout();
  initEditor();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
