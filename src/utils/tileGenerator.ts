import { GeneratedTile, TileGeneratorSettings, TileCategory } from '../types/tileset';
import { PRESET_TEXTURES } from './pixelPresets';

export function createBlankImageData(width = 32, height = 32): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return ctx.createImageData(width, height);
}

export function imageDataToDataUrl(imgData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16) || 0;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Blend RGBA foreground over background
export function blendPixel(
  bg: [number, number, number, number],
  fg: [number, number, number, number]
): [number, number, number, number] {
  const fgA = fg[3] / 255;
  if (fgA >= 0.99) return fg;
  if (fgA <= 0.01) return bg;

  const bgA = bg[3] / 255;
  const outA = fgA + bgA * (1 - fgA);
  if (outA <= 0.001) return [0, 0, 0, 0];

  const r = Math.round((fg[0] * fgA + bg[0] * bgA * (1 - fgA)) / outA);
  const g = Math.round((fg[1] * fgA + bg[1] * bgA * (1 - fgA)) / outA);
  const b = Math.round((fg[2] * fgA + bg[2] * bgA * (1 - fgA)) / outA);
  return [r, g, b, Math.round(outA * 255)];
}

// Tile definition metadata
export interface TileSpec {
  id: string;
  name: string;
  category: TileCategory;
  description: string;
  col: number;
  row: number;
  isSolid?: boolean;
  isSlope?: boolean;
}

export const TILE_CATALOG: TileSpec[] = [
  // Row 0: Core & Fill
  { id: 'center', name: 'Center / Fill', category: 'core', description: 'Full seamless base texture for interiors & plateaus', col: 0, row: 0 },
  { id: 'center_alt1', name: 'Center Variation A', category: 'core', description: 'Subtle dither and surface pebble variation', col: 1, row: 0 },
  { id: 'center_alt2', name: 'Center Variation B', category: 'core', description: 'Chipped seam & mineral accent variation', col: 2, row: 0 },
  { id: 'isolated', name: 'Isolated Island / Pillar', category: 'parts', description: 'Surrounded by edges on all 4 cardinal directions', col: 3, row: 0 },
  { id: 'corridor_vert', name: 'Vertical Path', category: 'parts', description: '1-tile wide pathway bordered on left and right', col: 4, row: 0 },
  { id: 'corridor_horiz', name: 'Horizontal Path', category: 'parts', description: '1-tile wide pathway bordered on top and bottom', col: 5, row: 0 },
  { id: 'cliff_stairs', name: 'Carved Stairs', category: 'cliffs', description: 'Stone steps ascending the wall elevation', col: 6, row: 0 },
  { id: 'cliff_wall_mid', name: 'Cliff Wall Face', category: 'cliffs', description: 'Vertical drop wall with rock strata & drop shadow', col: 7, row: 0 },

  // Row 1: 4 Cardinal Edges
  { id: 'edge_top', name: 'Edge North (Top)', category: 'edges', description: 'Top perimeter wall edge with border finish', col: 0, row: 1 },
  { id: 'edge_bottom', name: 'Edge South (Bottom)', category: 'edges', description: 'Bottom perimeter wall edge with cast shadow', col: 1, row: 1 },
  { id: 'edge_left', name: 'Edge West (Left)', category: 'edges', description: 'Left perimeter edge border', col: 2, row: 1 },
  { id: 'edge_right', name: 'Edge East (Right)', category: 'edges', description: 'Right perimeter edge border', col: 3, row: 1 },
  { id: 'endcap_n', name: 'Endcap North', category: 'parts', description: 'Closed dead-end facing North', col: 4, row: 1 },
  { id: 'endcap_s', name: 'Endcap South', category: 'parts', description: 'Closed dead-end facing South', col: 5, row: 1 },
  { id: 'endcap_w', name: 'Endcap West', category: 'parts', description: 'Closed dead-end facing West', col: 6, row: 1 },
  { id: 'endcap_e', name: 'Endcap East', category: 'parts', description: 'Closed dead-end facing East', col: 7, row: 1 },

  // Row 2: 4 Outer Corners (Convex 90 deg)
  { id: 'corner_outer_tl', name: 'Outer Corner NW', category: 'corners_outer', description: 'Top-Left 90° convex corner turn', col: 0, row: 2 },
  { id: 'corner_outer_tr', name: 'Outer Corner NE', category: 'corners_outer', description: 'Top-Right 90° convex corner turn', col: 1, row: 2 },
  { id: 'corner_outer_bl', name: 'Outer Corner SW', category: 'corners_outer', description: 'Bottom-Left 90° convex corner turn', col: 2, row: 2 },
  { id: 'corner_outer_br', name: 'Outer Corner SE', category: 'corners_outer', description: 'Bottom-Right 90° convex corner turn', col: 3, row: 2 },
  { id: 'cliff_top_lip', name: 'Cliff Top Edge', category: 'cliffs', description: 'Top cliff lip transitioning into vertical wall drop', col: 4, row: 2 },
  { id: 'cliff_base_seam', name: 'Cliff Base Seam', category: 'cliffs', description: 'Base of cliff meeting lower ground terrain', col: 5, row: 2 },
  { id: 'cliff_corner_l', name: 'Cliff Wall Left Edge', category: 'cliffs', description: 'Left corner profile of elevated cliff wall', col: 6, row: 2 },
  { id: 'cliff_corner_r', name: 'Cliff Wall Right Edge', category: 'cliffs', description: 'Right corner profile of elevated cliff wall', col: 7, row: 2 },

  // Row 3: 4 Inner Corners (Concave inside turns)
  { id: 'corner_inner_tl', name: 'Inner Corner NW', category: 'corners_inner', description: 'Top-Left inside concave corner', col: 0, row: 3 },
  { id: 'corner_inner_tr', name: 'Inner Corner NE', category: 'corners_inner', description: 'Top-Right inside concave corner', col: 1, row: 3 },
  { id: 'corner_inner_bl', name: 'Inner Corner SW', category: 'corners_inner', description: 'Bottom-Left inside concave corner', col: 2, row: 3 },
  { id: 'corner_inner_br', name: 'Inner Corner SE', category: 'corners_inner', description: 'Bottom-Right inside concave corner', col: 3, row: 3 },
  { id: 't_junction_n', name: 'T-Junction North', category: 'parts', description: '3-way intersection with branch facing North', col: 4, row: 3 },
  { id: 't_junction_s', name: 'T-Junction South', category: 'parts', description: '3-way intersection with branch facing South', col: 5, row: 3 },
  { id: 't_junction_w', name: 'T-Junction West', category: 'parts', description: '3-way intersection with branch facing West', col: 6, row: 3 },
  { id: 'cross_4way', name: '4-Way Crossroads', category: 'parts', description: 'Center intersection open on all 4 sides', col: 7, row: 3 },

  // Row 4: 45° Slopes
  { id: 'slope_ne_fill', name: 'Slope 45° NE (Fill SE)', category: 'slopes', description: 'Diagonal slope heading NE; filled on Southeast', col: 0, row: 4, isSlope: true },
  { id: 'slope_nw_fill', name: 'Slope 45° NW (Fill SW)', category: 'slopes', description: 'Diagonal slope heading NW; filled on Southwest', col: 1, row: 4, isSlope: true },
  { id: 'slope_se_fill', name: 'Slope 45° SE (Fill NW)', category: 'slopes', description: 'Diagonal slope heading SE; filled on Northwest', col: 2, row: 4, isSlope: true },
  { id: 'slope_sw_fill', name: 'Slope 45° SW (Fill NE)', category: 'slopes', description: 'Diagonal slope heading SW; filled on Northeast', col: 3, row: 4, isSlope: true },
  { id: 'slope_gentle_n1', name: 'Gentle Slope N (Part 1)', category: 'slopes', description: '2:1 shallow slope North left-half transition', col: 4, row: 4, isSlope: true },
  { id: 'slope_gentle_n2', name: 'Gentle Slope N (Part 2)', category: 'slopes', description: '2:1 shallow slope North right-half transition', col: 5, row: 4, isSlope: true },
  { id: 'slope_gentle_s1', name: 'Gentle Slope S (Part 1)', category: 'slopes', description: '2:1 shallow slope South left-half transition', col: 6, row: 4, isSlope: true },
  { id: 'slope_gentle_s2', name: 'Gentle Slope S (Part 2)', category: 'slopes', description: '2:1 shallow slope South right-half transition', col: 7, row: 4, isSlope: true },

  // Row 5: Smooth Curves & Rounded Edges
  { id: 'curve_convex_tl', name: 'Curved Outer NW', category: 'curves', description: 'Smooth rounded quarter-circle convex corner NW', col: 0, row: 5 },
  { id: 'curve_convex_tr', name: 'Curved Outer NE', category: 'curves', description: 'Smooth rounded quarter-circle convex corner NE', col: 1, row: 5 },
  { id: 'curve_convex_bl', name: 'Curved Outer SW', category: 'curves', description: 'Smooth rounded quarter-circle convex corner SW', col: 2, row: 5 },
  { id: 'curve_convex_br', name: 'Curved Outer SE', category: 'curves', description: 'Smooth rounded quarter-circle convex corner SE', col: 3, row: 5 },
  { id: 'curve_concave_tl', name: 'Curved Inner NW', category: 'curves', description: 'Smooth rounded quarter-circle concave inner turn NW', col: 4, row: 5 },
  { id: 'curve_concave_tr', name: 'Curved Inner NE', category: 'curves', description: 'Smooth rounded quarter-circle concave inner turn NE', col: 5, row: 5 },
  { id: 'curve_concave_bl', name: 'Curved Inner SW', category: 'curves', description: 'Smooth rounded quarter-circle concave inner turn SW', col: 6, row: 5 },
  { id: 'curve_concave_br', name: 'Curved Inner SE', category: 'curves', description: 'Smooth rounded quarter-circle concave inner turn SE', col: 7, row: 5 },

  // Row 6: 2.5D Elevation Ramps & Lateral Slopes
  { id: 'slope25d_ramp_v_full', name: '2.5D Vertical Ramp (N-S)', category: 'slopes_25d', description: 'Self-contained 1-tile climb from lower level up to high plateau', col: 0, row: 6, isSlope: true },
  { id: 'slope25d_ramp_v_top', name: '2.5D Ramp Top Crest', category: 'slopes_25d', description: 'Upper entrance of 2-tile ramp meeting high plateau floor', col: 1, row: 6, isSlope: true },
  { id: 'slope25d_ramp_v_base', name: '2.5D Ramp Base Apron', category: 'slopes_25d', description: 'Bottom exit of 2-tile ramp meeting lower ground with cast shadow', col: 2, row: 6, isSlope: true },
  { id: 'slope25d_ramp_lat_w2e_top', name: '2.5D Lateral Ramp W→E (Ledge)', category: 'slopes_25d', description: 'Horizontal ramp walkway climbing a cliff face from West to East', col: 3, row: 6, isSlope: true },
  { id: 'slope25d_ramp_lat_w2e_wall', name: '2.5D Lateral Ramp W→E (Wedge Wall)', category: 'slopes_25d', description: 'Cliff wall face under W→E ramp increasing in height towards East', col: 4, row: 6, isSlope: true },
  { id: 'slope25d_ramp_lat_e2w_top', name: '2.5D Lateral Ramp E→W (Ledge)', category: 'slopes_25d', description: 'Horizontal ramp walkway climbing a cliff face from East to West', col: 5, row: 6, isSlope: true },
  { id: 'slope25d_ramp_lat_e2w_wall', name: '2.5D Lateral Ramp E→W (Wedge Wall)', category: 'slopes_25d', description: 'Cliff wall face under E→W ramp increasing in height towards West', col: 6, row: 6, isSlope: true },
  { id: 'slope25d_natural_hill', name: '2.5D Rolling Hill / Mound', category: 'slopes_25d', description: 'Smooth rounded 2.5D elevation with upper sunlit dome and lower shadow', col: 7, row: 6, isSlope: true },

  // Row 7: 2.5D Diagonal Cliff Slopes
  { id: 'cliff_diag_slope_nw', name: '2.5D Diagonal Cliff (Slope NW)', category: 'slopes_25d', description: 'Upper plateau NW, sloped cliff wall in middle, lower ground in SE', col: 0, row: 7, isSlope: true },
  { id: 'cliff_diag_slope_ne', name: '2.5D Diagonal Cliff (Slope NE)', category: 'slopes_25d', description: 'Upper plateau NE, sloped cliff wall in middle, lower ground in SW', col: 1, row: 7, isSlope: true },
  { id: 'cliff_diag_slope_sw', name: '2.5D Diagonal Cliff (Slope SW)', category: 'slopes_25d', description: 'Slanted cliff face elevation facing South-West with drop shadow', col: 2, row: 7, isSlope: true },
  { id: 'cliff_diag_slope_se', name: '2.5D Diagonal Cliff (Slope SE)', category: 'slopes_25d', description: 'Slanted cliff face elevation facing South-East with drop shadow', col: 3, row: 7, isSlope: true },
  { id: 'cliff_diag_top_nw', name: '2.5D Diagonal Cliff Lip NW', category: 'slopes_25d', description: 'Diagonal clifftop edge facing NW with rock trim and plateau rim', col: 4, row: 7, isSlope: true },
  { id: 'cliff_diag_top_ne', name: '2.5D Diagonal Cliff Lip NE', category: 'slopes_25d', description: 'Diagonal clifftop edge facing NE with rock trim and plateau rim', col: 5, row: 7, isSlope: true },
  { id: 'cliff_diag_base_nw', name: '2.5D Diagonal Cliff Base NW', category: 'slopes_25d', description: 'Diagonal cliff base meeting ground with heavy cast shadow NW', col: 6, row: 7, isSlope: true },
  { id: 'cliff_diag_base_ne', name: '2.5D Diagonal Cliff Base NE', category: 'slopes_25d', description: 'Diagonal cliff base meeting ground with heavy cast shadow NE', col: 7, row: 7, isSlope: true },
];

// Helper to determine if pixel (x,y) is inside primary terrain shape for a given tile ID
function evalShape(id: string, x: number, y: number, radius: number): boolean {
  switch (id) {
    case 'center':
    case 'center_alt1':
    case 'center_alt2':
      return true;

    // Edges (boundary margin 8px by default for clear RPG border transitions)
    case 'edge_top':
      return y >= 8;
    case 'edge_bottom':
      return y < 24;
    case 'edge_left':
      return x >= 8;
    case 'edge_right':
      return x < 24;

    // Outer corners (convex 90 deg)
    case 'corner_outer_tl':
      return x >= 8 && y >= 8;
    case 'corner_outer_tr':
      return x < 24 && y >= 8;
    case 'corner_outer_bl':
      return x >= 8 && y < 24;
    case 'corner_outer_br':
      return x < 24 && y < 24;

    // Inner corners (concave inside turns)
    case 'corner_inner_tl':
      return !(x < 8 && y < 8);
    case 'corner_inner_tr':
      return !(x >= 24 && y < 8);
    case 'corner_inner_bl':
      return !(x < 8 && y >= 24);
    case 'corner_inner_br':
      return !(x >= 24 && y >= 24);

    // Isolated & Corridors
    case 'isolated':
      return x >= 6 && x < 26 && y >= 6 && y < 26;
    case 'corridor_vert':
      return x >= 8 && x < 24;
    case 'corridor_horiz':
      return y >= 8 && y < 24;

    // Endcaps
    case 'endcap_n':
      return x >= 8 && x < 24 && y >= 10;
    case 'endcap_s':
      return x >= 8 && x < 24 && y < 22;
    case 'endcap_w':
      return y >= 8 && y < 24 && x >= 10;
    case 'endcap_e':
      return y >= 8 && y < 24 && x < 22;

    // T-junctions
    case 't_junction_n':
      return (y >= 8 && y < 24) || (x >= 8 && x < 24 && y < 8);
    case 't_junction_s':
      return (y >= 8 && y < 24) || (x >= 8 && x < 24 && y >= 24);
    case 't_junction_w':
      return (x >= 8 && x < 24) || (y >= 8 && y < 24 && x < 8);
    case 'cross_4way':
      return (x >= 8 && x < 24) || (y >= 8 && y < 24);

    // 45 deg slopes
    case 'slope_ne_fill':
      // Slanted line from bottom-left to top-right, filled on bottom-right (x + y >= 31)
      return (x + y) >= 31;
    case 'slope_nw_fill':
      // Slanted line from top-left to bottom-right, filled on bottom-left (y >= x)
      return y >= x;
    case 'slope_se_fill':
      // Slanted line from top-left to bottom-right, filled on top-left (y <= x)
      return y <= x;
    case 'slope_sw_fill':
      // Slanted line from bottom-left to top-right, filled on top-left (x + y <= 31)
      return (x + y) <= 31;

    // Gentle 2:1 slopes (shallow angle)
    case 'slope_gentle_n1':
      // Left part of 2:1 slope: starts at y=31 on left, climbs to y=16 at right
      return y >= Math.round(31 - (x * 0.5));
    case 'slope_gentle_n2':
      // Right part of 2:1 slope: starts at y=16 on left, climbs to y=0 at right
      return y >= Math.round(15 - (x * 0.5));
    case 'slope_gentle_s1':
      // Left part of 2:1 descending slope
      return y <= Math.round(x * 0.5);
    case 'slope_gentle_s2':
      // Right part of 2:1 descending slope
      return y <= Math.round(16 + (x * 0.5));

    // Curved Outer (Convex)
    case 'curve_convex_tl': {
      const r = Math.max(12, Math.min(28, radius));
      // Outer cutout at top-left: outside circle centered at (r, r)
      if (x < r && y < r) {
        const dx = r - x;
        const dy = r - y;
        return (dx * dx + dy * dy) <= (r * r);
      }
      return true;
    }
    case 'curve_convex_tr': {
      const r = Math.max(12, Math.min(28, radius));
      if (x >= (31 - r) && y < r) {
        const dx = x - (31 - r);
        const dy = r - y;
        return (dx * dx + dy * dy) <= (r * r);
      }
      return true;
    }
    case 'curve_convex_bl': {
      const r = Math.max(12, Math.min(28, radius));
      if (x < r && y >= (31 - r)) {
        const dx = r - x;
        const dy = y - (31 - r);
        return (dx * dx + dy * dy) <= (r * r);
      }
      return true;
    }
    case 'curve_convex_br': {
      const r = Math.max(12, Math.min(28, radius));
      if (x >= (31 - r) && y >= (31 - r)) {
        const dx = x - (31 - r);
        const dy = y - (31 - r);
        return (dx * dx + dy * dy) <= (r * r);
      }
      return true;
    }

    // Curved Inner (Concave inside corners)
    case 'curve_concave_tl': {
      const r = Math.max(8, Math.min(20, radius));
      if (x < r && y < r) {
        const dx = x;
        const dy = y;
        return (dx * dx + dy * dy) >= (r * r);
      }
      return true;
    }
    case 'curve_concave_tr': {
      const r = Math.max(8, Math.min(20, radius));
      if (x >= (31 - r) && y < r) {
        const dx = 31 - x;
        const dy = y;
        return (dx * dx + dy * dy) >= (r * r);
      }
      return true;
    }
    case 'curve_concave_bl': {
      const r = Math.max(8, Math.min(20, radius));
      if (x < r && y >= (31 - r)) {
        const dx = x;
        const dy = 31 - y;
        return (dx * dx + dy * dy) >= (r * r);
      }
      return true;
    }
    case 'curve_concave_br': {
      const r = Math.max(8, Math.min(20, radius));
      if (x >= (31 - r) && y >= (31 - r)) {
        const dx = 31 - x;
        const dy = 31 - y;
        return (dx * dx + dy * dy) >= (r * r);
      }
      return true;
    }

    // Cliff variants cover full tile by default, customized in post-processing
    case 'cliff_top_lip':
    case 'cliff_wall_mid':
    case 'cliff_base_seam':
    case 'cliff_corner_l':
    case 'cliff_corner_r':
    case 'cliff_stairs':
      return true;

    default:
      return true;
  }
}

// Generate the entire tileset given a base 32x32 image and styling settings
export function generateTileset(
  baseImage: ImageData,
  settings: TileGeneratorSettings
): GeneratedTile[] {
  // Extract base average color & dark outline shade
  const baseData = baseImage.data;
  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  for (let i = 0; i < 32 * 32 * 4; i += 4) {
    if (baseData[i + 3] > 128) {
      totalR += baseData[i];
      totalG += baseData[i + 1];
      totalB += baseData[i + 2];
      count++;
    }
  }
  const avgR = count > 0 ? totalR / count : 100;
  const avgG = count > 0 ? totalG / count : 100;
  const avgB = count > 0 ? totalB / count : 100;

  // Auto dark border color (deep 35% brightness of base, slightly shifted to cool or warm)
  const autoDarkR = Math.round(avgR * 0.3);
  const autoDarkG = Math.round(avgG * 0.3);
  const autoDarkB = Math.round(avgB * 0.3);

  const customOutlineRgb = hexToRgb(settings.outlineColor);
  const outlineR = settings.outlineColor === '#000000' ? autoDarkR : customOutlineRgb[0];
  const outlineG = settings.outlineColor === '#000000' ? autoDarkG : customOutlineRgb[1];
  const outlineB = settings.outlineColor === '#000000' ? autoDarkB : customOutlineRgb[2];

  const highlightRgb = hexToRgb(settings.highlightColor);

  // Get underlay ImageData if specified
  let underlayData: ImageData | null = null;
  if (settings.underlayType === 'preset') {
    const found = PRESET_TEXTURES.find(p => p.id === settings.underlayPresetId) || PRESET_TEXTURES[1];
    underlayData = found.generate();
  }

  const generatedList: GeneratedTile[] = [];

  for (const spec of TILE_CATALOG) {
    const tileImg = createBlankImageData(32, 32);
    const tileData = tileImg.data;

    // Special handling for Cliffs & 2.5D Slopes
    if (spec.category === 'cliffs') {
      renderCliffTile(tileData, baseData, spec.id, settings, outlineR, outlineG, outlineB);
    } else if (spec.category === 'slopes_25d') {
      render25dSlopeTile(tileData, baseData, spec.id, settings, outlineR, outlineG, outlineB, underlayData);
    } else {
      // 1. Determine shape mask for all 32x32 pixels
      const mask: boolean[][] = Array.from({ length: 32 }, () => Array(32).fill(false));
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          mask[y][x] = evalShape(spec.id, x, y, settings.cornerRoundness * 2 + 10);
        }
      }

      // Add grass fringe / ragged edge perturbation if style is grass_fringe
      if (settings.edgeStyle === 'grass_fringe' && spec.id !== 'center') {
        applyGrassFringeToMask(mask, spec.id, settings.grassBladeFrequency);
      }

      // 2. Compute distance to boundary for edge detection
      const isEdge: boolean[][] = Array.from({ length: 32 }, () => Array(32).fill(false));
      const thickness = settings.edgeThickness;

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          if (!mask[y][x]) continue;

          // Check if within 'thickness' of outside
          let nearOutside = false;
          for (let dy = -thickness; dy <= thickness && !nearOutside; dy++) {
            for (let dx = -thickness; dx <= thickness && !nearOutside; dx++) {
              if (dx * dx + dy * dy <= thickness * thickness) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= 32 || ny < 0 || ny >= 32 || !mask[ny][nx]) {
                  nearOutside = true;
                }
              }
            }
          }
          isEdge[y][x] = nearOutside;
        }
      }

      // 3. Render pixel by pixel
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const idx = (y * 32 + x) * 4;
          const inside = mask[y][x];

          if (inside) {
            // Sample base texture
            let r = baseData[idx];
            let g = baseData[idx + 1];
            let b = baseData[idx + 2];
            let a = baseData[idx + 3];

            // Variations for center_alt1 and center_alt2
            if (spec.id === 'center_alt1') {
              if ((x % 7 === 1 && y % 5 === 2) || (x % 11 === 4 && y % 9 === 3)) {
                // Micro pebble or light blade
                r = Math.min(255, r + 40);
                g = Math.min(255, g + 40);
                b = Math.min(255, b + 40);
              } else if ((x % 9 === 0 && y % 8 === 0)) {
                r = Math.max(0, r - 35);
                g = Math.max(0, g - 35);
                b = Math.max(0, b - 35);
              }
            } else if (spec.id === 'center_alt2') {
              if (Math.abs(x - y) === 3 && x > 8 && x < 20) {
                // Minor crack / texture line
                r = Math.max(0, r - 45);
                g = Math.max(0, g - 45);
                b = Math.max(0, b - 45);
              }
            }

            // Apply edge styling
            if (isEdge[y][x]) {
              if (settings.edgeStyle === 'pixel_outline') {
                const alphaFactor = settings.outlineOpacity;
                r = Math.round(r * (1 - alphaFactor) + outlineR * alphaFactor);
                g = Math.round(g * (1 - alphaFactor) + outlineG * alphaFactor);
                b = Math.round(b * (1 - alphaFactor) + outlineB * alphaFactor);
              } else if (settings.edgeStyle === 'soft_bevel') {
                // Top & Left gets highlight, Bottom & Right gets dark bevel
                const isTopOrLeft = (y < 16 && (y <= x || x < 16)) || (x < 16 && (31 - y) > x);
                if (isTopOrLeft) {
                  r = Math.min(255, Math.round(r * 1.35 + 25));
                  g = Math.min(255, Math.round(g * 1.35 + 25));
                  b = Math.min(255, Math.round(b * 1.35 + 25));
                } else {
                  r = Math.max(0, Math.round(r * 0.65));
                  g = Math.max(0, Math.round(g * 0.65));
                  b = Math.max(0, Math.round(b * 0.65));
                }
              } else if (settings.edgeStyle === 'grass_fringe') {
                // Dark bottom edge, crisp outline
                r = Math.round(r * 0.75 + outlineR * 0.25);
                g = Math.round(g * 0.75 + outlineG * 0.25);
                b = Math.round(b * 0.75 + outlineB * 0.25);
              }
            }

            // Highlight rim if enabled (subtle rim on top/left edge)
            if (settings.highlightRim && isEdge[y][x] && (y <= 10 || x <= 10)) {
              r = Math.min(255, Math.round(r * 0.7 + highlightRgb[0] * 0.3));
              g = Math.min(255, Math.round(g * 0.7 + highlightRgb[1] * 0.3));
              b = Math.min(255, Math.round(b * 0.7 + highlightRgb[2] * 0.3));
            }

            tileData[idx] = r;
            tileData[idx + 1] = g;
            tileData[idx + 2] = b;
            tileData[idx + 3] = a;
          } else {
            // Outside shape: render underlay or transparent
            if (settings.underlayType === 'color') {
              const bgRgb = hexToRgb(settings.underlayColor);
              tileData[idx] = bgRgb[0];
              tileData[idx + 1] = bgRgb[1];
              tileData[idx + 2] = bgRgb[2];
              tileData[idx + 3] = 255;
            } else if (settings.underlayType === 'preset' && underlayData) {
              tileData[idx] = underlayData.data[idx];
              tileData[idx + 1] = underlayData.data[idx + 1];
              tileData[idx + 2] = underlayData.data[idx + 2];
              tileData[idx + 3] = underlayData.data[idx + 3];
            } else {
              // Transparent
              tileData[idx] = 0;
              tileData[idx + 1] = 0;
              tileData[idx + 2] = 0;
              tileData[idx + 3] = 0;
            }
          }
        }
      }
    }

    const dataUrl = imageDataToDataUrl(tileImg);

    generatedList.push({
      id: spec.id,
      name: spec.name,
      category: spec.category,
      description: spec.description,
      exportCol: spec.col,
      exportRow: spec.row,
      imageData: tileImg,
      dataUrl,
      isSolid: spec.isSolid ?? false,
      isSlope: spec.isSlope ?? false,
    });
  }

  return generatedList;
}

// Organic grass fringe perturbation on mask edges
function applyGrassFringeToMask(mask: boolean[][], id: string, freq: number) {
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (id === 'edge_top' && (y === 6 || y === 7)) {
        // Tuft blades sticking up into negative space
        if ((x * freq * 3) % 7 < 3) mask[y][x] = true;
      } else if (id === 'edge_bottom' && (y === 24 || y === 25)) {
        // Tuft blades hanging down
        if ((x * freq * 5) % 9 < 4) mask[y][x] = true;
      } else if (id === 'edge_left' && (x === 6 || x === 7)) {
        if ((y * freq * 3) % 7 < 3) mask[y][x] = true;
      } else if (id === 'edge_right' && (x === 24 || x === 25)) {
        if ((y * freq * 5) % 9 < 4) mask[y][x] = true;
      }
    }
  }
}

// Special rendering engine for 2.5D Top-Down RPG Cliffs & Wall Elevation
function renderCliffTile(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  tileId: string,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number
) {
  const cliffHeight = settings.cliffHeight; // default ~12-16px
  const shadowAlpha = settings.cliffShadowIntensity;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      let r = baseData[idx];
      let g = baseData[idx + 1];
      let b = baseData[idx + 2];

      if (tileId === 'cliff_top_lip') {
        // Top plateau edge with 2.5D drop shadow lip
        if (y < 22) {
          // Plateau surface
          tileData[idx] = r;
          tileData[idx + 1] = g;
          tileData[idx + 2] = b;
          tileData[idx + 3] = 255;
        } else if (y === 22 || y === 23) {
          // Dark drop lip
          tileData[idx] = Math.round(r * 0.45);
          tileData[idx + 1] = Math.round(g * 0.45);
          tileData[idx + 2] = Math.round(b * 0.45);
          tileData[idx + 3] = 255;
        } else {
          // Beginning of vertical wall drop
          const depthShade = 0.55 + ((y - 24) / 16);
          tileData[idx] = Math.round(r * depthShade);
          tileData[idx + 1] = Math.round(g * depthShade);
          tileData[idx + 2] = Math.round(b * depthShade);
          tileData[idx + 3] = 255;
        }
      } else if (tileId === 'cliff_wall_mid') {
        // Vertical rock strata & depth drop
        const strata = Math.sin(y * 0.9 + (x % 4) * 0.3) * 0.15;
        const verticalVignette = 0.65 + strata;
        // Vertical rock fissures at regular intervals
        const isFissure = (x === 9 || x === 21) && y > 4 && y < 28;

        if (isFissure) {
          tileData[idx] = Math.round(r * 0.35);
          tileData[idx + 1] = Math.round(g * 0.35);
          tileData[idx + 2] = Math.round(b * 0.35);
        } else {
          tileData[idx] = Math.max(0, Math.min(255, Math.round(r * verticalVignette)));
          tileData[idx + 1] = Math.max(0, Math.min(255, Math.round(g * verticalVignette)));
          tileData[idx + 2] = Math.max(0, Math.min(255, Math.round(b * verticalVignette)));
        }
        tileData[idx + 3] = 255;
      } else if (tileId === 'cliff_base_seam') {
        // Cliff base meeting ground with drop shadow cast on lower ground
        if (y < 12) {
          // Bottom segment of wall
          const wallShade = 0.65 + (y / 24);
          tileData[idx] = Math.round(r * wallShade);
          tileData[idx + 1] = Math.round(g * wallShade);
          tileData[idx + 2] = Math.round(b * wallShade);
        } else if (y >= 12 && y <= 16) {
          // Base seam shadow line cast onto ground
          tileData[idx] = Math.round(r * (0.35 + (1 - shadowAlpha) * 0.3));
          tileData[idx + 1] = Math.round(g * (0.35 + (1 - shadowAlpha) * 0.3));
          tileData[idx + 2] = Math.round(b * (0.35 + (1 - shadowAlpha) * 0.3));
        } else {
          // Regular lower ground terrain
          tileData[idx] = r;
          tileData[idx + 1] = g;
          tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      } else if (tileId === 'cliff_corner_l') {
        // Left profile edge of wall
        if (x < 8) {
          // Empty or background
          tileData[idx] = 0; tileData[idx+1] = 0; tileData[idx+2] = 0; tileData[idx+3] = 0;
        } else if (x === 8 || x === 9) {
          // Left wall outline
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
        } else {
          tileData[idx] = Math.round(r * 0.7);
          tileData[idx+1] = Math.round(g * 0.7);
          tileData[idx+2] = Math.round(b * 0.7);
          tileData[idx+3] = 255;
        }
      } else if (tileId === 'cliff_corner_r') {
        // Right profile edge of wall
        if (x >= 24) {
          tileData[idx] = 0; tileData[idx+1] = 0; tileData[idx+2] = 0; tileData[idx+3] = 0;
        } else if (x === 22 || x === 23) {
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
        } else {
          tileData[idx] = Math.round(r * 0.7);
          tileData[idx+1] = Math.round(g * 0.7);
          tileData[idx+2] = Math.round(b * 0.7);
          tileData[idx+3] = 255;
        }
      } else if (tileId === 'cliff_stairs') {
        // Carved stairs (4 steps spanning y=0 to y=31)
        const step = Math.floor(y / 8); // 0, 1, 2, 3
        const stepY = y % 8;
        const stairMargin = 4;

        if (x < stairMargin || x >= 32 - stairMargin) {
          // Side balustrade / rock trim
          tileData[idx] = Math.round(r * 0.5);
          tileData[idx + 1] = Math.round(g * 0.5);
          tileData[idx + 2] = Math.round(b * 0.5);
        } else if (stepY === 0) {
          // Step tread front highlight
          tileData[idx] = Math.min(255, Math.round(r * 1.3 + 30));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.3 + 30));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.3 + 30));
        } else if (stepY <= 5) {
          // Flat step tread surface
          tileData[idx] = Math.round(r * 1.05);
          tileData[idx + 1] = Math.round(g * 1.05);
          tileData[idx + 2] = Math.round(b * 1.05);
        } else {
          // Step riser shadow
          tileData[idx] = Math.round(r * 0.4);
          tileData[idx + 1] = Math.round(g * 0.4);
          tileData[idx + 2] = Math.round(b * 0.4);
        }
        tileData[idx + 3] = 255;
      }
    }
  }
}

// Helper to apply background pixel (transparent, secondary preset texture, or solid color)
function applyBackgroundPixel(
  tileData: Uint8ClampedArray,
  idx: number,
  settings: TileGeneratorSettings,
  underlayData: ImageData | null
) {
  if (settings.underlayType === 'color') {
    const bgRgb = hexToRgb(settings.underlayColor);
    tileData[idx] = bgRgb[0];
    tileData[idx + 1] = bgRgb[1];
    tileData[idx + 2] = bgRgb[2];
    tileData[idx + 3] = 255;
  } else if (settings.underlayType === 'preset' && underlayData) {
    tileData[idx] = underlayData.data[idx];
    tileData[idx + 1] = underlayData.data[idx + 1];
    tileData[idx + 2] = underlayData.data[idx + 2];
    tileData[idx + 3] = underlayData.data[idx + 3];
  } else {
    tileData[idx] = 0;
    tileData[idx + 1] = 0;
    tileData[idx + 2] = 0;
    tileData[idx + 3] = 0;
  }
}

// Special rendering engine for 2.5D Top-Down RPG Slopes, Ramps & Elevation Transitions
export function render25dSlopeTile(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  tileId: string,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  underlayData: ImageData | null = null
) {
  const rampStyle = settings.rampSurfaceType || 'natural';
  const shadowAlpha = settings.cliffShadowIntensity;
  const slopeBg = settings.slopeBackgroundWall || 'none';
  const noBgWall = (slopeBg === 'none');
  const isNaturalBank = (slopeBg === 'natural_bank');

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const r = baseData[idx];
      const g = baseData[idx + 1];
      const b = baseData[idx + 2];

      // 1. Single-tile Vertical Ramp (N-S)
      if (tileId === 'slope25d_ramp_v_full') {
        const leftMargin = 5;
        const rightMargin = 26;

        if (x < leftMargin) {
          if (noBgWall) {
            // No background wall: open transparent side with clean curb border
            if (x < leftMargin - 1) {
              applyBackgroundPixel(tileData, idx, settings, underlayData);
            } else {
              tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
            }
          } else if (isNaturalBank) {
            const bankShade = 0.82 + (y / 80);
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx+1] = Math.round(g * bankShade);
            tileData[idx+2] = Math.round(b * bankShade);
            tileData[idx+3] = 255;
          } else {
            // Left retaining rock wall wing
            if (x === 0) {
              tileData[idx] = 0; tileData[idx+1] = 0; tileData[idx+2] = 0; tileData[idx+3] = 0;
            } else if (x === leftMargin - 1) {
              tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
            } else {
              const wallShade = 0.55 + (y / 64);
              tileData[idx] = Math.round(r * wallShade);
              tileData[idx+1] = Math.round(g * wallShade);
              tileData[idx+2] = Math.round(b * wallShade);
              tileData[idx+3] = 255;
            }
          }
        } else if (x > rightMargin) {
          if (noBgWall) {
            // No background wall: open transparent side with clean curb border
            if (x > rightMargin + 1) {
              applyBackgroundPixel(tileData, idx, settings, underlayData);
            } else {
              tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
            }
          } else if (isNaturalBank) {
            const bankShade = 0.80 + (y / 80);
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx+1] = Math.round(g * bankShade);
            tileData[idx+2] = Math.round(b * bankShade);
            tileData[idx+3] = 255;
          } else {
            // Right retaining rock wall wing
            if (x === 31) {
              tileData[idx] = 0; tileData[idx+1] = 0; tileData[idx+2] = 0; tileData[idx+3] = 0;
            } else if (x === rightMargin + 1) {
              tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
            } else {
              const wallShade = 0.50 + (y / 64);
              tileData[idx] = Math.round(r * wallShade);
              tileData[idx+1] = Math.round(g * wallShade);
              tileData[idx+2] = Math.round(b * wallShade);
              tileData[idx+3] = 255;
            }
          }
        } else {
          // Ramp slope surface
          // Elevation gradient: higher and brighter at top (y=0), darker at bottom (y=31)
          const elevationLight = 1.18 - (y / 31) * 0.32;
          let pr = Math.min(255, Math.round(r * elevationLight));
          let pg = Math.min(255, Math.round(g * elevationLight));
          let pb = Math.min(255, Math.round(b * elevationLight));

          if (rampStyle === 'mud_slide') {
            // Pokémon Diamond & Pearl Sinnoh Mud Slide / Bicycle Ramp (Chevron treads & bike ruts)
            const chevronY = (y + Math.abs(x - 16) * 0.5) % 6;
            const isBikeRut = (x >= 9 && x <= 11) || (x >= 20 && x <= 22);

            if (chevronY < 1.2) {
              // Highlight crest of chevron mud tread
              pr = Math.min(255, pr + 38);
              pg = Math.min(255, pg + 38);
              pb = Math.min(255, pb + 38);
            } else if (chevronY > 4.2) {
              // Shaded trough groove of chevron slide
              pr = Math.round(pr * 0.62);
              pg = Math.round(pg * 0.62);
              pb = Math.round(pb * 0.62);
            }

            if (isBikeRut) {
              // High-gear bike tire tread depression
              pr = Math.round(pr * 0.78);
              pg = Math.round(pg * 0.78);
              pb = Math.round(pb * 0.78);
            }
          } else if (rampStyle === 'stepped') {
            // Dragon Quest DS classic stepped stone incline risers
            const stepY = y % 8;
            if (stepY === 0) {
              // Top edge specular stone highlight
              pr = Math.min(255, pr + 42);
              pg = Math.min(255, pg + 42);
              pb = Math.min(255, pb + 42);
            } else if (stepY === 7) {
              // Front stone riser shadow
              pr = Math.round(pr * 0.64);
              pg = Math.round(pg * 0.64);
              pb = Math.round(pb * 0.64);
            } else if (stepY === 1) {
              pr = Math.min(255, pr + 18);
              pg = Math.min(255, pg + 18);
              pb = Math.min(255, pb + 18);
            }
          } else if (rampStyle === 'plank') {
            const isSeam = (y % 6 === 0);
            const isPin = (x === 7 || x === 24) && (y % 6 === 2);
            if (isSeam) {
              pr = Math.round(r * 0.4);
              pg = Math.round(g * 0.4);
              pb = Math.round(b * 0.4);
            } else if (isPin) {
              pr = 25; pg = 25; pb = 30; // iron nail
            } else if (y % 6 === 1) {
              pr = Math.min(255, pr + 25);
              pg = Math.min(255, pg + 25);
              pb = Math.min(255, pb + 25);
            }
          } else {
            // Natural dirt / grass incline grooves
            const isWheelTrack = (x >= 9 && x <= 11) || (x >= 20 && x <= 22);
            if (isWheelTrack) {
              pr = Math.round(pr * 0.85);
              pg = Math.round(pg * 0.85);
              pb = Math.round(pb * 0.85);
            }
          }

          // Top entry rim and bottom apron shadow
          if (y === 0) {
            pr = Math.min(255, pr + 20);
            pg = Math.min(255, pg + 20);
            pb = Math.min(255, pb + 20);
          } else if (y >= 30) {
            if (noBgWall) {
              pr = Math.round(pr * 0.9);
              pg = Math.round(pg * 0.9);
              pb = Math.round(pb * 0.9);
            } else {
              pr = Math.round(pr * (0.8 - shadowAlpha * 0.2));
              pg = Math.round(pg * (0.8 - shadowAlpha * 0.2));
              pb = Math.round(pb * (0.8 - shadowAlpha * 0.2));
            }
          }

          tileData[idx] = pr;
          tileData[idx+1] = pg;
          tileData[idx+2] = pb;
          tileData[idx+3] = 255;
        }
      }

      // 2. Vertical Ramp Top Crest (Upper connection to plateau)
      else if (tileId === 'slope25d_ramp_v_top') {
        const leftWall = Math.round(1 + (y * 5 / 31));
        const rightWall = Math.round(30 - (y * 5 / 31));

        if (x < leftWall || x > rightWall) {
          if (noBgWall) {
            // Freestanding open ramp: no background rock wall, transparent negative space
            applyBackgroundPixel(tileData, idx, settings, underlayData);
          } else if (isNaturalBank) {
            const bankShade = 0.85 + (y / 80);
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx+1] = Math.round(g * bankShade);
            tileData[idx+2] = Math.round(b * bankShade);
            tileData[idx+3] = 255;
          } else if (y < 8) {
            // Plateau surface
            tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b; tileData[idx+3] = 255;
          } else {
            // Upper cliff rock wings
            const wingShade = 0.6 + (y / 64);
            tileData[idx] = Math.round(r * wingShade);
            tileData[idx+1] = Math.round(g * wingShade);
            tileData[idx+2] = Math.round(b * wingShade);
            tileData[idx+3] = 255;
          }
        } else if (x === leftWall || x === rightWall) {
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
        } else {
          // Ramp bed
          const elev = 1.15 - (y / 60);
          tileData[idx] = Math.min(255, Math.round(r * elev));
          tileData[idx+1] = Math.min(255, Math.round(g * elev));
          tileData[idx+2] = Math.min(255, Math.round(b * elev));
          tileData[idx+3] = 255;
        }
      }

      // 3. Vertical Ramp Base Apron (Lower connection with cast shadow)
      else if (tileId === 'slope25d_ramp_v_base') {
        if (y < 16) {
          if (x < 6 || x > 25) {
            if (noBgWall) {
              applyBackgroundPixel(tileData, idx, settings, underlayData);
            } else if (isNaturalBank) {
              const baseWallShade = 0.78 + (y / 50);
              tileData[idx] = Math.round(r * baseWallShade);
              tileData[idx+1] = Math.round(g * baseWallShade);
              tileData[idx+2] = Math.round(b * baseWallShade);
              tileData[idx+3] = 255;
            } else {
              const baseWallShade = 0.55 + (y / 40);
              tileData[idx] = Math.round(r * baseWallShade);
              tileData[idx+1] = Math.round(g * baseWallShade);
              tileData[idx+2] = Math.round(b * baseWallShade);
              tileData[idx+3] = 255;
            }
          } else if (x === 6 || x === 25) {
            tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
          } else {
            tileData[idx] = Math.round(r * 0.95);
            tileData[idx+1] = Math.round(g * 0.95);
            tileData[idx+2] = Math.round(b * 0.95);
            tileData[idx+3] = 255;
          }
        } else if (y >= 16 && y <= 20) {
          // Bottom apron shadow band
          if (noBgWall) {
            const softShadow = 0.88 - shadowAlpha * 0.12;
            tileData[idx] = Math.round(r * softShadow);
            tileData[idx+1] = Math.round(g * softShadow);
            tileData[idx+2] = Math.round(b * softShadow);
          } else {
            tileData[idx] = Math.round(r * (0.6 - shadowAlpha * 0.25));
            tileData[idx+1] = Math.round(g * (0.6 - shadowAlpha * 0.25));
            tileData[idx+2] = Math.round(b * (0.6 - shadowAlpha * 0.25));
          }
          tileData[idx+3] = 255;
        } else {
          // Lower flat terrain
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b; tileData[idx+3] = 255;
        }
      }

      // 4. Lateral Ramp W→E Top (Ascending left to right)
      else if (tileId === 'slope25d_ramp_lat_w2e_top') {
        const rampY = Math.round(24 - (x * 16 / 31));
        const distFromRamp = y - rampY;

        if (distFromRamp < -4) {
          if (noBgWall) {
            // No background wall: open transparent air above ramp ledge!
            applyBackgroundPixel(tileData, idx, settings, underlayData);
          } else if (isNaturalBank) {
            const bgShade = 0.82 + ((y % 4) * 0.04);
            tileData[idx] = Math.round(r * bgShade);
            tileData[idx+1] = Math.round(g * bgShade);
            tileData[idx+2] = Math.round(b * bgShade);
            tileData[idx+3] = 255;
          } else {
            // Upper cliff rock background
            const bgShade = 0.65 + ((y % 4) * 0.05);
            tileData[idx] = Math.round(r * bgShade);
            tileData[idx+1] = Math.round(g * bgShade);
            tileData[idx+2] = Math.round(b * bgShade);
            tileData[idx+3] = 255;
          }
        } else if (distFromRamp === -4) {
          // Sunlit upper ramp ledge rim
          tileData[idx] = Math.min(255, Math.round(r * 1.35 + 30));
          tileData[idx+1] = Math.min(255, Math.round(g * 1.35 + 30));
          tileData[idx+2] = Math.min(255, Math.round(b * 1.35 + 30));
          tileData[idx+3] = 255;
        } else if (distFromRamp >= -3 && distFromRamp <= 3) {
          // Walkable ramp track
          const inclineLight = 0.95 + (x / 31) * 0.2;
          tileData[idx] = Math.min(255, Math.round(r * inclineLight));
          tileData[idx+1] = Math.min(255, Math.round(g * inclineLight));
          tileData[idx+2] = Math.min(255, Math.round(b * inclineLight));
          tileData[idx+3] = 255;
        } else if (distFromRamp === 4) {
          // Lower ramp edge curb
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
        } else {
          // Below the ramp
          if (noBgWall) {
            if (rampStyle === 'plank' && (x === 6 || x === 18 || x === 28) && distFromRamp <= 12) {
              // Wooden support trestle post
              tileData[idx] = Math.round(r * 0.45);
              tileData[idx+1] = Math.round(g * 0.45);
              tileData[idx+2] = Math.round(b * 0.45);
              tileData[idx+3] = 255;
            } else {
              applyBackgroundPixel(tileData, idx, settings, underlayData);
            }
          } else if (isNaturalBank) {
            const bankShade = 0.78 - ((distFromRamp - 4) / 20) * 0.2;
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx+1] = Math.round(g * bankShade);
            tileData[idx+2] = Math.round(b * bankShade);
            tileData[idx+3] = 255;
          } else {
            tileData[idx] = Math.round(r * 0.5);
            tileData[idx+1] = Math.round(g * 0.5);
            tileData[idx+2] = Math.round(b * 0.5);
            tileData[idx+3] = 255;
          }
        }
      }

      // 5. Lateral Ramp W→E Wedge Wall
      else if (tileId === 'slope25d_ramp_lat_w2e_wall') {
        const wallBottom = Math.round(6 + (x * 20 / 31));

        if (y < wallBottom) {
          if (noBgWall) {
            if (rampStyle === 'plank') {
              const isPillar = (x === 6 || x === 18 || x === 28);
              if (isPillar) {
                tileData[idx] = Math.round(r * 0.45);
                tileData[idx+1] = Math.round(g * 0.45);
                tileData[idx+2] = Math.round(b * 0.45);
                tileData[idx+3] = 255;
              } else {
                applyBackgroundPixel(tileData, idx, settings, underlayData);
              }
            } else {
              applyBackgroundPixel(tileData, idx, settings, underlayData);
            }
          } else if (isNaturalBank) {
            const bankShade = 0.88 - ((y / wallBottom) * 0.22);
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx+1] = Math.round(g * bankShade);
            tileData[idx+2] = Math.round(b * bankShade);
            tileData[idx+3] = 255;
          } else {
            const strata = Math.sin(y * 1.1 + (x % 3) * 0.4) * 0.12;
            const wallShade = Math.max(0.4, Math.min(0.85, 0.60 + strata));
            tileData[idx] = Math.round(r * wallShade);
            tileData[idx+1] = Math.round(g * wallShade);
            tileData[idx+2] = Math.round(b * wallShade);
            tileData[idx+3] = 255;
          }
        } else if (y >= wallBottom && y <= wallBottom + 3) {
          if (noBgWall) {
            tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b; tileData[idx+3] = 255;
          } else {
            tileData[idx] = Math.round(r * (0.45 - shadowAlpha * 0.15));
            tileData[idx+1] = Math.round(g * (0.45 - shadowAlpha * 0.15));
            tileData[idx+2] = Math.round(b * (0.45 - shadowAlpha * 0.15));
            tileData[idx+3] = 255;
          }
        } else {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b; tileData[idx+3] = 255;
        }
      }

      // 6. Lateral Ramp E→W Top (Ascending right to left)
      else if (tileId === 'slope25d_ramp_lat_e2w_top') {
        const rampY = Math.round(8 + (x * 16 / 31));
        const distFromRamp = y - rampY;

        if (distFromRamp < -4) {
          if (noBgWall) {
            applyBackgroundPixel(tileData, idx, settings, underlayData);
          } else if (isNaturalBank) {
            const bgShade = 0.82 + ((y % 4) * 0.04);
            tileData[idx] = Math.round(r * bgShade);
            tileData[idx+1] = Math.round(g * bgShade);
            tileData[idx+2] = Math.round(b * bgShade);
            tileData[idx+3] = 255;
          } else {
            const bgShade = 0.65 + ((y % 4) * 0.05);
            tileData[idx] = Math.round(r * bgShade);
            tileData[idx+1] = Math.round(g * bgShade);
            tileData[idx+2] = Math.round(b * bgShade);
            tileData[idx+3] = 255;
          }
        } else if (distFromRamp === -4) {
          tileData[idx] = Math.min(255, Math.round(r * 1.35 + 30));
          tileData[idx+1] = Math.min(255, Math.round(g * 1.35 + 30));
          tileData[idx+2] = Math.min(255, Math.round(b * 1.35 + 30));
          tileData[idx+3] = 255;
        } else if (distFromRamp >= -3 && distFromRamp <= 3) {
          const inclineLight = 0.95 + ((31 - x) / 31) * 0.2;
          tileData[idx] = Math.min(255, Math.round(r * inclineLight));
          tileData[idx+1] = Math.min(255, Math.round(g * inclineLight));
          tileData[idx+2] = Math.min(255, Math.round(b * inclineLight));
          tileData[idx+3] = 255;
        } else if (distFromRamp === 4) {
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
        } else {
          if (noBgWall) {
            if (rampStyle === 'plank' && (x === 4 || x === 14 || x === 26) && distFromRamp <= 12) {
              tileData[idx] = Math.round(r * 0.45);
              tileData[idx+1] = Math.round(g * 0.45);
              tileData[idx+2] = Math.round(b * 0.45);
              tileData[idx+3] = 255;
            } else {
              applyBackgroundPixel(tileData, idx, settings, underlayData);
            }
          } else if (isNaturalBank) {
            const bankShade = 0.78 - ((distFromRamp - 4) / 20) * 0.2;
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx+1] = Math.round(g * bankShade);
            tileData[idx+2] = Math.round(b * bankShade);
            tileData[idx+3] = 255;
          } else {
            tileData[idx] = Math.round(r * 0.5);
            tileData[idx+1] = Math.round(g * 0.5);
            tileData[idx+2] = Math.round(b * 0.5);
            tileData[idx+3] = 255;
          }
        }
      }

      // 7. Lateral Ramp E→W Wedge Wall
      else if (tileId === 'slope25d_ramp_lat_e2w_wall') {
        const wallBottom = Math.round(26 - (x * 20 / 31));

        if (y < wallBottom) {
          if (noBgWall) {
            if (rampStyle === 'plank') {
              const isPillar = (x === 4 || x === 14 || x === 26);
              if (isPillar) {
                tileData[idx] = Math.round(r * 0.45);
                tileData[idx+1] = Math.round(g * 0.45);
                tileData[idx+2] = Math.round(b * 0.45);
                tileData[idx+3] = 255;
              } else {
                applyBackgroundPixel(tileData, idx, settings, underlayData);
              }
            } else {
              applyBackgroundPixel(tileData, idx, settings, underlayData);
            }
          } else if (isNaturalBank) {
            const bankShade = 0.88 - ((y / wallBottom) * 0.22);
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx+1] = Math.round(g * bankShade);
            tileData[idx+2] = Math.round(b * bankShade);
            tileData[idx+3] = 255;
          } else {
            const strata = Math.sin(y * 1.1 + (x % 3) * 0.4) * 0.12;
            const wallShade = Math.max(0.4, Math.min(0.85, 0.60 + strata));
            tileData[idx] = Math.round(r * wallShade);
            tileData[idx+1] = Math.round(g * wallShade);
            tileData[idx+2] = Math.round(b * wallShade);
            tileData[idx+3] = 255;
          }
        } else if (y >= wallBottom && y <= wallBottom + 3) {
          if (noBgWall) {
            tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b; tileData[idx+3] = 255;
          } else {
            tileData[idx] = Math.round(r * (0.45 - shadowAlpha * 0.15));
            tileData[idx+1] = Math.round(g * (0.45 - shadowAlpha * 0.15));
            tileData[idx+2] = Math.round(b * (0.45 - shadowAlpha * 0.15));
            tileData[idx+3] = 255;
          }
        } else {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b; tileData[idx+3] = 255;
        }
      }

      // 8. Rolling Hill / Mound
      else if (tileId === 'slope25d_natural_hill') {
        const dx = x - 13;
        const dy = y - 11;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let factor = 1.0;
        if (dist < 10) {
          factor = 1.25 - (dist / 40);
        } else {
          const angle = Math.atan2(dy, dx);
          const shadowBias = (Math.sin(angle - 0.7) + 1) / 2;
          factor = 1.0 - shadowBias * 0.35 * (dist / 22);
        }

        tileData[idx] = Math.max(0, Math.min(255, Math.round(r * factor)));
        tileData[idx+1] = Math.max(0, Math.min(255, Math.round(g * factor)));
        tileData[idx+2] = Math.max(0, Math.min(255, Math.round(b * factor)));
        tileData[idx+3] = 255;
      }

      // 9. Diagonal Cliff Slope NW (Upper plateau NW, diagonal cliff drop, lower ground SE)
      else if (tileId === 'cliff_diag_slope_nw') {
        const diag = x + y;
        if (diag < 16) {
          if (noBgWall) {
            // Freestanding open diagonal slope: upper negative space is open/transparent
            applyBackgroundPixel(tileData, idx, settings, underlayData);
          } else {
            // Upper plateau
            tileData[idx] = Math.min(255, Math.round(r * 1.08));
            tileData[idx+1] = Math.min(255, Math.round(g * 1.08));
            tileData[idx+2] = Math.min(255, Math.round(b * 1.08));
            tileData[idx+3] = 255;
          }
        } else if (diag === 16 || diag === 17) {
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
        } else if (diag >= 18 && diag <= 30) {
          if (noBgWall) {
            // Smooth natural slope grade without dark cliff face strata
            const slopeShade = 1.05 - ((diag - 18) / 12) * 0.25;
            tileData[idx] = Math.round(r * slopeShade);
            tileData[idx+1] = Math.round(g * slopeShade);
            tileData[idx+2] = Math.round(b * slopeShade);
          } else if (isNaturalBank) {
            const slopeShade = 0.95 - ((diag - 18) / 12) * 0.22;
            tileData[idx] = Math.round(r * slopeShade);
            tileData[idx+1] = Math.round(g * slopeShade);
            tileData[idx+2] = Math.round(b * slopeShade);
          } else {
            // Vertical rock strata on diagonal cliff face
            const strata = Math.sin(y * 1.2 + (x % 3) * 0.5) * 0.15;
            const rockShade = Math.max(0.35, Math.min(0.75, 0.55 + strata));
            tileData[idx] = Math.round(r * rockShade);
            tileData[idx+1] = Math.round(g * rockShade);
            tileData[idx+2] = Math.round(b * rockShade);
          }
          tileData[idx+3] = 255;
        } else if (diag >= 31 && diag <= 34) {
          if (noBgWall) {
            tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
          } else {
            tileData[idx] = Math.round(r * (0.35 + (1 - shadowAlpha) * 0.2));
            tileData[idx+1] = Math.round(g * (0.35 + (1 - shadowAlpha) * 0.2));
            tileData[idx+2] = Math.round(b * (0.35 + (1 - shadowAlpha) * 0.2));
          }
          tileData[idx+3] = 255;
        } else {
          // Lower ground
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
          tileData[idx+3] = 255;
        }
      }

      // 10. Diagonal Cliff Slope NE (Upper plateau NE, diagonal cliff drop, lower ground SW)
      else if (tileId === 'cliff_diag_slope_ne') {
        const diag = (31 - x) + y;
        if (diag < 16) {
          if (noBgWall) {
            applyBackgroundPixel(tileData, idx, settings, underlayData);
          } else {
            tileData[idx] = Math.min(255, Math.round(r * 1.08));
            tileData[idx+1] = Math.min(255, Math.round(g * 1.08));
            tileData[idx+2] = Math.min(255, Math.round(b * 1.08));
            tileData[idx+3] = 255;
          }
        } else if (diag === 16 || diag === 17) {
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB; tileData[idx+3] = 255;
        } else if (diag >= 18 && diag <= 30) {
          if (noBgWall) {
            const slopeShade = 1.05 - ((diag - 18) / 12) * 0.25;
            tileData[idx] = Math.round(r * slopeShade);
            tileData[idx+1] = Math.round(g * slopeShade);
            tileData[idx+2] = Math.round(b * slopeShade);
          } else if (isNaturalBank) {
            const slopeShade = 0.95 - ((diag - 18) / 12) * 0.22;
            tileData[idx] = Math.round(r * slopeShade);
            tileData[idx+1] = Math.round(g * slopeShade);
            tileData[idx+2] = Math.round(b * slopeShade);
          } else {
            const strata = Math.sin(y * 1.2 + (x % 3) * 0.5) * 0.15;
            const rockShade = Math.max(0.35, Math.min(0.75, 0.55 + strata));
            tileData[idx] = Math.round(r * rockShade);
            tileData[idx+1] = Math.round(g * rockShade);
            tileData[idx+2] = Math.round(b * rockShade);
          }
          tileData[idx+3] = 255;
        } else if (diag >= 31 && diag <= 34) {
          if (noBgWall) {
            tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
          } else {
            tileData[idx] = Math.round(r * (0.35 + (1 - shadowAlpha) * 0.2));
            tileData[idx+1] = Math.round(g * (0.35 + (1 - shadowAlpha) * 0.2));
            tileData[idx+2] = Math.round(b * (0.35 + (1 - shadowAlpha) * 0.2));
          }
          tileData[idx+3] = 255;
        } else {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
          tileData[idx+3] = 255;
        }
      }

      // 11. Diagonal Cliff Slope SW
      else if (tileId === 'cliff_diag_slope_sw') {
        const diag = (31 - y) + x;
        if (diag < 16) {
          if (noBgWall) {
            applyBackgroundPixel(tileData, idx, settings, underlayData);
          } else {
            tileData[idx] = Math.min(255, Math.round(r * 1.08));
            tileData[idx+1] = Math.min(255, Math.round(g * 1.08));
            tileData[idx+2] = Math.min(255, Math.round(b * 1.08));
          }
        } else if (diag === 16 || diag === 17) {
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB;
        } else if (diag >= 18 && diag <= 28) {
          if (noBgWall) {
            const slopeShade = 1.02 - ((diag - 18) / 10) * 0.22;
            tileData[idx] = Math.round(r * slopeShade);
            tileData[idx+1] = Math.round(g * slopeShade);
            tileData[idx+2] = Math.round(b * slopeShade);
          } else {
            const rockShade = 0.58 + ((x % 4) * 0.04);
            tileData[idx] = Math.round(r * rockShade);
            tileData[idx+1] = Math.round(g * rockShade);
            tileData[idx+2] = Math.round(b * rockShade);
          }
        } else {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
        }
        tileData[idx+3] = 255;
      }

      // 12. Diagonal Cliff Slope SE
      else if (tileId === 'cliff_diag_slope_se') {
        const diag = (31 - y) + (31 - x);
        if (diag < 16) {
          if (noBgWall) {
            applyBackgroundPixel(tileData, idx, settings, underlayData);
          } else {
            tileData[idx] = Math.min(255, Math.round(r * 1.08));
            tileData[idx+1] = Math.min(255, Math.round(g * 1.08));
            tileData[idx+2] = Math.min(255, Math.round(b * 1.08));
          }
        } else if (diag === 16 || diag === 17) {
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB;
        } else if (diag >= 18 && diag <= 28) {
          if (noBgWall) {
            const slopeShade = 1.02 - ((diag - 18) / 10) * 0.22;
            tileData[idx] = Math.round(r * slopeShade);
            tileData[idx+1] = Math.round(g * slopeShade);
            tileData[idx+2] = Math.round(b * slopeShade);
          } else {
            const rockShade = 0.58 + ((x % 4) * 0.04);
            tileData[idx] = Math.round(r * rockShade);
            tileData[idx+1] = Math.round(g * rockShade);
            tileData[idx+2] = Math.round(b * rockShade);
          }
        } else {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
        }
        tileData[idx+3] = 255;
      }

      // 13. Diagonal Cliff Lip NW
      else if (tileId === 'cliff_diag_top_nw') {
        const diag = x + y;
        if (diag < 20) {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
        } else if (diag >= 20 && diag <= 22) {
          tileData[idx] = Math.round(r * 0.45);
          tileData[idx+1] = Math.round(g * 0.45);
          tileData[idx+2] = Math.round(b * 0.45);
        } else {
          const depth = 0.55 + ((diag - 22) / 20);
          tileData[idx] = Math.round(r * depth);
          tileData[idx+1] = Math.round(g * depth);
          tileData[idx+2] = Math.round(b * depth);
        }
        tileData[idx+3] = 255;
      }

      // 14. Diagonal Cliff Lip NE
      else if (tileId === 'cliff_diag_top_ne') {
        const diag = (31 - x) + y;
        if (diag < 20) {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
        } else if (diag >= 20 && diag <= 22) {
          tileData[idx] = Math.round(r * 0.45);
          tileData[idx+1] = Math.round(g * 0.45);
          tileData[idx+2] = Math.round(b * 0.45);
        } else {
          const depth = 0.55 + ((diag - 22) / 20);
          tileData[idx] = Math.round(r * depth);
          tileData[idx+1] = Math.round(g * depth);
          tileData[idx+2] = Math.round(b * depth);
        }
        tileData[idx+3] = 255;
      }

      // 15. Diagonal Cliff Base NW
      else if (tileId === 'cliff_diag_base_nw') {
        const diag = x + y;
        if (diag < 10) {
          const wallShade = 0.65 + (diag / 20);
          tileData[idx] = Math.round(r * wallShade);
          tileData[idx+1] = Math.round(g * wallShade);
          tileData[idx+2] = Math.round(b * wallShade);
        } else if (diag >= 10 && diag <= 15) {
          tileData[idx] = Math.round(r * (0.35 + (1 - shadowAlpha) * 0.2));
          tileData[idx+1] = Math.round(g * (0.35 + (1 - shadowAlpha) * 0.2));
          tileData[idx+2] = Math.round(b * (0.35 + (1 - shadowAlpha) * 0.2));
        } else {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
        }
        tileData[idx+3] = 255;
      }

      // 16. Diagonal Cliff Base NE
      else if (tileId === 'cliff_diag_base_ne') {
        const diag = (31 - x) + y;
        if (diag < 10) {
          const wallShade = 0.65 + (diag / 20);
          tileData[idx] = Math.round(r * wallShade);
          tileData[idx+1] = Math.round(g * wallShade);
          tileData[idx+2] = Math.round(b * wallShade);
        } else if (diag >= 10 && diag <= 15) {
          tileData[idx] = Math.round(r * (0.35 + (1 - shadowAlpha) * 0.2));
          tileData[idx+1] = Math.round(g * (0.35 + (1 - shadowAlpha) * 0.2));
          tileData[idx+2] = Math.round(b * (0.35 + (1 - shadowAlpha) * 0.2));
        } else {
          tileData[idx] = r; tileData[idx+1] = g; tileData[idx+2] = b;
        }
        tileData[idx+3] = 255;
      }
    }
  }
}
