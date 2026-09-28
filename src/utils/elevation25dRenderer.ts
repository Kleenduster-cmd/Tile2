import { TileGeneratorSettings, WallStrataStyle } from '../types/tileset';
import { hexToRgb } from './tileGenerator';

// Helper to fill background pixel (transparent, secondary preset underlay, or custom solid color)
export function fillBackgroundPixel(
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

// Blend ground drop shadow onto underlay/floor
export function applyGroundShadow(
  tileData: Uint8ClampedArray,
  idx: number,
  shadowFactor: number, // 0.2 (heavy) .. 0.8 (light)
  settings: TileGeneratorSettings,
  underlayData: ImageData | null
) {
  if (settings.underlayType === 'preset' && underlayData) {
    const ur = underlayData.data[idx];
    const ug = underlayData.data[idx + 1];
    const ub = underlayData.data[idx + 2];
    tileData[idx] = Math.round(ur * shadowFactor);
    tileData[idx + 1] = Math.round(ug * shadowFactor);
    tileData[idx + 2] = Math.round(ub * shadowFactor);
    tileData[idx + 3] = 255;
  } else if (settings.underlayType === 'color') {
    const bg = hexToRgb(settings.underlayColor);
    tileData[idx] = Math.round(bg[0] * shadowFactor);
    tileData[idx + 1] = Math.round(bg[1] * shadowFactor);
    tileData[idx + 2] = Math.round(bg[2] * shadowFactor);
    tileData[idx + 3] = 255;
  } else {
    // In transparent mode, render an organic semi-transparent black drop shadow
    const alpha = Math.round((1 - shadowFactor) * 230);
    tileData[idx] = 12;
    tileData[idx + 1] = 14;
    tileData[idx + 2] = 20;
    tileData[idx + 3] = alpha;
  }
}

// Generate vertical wall strata pixel (rock, brick, timber, earth)
export function computeWallStrata(
  x: number,
  y: number,
  wallY: number, // 0-indexed relative to top of vertical wall
  wallHeight: number,
  baseR: number,
  baseG: number,
  baseB: number,
  style: WallStrataStyle,
  depthIntensity: number,
  isShaded = false
): [number, number, number] {
  // Ambient occlusion: top of wall has shadow under the plateau overhang, bottom fades into floor
  const topOverhangShadow = wallY === 0 ? 0.52 : wallY === 1 ? 0.68 : 1.0;
  const bottomSeamShadow = wallY >= wallHeight - 2 ? 0.75 : 1.0;
  const sideLight = isShaded ? 0.72 : 1.0;

  let r = baseR;
  let g = baseG;
  let b = baseB;

  if (style === 'masonry_brick') {
    // Ashlar / Running bond chiseled stone blocks (course height 4px, width 8px)
    const course = Math.floor(wallY / 4);
    const courseY = wallY % 4;
    const offsetX = (course % 2 === 0) ? 0 : 4;
    const blockX = (x + offsetX) % 8;

    const isMortarH = (courseY === 0);
    const isMortarV = (blockX === 0);
    const isBlockTop = (courseY === 1);
    const isBlockRight = (blockX === 7);

    if (isMortarH || isMortarV) {
      // Dark mortar line
      r = Math.round(r * 0.42);
      g = Math.round(g * 0.42);
      b = Math.round(b * 0.42);
    } else if (isBlockTop) {
      // Beveled top lip of stone brick
      r = Math.min(255, Math.round(r * 1.2));
      g = Math.min(255, Math.round(g * 1.2));
      b = Math.min(255, Math.round(b * 1.2));
    } else if (isBlockRight) {
      // Shaded right edge of stone brick
      r = Math.round(r * 0.72);
      g = Math.round(g * 0.72);
      b = Math.round(b * 0.72);
    } else {
      // Stone surface with subtle dither
      const dither = ((x * 3 + y * 7) % 5 === 0) ? -18 : ((x * 11 + y * 5) % 7 === 0) ? 14 : 0;
      r = Math.max(0, Math.min(255, Math.round(r * 0.88 + dither)));
      g = Math.max(0, Math.min(255, Math.round(g * 0.88 + dither)));
      b = Math.max(0, Math.min(255, Math.round(b * 0.88 + dither)));
    }
  } else if (style === 'timber_logs') {
    // Stacked horizontal timber logs (log height 4px)
    const logIdx = Math.floor(wallY / 4);
    const logY = wallY % 4;
    const isLogSeam = (logY === 0);
    const isLogHighlight = (logY === 1);
    const isLogBark = (logY === 3);

    // Warm timber color shift
    const timberR = Math.min(255, Math.round(r * 1.15 + 10));
    const timberG = Math.round(g * 0.9);
    const timberB = Math.round(b * 0.75);

    if (isLogSeam) {
      r = Math.round(timberR * 0.38);
      g = Math.round(timberG * 0.38);
      b = Math.round(timberB * 0.38);
    } else if (isLogHighlight) {
      r = Math.min(255, Math.round(timberR * 1.25));
      g = Math.min(255, Math.round(timberG * 1.25));
      b = Math.min(255, Math.round(timberB * 1.25));
    } else if (isLogBark) {
      r = Math.round(timberR * 0.65);
      g = Math.round(timberG * 0.65);
      b = Math.round(timberB * 0.65);
    } else {
      r = timberR;
      g = timberG;
      b = timberB;
    }

    // Iron bracket nail every 10px
    if ((x === 6 || x === 16 || x === 26) && (logY === 2)) {
      r = 35; g = 35; b = 40;
    }
  } else if (style === 'earthen_soil') {
    // Layered soil & root fibers
    const stratum = Math.floor(wallY / 5);
    const soilTone = 0.75 - (stratum * 0.08 * depthIntensity);
    r = Math.round(r * soilTone * 1.05);
    g = Math.round(g * soilTone * 0.95);
    b = Math.round(b * soilTone * 0.8);

    // Pebble specks
    if ((x * 7 + y * 13) % 17 === 0) {
      r = Math.min(255, r + 45);
      g = Math.min(255, g + 45);
      b = Math.min(255, b + 45);
    } else if ((x * 11 + y * 19) % 23 === 0) {
      r = Math.max(0, r - 35);
      g = Math.max(0, g - 35);
      b = Math.max(0, b - 35);
    }
  } else {
    // Default: 'rock_strata' (classic 2.5D RPG rock cliff face)
    const wave = Math.sin(wallY * 0.8 + (x % 5) * 0.4) * 0.12;
    const baseStrata = 0.68 + wave;

    // Horizontal clefts
    const isCleft = (wallY === 4 || wallY === 9 || wallY === 14) && (x % 6 !== 0);
    // Vertical fracture
    const isFracture = ((x === 11 && wallY > 3 && wallY < 12) || (x === 23 && wallY > 6 && wallY < 15));

    if (isCleft || isFracture) {
      r = Math.round(r * 0.38);
      g = Math.round(g * 0.38);
      b = Math.round(b * 0.38);
    } else {
      r = Math.max(0, Math.min(255, Math.round(r * baseStrata)));
      g = Math.max(0, Math.min(255, Math.round(g * baseStrata)));
      b = Math.max(0, Math.min(255, Math.round(b * baseStrata)));
    }
  }

  const finalMult = topOverhangShadow * bottomSeamShadow * sideLight;
  return [
    Math.round(r * finalMult),
    Math.round(g * finalMult),
    Math.round(b * finalMult),
  ];
}

// -------------------------------------------------------------
// 1. SOUTH 2.5D CLIFF FACADE (edge_bottom)
// In a 30° Top-Down Bird's-Eye View (orthogonal non-isometric grid),
// the south edge of a plateau is a prominent vertical drop facade
// with specular plateau rim, vertical cliff strata, and 30° ground drop shadow!
// -------------------------------------------------------------
export function render25dSouthFacade(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null
) {
  const angleDeg = settings.projectionAngle ?? 30;
  const angleRad = (angleDeg * Math.PI) / 180;
  const sinAngle = Math.sin(angleRad); // sin(30°) = 0.50

  const cliffHeight = Math.max(8, Math.min(22, settings.cliffHeight || 16));
  const topLipY = 32 - cliffHeight - 6; // e.g. 32 - 16 - 6 = 10
  const wallStartY = topLipY + 2; // e.g. 12
  const wallEndY = topLipY + cliffHeight; // e.g. 26
  const shadowIntensity = settings.cliffShadowIntensity || 0.7;
  const strataStyle = settings.wallStrataStyle || 'rock_strata';
  const depthIntensity = settings.slopeDepthIntensity || 0.85;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const br = baseData[idx];
      const bg = baseData[idx + 1];
      const bb = baseData[idx + 2];

      if (y < topLipY) {
        // Upper Plateau Floor (seen from top-down 30° bird's-eye view)
        tileData[idx] = br;
        tileData[idx + 1] = bg;
        tileData[idx + 2] = bb;
        tileData[idx + 3] = 255;
      } else if (y === topLipY) {
        // Plateau edge rim highlight (specular nosing)
        tileData[idx] = Math.min(255, Math.round(br * 1.25 + highlightRgb[0] * 0.18));
        tileData[idx + 1] = Math.min(255, Math.round(bg * 1.25 + highlightRgb[1] * 0.18));
        tileData[idx + 2] = Math.min(255, Math.round(bb * 1.25 + highlightRgb[2] * 0.18));
        tileData[idx + 3] = 255;
      } else if (y === topLipY + 1) {
        // Dark overhang crease under the plateau rim
        tileData[idx] = Math.round(br * 0.42);
        tileData[idx + 1] = Math.round(bg * 0.42);
        tileData[idx + 2] = Math.round(bb * 0.42);
        tileData[idx + 3] = 255;
      } else if (y >= wallStartY && y <= wallEndY) {
        // Vertical Front Wall Facade (facing viewer directly at 30° bird's-eye angle)
        const wallY = y - wallStartY;
        const [wr, wg, wb] = computeWallStrata(
          x,
          y,
          wallY,
          cliffHeight,
          br,
          bg,
          bb,
          strataStyle,
          depthIntensity
        );
        tileData[idx] = wr;
        tileData[idx + 1] = wg;
        tileData[idx + 2] = wb;
        tileData[idx + 3] = 255;
      } else if (y === wallEndY + 1) {
        // Seam contact crease at wall base
        tileData[idx] = outlineR;
        tileData[idx + 1] = outlineG;
        tileData[idx + 2] = outlineB;
        tileData[idx + 3] = 255;
      } else {
        // y > wallEndY + 1: Lower Ground receiving 30° cast shadow
        const shadowDist = y - (wallEndY + 1); // 1, 2, 3, 4...
        // 30° angle shadow projection rate
        const shadowFactor = Math.min(0.92, (0.32 + (shadowDist * 0.13 / (sinAngle * 2))) / shadowIntensity);
        applyGroundShadow(tileData, idx, shadowFactor, settings, underlayData);
      }
    }
  }
}

// -------------------------------------------------------------
// 2. SOUTH-WEST 2.5D CLIFF CORNER (corner_outer_bl)
// In 30° bird's-eye view: West retaining wall with 30° receding bevel,
// South vertical drop wall, and lower ground floor with 30° shadow.
// -------------------------------------------------------------
export function render25dSWCorner(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null
) {
  const angleDeg = settings.projectionAngle ?? 30;
  const angleRad = (angleDeg * Math.PI) / 180;
  const tanAngle = Math.tan(angleRad); // tan(30°) ≈ 0.577

  const cliffHeight = Math.max(8, Math.min(22, settings.cliffHeight || 16));
  const topLipY = 32 - cliffHeight - 6;
  const wallStartY = topLipY + 2;
  const wallEndY = topLipY + cliffHeight;
  const baseWestMargin = 8;
  const strataStyle = settings.wallStrataStyle || 'rock_strata';
  const depthIntensity = settings.slopeDepthIntensity || 0.85;

  for (let y = 0; y < 32; y++) {
    // 30° receding bevel along the retaining wall
    const bevel = (y >= topLipY && y <= wallEndY + 1)
      ? Math.round((y - topLipY) * tanAngle * 0.35)
      : (y > wallEndY + 1 ? Math.round((wallEndY + 1 - topLipY) * tanAngle * 0.35) : 0);
    const westMargin = baseWestMargin + bevel;

    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const br = baseData[idx];
      const bg = baseData[idx + 1];
      const bb = baseData[idx + 2];

      if (x < westMargin) {
        // West of cliff: Lower ground floor
        if (y >= wallEndY + 1) {
          applyGroundShadow(tileData, idx, 0.75, settings, underlayData);
        } else {
          fillBackgroundPixel(tileData, idx, settings, underlayData);
        }
      } else if (x === westMargin) {
        // West side profile edge outline (at 30° angle)
        tileData[idx] = outlineR;
        tileData[idx + 1] = outlineG;
        tileData[idx + 2] = outlineB;
        tileData[idx + 3] = 255;
      } else if (x === westMargin + 1) {
        // Sunlit West beveled edge highlight (at 30° angle)
        tileData[idx] = Math.min(255, Math.round(br * 1.25 + highlightRgb[0] * 0.15));
        tileData[idx + 1] = Math.min(255, Math.round(bg * 1.25 + highlightRgb[1] * 0.15));
        tileData[idx + 2] = Math.min(255, Math.round(bb * 1.25 + highlightRgb[2] * 0.15));
        tileData[idx + 3] = 255;
      } else {
        // x > westMargin + 1
        if (y < topLipY) {
          // Plateau surface
          tileData[idx] = br;
          tileData[idx + 1] = bg;
          tileData[idx + 2] = bb;
          tileData[idx + 3] = 255;
        } else if (y === topLipY) {
          // Plateau lip highlight
          tileData[idx] = Math.min(255, Math.round(br * 1.22 + highlightRgb[0] * 0.15));
          tileData[idx + 1] = Math.min(255, Math.round(bg * 1.22 + highlightRgb[1] * 0.15));
          tileData[idx + 2] = Math.min(255, Math.round(bb * 1.22 + highlightRgb[2] * 0.15));
          tileData[idx + 3] = 255;
        } else if (y === topLipY + 1) {
          tileData[idx] = Math.round(br * 0.45);
          tileData[idx + 1] = Math.round(bg * 0.45);
          tileData[idx + 2] = Math.round(bb * 0.45);
          tileData[idx + 3] = 255;
        } else if (y >= wallStartY && y <= wallEndY) {
          // Vertical front wall face
          const wallY = y - wallStartY;
          const [wr, wg, wb] = computeWallStrata(
            x,
            y,
            wallY,
            cliffHeight,
            br,
            bg,
            bb,
            strataStyle,
            depthIntensity
          );
          tileData[idx] = wr;
          tileData[idx + 1] = wg;
          tileData[idx + 2] = wb;
          tileData[idx + 3] = 255;
        } else if (y === wallEndY + 1) {
          tileData[idx] = outlineR;
          tileData[idx + 1] = outlineG;
          tileData[idx + 2] = outlineB;
          tileData[idx + 3] = 255;
        } else {
          // Lower ground shadow
          const shadowDist = y - (wallEndY + 1);
          const shadowFactor = Math.min(0.9, 0.38 + shadowDist * 0.15);
          applyGroundShadow(tileData, idx, shadowFactor, settings, underlayData);
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 3. SOUTH-EAST 2.5D CLIFF CORNER (corner_outer_br)
// In 30° bird's-eye view: East shaded side profile + South vertical wall
// + 30° directional ground shadow on East and South.
// -------------------------------------------------------------
export function render25dSECorner(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null
) {
  const angleDeg = settings.projectionAngle ?? 30;
  const angleRad = (angleDeg * Math.PI) / 180;
  const tanAngle = Math.tan(angleRad); // tan(30°) ≈ 0.577
  const cosAngle = Math.cos(angleRad); // cos(30°) ≈ 0.866
  const sinAngle = Math.sin(angleRad); // sin(30°) ≈ 0.500

  const cliffHeight = Math.max(8, Math.min(22, settings.cliffHeight || 16));
  const topLipY = 32 - cliffHeight - 6;
  const wallStartY = topLipY + 2;
  const wallEndY = topLipY + cliffHeight;
  const baseEastMargin = 24;
  const strataStyle = settings.wallStrataStyle || 'rock_strata';
  const depthIntensity = settings.slopeDepthIntensity || 0.85;

  for (let y = 0; y < 32; y++) {
    // 30° receding profile along the East retaining wall
    const bevel = (y >= topLipY && y <= wallEndY + 1)
      ? Math.round((y - topLipY) * tanAngle * 0.35)
      : (y > wallEndY + 1 ? Math.round((wallEndY + 1 - topLipY) * tanAngle * 0.35) : 0);
    const eastMargin = baseEastMargin - bevel;

    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const br = baseData[idx];
      const bg = baseData[idx + 1];
      const bb = baseData[idx + 2];

      if (x >= eastMargin) {
        // East of cliff: Ground receiving 30° angle directional shadow
        if (y >= topLipY) {
          const shadowDist = (x - eastMargin) * cosAngle + (y >= wallEndY ? (y - wallEndY) * sinAngle : 0);
          const shadowFactor = Math.min(0.90, 0.40 + shadowDist * 0.12);
          applyGroundShadow(tileData, idx, shadowFactor, settings, underlayData);
        } else {
          fillBackgroundPixel(tileData, idx, settings, underlayData);
        }
      } else if (x === eastMargin - 1) {
        // East side profile outline (at 30° angle)
        tileData[idx] = outlineR;
        tileData[idx + 1] = outlineG;
        tileData[idx + 2] = outlineB;
        tileData[idx + 3] = 255;
      } else if (x === eastMargin - 2) {
        // Shaded East side wall band (at 30° angle)
        tileData[idx] = Math.round(br * 0.58);
        tileData[idx + 1] = Math.round(bg * 0.58);
        tileData[idx + 2] = Math.round(bb * 0.58);
        tileData[idx + 3] = 255;
      } else {
        // x < eastMargin - 2
        if (y < topLipY) {
          tileData[idx] = br;
          tileData[idx + 1] = bg;
          tileData[idx + 2] = bb;
          tileData[idx + 3] = 255;
        } else if (y === topLipY) {
          tileData[idx] = Math.min(255, Math.round(br * 1.18 + highlightRgb[0] * 0.12));
          tileData[idx + 1] = Math.min(255, Math.round(bg * 1.18 + highlightRgb[1] * 0.12));
          tileData[idx + 2] = Math.min(255, Math.round(bb * 1.18 + highlightRgb[2] * 0.12));
          tileData[idx + 3] = 255;
        } else if (y === topLipY + 1) {
          tileData[idx] = Math.round(br * 0.45);
          tileData[idx + 1] = Math.round(bg * 0.45);
          tileData[idx + 2] = Math.round(bb * 0.45);
          tileData[idx + 3] = 255;
        } else if (y >= wallStartY && y <= wallEndY) {
          const wallY = y - wallStartY;
          const [wr, wg, wb] = computeWallStrata(
            x,
            y,
            wallY,
            cliffHeight,
            br,
            bg,
            bb,
            strataStyle,
            depthIntensity,
            false
          );
          tileData[idx] = wr;
          tileData[idx + 1] = wg;
          tileData[idx + 2] = wb;
          tileData[idx + 3] = 255;
        } else if (y === wallEndY + 1) {
          tileData[idx] = outlineR;
          tileData[idx + 1] = outlineG;
          tileData[idx + 2] = outlineB;
          tileData[idx + 3] = 255;
        } else {
          // Bottom ground shadow
          const shadowDist = y - (wallEndY + 1);
          const shadowFactor = Math.min(0.9, 0.38 + shadowDist * 0.15);
          applyGroundShadow(tileData, idx, shadowFactor, settings, underlayData);
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 4. 2.5D ELEVATED PEDESTAL / RAISED BLOCK (isolated)
// In 30° Top-Down Bird's-Eye View:
// - Top Face: 30° foreshortened square plateau with sunlit rim
// - Front Facade: Vertical rock/brick/timber strata wall
// - Side Profile: 30° beveled edge facets
// - Ground Shadow: 30° directional drop shadow cast to the lower floor
// -------------------------------------------------------------
export function render25dIsolatedBlock(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null
) {
  const angleDeg = settings.projectionAngle ?? 30;
  const angleRad = (angleDeg * Math.PI) / 180;
  const tanAngle = Math.tan(angleRad); // tan(30°) ≈ 0.577

  const topY1 = 4;
  const topY2 = 13; // 30° foreshortened top square (9px deep)
  const facadeY1 = 14;
  const facadeY2 = 24; // 11px front vertical drop face
  const blockX1 = 6;
  const blockX2 = 25; // 20px wide block
  const strataStyle = settings.wallStrataStyle || 'rock_strata';
  const depthIntensity = settings.slopeDepthIntensity || 0.85;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const br = baseData[idx];
      const bg = baseData[idx + 1];
      const bb = baseData[idx + 2];

      const inTopFace = (x >= blockX1 && x <= blockX2 && y >= topY1 && y <= topY2);
      const inFrontFacade = (x >= blockX1 && x <= blockX2 && y >= facadeY1 && y <= facadeY2);

      // 30° projected ground shadow to the bottom-right
      const shadowShiftX = y > facadeY2 ? Math.round((y - facadeY2) * tanAngle * 1.5) : 0;
      const inGroundShadow = (
        (y > facadeY2 && y <= 30 && x >= blockX1 + 2 + shadowShiftX && x <= blockX2 + 4 + shadowShiftX) ||
        (y >= facadeY1 && y <= facadeY2 && x > blockX2 && x <= blockX2 + 3)
      );

      if (inTopFace) {
        if (x === blockX1 || y === topY1) {
          // Top & West sunlit rim (30° bird's-eye sunlight from top-left)
          tileData[idx] = Math.min(255, Math.round(br * 1.32 + highlightRgb[0] * 0.22));
          tileData[idx + 1] = Math.min(255, Math.round(bg * 1.32 + highlightRgb[1] * 0.22));
          tileData[idx + 2] = Math.min(255, Math.round(bb * 1.32 + highlightRgb[2] * 0.22));
        } else if (x === blockX2 || y === topY2) {
          // East and South crease
          tileData[idx] = Math.round(br * 0.58);
          tileData[idx + 1] = Math.round(bg * 0.58);
          tileData[idx + 2] = Math.round(bb * 0.58);
        } else {
          tileData[idx] = br;
          tileData[idx + 1] = bg;
          tileData[idx + 2] = bb;
        }
        tileData[idx + 3] = 255;
      } else if (inFrontFacade) {
        if (x === blockX1) {
          // 30° left outline
          tileData[idx] = outlineR; tileData[idx+1] = outlineG; tileData[idx+2] = outlineB;
        } else if (x === blockX2) {
          // 30° right shaded corner outline
          tileData[idx] = Math.round(outlineR * 0.75);
          tileData[idx+1] = Math.round(outlineG * 0.75);
          tileData[idx+2] = Math.round(outlineB * 0.75);
        } else {
          const wallY = y - facadeY1;
          const [wr, wg, wb] = computeWallStrata(
            x,
            y,
            wallY,
            facadeY2 - facadeY1 + 1,
            br,
            bg,
            bb,
            strataStyle,
            depthIntensity
          );
          tileData[idx] = wr;
          tileData[idx + 1] = wg;
          tileData[idx + 2] = wb;
        }
        tileData[idx + 3] = 255;
      } else if (inGroundShadow) {
        const shadowDist = (y > facadeY2 ? y - facadeY2 : 0) + (x > blockX2 ? x - blockX2 : 0);
        const shadowFactor = Math.min(0.88, 0.40 + shadowDist * 0.08);
        applyGroundShadow(tileData, idx, shadowFactor, settings, underlayData);
      } else {
        fillBackgroundPixel(tileData, idx, settings, underlayData);
      }
    }
  }
}

// -------------------------------------------------------------
// 5. 2.5D RAISED HORIZONTAL CAUSEWAY / LEDGE (corridor_horiz)
// Top walkway surface, South drop facade, and lower ground shadow!
// -------------------------------------------------------------
export function render25dHorizontalLedge(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null
) {
  const walkwayTopY = 6;
  const walkwayBottomY = 16;
  const facadeBottomY = 26;
  const strataStyle = settings.wallStrataStyle || 'rock_strata';
  const depthIntensity = settings.slopeDepthIntensity || 0.85;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const br = baseData[idx];
      const bg = baseData[idx + 1];
      const bb = baseData[idx + 2];

      if (y < walkwayTopY) {
        fillBackgroundPixel(tileData, idx, settings, underlayData);
      } else if (y === walkwayTopY) {
        tileData[idx] = Math.min(255, Math.round(br * 1.25 + highlightRgb[0] * 0.15));
        tileData[idx + 1] = Math.min(255, Math.round(bg * 1.25 + highlightRgb[1] * 0.15));
        tileData[idx + 2] = Math.min(255, Math.round(bb * 1.25 + highlightRgb[2] * 0.15));
        tileData[idx + 3] = 255;
      } else if (y > walkwayTopY && y < walkwayBottomY) {
        tileData[idx] = br;
        tileData[idx + 1] = bg;
        tileData[idx + 2] = bb;
        tileData[idx + 3] = 255;
      } else if (y === walkwayBottomY) {
        tileData[idx] = Math.round(br * 0.45);
        tileData[idx + 1] = Math.round(bg * 0.45);
        tileData[idx + 2] = Math.round(bb * 0.45);
        tileData[idx + 3] = 255;
      } else if (y > walkwayBottomY && y <= facadeBottomY) {
        const wallY = y - (walkwayBottomY + 1);
        const [wr, wg, wb] = computeWallStrata(
          x,
          y,
          wallY,
          facadeBottomY - walkwayBottomY,
          br,
          bg,
          bb,
          strataStyle,
          depthIntensity
        );
        tileData[idx] = wr;
        tileData[idx + 1] = wg;
        tileData[idx + 2] = wb;
        tileData[idx + 3] = 255;
      } else if (y === facadeBottomY + 1) {
        tileData[idx] = outlineR;
        tileData[idx + 1] = outlineG;
        tileData[idx + 2] = outlineB;
        tileData[idx + 3] = 255;
      } else {
        const shadowDist = y - (facadeBottomY + 1);
        const shadowFactor = Math.min(0.9, 0.4 + shadowDist * 0.14);
        applyGroundShadow(tileData, idx, shadowFactor, settings, underlayData);
      }
    }
  }
}
