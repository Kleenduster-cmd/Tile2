import { GeneratedTile, TileGeneratorSettings } from '../types/tileset';
import { generateTileset } from './tileGenerator';

export interface ExportOptions {
  scale: 1 | 2 | 4;
  format: 'grid_8x8' | 'grid_16x4' | 'strip_horizontal';
  includeMetadata: boolean;
  forceTransparent?: boolean;
}

export function createTilesetCanvas(
  tiles: GeneratedTile[],
  scale: 1 | 2 | 4 = 1,
  format: 'grid_8x8' | 'grid_16x4' | 'strip_horizontal' = 'grid_8x8'
): HTMLCanvasElement {
  const tileSize = 32 * scale;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  let cols = 8;
  let rows = 8;

  if (format === 'grid_16x4') {
    cols = 16;
    rows = 4;
  } else if (format === 'strip_horizontal') {
    cols = tiles.length;
    rows = 1;
  }

  canvas.width = cols * tileSize;
  canvas.height = rows * tileSize;

  // Clear canvas transparently (guaranteed 100% alpha transparency)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Temporary canvas to upscale individual 32x32 tiles crisply
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 32;
  tempCanvas.height = 32;
  const tempCtx = tempCanvas.getContext('2d')!;

  tiles.forEach((tile, index) => {
    let col = tile.exportCol;
    let row = tile.exportRow;

    if (format === 'grid_16x4') {
      col = index % 16;
      row = Math.floor(index / 16);
    } else if (format === 'strip_horizontal') {
      col = index;
      row = 0;
    }

    tempCtx.putImageData(tile.imageData, 0, 0);

    ctx.drawImage(
      tempCanvas,
      0,
      0,
      32,
      32,
      col * tileSize,
      row * tileSize,
      tileSize,
      tileSize
    );
  });

  return canvas;
}

// Dedicated 1-click helper to export all 64 tiles as a 32x32 tileset in one transparent PNG image
export function download32x32TransparentTileset(
  tiles: GeneratedTile[],
  baseImage?: ImageData | null,
  settings?: TileGeneratorSettings,
  format: 'grid_8x8' | 'grid_16x4' | 'strip_horizontal' = 'grid_8x8',
  filename = 'rpg_tileset_32x32_transparent.png'
) {
  // If baseImage and settings are provided and preview was using an underlay, generate pure transparent tiles
  let exportTiles = tiles;
  if (baseImage && settings && settings.underlayType !== 'transparent') {
    exportTiles = generateTileset(baseImage, {
      ...settings,
      underlayType: 'transparent',
    });
  }

  const canvas = createTilesetCanvas(exportTiles, 1, format);
  downloadCanvasAsPng(canvas, filename);
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function downloadTileAsPng(tile: GeneratedTile, scale: 1 | 2 | 4 = 1) {
  const canvas = document.createElement('canvas');
  const size = 32 * scale;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const temp = document.createElement('canvas');
  temp.width = 32;
  temp.height = 32;
  const tCtx = temp.getContext('2d')!;
  tCtx.putImageData(tile.imageData, 0, 0);

  ctx.drawImage(temp, 0, 0, 32, 32, 0, 0, size, size);
  downloadCanvasAsPng(canvas, `${tile.id}_${size}x${size}.png`);
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } catch {
          resolve(false);
        }
      }, 'image/png');
    });
  } catch {
    return false;
  }
}

export function generateTileMetadataJson(tiles: GeneratedTile[], scale = 1): string {
  const meta = {
    generator: 'TileForge 32 - RPG Tileset Studio',
    version: '1.0.0',
    tileSize: 32 * scale,
    baseTileSize: 32,
    columns: 8,
    rows: 8,
    tiles: tiles.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      col: t.exportCol,
      row: t.exportRow,
      pixelX: t.exportCol * 32 * scale,
      pixelY: t.exportRow * 32 * scale,
      isSlope: t.isSlope || false,
      isSolid: t.isSolid || false,
      description: t.description,
    })),
  };
  return JSON.stringify(meta, null, 2);
}

export function downloadJson(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
