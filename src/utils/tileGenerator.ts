import { GeneratedTile, TileGeneratorSettings, TileCategory } from '../types/tileset';
import { PRESET_TEXTURES } from './pixelPresets';
import { renderDetailedStairs, renderDetailed25dSlope } from './stairAndSlopeDetails';
import {
  render25dSouthFacade,
  render25dSWCorner,
  render25dSECorner,
  render25dIsolatedBlock,
  render25dHorizontalLedge,
  applyGroundShadow,
} from './elevation25dRenderer';

let _sharedCanvas: HTMLCanvasElement | null = null;
let _sharedCtx: CanvasRenderingContext2D | null = null;

function getSharedCanvas(width = 32, height = 32): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!_sharedCanvas) {
    _sharedCanvas = document.createElement('canvas');
  }
  if (_sharedCanvas.width !== width) _sharedCanvas.width = width;
  if (_sharedCanvas.height !== height) _sharedCanvas.height = height;
  if (!_sharedCtx) {
    _sharedCtx = _sharedCanvas.getContext('2d', { willReadFrequently: true })!;
  }
  return { canvas: _sharedCanvas, ctx: _sharedCtx };
}

export function createBlankImageData(width = 32, height = 32): ImageData {
  if (typeof ImageData !== 'undefined') {
    try {
      return new ImageData(width, height);
    } catch {
      // Fallback
    }
  }
  const { ctx } = getSharedCanvas(width, height);
  return ctx.createImageData(width, height);
}

export function imageDataToDataUrl(imgData: ImageData): string {
  const { canvas, ctx } = getSharedCanvas(imgData.width, imgData.height);
  ctx.clearRect(0, 0, imgData.width, imgData.height);
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

/**
 * Ensures a 32x32 ground texture tiles 100% seamlessly across X and Y axes
 * so ground tiles connect to each other with zero gap or edge seam.
 */
export function makeTextureSeamless(src: ImageData): ImageData {
  const result = createBlankImageData(32, 32);
  const s = src.data;
  const d = result.data;
  d.set(s);

  const feather = 3;

  // Horizontal wrap matching (X-axis)
  for (let y = 0; y < 32; y++) {
    for (let f = 0; f < feather; f++) {
      const leftIdx = (y * 32 + f) * 4;
      const rightIdx = (y * 32 + (31 - f)) * 4;
      const weight = 0.5 * (1 - f / feather);

      for (let c = 0; c < 3; c++) {
        const leftVal = s[leftIdx + c];
        const rightVal = s[rightIdx + c];
        const avg = (leftVal + rightVal) / 2;
        d[leftIdx + c] = Math.round(leftVal * (1 - weight) + avg * weight);
        d[rightIdx + c] = Math.round(rightVal * (1 - weight) + avg * weight);
      }
    }
  }

  // Vertical wrap matching (Y-axis)
  const temp = new Uint8ClampedArray(d);
  for (let x = 0; x < 32; x++) {
    for (let f = 0; f < feather; f++) {
      const topIdx = (f * 32 + x) * 4;
      const bottomIdx = ((31 - f) * 32 + x) * 4;
      const weight = 0.5 * (1 - f / feather);

      for (let c = 0; c < 3; c++) {
        const topVal = temp[topIdx + c];
        const bottomVal = temp[bottomIdx + c];
        const avg = (topVal + bottomVal) / 2;
        d[topIdx + c] = Math.round(topVal * (1 - weight) + avg * weight);
        d[bottomIdx + c] = Math.round(bottomVal * (1 - weight) + avg * weight);
      }
    }
  }

  return result;
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
  { id: 'isolated', name: '2.5D Raised Pedestal / Block', category: 'parts', description: 'Elevated 3D cube block with top face, front facade & ground shadow', col: 3, row: 0 },
  { id: 'corridor_vert', name: 'Vertical Causeway', category: 'parts', description: '1-tile wide raised path flanked by west and east side walls', col: 4, row: 0 },
  { id: 'corridor_horiz', name: '2.5D Raised Ledge / Path', category: 'parts', description: 'Elevated horizontal walkway with south vertical cliff drop', col: 5, row: 0 },
  { id: 'cliff_stairs', name: '2.5D Carved Stairs', category: 'cliffs', description: '4-step vertical stairway with treads, risers, and 3D balustrades', col: 6, row: 0 },
  { id: 'cliff_wall_mid', name: '2.5D Cliff Wall Face', category: 'cliffs', description: 'Vertical drop wall with rock strata & drop shadow', col: 7, row: 0 },

  // Row 1: 4 Cardinal Edges (2.5D Elevation Borders)
  { id: 'edge_top', name: '2.5D North Plateau Lip', category: 'edges', description: 'Top perimeter rim with sunlit highlight and plateau floor', col: 0, row: 1 },
  { id: 'edge_bottom', name: '2.5D South Cliff Drop (Facade)', category: 'edges', description: 'Vertical drop wall facade with rock strata and ground drop shadow', col: 1, row: 1 },
  { id: 'edge_left', name: '2.5D West Cliff Wall Profile', category: 'edges', description: 'West side cliff edge with sunlit 2.5D edge bevel', col: 2, row: 1 },
  { id: 'edge_right', name: '2.5D East Cliff Wall Profile', category: 'edges', description: 'East side cliff edge with dark shadow band', col: 3, row: 1 },
  { id: 'endcap_n', name: 'Endcap North', category: 'parts', description: 'Closed dead-end facing North', col: 4, row: 1 },
  { id: 'endcap_s', name: '2.5D Endcap South (Drop)', category: 'parts', description: 'Closed dead-end facing South with vertical cliff face', col: 5, row: 1 },
  { id: 'endcap_w', name: 'Endcap West', category: 'parts', description: 'Closed dead-end facing West', col: 6, row: 1 },
  { id: 'endcap_e', name: 'Endcap East', category: 'parts', description: 'Closed dead-end facing East', col: 7, row: 1 },

  // Row 2: 4 Outer Corners (2.5D Elevation Corners)
  { id: 'corner_outer_tl', name: '2.5D NW Plateau Corner', category: 'corners_outer', description: 'Sunlit top-left convex corner of elevated plateau', col: 0, row: 2 },
  { id: 'corner_outer_tr', name: '2.5D NE Plateau Corner', category: 'corners_outer', description: 'Top-right convex corner with shaded east bevel', col: 1, row: 2 },
  { id: 'corner_outer_bl', name: '2.5D SW Cliff Corner (Drop)', category: 'corners_outer', description: 'South-West corner with west profile, front wall drop & ground shadow', col: 2, row: 2 },
  { id: 'corner_outer_br', name: '2.5D SE Cliff Corner (Drop)', category: 'corners_outer', description: 'South-East corner with front wall drop and right/bottom cast shadow', col: 3, row: 2 },
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

  // Row 6: Top-Down RPG Elevation Ramps & Horizontal Slopes
  { id: 'slope25d_ramp_v_full', name: 'Top-Down Vertical Ramp (1-Tile)', category: 'slopes_25d', description: 'Straight top-down vertical ramp climbing from lower ground to high plateau', col: 0, row: 6, isSlope: true },
  { id: 'slope25d_ramp_v_top', name: 'Top-Down Vertical Ramp (Top Half)', category: 'slopes_25d', description: 'Upper 32x32 half of 2-tile vertical ramp; connects seamlessly to base', col: 1, row: 6, isSlope: true },
  { id: 'slope25d_ramp_v_base', name: 'Top-Down Vertical Ramp (Bottom Half)', category: 'slopes_25d', description: 'Lower 32x32 half of 2-tile vertical ramp; connects seamlessly to top', col: 2, row: 6, isSlope: true },
  { id: 'slope25d_ramp_lat_w2e_top', name: 'Top-Down Ramp W→E (Part 1 - Low)', category: 'slopes_25d', description: 'West 32x32 half of horizontal ramp; connects seamlessly to Part 2', col: 3, row: 6, isSlope: true },
  { id: 'slope25d_ramp_lat_w2e_wall', name: 'Top-Down Ramp W→E (Part 2 - High)', category: 'slopes_25d', description: 'East 32x32 half of horizontal ramp; connects seamlessly to Part 1', col: 4, row: 6, isSlope: true },
  { id: 'slope25d_ramp_lat_e2w_top', name: 'Top-Down Ramp E→W (Part 1 - High)', category: 'slopes_25d', description: 'East 32x32 half of horizontal ramp; connects seamlessly to Part 2', col: 5, row: 6, isSlope: true },
  { id: 'slope25d_ramp_lat_e2w_wall', name: 'Top-Down Ramp E→W (Part 2 - Low)', category: 'slopes_25d', description: 'West 32x32 half of horizontal ramp; connects seamlessly to Part 1', col: 6, row: 6, isSlope: true },
  { id: 'slope25d_natural_hill', name: 'Top-Down Rolling Hill / Mound', category: 'slopes_25d', description: 'Top-down circular hill with gentle concentric slope contours', col: 7, row: 6, isSlope: true },

  // Row 7: Top-Down RPG Diagonal Slopes & Cliffs
  { id: 'cliff_diag_slope_nw', name: 'Top-Down Diagonal Slope NW', category: 'slopes_25d', description: 'Top-down diagonal slope connecting upper plateau NW to lower ground SE', col: 0, row: 7, isSlope: true },
  { id: 'cliff_diag_slope_ne', name: 'Top-Down Diagonal Slope NE', category: 'slopes_25d', description: 'Top-down diagonal slope connecting upper plateau NE to lower ground SW', col: 1, row: 7, isSlope: true },
  { id: 'cliff_diag_slope_sw', name: 'Top-Down Diagonal Slope SW', category: 'slopes_25d', description: 'Top-down diagonal slope connecting upper plateau SW to lower ground NE', col: 2, row: 7, isSlope: true },
  { id: 'cliff_diag_slope_se', name: 'Top-Down Diagonal Slope SE', category: 'slopes_25d', description: 'Top-down diagonal slope connecting upper plateau SE to lower ground NW', col: 3, row: 7, isSlope: true },
  { id: 'cliff_diag_top_nw', name: 'Top-Down Diagonal Cliff Lip NW', category: 'slopes_25d', description: 'Top-down diagonal cliff top rim facing NW', col: 4, row: 7, isSlope: true },
  { id: 'cliff_diag_top_ne', name: 'Top-Down Diagonal Cliff Lip NE', category: 'slopes_25d', description: 'Top-down diagonal cliff top rim facing NE', col: 5, row: 7, isSlope: true },
  { id: 'cliff_diag_base_nw', name: 'Top-Down Diagonal Cliff Base NW', category: 'slopes_25d', description: 'Top-down diagonal cliff base meeting ground seamlessly NW', col: 6, row: 7, isSlope: true },
  { id: 'cliff_diag_base_ne', name: 'Top-Down Diagonal Cliff Base NE', category: 'slopes_25d', description: 'Top-down diagonal cliff base meeting ground seamlessly NE', col: 7, row: 7, isSlope: true },
];

// Helper to determine if pixel (x,y) is inside primary terrain shape for a given tile ID
function evalShape(id: string, x: number, y: number, radius: number, tanAngle = 0.57735): boolean {

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

    // 30° / 45° Diagonal Slopes (governed by 30° top-down bird's-eye projection)
    case 'slope_ne_fill':
      // 30° bird's-eye slope rising to top-right
      return y >= Math.round(31 - x * tanAngle);
    case 'slope_nw_fill':
      // 30° bird's-eye slope rising to top-left
      return y >= Math.round(x * tanAngle);
    case 'slope_se_fill':
      // 30° bird's-eye slope descending to bottom-right
      return y <= Math.round(x * tanAngle);
    case 'slope_sw_fill':
      // 30° bird's-eye slope descending to bottom-left
      return y <= Math.round(31 - x * tanAngle);

    // Gentle 30° shallow incline transitions across 2 tiles
    case 'slope_gentle_n1':
      // Left part of shallow 30° slope: climbs from bottom edge
      return y >= Math.round(31 - x * tanAngle);
    case 'slope_gentle_n2':
      // Right part of shallow 30° slope: continues climb up to top edge
      return y >= Math.max(0, Math.round(31 - (16 + x) * tanAngle));
    case 'slope_gentle_s1':
      // Left part of shallow 30° descending slope
      return y <= Math.round(x * tanAngle);
    case 'slope_gentle_s2':
      // Right part of shallow 30° descending slope
      return y <= Math.min(31, Math.round((16 + x) * tanAngle));

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

  // Precompute 30° bird's-eye projection trigonometry once for the whole tileset
  const angleDeg = settings.projectionAngle ?? 30;
  const tanAngle = Math.tan((angleDeg * Math.PI) / 180);

  // Reusable flat pixel buffers (1024 bytes each, 0 allocations per tile)
  const maskBuf = new Uint8Array(1024);
  const isEdgeBuf = new Uint8Array(1024);

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

    // Special handling for Cliffs & 2.5D Elevation Elements
    if (spec.category === 'cliffs') {
      renderCliffTile(tileData, baseData, spec.id, settings, outlineR, outlineG, outlineB, highlightRgb);
    } else if (spec.category === 'slopes_25d') {
      render25dSlopeTile(tileData, baseData, spec.id, settings, outlineR, outlineG, outlineB, highlightRgb, underlayData);
    } else if (spec.id === 'edge_bottom') {
      render25dSouthFacade(tileData, baseData, settings, outlineR, outlineG, outlineB, highlightRgb, underlayData);
    } else if (spec.id === 'corner_outer_bl') {
      render25dSWCorner(tileData, baseData, settings, outlineR, outlineG, outlineB, highlightRgb, underlayData);
    } else if (spec.id === 'corner_outer_br') {
      render25dSECorner(tileData, baseData, settings, outlineR, outlineG, outlineB, highlightRgb, underlayData);
    } else if (spec.id === 'isolated') {
      render25dIsolatedBlock(tileData, baseData, settings, outlineR, outlineG, outlineB, highlightRgb, underlayData);
    } else if (spec.id === 'corridor_horiz') {
      render25dHorizontalLedge(tileData, baseData, settings, outlineR, outlineG, outlineB, highlightRgb, underlayData);
    } else {
      // 1. Determine shape mask for all 32x32 pixels using flat Uint8Array
      maskBuf.fill(0);
      isEdgeBuf.fill(0);
      const radius = settings.cornerRoundness * 2 + 10;

      for (let y = 0; y < 32; y++) {
        const rowOffset = y * 32;
        for (let x = 0; x < 32; x++) {
          if (evalShape(spec.id, x, y, radius, tanAngle)) {
            maskBuf[rowOffset + x] = 1;
          }
        }
      }

      // Add grass fringe / ragged edge perturbation if style is grass_fringe (never on core ground tiles)
      if (settings.edgeStyle === 'grass_fringe' && spec.category !== 'core') {
        applyGrassFringeToMask(maskBuf, spec.id, settings.grassBladeFrequency);
      }

      // 2. Compute distance to boundary for edge detection
      // CRITICAL FOR ZERO-GAP CONNECTING GROUND TILES:
      // - Core ground fill tiles ('center', 'center_alt1', 'center_alt2') have NO edge outline,
      //   ensuring they tile with 0px gap against each other and against adjacent tiles.
      // - For other connecting tiles, boundaries that extend across the tile border
      //   (i.e., evalShape is true in adjacent space) are connected terrain, NOT outside edges!
      if (spec.category !== 'core') {
        const thickness = settings.edgeThickness;
        const thickSq = thickness * thickness;

        for (let y = 0; y < 32; y++) {
          const rowOffset = y * 32;
          for (let x = 0; x < 32; x++) {
            if (!maskBuf[rowOffset + x]) continue;

            // Check if within 'thickness' of true outside space (NOT connecting tile boundaries)
            let nearOutside = false;
            for (let dy = -thickness; dy <= thickness && !nearOutside; dy++) {
              const ny = y + dy;
              const dySq = dy * dy;
              for (let dx = -thickness; dx <= thickness; dx++) {
                if (dx * dx + dySq <= thickSq) {
                  const nx = x + dx;
                  if (nx >= 0 && nx < 32 && ny >= 0 && ny < 32) {
                    if (!maskBuf[ny * 32 + nx]) {
                      nearOutside = true;
                      break;
                    }
                  } else {
                    // Check if terrain extends across the tile border into the neighboring tile
                    if (!evalShape(spec.id, nx, ny, radius, tanAngle)) {
                      nearOutside = true;
                      break;
                    }
                  }
                }
              }
            }
            if (nearOutside) {
              isEdgeBuf[rowOffset + x] = 1;
            }
          }
        }
      }

      // 3. Render pixel by pixel
      const depthIntensity = settings.slopeDepthIntensity ?? 0.85;

      for (let y = 0; y < 32; y++) {
        const rowOffset = y * 32;
        for (let x = 0; x < 32; x++) {
          const pixelIndex = rowOffset + x;
          const idx = pixelIndex * 4;
          const inside = maskBuf[pixelIndex] === 1;

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

            // Slope Depth, Incline Gradient & Terracing for Row 4 30° / 45° Slopes & Curves
            if (spec.category === 'slopes') {
              let slopeDist = 0;
              let isNorthOrWestFacing = false;

              if (spec.id === 'slope_ne_fill') {
                slopeDist = y - Math.round(31 - x * tanAngle);
                isNorthOrWestFacing = true;
              } else if (spec.id === 'slope_nw_fill') {
                slopeDist = y - Math.round(x * tanAngle);
                isNorthOrWestFacing = false;
              } else if (spec.id === 'slope_se_fill') {
                slopeDist = Math.round(x * tanAngle) - y;
                isNorthOrWestFacing = true;
              } else if (spec.id === 'slope_sw_fill') {
                slopeDist = Math.round(31 - x * tanAngle) - y;
                isNorthOrWestFacing = true;
              } else if (spec.id === 'slope_gentle_n1') {
                slopeDist = y - Math.round(31 - x * tanAngle);
                isNorthOrWestFacing = true;
              } else if (spec.id === 'slope_gentle_n2') {
                slopeDist = y - Math.max(0, Math.round(31 - (16 + x) * tanAngle));
                isNorthOrWestFacing = true;
              } else if (spec.id === 'slope_gentle_s1') {
                slopeDist = Math.round(x * tanAngle) - y;
                isNorthOrWestFacing = false;
              } else if (spec.id === 'slope_gentle_s2') {
                slopeDist = Math.min(31, Math.round((16 + x) * tanAngle)) - y;
                isNorthOrWestFacing = false;
              }

              if (slopeDist >= 0) {
                // Top-down RPG slope incline & boundary
                if (settings.slope3dCurbs && slopeDist <= 1) {
                  // Subtle top-down slope ridge highlight
                  const rimMult = isNorthOrWestFacing ? 1.25 : 1.15;
                  r = Math.min(255, Math.round(r * rimMult + highlightRgb[0] * 0.20));
                  g = Math.min(255, Math.round(g * rimMult + highlightRgb[1] * 0.20));
                  b = Math.min(255, Math.round(b * rimMult + highlightRgb[2] * 0.20));
                } else if (slopeDist <= 10) {
                  // Top-down RPG slope incline zone
                  const slopeT = slopeDist / 10;
                  const elevLight = 1.12 - slopeT * (0.12 * depthIntensity);
                  r = Math.min(255, Math.round(r * elevLight));
                  g = Math.min(255, Math.round(g * elevLight));
                  b = Math.min(255, Math.round(b * elevLight));

                  // Transverse Incline Treads in top-down RPG perspective
                  const rib = Math.round(slopeDist) % 4;
                  if (rib === 0) {
                    const ribBoost = Math.round(18 * depthIntensity);
                    r = Math.min(255, r + ribBoost);
                    g = Math.min(255, g + ribBoost);
                    b = Math.min(255, b + ribBoost);
                  } else if (rib === 2) {
                    r = Math.round(r * 0.88);
                    g = Math.round(g * 0.88);
                    b = Math.round(b * 0.88);
                  }

                  // Ramp surface patterns
                  const rampStyle = settings.rampSurfaceType || 'natural';
                  if (rampStyle === 'mud_slide') {
                    const isRut = Math.abs(x - y) === 3 || Math.abs((31 - x) - y) === 3;
                    if (isRut) {
                      r = Math.round(r * 0.70); g = Math.round(g * 0.70); b = Math.round(b * 0.70);
                    }
                  } else if (rampStyle === 'stepped') {
                    const stepY = Math.round(slopeDist) % 6;
                    if (stepY === 0) {
                      r = Math.min(255, r + 30); g = Math.min(255, g + 30); b = Math.min(255, b + 30);
                    } else if (stepY === 5) {
                      r = Math.round(r * 0.65); g = Math.round(g * 0.65); b = Math.round(b * 0.65);
                    }
                  } else if (rampStyle === 'plank') {
                    if (Math.round(slopeDist) % 5 === 0) {
                      r = Math.round(r * 0.40); g = Math.round(g * 0.40); b = Math.round(b * 0.40);
                    }
                  } else if (rampStyle === 'cobblestone') {
                    if ((x % 4 === 0 && y % 4 === 0)) {
                      r = Math.min(255, r + 24); g = Math.min(255, g + 24); b = Math.min(255, b + 24);
                    }
                  }
                }
                // For slopeDist > 10, perfectly retains base texture (r, g, b) with ZERO gap to adjacent ground tiles!
              }
            } else if (spec.category === 'curves') {
              // 2.5D Radial Elevation Curvature for Curved Outer and Inner Corners
              if (spec.id.startsWith('curve_convex_')) {
                let cornerDist = 0;
                if (spec.id === 'curve_convex_tl') cornerDist = Math.hypot(x - 8, y - 8);
                else if (spec.id === 'curve_convex_tr') cornerDist = Math.hypot(x - 24, y - 8);
                else if (spec.id === 'curve_convex_bl') cornerDist = Math.hypot(x - 8, y - 24);
                else if (spec.id === 'curve_convex_br') cornerDist = Math.hypot(x - 24, y - 24);

                if (cornerDist <= 4) {
                  r = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.20));
                  g = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.20));
                  b = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.20));
                } else if (cornerDist >= 12 && cornerDist <= 16) {
                  const domeShade = 0.88 - ((cornerDist - 12) / 4) * 0.18 * depthIntensity;
                  r = Math.round(r * domeShade);
                  g = Math.round(g * domeShade);
                  b = Math.round(b * domeShade);
                }
              }
            }

            // Apply edge styling
            if (isEdgeBuf[pixelIndex]) {
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
            if (settings.highlightRim && isEdgeBuf[pixelIndex] && (y <= 10 || x <= 10)) {
              r = Math.min(255, Math.round(r * 0.7 + highlightRgb[0] * 0.3));
              g = Math.min(255, Math.round(g * 0.7 + highlightRgb[1] * 0.3));
              b = Math.min(255, Math.round(b * 0.7 + highlightRgb[2] * 0.3));
            }

            // 2.5D Top-Down Elevation Lighting & Perspective Shading
            if (spec.id === 'edge_top' && (y === 8 || y === 9)) {
              // Sunlit North Plateau Lip
              r = Math.min(255, Math.round(r * 1.32 + highlightRgb[0] * 0.2));
              g = Math.min(255, Math.round(g * 1.32 + highlightRgb[1] * 0.2));
              b = Math.min(255, Math.round(b * 1.32 + highlightRgb[2] * 0.2));
            } else if (spec.id === 'edge_left' && (x === 8 || x === 9)) {
              // Sunlit West Cliff Profile
              r = Math.min(255, Math.round(r * 1.28 + highlightRgb[0] * 0.18));
              g = Math.min(255, Math.round(g * 1.28 + highlightRgb[1] * 0.18));
              b = Math.min(255, Math.round(b * 1.28 + highlightRgb[2] * 0.18));
            } else if (spec.id === 'edge_right' && (x === 22 || x === 23)) {
              // Shaded East Cliff Profile
              r = Math.round(r * 0.62);
              g = Math.round(g * 0.62);
              b = Math.round(b * 0.62);
            } else if (spec.id === 'corner_outer_tl' && (x <= 10 && y <= 10)) {
              // Sunlit NW Apex Corner
              r = Math.min(255, Math.round(r * 1.38 + highlightRgb[0] * 0.25));
              g = Math.min(255, Math.round(g * 1.38 + highlightRgb[1] * 0.25));
              b = Math.min(255, Math.round(b * 1.38 + highlightRgb[2] * 0.25));
            } else if (spec.id === 'corner_outer_tr') {
              if (y <= 9) {
                r = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.15));
                g = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.15));
                b = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.15));
              }
              if (x >= 22) {
                r = Math.round(r * 0.65);
                g = Math.round(g * 0.65);
                b = Math.round(b * 0.65);
              }
            } else if (spec.id === 'corridor_vert') {
              if (x <= 9) {
                r = Math.min(255, Math.round(r * 1.25));
                g = Math.min(255, Math.round(g * 1.25));
                b = Math.min(255, Math.round(b * 1.25));
              } else if (x >= 22) {
                r = Math.round(r * 0.65);
                g = Math.round(g * 0.65);
                b = Math.round(b * 0.65);
              }
            }

            tileData[idx] = r;
            tileData[idx + 1] = g;
            tileData[idx + 2] = b;
            tileData[idx + 3] = a;
          } else {
            // 2.5D Ground drop shadow outside East-facing cliffs
            const isEastWallShadow = (
              (spec.id === 'edge_right' && (x === 24 || x === 25)) ||
              (spec.id === 'corner_outer_tr' && (x === 24 || x === 25) && y >= 8) ||
              (spec.id === 'corridor_vert' && (x === 24 || x === 25))
            );
            if (isEastWallShadow) {
              const shadowDist = x - 23;
              const shadowFactor = 0.5 + shadowDist * 0.15;
              applyGroundShadow(tileData, idx, shadowFactor, settings, underlayData);
              continue;
            }

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
function applyGrassFringeToMask(mask: Uint8Array, id: string, freq: number) {
  for (let y = 0; y < 32; y++) {
    const rowOffset = y * 32;
    for (let x = 0; x < 32; x++) {
      if (id === 'edge_top' && (y === 6 || y === 7)) {
        // Tuft blades sticking up into negative space
        if ((x * freq * 3) % 7 < 3) mask[rowOffset + x] = 1;
      } else if (id === 'edge_bottom' && (y === 24 || y === 25)) {
        // Tuft blades hanging down
        if ((x * freq * 5) % 9 < 4) mask[rowOffset + x] = 1;
      } else if (id === 'edge_left' && (x === 6 || x === 7)) {
        if ((y * freq * 3) % 7 < 3) mask[rowOffset + x] = 1;
      } else if (id === 'edge_right' && (x === 24 || x === 25)) {
        if ((y * freq * 5) % 9 < 4) mask[rowOffset + x] = 1;
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
  outlineB: number,
  highlightRgb: [number, number, number]
) {
  if (tileId === 'cliff_stairs') {
    renderDetailedStairs(tileData, baseData, settings, outlineR, outlineG, outlineB, highlightRgb);
    return;
  }

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
      }
    }
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
  highlightRgb: [number, number, number] = [255, 255, 255],
  underlayData: ImageData | null = null
) {
  renderDetailed25dSlope(
    tileData,
    baseData,
    tileId,
    settings,
    outlineR,
    outlineG,
    outlineB,
    highlightRgb,
    underlayData
  );
}
