import { createBlankImageData, hexToRgb } from './tileGenerator';

// Keywords to color palette and texture archetype mapper for procedural fallback or prompt enhancement
interface PaletteStyle {
  colors: string[];
  pattern: 'grain' | 'brick' | 'ripples' | 'cracks' | 'organic' | 'panels';
}

function analyzePrompt(prompt: string): PaletteStyle {
  const p = prompt.toLowerCase();

  if (p.includes('water') || p.includes('sea') || p.includes('ocean') || p.includes('river')) {
    return {
      colors: ['#124d80', '#1c6ea4', '#2991cf', '#68c5f5', '#c8efff'],
      pattern: 'ripples',
    };
  }
  if (p.includes('lava') || p.includes('magma') || p.includes('fire') || p.includes('volcano')) {
    return {
      colors: ['#181214', '#2d1c20', '#991c0e', '#e64a19', '#ffca28'],
      pattern: 'cracks',
    };
  }
  if (p.includes('dungeon') || p.includes('brick') || p.includes('wall') || p.includes('temple') || p.includes('ruin')) {
    return {
      colors: ['#1e2025', '#333740', '#4a4f5c', '#686e7e', '#8891a3'],
      pattern: 'brick',
    };
  }
  if (p.includes('tech') || p.includes('sci-fi') || p.includes('metal') || p.includes('cyber') || p.includes('steel')) {
    return {
      colors: ['#10151c', '#202936', '#3b4859', '#57677d', '#00e5ff'],
      pattern: 'panels',
    };
  }
  if (p.includes('sand') || p.includes('desert') || p.includes('dune')) {
    return {
      colors: ['#99682b', '#b8833d', '#d9a657', '#ecc27b', '#fae2a8'],
      pattern: 'ripples',
    };
  }
  if (p.includes('ice') || p.includes('snow') || p.includes('frost') || p.includes('crystal')) {
    return {
      colors: ['#285c7c', '#4689ad', '#74bbe0', '#b6e5fa', '#ffffff'],
      pattern: 'cracks',
    };
  }
  if (p.includes('mud') || p.includes('dirt') || p.includes('earth') || p.includes('soil')) {
    return {
      colors: ['#382416', '#4f331f', '#6b472c', '#8a5e3d', '#a87853'],
      pattern: 'organic',
    };
  }
  if (p.includes('purple') || p.includes('poison') || p.includes('slime') || p.includes('alien')) {
    return {
      colors: ['#1a0b26', '#36164d', '#612b8a', '#9447d1', '#76ff03'],
      pattern: 'organic',
    };
  }

  // Default green/grass/nature
  return {
    colors: ['#236318', '#348525', '#49a836', '#64c74e', '#a8f095'],
    pattern: 'organic',
  };
}

export function synthesizeProceduralTexture(prompt: string): ImageData {
  const { colors, pattern } = analyzePrompt(prompt);
  const rgbList = colors.map(hexToRgb);
  const img = createBlankImageData(32, 32);
  const d = img.data;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      let colIdx = 1;

      if (pattern === 'ripples') {
        const wave = Math.sin(x * 0.3 + y * 0.2) * 0.5 + Math.cos(x * 0.2 - y * 0.4) * 0.5;
        const norm = (wave + 1) / 2;
        colIdx = Math.floor(norm * (rgbList.length - 0.01));
      } else if (pattern === 'brick') {
        const isH = y % 8 === 0;
        const row = Math.floor(y / 8);
        const isV = row % 2 === 0 ? x % 16 === 0 : (x + 8) % 16 === 0;
        if (isH || isV) {
          colIdx = 0;
        } else if (y % 8 === 1) {
          colIdx = 3;
        } else {
          const n = (Math.sin(x * 12.3 + y * 45.6) + 1) / 2;
          colIdx = n > 0.6 ? 2 : 1;
        }
      } else if (pattern === 'cracks') {
        const line = Math.abs(Math.sin(x * 0.25 + y * 0.15) * 8 - (y * 0.3));
        if (line < 1.0) colIdx = rgbList.length - 1;
        else if (line < 2.0) colIdx = rgbList.length - 2;
        else colIdx = Math.floor(((Math.sin(x * 3 + y * 5) + 1) / 2) * 2);
      } else if (pattern === 'panels') {
        const isBorder = x === 0 || x === 31 || y === 0 || y === 31 || x === 16 || y === 16;
        if (isBorder) colIdx = 0;
        else if (x === 1 || y === 1) colIdx = 3;
        else colIdx = 1;
      } else {
        // Organic
        const n = (Math.sin(x * 0.5 + y * 0.8) + Math.cos(x * 0.9 - y * 0.4) + Math.sin(x * 1.7 + y * 2.3) * 0.5 + 2.5) / 5;
        colIdx = Math.floor(Math.max(0, Math.min(0.99, n)) * rgbList.length);
      }

      const c = rgbList[colIdx] || rgbList[0];
      d[idx] = c[0];
      d[idx + 1] = c[1];
      d[idx + 2] = c[2];
      d[idx + 3] = 255;
    }
  }

  return img;
}

export async function generateAiTexture(prompt: string): Promise<ImageData> {
  try {
    const res = await fetch('/api/generate-texture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.hexMatrix && Array.isArray(data.hexMatrix) && data.hexMatrix.length >= 16) {
        const img = createBlankImageData(32, 32);
        const d = img.data;
        for (let y = 0; y < 32; y++) {
          const row = data.hexMatrix[y] || data.hexMatrix[0];
          for (let x = 0; x < 32; x++) {
            const hex = row[x] || '#333333';
            const rgb = hexToRgb(hex);
            const idx = (y * 32 + x) * 4;
            d[idx] = rgb[0];
            d[idx + 1] = rgb[1];
            d[idx + 2] = rgb[2];
            d[idx + 3] = 255;
          }
        }
        return img;
      }
    }
  } catch (err) {
    console.warn('AI generation server unavailable, using procedural synthesizer:', err);
  }

  // Graceful procedural synthesis with deterministic artistic rules
  return synthesizeProceduralTexture(prompt);
}
