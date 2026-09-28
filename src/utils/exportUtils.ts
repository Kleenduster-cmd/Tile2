import JSZip from 'jszip';
import { GeneratedTile, TileGeneratorSettings } from '../types/tileset';
import { generateTileset } from './tileGenerator';

export interface ExportOptions {
  scale?: number;
  format: 'grid_8x8' | 'grid_16x4' | 'strip_horizontal';
  includeMetadata: boolean;
  forceTransparent?: boolean;
}

/**
 * Creates a spritesheet canvas.
 * For exported tilesets, scale=1 guarantees each tile strictly retains 32x32 px.
 * - grid_8x8: 256×256 px total (8 cols × 8 rows of 32×32 tiles)
 * - grid_16x4: 512×128 px total (16 cols × 4 rows of 32×32 tiles)
 * - strip_horizontal: 2048×32 px total (64 cols × 1 row of 32×32 tiles)
 */
export function createTilesetCanvas(
  tiles: GeneratedTile[],
  scale = 1,
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

  // Clear canvas transparently (guaranteed 100% alpha transparency for negative space)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Buffer canvas for native 32x32 tile data
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

/**
 * Dedicated 1-click helper to export all 64 tiles as a strict 32x32 tileset in one transparent PNG image
 * Guarantees every single tile retains exactly 32x32 pixels.
 */
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

  // Scale is strictly 1 to ensure 32x32 pixel tiles are retained
  const canvas = createTilesetCanvas(exportTiles, 1, format);
  downloadCanvasAsPng(canvas, filename);
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Exports a single tile as a PNG file. Defaults to native 32x32 px.
 */
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

/**
 * Copies the 32x32 spritesheet canvas to the clipboard.
 */
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

/**
 * Generates JSON metadata preserving 32x32 dimensions and exact pixel offsets.
 */
export function generateTileMetadataJson(
  tiles: GeneratedTile[],
  format: 'grid_8x8' | 'grid_16x4' | 'strip_horizontal' = 'grid_8x8'
): string {
  const numCols = format === 'grid_8x8' ? 8 : format === 'grid_16x4' ? 16 : tiles.length;
  const numRows = format === 'grid_8x8' ? 8 : format === 'grid_16x4' ? 4 : 1;

  const meta = {
    generator: 'TileForge 2.5D - RPG Tileset Studio',
    version: '1.0.0',
    projection: "30° Top-Down Bird's-Eye View (Non-Isometric Grid)",
    tileWidth: 32,
    tileHeight: 32,
    tileSize: 32,
    layoutFormat: format,
    sheetWidth: numCols * 32,
    sheetHeight: numRows * 32,
    totalTiles: tiles.length,
    columns: numCols,
    rows: numRows,
    tiles: tiles.map((t, idx) => {
      let col = t.exportCol;
      let row = t.exportRow;
      if (format === 'grid_16x4') {
        col = idx % 16;
        row = Math.floor(idx / 16);
      } else if (format === 'strip_horizontal') {
        col = idx;
        row = 0;
      }
      return {
        id: t.id,
        name: t.name,
        category: t.category,
        col,
        row,
        pixelX: col * 32,
        pixelY: row * 32,
        width: 32,
        height: 32,
        isSlope: t.isSlope || false,
        isSolid: t.isSolid || false,
        description: t.description,
      };
    }),
  };
  return JSON.stringify(meta, null, 2);
}

/**
 * Generates standard Tiled Map Editor TSX XML definition for the 32x32 tileset.
 */
export function generateTiledTsx(
  imageFilename = 'rpg_tileset_32x32_transparent.png',
  format: 'grid_8x8' | 'grid_16x4' | 'strip_horizontal' = 'grid_8x8'
): string {
  const numCols = format === 'grid_8x8' ? 8 : format === 'grid_16x4' ? 16 : 64;
  const numRows = format === 'grid_8x8' ? 8 : format === 'grid_16x4' ? 4 : 1;
  const width = numCols * 32;
  const height = numRows * 32;

  return `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.10.2" name="rpg_tileset_32x32" tilewidth="32" tileheight="32" tilecount="64" columns="${numCols}">
 <image source="${imageFilename}" width="${width}" height="${height}"/>
</tileset>`;
}

/**
 * Downloads all 64 individual tiles as separate 32x32 PNG files in a ZIP archive.
 * Each file is guaranteed to retain exact 32x32 pixel dimensions with transparent alpha.
 */
export async function downloadAll32x32TilesZip(
  tiles: GeneratedTile[],
  zipFilename = 'rpg_tileset_32x32_individual_tiles.zip'
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('tiles_32x32') || zip;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 32;
  tempCanvas.height = 32;
  const ctx = tempCanvas.getContext('2d')!;

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    ctx.clearRect(0, 0, 32, 32);
    ctx.putImageData(tile.imageData, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    // Extract base64 data
    const base64 = dataUrl.split(',')[1];
    const prefix = String(i).padStart(2, '0');
    folder.file(`${prefix}_${tile.id}_32x32.png`, base64, { base64: true });
  }

  // Also include the 32x32 metadata JSON inside the zip
  const metadata = generateTileMetadataJson(tiles, 'grid_8x8');
  folder.file('tileset_metadata_32x32.json', metadata);
  folder.file('tileset_32x32.tsx', generateTiledTsx('rpg_tileset_32x32_transparent.png', 'grid_8x8'));

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  link.click();
  URL.revokeObjectURL(url);
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

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
