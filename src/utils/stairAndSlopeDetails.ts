import { TileGeneratorSettings } from '../types/tileset';
import { hexToRgb } from './tileGenerator';

// Helper to apply background pixel (transparent, secondary preset texture, or solid color)
export function applyBgPixel(
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

// -------------------------------------------------------------
// RENDER DETAILED STAIRS (4-step 2.5D elevation with balustrades)
// -------------------------------------------------------------
export function renderDetailedStairs(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number]
) {
  const stairStyle = settings.stairStyle || 'carved_stone';
  const stairRailing = settings.stairRailing || 'stone_balustrade';
  const depthIntensity = settings.slopeDepthIntensity ?? 0.85;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const r = baseData[idx];
      const g = baseData[idx + 1];
      const b = baseData[idx + 2];

      const step = Math.floor(y / 8); // 0, 1, 2, 3
      const stepY = y % 8; // 0..7

      // Side balustrade zones
      const isLeftRail = (stairRailing !== 'open_flush') && (x < 5);
      const isRightRail = (stairRailing !== 'open_flush') && (x >= 27);

      if (isLeftRail) {
        if (stairRailing === 'stone_balustrade') {
          if (x === 0) {
            tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB;
          } else if (x === 1) {
            const s = 0.68 + (step * 0.04);
            tileData[idx] = Math.round(r * s);
            tileData[idx + 1] = Math.round(g * s);
            tileData[idx + 2] = Math.round(b * s);
          } else if (x === 2) {
            // Sunlit top coping highlight
            tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.25));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.25));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.25));
          } else if (x === 3) {
            tileData[idx] = Math.round(r * 0.82);
            tileData[idx + 1] = Math.round(g * 0.82);
            tileData[idx + 2] = Math.round(b * 0.82);
          } else { // x === 4
            // Inner drop face casting shadow on step
            tileData[idx] = Math.round(r * (stepY >= 6 ? 0.38 : 0.52));
            tileData[idx + 1] = Math.round(g * (stepY >= 6 ? 0.38 : 0.52));
            tileData[idx + 2] = Math.round(b * (stepY >= 6 ? 0.38 : 0.52));
          }
          if (stepY === 7) {
            // Mortar notch cut into stringer
            tileData[idx] = Math.round(tileData[idx] * 0.72);
            tileData[idx + 1] = Math.round(tileData[idx + 1] * 0.72);
            tileData[idx + 2] = Math.round(tileData[idx + 2] * 0.72);
          }
          tileData[idx + 3] = 255;
          continue;
        } else if (stairRailing === 'wood_posts') {
          const isPost = (stepY === 1 || stepY === 2) && (x >= 1 && x <= 3);
          const isRail = (x === 2);
          if (isPost) {
            if (x === 1) {
              tileData[idx] = Math.min(255, Math.round(r * 1.35 + 20));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.35 + 20));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.35 + 20));
            } else {
              tileData[idx] = Math.round(r * 0.65);
              tileData[idx + 1] = Math.round(g * 0.65);
              tileData[idx + 2] = Math.round(b * 0.65);
            }
            if (stepY === 2 && x === 2) {
              tileData[idx] = 40; tileData[idx + 1] = 40; tileData[idx + 2] = 45; // iron pin
            }
          } else if (isRail) {
            tileData[idx] = Math.min(255, Math.round(r * 1.12));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.12));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.12));
          } else {
            tileData[idx] = Math.round(r * 0.5);
            tileData[idx + 1] = Math.round(g * 0.5);
            tileData[idx + 2] = Math.round(b * 0.5);
          }
          tileData[idx + 3] = 255;
          continue;
        }
      } else if (isRightRail) {
        if (stairRailing === 'stone_balustrade') {
          if (x === 27) {
            tileData[idx] = Math.round(r * 0.42);
            tileData[idx + 1] = Math.round(g * 0.42);
            tileData[idx + 2] = Math.round(b * 0.42);
          } else if (x === 28 || x === 29) {
            const s = 0.65 + (step * 0.04);
            tileData[idx] = Math.round(r * s);
            tileData[idx + 1] = Math.round(g * s);
            tileData[idx + 2] = Math.round(b * s);
          } else if (x === 30) {
            tileData[idx] = Math.round(r * 0.5);
            tileData[idx + 1] = Math.round(g * 0.5);
            tileData[idx + 2] = Math.round(b * 0.5);
          } else {
            tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB;
          }
          if (stepY === 7) {
            tileData[idx] = Math.round(tileData[idx] * 0.72);
            tileData[idx + 1] = Math.round(tileData[idx + 1] * 0.72);
            tileData[idx + 2] = Math.round(tileData[idx + 2] * 0.72);
          }
          tileData[idx + 3] = 255;
          continue;
        } else if (stairRailing === 'wood_posts') {
          const isPost = (stepY === 1 || stepY === 2) && (x >= 28 && x <= 30);
          const isRail = (x === 29);
          if (isPost) {
            tileData[idx] = Math.round(r * 0.6);
            tileData[idx + 1] = Math.round(g * 0.6);
            tileData[idx + 2] = Math.round(b * 0.6);
            if (stepY === 2 && x === 29) {
              tileData[idx] = 40; tileData[idx + 1] = 40; tileData[idx + 2] = 45;
            }
          } else if (isRail) {
            tileData[idx] = Math.round(r * 0.75);
            tileData[idx + 1] = Math.round(g * 0.75);
            tileData[idx + 2] = Math.round(b * 0.75);
          } else {
            tileData[idx] = Math.round(r * 0.45);
            tileData[idx + 1] = Math.round(g * 0.45);
            tileData[idx + 2] = Math.round(b * 0.45);
          }
          tileData[idx + 3] = 255;
          continue;
        }
      }

      // Step elevation factor (higher steps receive more top-light)
      const stepElev = 1.12 - (step * 0.08 * depthIntensity);

      // Side ambient occlusion from stringers
      let sideOcc = 1.0;
      if (stairRailing !== 'open_flush') {
        if (x === 5) sideOcc = 0.86;
        else if (x === 6) sideOcc = 0.94;
        else if (x === 26) sideOcc = 0.82;
        else if (x === 25) sideOcc = 0.90;
      }

      // Center foot-wear track
      const isFootWear = Math.abs(x - 16) <= 3;
      // Staggered stone cleft joints
      const jointX = (step === 0) ? 14 : (step === 1) ? 20 : (step === 2) ? 11 : 18;
      const isJoint = (x === jointX);

      let sr = r, sg = g, sb = b;

      if (stepY === 0) {
        // Nosing front specular lip
        const nosing = 1.34 + 0.16 * depthIntensity;
        sr = Math.min(255, Math.round(r * nosing + highlightRgb[0] * 0.22));
        sg = Math.min(255, Math.round(g * nosing + highlightRgb[1] * 0.22));
        sb = Math.min(255, Math.round(b * nosing + highlightRgb[2] * 0.22));
      } else if (stepY >= 1 && stepY <= 4) {
        // Flat step tread with perspective depth gradient (brighter in front, darker in back)
        const treadGrad = 1.06 - ((stepY - 1) / 3) * 0.18 * depthIntensity;
        const totalLight = stepElev * treadGrad * sideOcc;
        sr = Math.min(255, Math.round(r * totalLight));
        sg = Math.min(255, Math.round(g * totalLight));
        sb = Math.min(255, Math.round(b * totalLight));

        if (isFootWear) {
          sr = Math.min(255, sr + 12);
          sg = Math.min(255, sg + 12);
          sb = Math.min(255, sb + 12);
        }

        if (stairStyle === 'carved_stone') {
          if (isJoint) {
            sr = Math.round(sr * 0.62);
            sg = Math.round(sg * 0.62);
            sb = Math.round(sb * 0.62);
          } else if (x === jointX + 1) {
            sr = Math.min(255, sr + 15);
            sg = Math.min(255, sg + 15);
            sb = Math.min(255, sb + 15);
          }
        } else if (stairStyle === 'wood_timbers') {
          if (x % 3 === 0) {
            sr = Math.round(sr * 0.88);
            sg = Math.round(sg * 0.88);
            sb = Math.round(sb * 0.88);
          }
          if ((x === 7 || x === 24) && stepY === 2) {
            sr = 40; sg = 40; sb = 45; // nail head
          }
        } else if (stairStyle === 'ancient_cobble') {
          if ((x + y * 2) % 7 === 0) {
            sr = Math.round(sr * 0.6);
            sg = Math.round(sg * 0.76 + 18); // moss tint
            sb = Math.round(sb * 0.6);
          }
        } else if (stairStyle === 'temple_marble') {
          if (stepY === 1 && x >= 7 && x <= 24) {
            sr = Math.min(255, Math.round(sr * 1.1 + 35));
            sg = Math.min(255, Math.round(sg * 1.05 + 25));
            sb = Math.max(0, Math.round(sb * 0.7)); // gold inlay
          }
        }
      } else if (stepY === 5) {
        // Tread rear junction line
        const light = 0.80 * stepElev * sideOcc;
        sr = Math.round(r * light);
        sg = Math.round(g * light);
        sb = Math.round(b * light);
      } else if (stepY === 6) {
        // Deep overhang shadow directly under nosing
        const shadow = (0.40 - depthIntensity * 0.12) * sideOcc;
        sr = Math.round(r * shadow);
        sg = Math.round(g * shadow);
        sb = Math.round(b * shadow);
      } else { // stepY === 7
        // Vertical riser face with chisel grain
        const riser = (0.52 - depthIntensity * 0.08) * sideOcc;
        sr = Math.round(r * riser);
        sg = Math.round(g * riser);
        sb = Math.round(b * riser);
        if (isJoint) {
          sr = Math.round(sr * 0.5);
          sg = Math.round(sg * 0.5);
          sb = Math.round(sb * 0.5);
        }
        if (x % 2 === 0) {
          sr = Math.round(sr * 0.85);
          sg = Math.round(sg * 0.85);
          sb = Math.round(sb * 0.85);
        }
      }

      tileData[idx] = sr;
      tileData[idx + 1] = sg;
      tileData[idx + 2] = sb;
      tileData[idx + 3] = 255;
    }
  }
}

// -------------------------------------------------------------
// RENDER DETAILED 2.5D SLOPES & RAMPS
// -------------------------------------------------------------
export function renderDetailed25dSlope(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  tileId: string,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null = null
) {
  const rampStyle = settings.rampSurfaceType || 'natural';
  const shadowAlpha = settings.cliffShadowIntensity;
  const slopeBg = settings.slopeBackgroundWall || 'none';
  const noBgWall = (slopeBg === 'none');
  const isNaturalBank = (slopeBg === 'natural_bank');
  const depthIntensity = settings.slopeDepthIntensity ?? 0.85;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const r = baseData[idx];
      const g = baseData[idx + 1];
      const b = baseData[idx + 2];

      // 1. VERTICAL RAMP (TOP-DOWN RPG VIEW: 1-TILE STRAIGHT RAMP)
      if (tileId === 'slope25d_ramp_v_full') {
        const leftMargin = 6;
        const rightMargin = 25;

        if (x < leftMargin) {
          if (noBgWall) {
            if (x < leftMargin - 2) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (x === leftMargin - 2) {
              tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.20));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.20));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.20));
              tileData[idx + 3] = 255;
            } else {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            }
          } else {
            const isStrata = (y % 6 === 0);
            const wallShade = isStrata ? 0.44 : 0.60;
            tileData[idx] = Math.round(r * wallShade);
            tileData[idx + 1] = Math.round(g * wallShade);
            tileData[idx + 2] = Math.round(b * wallShade);
            tileData[idx + 3] = 255;
          }
        } else if (x > rightMargin) {
          if (noBgWall) {
            if (x === rightMargin + 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else if (x === rightMargin + 2) {
              tileData[idx] = Math.round(r * 0.72);
              tileData[idx + 1] = Math.round(g * 0.72);
              tileData[idx + 2] = Math.round(b * 0.72);
              tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const isStrata = (y % 6 === 0);
            const wallShade = isStrata ? 0.38 : 0.52;
            tileData[idx] = Math.round(r * wallShade);
            tileData[idx + 1] = Math.round(g * wallShade);
            tileData[idx + 2] = Math.round(b * wallShade);
            tileData[idx + 3] = 255;
          }
        } else {
          // Top-down RPG ramp path
          if (y === 0) {
            // Flush entrance meeting upper ground floor with ZERO gap
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else if (y === 31) {
            // Flush exit meeting lower ground floor with ZERO gap
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            const slopeT = y / 31;
            const elevLight = 1.15 - slopeT * (0.30 * depthIntensity);
            let pr = Math.min(255, Math.round(r * elevLight));
            let pg = Math.min(255, Math.round(g * elevLight));
            let pb = Math.min(255, Math.round(b * elevLight));

            const isTread = (y % 4 === 0);
            const isShadow = (y % 4 === 2);
            if (isTread) {
              pr = Math.min(255, pr + Math.round(22 * depthIntensity));
              pg = Math.min(255, pg + Math.round(22 * depthIntensity));
              pb = Math.min(255, pb + Math.round(22 * depthIntensity));
            } else if (isShadow) {
              pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
            }

            if (rampStyle === 'mud_slide') {
              if (x === 10 || x === 11 || x === 20 || x === 21) {
                pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
              }
            } else if (rampStyle === 'stepped') {
              if (y % 6 === 0) {
                pr = Math.min(255, pr + 36); pg = Math.min(255, pg + 36); pb = Math.min(255, pb + 36);
              } else if (y % 6 === 5) {
                pr = Math.round(pr * 0.55); pg = Math.round(pg * 0.55); pb = Math.round(pb * 0.55);
              }
            } else if (rampStyle === 'plank') {
              if (y % 5 === 0) {
                pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35);
              } else if (y % 5 === 1) {
                pr = Math.min(255, pr + 28); pg = Math.min(255, pg + 28); pb = Math.min(255, pb + 28);
              }
              if ((x === 8 || x === 23) && (y % 5 === 2)) {
                pr = 25; pg = 28; pb = 32;
              }
            } else if (rampStyle === 'cobblestone') {
              if (Math.hypot((x % 4) - 2, (y % 4) - 2) < 1.1) {
                pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
              }
            } else if (settings.slopeWheelRuts && (x === 11 || x === 20)) {
              pr = Math.round(pr * 0.76); pg = Math.round(pg * 0.76); pb = Math.round(pb * 0.76);
            }

            tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb; tileData[idx + 3] = 255;
          }
        }
      }

      // 2. VERTICAL RAMP TOP HALF (TOP-DOWN RPG 2-TILE SET - UPPER HALF)
      else if (tileId === 'slope25d_ramp_v_top') {
        const leftMargin = 6;
        const rightMargin = 25;

        if (x < leftMargin) {
          if (noBgWall) {
            if (x < leftMargin - 2) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (x === leftMargin - 2) {
              tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.20));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.20));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.20));
              tileData[idx + 3] = 255;
            } else {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            }
          } else {
            const isStrata = (y % 6 === 0);
            const wShade = isStrata ? 0.44 : 0.60;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else if (x > rightMargin) {
          if (noBgWall) {
            if (x === rightMargin + 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else if (x === rightMargin + 2) {
              tileData[idx] = Math.round(r * 0.72); tileData[idx + 1] = Math.round(g * 0.72); tileData[idx + 2] = Math.round(b * 0.72); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const isStrata = (y % 6 === 0);
            const wShade = isStrata ? 0.38 : 0.52;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else {
          // Walkable ramp path - Upper Half of 64px vertical climb
          if (y === 0) {
            // Flush entrance meeting upper plateau floor with ZERO gap
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            const slopeT = y / 62; // 0.0 to 31/62 = 0.50
            const elevLight = 1.15 - slopeT * (0.30 * depthIntensity);
            let pr = Math.min(255, Math.round(r * elevLight));
            let pg = Math.min(255, Math.round(g * elevLight));
            let pb = Math.min(255, Math.round(b * elevLight));

            const isTread = (y % 4 === 0);
            const isShadow = (y % 4 === 2);
            if (isTread) {
              pr = Math.min(255, pr + Math.round(22 * depthIntensity));
              pg = Math.min(255, pg + Math.round(22 * depthIntensity));
              pb = Math.min(255, pb + Math.round(22 * depthIntensity));
            } else if (isShadow) {
              pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
            }

            if (rampStyle === 'mud_slide' && (x === 10 || x === 11 || x === 20 || x === 21)) {
              pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
            } else if (rampStyle === 'stepped') {
              if (y % 6 === 0) {
                pr = Math.min(255, pr + 36); pg = Math.min(255, pg + 36); pb = Math.min(255, pb + 36);
              } else if (y % 6 === 5) {
                pr = Math.round(pr * 0.55); pg = Math.round(pg * 0.55); pb = Math.round(pb * 0.55);
              }
            } else if (rampStyle === 'plank') {
              if (y % 5 === 0) {
                pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35);
              } else if (y % 5 === 1) {
                pr = Math.min(255, pr + 28); pg = Math.min(255, pg + 28); pb = Math.min(255, pb + 28);
              }
              if ((x === 8 || x === 23) && (y % 5 === 2)) {
                pr = 25; pg = 28; pb = 32;
              }
            } else if (rampStyle === 'cobblestone') {
              if (Math.hypot((x % 4) - 2, (y % 4) - 2) < 1.1) {
                pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
              }
            } else if (settings.slopeWheelRuts && (x === 11 || x === 20)) {
              pr = Math.round(pr * 0.76); pg = Math.round(pg * 0.76); pb = Math.round(pb * 0.76);
            }

            tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb; tileData[idx + 3] = 255;
          }
        }
      }

      // 3. VERTICAL RAMP BOTTOM HALF (TOP-DOWN RPG 2-TILE SET - LOWER HALF)
      else if (tileId === 'slope25d_ramp_v_base') {
        const leftMargin = 6;
        const rightMargin = 25;

        if (x < leftMargin) {
          if (noBgWall) {
            if (x < leftMargin - 2) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (x === leftMargin - 2) {
              tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.20));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.20));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.20));
              tileData[idx + 3] = 255;
            } else {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            }
          } else {
            const isStrata = ((32 + y) % 6 === 0);
            const wShade = isStrata ? 0.44 : 0.60;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else if (x > rightMargin) {
          if (noBgWall) {
            if (x === rightMargin + 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else if (x === rightMargin + 2) {
              tileData[idx] = Math.round(r * 0.72); tileData[idx + 1] = Math.round(g * 0.72); tileData[idx + 2] = Math.round(b * 0.72); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const isStrata = ((32 + y) % 6 === 0);
            const wShade = isStrata ? 0.38 : 0.52;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else {
          // Walkable ramp path - Lower Half continuing from Top Half
          if (y === 31) {
            // Flush exit meeting lower ground floor with ZERO gap
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            const globalY = 32 + y;
            const slopeT = globalY / 62; // 32/62 = 0.516 to 62/62 = 1.0
            const elevLight = 1.15 - slopeT * (0.30 * depthIntensity);
            let pr = Math.min(255, Math.round(r * elevLight));
            let pg = Math.min(255, Math.round(g * elevLight));
            let pb = Math.min(255, Math.round(b * elevLight));

            // Treads continuing seamless 4-pixel phase from Top Half
            const isTread = (globalY % 4 === 0);
            const isShadow = (globalY % 4 === 2);
            if (isTread) {
              pr = Math.min(255, pr + Math.round(22 * depthIntensity));
              pg = Math.min(255, pg + Math.round(22 * depthIntensity));
              pb = Math.min(255, pb + Math.round(22 * depthIntensity));
            } else if (isShadow) {
              pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
            }

            if (rampStyle === 'mud_slide' && (x === 10 || x === 11 || x === 20 || x === 21)) {
              pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
            } else if (rampStyle === 'stepped') {
              if (globalY % 6 === 0) {
                pr = Math.min(255, pr + 36); pg = Math.min(255, pg + 36); pb = Math.min(255, pb + 36);
              } else if (globalY % 6 === 5) {
                pr = Math.round(pr * 0.55); pg = Math.round(pg * 0.55); pb = Math.round(pb * 0.55);
              }
            } else if (rampStyle === 'plank') {
              if (globalY % 5 === 0) {
                pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35);
              } else if (globalY % 5 === 1) {
                pr = Math.min(255, pr + 28); pg = Math.min(255, pg + 28); pb = Math.min(255, pb + 28);
              }
              if ((x === 8 || x === 23) && (globalY % 5 === 2)) {
                pr = 25; pg = 28; pb = 32;
              }
            } else if (rampStyle === 'cobblestone') {
              if (Math.hypot((x % 4) - 2, (y % 4) - 2) < 1.1) {
                pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
              }
            } else if (settings.slopeWheelRuts && (x === 11 || x === 20)) {
              pr = Math.round(pr * 0.76); pg = Math.round(pg * 0.76); pb = Math.round(pb * 0.76);
            }

            tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb; tileData[idx + 3] = 255;
          }
        }
      }

      // 4. LATERAL RAMP W->E (TOP-DOWN RPG VIEW: PART 1 - LOW/WEST HALF)
      else if (tileId === 'slope25d_ramp_lat_w2e_top') {
        const topMargin = 6;
        const bottomMargin = 25;

        if (y < topMargin) {
          if (noBgWall) {
            if (y < topMargin - 2) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (y === topMargin - 2) {
              tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.20));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.20));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.20));
              tileData[idx + 3] = 255;
            } else {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            }
          } else {
            const isStrata = (x % 6 === 0);
            const wShade = isStrata ? 0.44 : 0.60;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else if (y > bottomMargin) {
          if (noBgWall) {
            if (y === bottomMargin + 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else if (y === bottomMargin + 2) {
              tileData[idx] = Math.round(r * 0.72); tileData[idx + 1] = Math.round(g * 0.72); tileData[idx + 2] = Math.round(b * 0.72); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const isStrata = (x % 6 === 0);
            const wShade = isStrata ? 0.38 : 0.52;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else {
          // Horizontal walkable ramp path ascending from West to East (Part 1: Low to Mid)
          if (x === 0) {
            // Flush entrance meeting lower ground on the West with ZERO gap
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            const slopeT = x / 62; // 0.0 to 31/62 = 0.50
            const elevLight = 0.85 + slopeT * (0.30 * depthIntensity);
            let pr = Math.min(255, Math.round(r * elevLight));
            let pg = Math.min(255, Math.round(g * elevLight));
            let pb = Math.min(255, Math.round(b * elevLight));

            const isTread = (x % 4 === 0);
            const isShadow = (x % 4 === 2);
            if (isTread) {
              pr = Math.min(255, pr + Math.round(22 * depthIntensity));
              pg = Math.min(255, pg + Math.round(22 * depthIntensity));
              pb = Math.min(255, pb + Math.round(22 * depthIntensity));
            } else if (isShadow) {
              pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
            }

            if (rampStyle === 'mud_slide' && (y === 10 || y === 11 || y === 20 || y === 21)) {
              pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
            } else if (rampStyle === 'stepped') {
              if (x % 6 === 0) {
                pr = Math.min(255, pr + 36); pg = Math.min(255, pg + 36); pb = Math.min(255, pb + 36);
              } else if (x % 6 === 5) {
                pr = Math.round(pr * 0.55); pg = Math.round(pg * 0.55); pb = Math.round(pb * 0.55);
              }
            } else if (rampStyle === 'plank') {
              if (x % 5 === 0) {
                pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35);
              } else if (x % 5 === 1) {
                pr = Math.min(255, pr + 28); pg = Math.min(255, pg + 28); pb = Math.min(255, pb + 28);
              }
            } else if (rampStyle === 'cobblestone') {
              if (Math.hypot((x % 4) - 2, (y % 4) - 2) < 1.1) {
                pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
              }
            } else if (settings.slopeWheelRuts && (y === 11 || y === 20)) {
              pr = Math.round(pr * 0.76); pg = Math.round(pg * 0.76); pb = Math.round(pb * 0.76);
            }

            tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb; tileData[idx + 3] = 255;
          }
        }
      }

      // 5. LATERAL RAMP W->E (TOP-DOWN RPG VIEW: PART 2 - MID/EAST HALF)
      else if (tileId === 'slope25d_ramp_lat_w2e_wall') {
        const topMargin = 6;
        const bottomMargin = 25;

        if (y < topMargin) {
          if (noBgWall) {
            if (y < topMargin - 2) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (y === topMargin - 2) {
              tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.20));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.20));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.20));
              tileData[idx + 3] = 255;
            } else {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            }
          } else {
            const isStrata = ((32 + x) % 6 === 0);
            const wShade = isStrata ? 0.44 : 0.60;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else if (y > bottomMargin) {
          if (noBgWall) {
            if (y === bottomMargin + 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else if (y === bottomMargin + 2) {
              tileData[idx] = Math.round(r * 0.72); tileData[idx + 1] = Math.round(g * 0.72); tileData[idx + 2] = Math.round(b * 0.72); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const isStrata = ((32 + x) % 6 === 0);
            const wShade = isStrata ? 0.38 : 0.52;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else {
          // Walkable ramp path continuing seamlessly from Part 1
          if (x === 31) {
            // Flush exit meeting upper plateau on the East with ZERO gap
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            const globalX = 32 + x;
            const slopeT = globalX / 62; // 32/62 = 0.516 to 62/62 = 1.0
            const elevLight = 0.85 + slopeT * (0.30 * depthIntensity);
            let pr = Math.min(255, Math.round(r * elevLight));
            let pg = Math.min(255, Math.round(g * elevLight));
            let pb = Math.min(255, Math.round(b * elevLight));

            const isTread = (globalX % 4 === 0);
            const isShadow = (globalX % 4 === 2);
            if (isTread) {
              pr = Math.min(255, pr + Math.round(22 * depthIntensity));
              pg = Math.min(255, pg + Math.round(22 * depthIntensity));
              pb = Math.min(255, pb + Math.round(22 * depthIntensity));
            } else if (isShadow) {
              pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
            }

            if (rampStyle === 'mud_slide' && (y === 10 || y === 11 || y === 20 || y === 21)) {
              pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
            } else if (rampStyle === 'stepped') {
              if (globalX % 6 === 0) {
                pr = Math.min(255, pr + 36); pg = Math.min(255, pg + 36); pb = Math.min(255, pb + 36);
              } else if (globalX % 6 === 5) {
                pr = Math.round(pr * 0.55); pg = Math.round(pg * 0.55); pb = Math.round(pb * 0.55);
              }
            } else if (rampStyle === 'plank') {
              if (globalX % 5 === 0) {
                pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35);
              } else if (globalX % 5 === 1) {
                pr = Math.min(255, pr + 28); pg = Math.min(255, pg + 28); pb = Math.min(255, pb + 28);
              }
            } else if (rampStyle === 'cobblestone') {
              if (Math.hypot((x % 4) - 2, (y % 4) - 2) < 1.1) {
                pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
              }
            } else if (settings.slopeWheelRuts && (y === 11 || y === 20)) {
              pr = Math.round(pr * 0.76); pg = Math.round(pg * 0.76); pb = Math.round(pb * 0.76);
            }

            tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb; tileData[idx + 3] = 255;
          }
        }
      }

      // 6. LATERAL RAMP E->W (TOP-DOWN RPG VIEW: PART 1 - HIGH/EAST HALF)
      else if (tileId === 'slope25d_ramp_lat_e2w_top') {
        const topMargin = 6;
        const bottomMargin = 25;

        if (y < topMargin) {
          if (noBgWall) {
            if (y < topMargin - 2) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (y === topMargin - 2) {
              tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.20));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.20));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.20));
              tileData[idx + 3] = 255;
            } else {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            }
          } else {
            const isStrata = (x % 6 === 0);
            const wShade = isStrata ? 0.44 : 0.60;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else if (y > bottomMargin) {
          if (noBgWall) {
            if (y === bottomMargin + 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else if (y === bottomMargin + 2) {
              tileData[idx] = Math.round(r * 0.72); tileData[idx + 1] = Math.round(g * 0.72); tileData[idx + 2] = Math.round(b * 0.72); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const isStrata = (x % 6 === 0);
            const wShade = isStrata ? 0.38 : 0.52;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else {
          // Descending towards West (Part 1 East Half: High to Mid)
          if (x === 31) {
            // Flush entrance meeting upper plateau on the East with ZERO gap
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            const distFromEast = 31 - x;
            const slopeT = distFromEast / 62; // 0.0 to 31/62 = 0.50
            const elevLight = 1.15 - slopeT * (0.30 * depthIntensity);
            let pr = Math.min(255, Math.round(r * elevLight));
            let pg = Math.min(255, Math.round(g * elevLight));
            let pb = Math.min(255, Math.round(b * elevLight));

            const isTread = (distFromEast % 4 === 0);
            const isShadow = (distFromEast % 4 === 2);
            if (isTread) {
              pr = Math.min(255, pr + Math.round(22 * depthIntensity));
              pg = Math.min(255, pg + Math.round(22 * depthIntensity));
              pb = Math.min(255, pb + Math.round(22 * depthIntensity));
            } else if (isShadow) {
              pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
            }

            if (rampStyle === 'mud_slide' && (y === 10 || y === 11 || y === 20 || y === 21)) {
              pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
            } else if (rampStyle === 'stepped') {
              if (distFromEast % 6 === 0) {
                pr = Math.min(255, pr + 36); pg = Math.min(255, pg + 36); pb = Math.min(255, pb + 36);
              } else if (distFromEast % 6 === 5) {
                pr = Math.round(pr * 0.55); pg = Math.round(pg * 0.55); pb = Math.round(pb * 0.55);
              }
            } else if (rampStyle === 'plank') {
              if (distFromEast % 5 === 0) {
                pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35);
              } else if (distFromEast % 5 === 1) {
                pr = Math.min(255, pr + 28); pg = Math.min(255, pg + 28); pb = Math.min(255, pb + 28);
              }
            } else if (rampStyle === 'cobblestone') {
              if (Math.hypot((x % 4) - 2, (y % 4) - 2) < 1.1) {
                pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
              }
            } else if (settings.slopeWheelRuts && (y === 11 || y === 20)) {
              pr = Math.round(pr * 0.76); pg = Math.round(pg * 0.76); pb = Math.round(pb * 0.76);
            }

            tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb; tileData[idx + 3] = 255;
          }
        }
      }

      // 7. LATERAL RAMP E->W (TOP-DOWN RPG VIEW: PART 2 - LOW/WEST HALF)
      else if (tileId === 'slope25d_ramp_lat_e2w_wall') {
        const topMargin = 6;
        const bottomMargin = 25;

        if (y < topMargin) {
          if (noBgWall) {
            if (y < topMargin - 2) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (y === topMargin - 2) {
              tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.20));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.20));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.20));
              tileData[idx + 3] = 255;
            } else {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            }
          } else {
            const isStrata = ((32 + (31 - x)) % 6 === 0);
            const wShade = isStrata ? 0.44 : 0.60;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else if (y > bottomMargin) {
          if (noBgWall) {
            if (y === bottomMargin + 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else if (y === bottomMargin + 2) {
              tileData[idx] = Math.round(r * 0.72); tileData[idx + 1] = Math.round(g * 0.72); tileData[idx + 2] = Math.round(b * 0.72); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const isStrata = ((32 + (31 - x)) % 6 === 0);
            const wShade = isStrata ? 0.38 : 0.52;
            tileData[idx] = Math.round(r * wShade); tileData[idx + 1] = Math.round(g * wShade); tileData[idx + 2] = Math.round(b * wShade);
            tileData[idx + 3] = 255;
          }
        } else {
          // Continuing down towards West (Part 2 West Half: Mid to Low)
          if (x === 0) {
            // Flush exit meeting lower ground on the West with ZERO gap
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            const globalDist = 32 + (31 - x);
            const slopeT = globalDist / 62; // 32/62 = 0.516 to 62/62 = 1.0
            const elevLight = 1.15 - slopeT * (0.30 * depthIntensity);
            let pr = Math.min(255, Math.round(r * elevLight));
            let pg = Math.min(255, Math.round(g * elevLight));
            let pb = Math.min(255, Math.round(b * elevLight));

            const isTread = (globalDist % 4 === 0);
            const isShadow = (globalDist % 4 === 2);
            if (isTread) {
              pr = Math.min(255, pr + Math.round(22 * depthIntensity));
              pg = Math.min(255, pg + Math.round(22 * depthIntensity));
              pb = Math.min(255, pb + Math.round(22 * depthIntensity));
            } else if (isShadow) {
              pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
            }

            if (rampStyle === 'mud_slide' && (y === 10 || y === 11 || y === 20 || y === 21)) {
              pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
            } else if (rampStyle === 'stepped') {
              if (globalDist % 6 === 0) {
                pr = Math.min(255, pr + 36); pg = Math.min(255, pg + 36); pb = Math.min(255, pb + 36);
              } else if (globalDist % 6 === 5) {
                pr = Math.round(pr * 0.55); pg = Math.round(pg * 0.55); pb = Math.round(pb * 0.55);
              }
            } else if (rampStyle === 'plank') {
              if (globalDist % 5 === 0) {
                pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35);
              } else if (globalDist % 5 === 1) {
                pr = Math.min(255, pr + 28); pg = Math.min(255, pg + 28); pb = Math.min(255, pb + 28);
              }
            } else if (rampStyle === 'cobblestone') {
              if (Math.hypot((x % 4) - 2, (y % 4) - 2) < 1.1) {
                pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
              }
            } else if (settings.slopeWheelRuts && (y === 11 || y === 20)) {
              pr = Math.round(pr * 0.76); pg = Math.round(pg * 0.76); pb = Math.round(pb * 0.76);
            }

            tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb; tileData[idx + 3] = 255;
          }
        }
      }

      // 8. ROLLING HILL / MOUND (TOP-DOWN RPG CONCENTRIC ELEVATION)
      else if (tileId === 'slope25d_natural_hill') {
        const dx = x - 15.5;
        const dy = y - 15.5;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) {
          // Flat sunlit circular top plateau
          tileData[idx] = Math.min(255, Math.round(r * 1.18));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.18));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.18));
        } else if (dist <= 15) {
          // Top-down circular slope skirt with subtle concentric ring steps
          const ringT = (dist - 5) / 10;
          const shade = 1.15 - ringT * (0.25 * depthIntensity);
          tileData[idx] = Math.round(r * shade);
          tileData[idx + 1] = Math.round(g * shade);
          tileData[idx + 2] = Math.round(b * shade);
        } else {
          // Ground floor meeting all 4 outer borders with ZERO gap
          tileData[idx] = r;
          tileData[idx + 1] = g;
          tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      }

      // 9. DIAGONAL CLIFF SLOPE NW (TOP-DOWN RPG VIEW)
      else if (tileId === 'cliff_diag_slope_nw') {
        const diag = x + y;
        if (diag <= 12) {
          // Upper plateau floor - seamless with ground
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        } else if (diag === 13) {
          // Sunlit slope crest ridge highlight
          tileData[idx] = Math.min(255, Math.round(r * 1.30 + highlightRgb[0] * 0.22));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.30 + highlightRgb[1] * 0.22));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.30 + highlightRgb[2] * 0.22));
        } else if (diag >= 14 && diag <= 21) {
          // Top-down diagonal slope incline
          const slopeT = (diag - 14) / 7;
          const elevLight = 1.15 - slopeT * (0.30 * depthIntensity);
          let pr = Math.min(255, Math.round(r * elevLight));
          let pg = Math.min(255, Math.round(g * elevLight));
          let pb = Math.min(255, Math.round(b * elevLight));

          const isTread = ((diag - 14) % 4 === 0);
          const isShadow = ((diag - 14) % 4 === 2);
          if (isTread) {
            pr = Math.min(255, pr + Math.round(20 * depthIntensity));
            pg = Math.min(255, pg + Math.round(20 * depthIntensity));
            pb = Math.min(255, pb + Math.round(20 * depthIntensity));
          } else if (isShadow) {
            pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
          }

          if (rampStyle === 'mud_slide' && Math.abs(x - y) === 3) {
            pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
          } else if (rampStyle === 'stepped') {
            const sY = (diag - 14) % 5;
            if (sY === 0) { pr = Math.min(255, pr + 32); pg = Math.min(255, pg + 32); pb = Math.min(255, pb + 32); }
            else if (sY === 4) { pr = Math.round(pr * 0.60); pg = Math.round(pg * 0.60); pb = Math.round(pb * 0.60); }
          } else if (rampStyle === 'plank') {
            if ((diag - 14) % 4 === 0) { pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35); }
            else if ((diag - 14) % 4 === 1) { pr = Math.min(255, pr + 26); pg = Math.min(255, pg + 26); pb = Math.min(255, pb + 26); }
          } else if (rampStyle === 'cobblestone' && (x % 4 === 0 && y % 4 === 0)) {
            pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
          }

          tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb;
        } else if (diag === 22) {
          // Shaded slope base seam
          tileData[idx] = Math.round(r * 0.82);
          tileData[idx + 1] = Math.round(g * 0.82);
          tileData[idx + 2] = Math.round(b * 0.82);
        } else {
          // Lower ground floor - seamless with ground with ZERO gap
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      }

      // 10. DIAGONAL CLIFF SLOPE NE (TOP-DOWN RPG VIEW)
      else if (tileId === 'cliff_diag_slope_ne') {
        const diag = (31 - x) + y;
        if (diag <= 12) {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        } else if (diag === 13) {
          tileData[idx] = Math.min(255, Math.round(r * 1.30 + highlightRgb[0] * 0.22));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.30 + highlightRgb[1] * 0.22));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.30 + highlightRgb[2] * 0.22));
        } else if (diag >= 14 && diag <= 21) {
          const slopeT = (diag - 14) / 7;
          const elevLight = 1.15 - slopeT * (0.30 * depthIntensity);
          let pr = Math.min(255, Math.round(r * elevLight));
          let pg = Math.min(255, Math.round(g * elevLight));
          let pb = Math.min(255, Math.round(b * elevLight));

          const isTread = ((diag - 14) % 4 === 0);
          const isShadow = ((diag - 14) % 4 === 2);
          if (isTread) {
            pr = Math.min(255, pr + Math.round(20 * depthIntensity));
            pg = Math.min(255, pg + Math.round(20 * depthIntensity));
            pb = Math.min(255, pb + Math.round(20 * depthIntensity));
          } else if (isShadow) {
            pr = Math.round(pr * 0.85); pg = Math.round(pg * 0.85); pb = Math.round(pb * 0.85);
          }

          if (rampStyle === 'mud_slide' && Math.abs((31 - x) - y) === 3) {
            pr = Math.round(pr * 0.70); pg = Math.round(pg * 0.70); pb = Math.round(pb * 0.70);
          } else if (rampStyle === 'stepped') {
            const sY = (diag - 14) % 5;
            if (sY === 0) { pr = Math.min(255, pr + 32); pg = Math.min(255, pg + 32); pb = Math.min(255, pb + 32); }
            else if (sY === 4) { pr = Math.round(pr * 0.60); pg = Math.round(pg * 0.60); pb = Math.round(pb * 0.60); }
          } else if (rampStyle === 'plank') {
            if ((diag - 14) % 4 === 0) { pr = Math.round(r * 0.35); pg = Math.round(g * 0.35); pb = Math.round(b * 0.35); }
            else if ((diag - 14) % 4 === 1) { pr = Math.min(255, pr + 26); pg = Math.min(255, pg + 26); pb = Math.min(255, pb + 26); }
          } else if (rampStyle === 'cobblestone' && (x % 4 === 0 && y % 4 === 0)) {
            pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
          }

          tileData[idx] = pr; tileData[idx + 1] = pg; tileData[idx + 2] = pb;
        } else if (diag === 22) {
          tileData[idx] = Math.round(r * 0.82);
          tileData[idx + 1] = Math.round(g * 0.82);
          tileData[idx + 2] = Math.round(b * 0.82);
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      }

      // 11. DIAGONAL CLIFF SLOPE SW (TOP-DOWN RPG VIEW)
      else if (tileId === 'cliff_diag_slope_sw') {
        const diagLip = Math.round(7 + x * 0.5);
        const wallBottom = diagLip + 12;

        if (y < diagLip) {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        } else if (y === diagLip) {
          tileData[idx] = Math.min(255, Math.round(r * 1.30 + highlightRgb[0] * 0.22));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.30 + highlightRgb[1] * 0.22));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.30 + highlightRgb[2] * 0.22));
        } else if (y > diagLip && y <= wallBottom) {
          const wallY = y - diagLip;
          const isStrata = (wallY % 5 === 0);
          const wShade = isStrata ? 0.44 : 0.60;
          tileData[idx] = Math.round(r * wShade);
          tileData[idx + 1] = Math.round(g * wShade);
          tileData[idx + 2] = Math.round(b * wShade);
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      }

      // 12. DIAGONAL CLIFF SLOPE SE (TOP-DOWN RPG VIEW)
      else if (tileId === 'cliff_diag_slope_se') {
        const diagLip = Math.round(7 + (31 - x) * 0.5);
        const wallBottom = diagLip + 12;

        if (y < diagLip) {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        } else if (y === diagLip) {
          tileData[idx] = Math.min(255, Math.round(r * 1.28 + highlightRgb[0] * 0.20));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.28 + highlightRgb[1] * 0.20));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.28 + highlightRgb[2] * 0.20));
        } else if (y > diagLip && y <= wallBottom) {
          const wallY = y - diagLip;
          const isStrata = (wallY % 5 === 0);
          const wShade = isStrata ? 0.40 : 0.54;
          tileData[idx] = Math.round(r * wShade);
          tileData[idx + 1] = Math.round(g * wShade);
          tileData[idx + 2] = Math.round(b * wShade);
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      }

      // 13. DIAGONAL CLIFF LIP NW (TOP-DOWN RPG VIEW)
      else if (tileId === 'cliff_diag_top_nw') {
        const diag = x + y;
        if (diag < 18) {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        } else if (diag === 18 || diag === 19) {
          tileData[idx] = Math.min(255, Math.round(r * 1.30 + highlightRgb[0] * 0.22));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.30 + highlightRgb[1] * 0.22));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.30 + highlightRgb[2] * 0.22));
        } else {
          const wallDrop = diag - 19;
          const wShade = Math.max(0.48, 0.65 - wallDrop * 0.04);
          tileData[idx] = Math.round(r * wShade);
          tileData[idx + 1] = Math.round(g * wShade);
          tileData[idx + 2] = Math.round(b * wShade);
        }
        tileData[idx + 3] = 255;
      }

      // 14. DIAGONAL CLIFF LIP NE (TOP-DOWN RPG VIEW)
      else if (tileId === 'cliff_diag_top_ne') {
        const diag = (31 - x) + y;
        if (diag < 18) {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        } else if (diag === 18 || diag === 19) {
          tileData[idx] = Math.min(255, Math.round(r * 1.28 + highlightRgb[0] * 0.20));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.28 + highlightRgb[1] * 0.20));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.28 + highlightRgb[2] * 0.20));
        } else {
          const wallDrop = diag - 19;
          const wShade = Math.max(0.44, 0.60 - wallDrop * 0.04);
          tileData[idx] = Math.round(r * wShade);
          tileData[idx + 1] = Math.round(g * wShade);
          tileData[idx + 2] = Math.round(b * wShade);
        }
        tileData[idx + 3] = 255;
      }

      // 15. DIAGONAL CLIFF BASE NW (TOP-DOWN RPG VIEW)
      else if (tileId === 'cliff_diag_base_nw') {
        const diag = x + y;
        if (diag < 12) {
          const isStrata = (y % 4 === 0);
          const wallShade = isStrata ? 0.44 : 0.60;
          tileData[idx] = Math.round(r * wallShade);
          tileData[idx + 1] = Math.round(g * wallShade);
          tileData[idx + 2] = Math.round(b * wallShade);
        } else if (diag === 12 || diag === 13) {
          tileData[idx] = Math.round(r * 0.65);
          tileData[idx + 1] = Math.round(g * 0.65);
          tileData[idx + 2] = Math.round(b * 0.65);
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      }

      // 16. DIAGONAL CLIFF BASE NE (TOP-DOWN RPG VIEW)
      else if (tileId === 'cliff_diag_base_ne') {
        const diag = (31 - x) + y;
        if (diag < 12) {
          const isStrata = (y % 4 === 0);
          const wallShade = isStrata ? 0.40 : 0.54;
          tileData[idx] = Math.round(r * wallShade);
          tileData[idx + 1] = Math.round(g * wallShade);
          tileData[idx + 2] = Math.round(b * wallShade);
        } else if (diag === 12 || diag === 13) {
          tileData[idx] = Math.round(r * 0.62);
          tileData[idx + 1] = Math.round(g * 0.62);
          tileData[idx + 2] = Math.round(b * 0.62);
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      }
    }
  }
}

// -------------------------------------------------------------
// COMPUTE 2.5D VERTICAL WALL STRATA / MASONRY PIXEL
// -------------------------------------------------------------
export function computeWallFacePixel(
  baseR: number,
  baseG: number,
  baseB: number,
  x: number,
  y: number,
  wallY: number,
  wallHeight: number,
  settings: TileGeneratorSettings
): [number, number, number] {
  const wallStyle = settings.wallStrataStyle || 'rock_strata';
  const depthFactor = 0.50 + ((wallY / wallHeight) * 0.18);

  let wr = Math.round(baseR * depthFactor);
  let wg = Math.round(baseG * depthFactor);
  let wb = Math.round(baseB * depthFactor);

  if (wallStyle === 'rock_strata') {
    const strata = Math.sin(y * 1.1 + (x % 4) * 0.3) * 0.14;
    wr = Math.round(wr * (1.0 + strata));
    wg = Math.round(wg * (1.0 + strata));
    wb = Math.round(wb * (1.0 + strata));
    if ((x === 9 || x === 22) && wallY > 2 && wallY < wallHeight - 2) {
      wr = Math.round(wr * 0.5);
      wg = Math.round(wg * 0.5);
      wb = Math.round(wb * 0.5);
    }
  } else if (wallStyle === 'masonry_brick') {
    const course = Math.floor(wallY / 4);
    const courseY = wallY % 4;
    const brickOffset = (course % 2 === 0) ? 0 : 4;
    const isMortarH = (courseY === 0);
    const isMortarV = ((x + brickOffset) % 8 === 0);
    if (isMortarH || isMortarV) {
      wr = Math.round(wr * 0.42);
      wg = Math.round(wg * 0.42);
      wb = Math.round(wb * 0.42);
    } else if (courseY === 1) {
      wr = Math.min(255, wr + 18);
      wg = Math.min(255, wg + 18);
      wb = Math.min(255, wb + 18);
    }
  } else if (wallStyle === 'timber_logs') {
    const logY = wallY % 5;
    if (logY === 0) {
      wr = Math.round(wr * 0.38);
      wg = Math.round(wg * 0.38);
      wb = Math.round(wb * 0.38);
    } else if (logY === 1) {
      wr = Math.min(255, wr + 25);
      wg = Math.min(255, wg + 25);
      wb = Math.min(255, wb + 25);
    }
  } else {
    const noise = ((x * 7 + y * 13) % 11) / 11;
    wr = Math.round(wr * (0.92 + noise * 0.16));
    wg = Math.round(wg * (0.92 + noise * 0.16));
    wb = Math.round(wb * (0.92 + noise * 0.16));
  }

  return [Math.max(0, Math.min(255, wr)), Math.max(0, Math.min(255, wg)), Math.max(0, Math.min(255, wb))];
}

// -------------------------------------------------------------
// RENDER 2.5D FRONT CLIFF WALL DROP (South Edge of Plateau)
// -------------------------------------------------------------
export function render25dFrontCliffDrop(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null
) {
  const cliffHeight = Math.max(8, Math.min(20, settings.cliffHeight || 14));
  const shadowAlpha = settings.cliffShadowIntensity;
  const plateauY = Math.max(6, 31 - cliffHeight - 4);

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const r = baseData[idx];
      const g = baseData[idx + 1];
      const b = baseData[idx + 2];

      if (y < plateauY) {
        // Upper Plateau Surface (Walkable Z=1, illuminated 3/4 top view)
        tileData[idx] = r;
        tileData[idx + 1] = g;
        tileData[idx + 2] = b;
        tileData[idx + 3] = 255;
      } else if (y === plateauY) {
        // Sunlit plateau lip rim
        tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.2));
        tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.2));
        tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.2));
        tileData[idx + 3] = 255;
      } else if (y > plateauY && y <= plateauY + cliffHeight) {
        // Front Vertical Wall Face (Facing camera!)
        const wallY = y - plateauY;
        const [wr, wg, wb] = computeWallFacePixel(r, g, b, x, y, wallY, cliffHeight, settings);
        tileData[idx] = wr;
        tileData[idx + 1] = wg;
        tileData[idx + 2] = wb;
        tileData[idx + 3] = 255;
      } else {
        // Lower ground level with cast drop shadow
        const shadowDist = y - (plateauY + cliffHeight);
        const shadowFactor = Math.max(0.38, 0.45 + (1 - shadowAlpha) * 0.25 + (shadowDist * 0.1));
        if (settings.underlayType === 'color' || settings.underlayType === 'preset') {
          tileData[idx] = Math.round(r * shadowFactor);
          tileData[idx + 1] = Math.round(g * shadowFactor);
          tileData[idx + 2] = Math.round(b * shadowFactor);
          tileData[idx + 3] = 255;
        } else {
          // Transparent negative space with soft ambient occlusion shadow
          tileData[idx] = Math.round(outlineR * 0.6);
          tileData[idx + 1] = Math.round(outlineG * 0.6);
          tileData[idx + 2] = Math.round(outlineB * 0.6);
          tileData[idx + 3] = Math.round(shadowAlpha * 200 * (1 - shadowDist / 6));
        }
      }
    }
  }
}

// -------------------------------------------------------------
// RENDER 2.5D CLIFF CORNERS (SW and SE Front Wall Turns)
// -------------------------------------------------------------
export function render25dCliffCorner(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  cornerType: 'sw' | 'se',
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null
) {
  const cliffHeight = Math.max(8, Math.min(20, settings.cliffHeight || 14));
  const shadowAlpha = settings.cliffShadowIntensity;
  const plateauY = Math.max(6, 31 - cliffHeight - 4);

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const r = baseData[idx];
      const g = baseData[idx + 1];
      const b = baseData[idx + 2];

      const isCornerInside = cornerType === 'sw' ? (x >= 8) : (x < 24);
      const isCornerOutside = !isCornerInside;

      if (isCornerOutside) {
        if (y > plateauY && y <= plateauY + cliffHeight && ((cornerType === 'sw' && x >= 5) || (cornerType === 'se' && x <= 26))) {
          // Side shadow of vertical cliff corner
          tileData[idx] = Math.round(outlineR * 0.7);
          tileData[idx + 1] = Math.round(outlineG * 0.7);
          tileData[idx + 2] = Math.round(outlineB * 0.7);
          tileData[idx + 3] = Math.round(shadowAlpha * 220);
        } else {
          applyBgPixel(tileData, idx, settings, underlayData);
        }
      } else {
        if (y < plateauY) {
          // Upper Plateau
          tileData[idx] = r;
          tileData[idx + 1] = g;
          tileData[idx + 2] = b;
          tileData[idx + 3] = 255;
        } else if (y === plateauY) {
          tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.2));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.2));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.2));
          tileData[idx + 3] = 255;
        } else if (y > plateauY && y <= plateauY + cliffHeight) {
          const wallY = y - plateauY;
          const [wr, wg, wb] = computeWallFacePixel(r, g, b, x, y, wallY, cliffHeight, settings);
          tileData[idx] = wr;
          tileData[idx + 1] = wg;
          tileData[idx + 2] = wb;
          tileData[idx + 3] = 255;
        } else {
          const shadowDist = y - (plateauY + cliffHeight);
          const shadowFactor = Math.max(0.38, 0.45 + (1 - shadowAlpha) * 0.25 + (shadowDist * 0.1));
          if (settings.underlayType !== 'transparent') {
            tileData[idx] = Math.round(r * shadowFactor);
            tileData[idx + 1] = Math.round(g * shadowFactor);
            tileData[idx + 2] = Math.round(b * shadowFactor);
            tileData[idx + 3] = 255;
          } else {
            tileData[idx] = Math.round(outlineR * 0.6);
            tileData[idx + 1] = Math.round(outlineG * 0.6);
            tileData[idx + 2] = Math.round(outlineB * 0.6);
            tileData[idx + 3] = Math.round(shadowAlpha * 200 * (1 - shadowDist / 6));
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------
// RENDER 2.5D DIAGONAL ELEVATION SLOPES (Row 4 Slopes)
// -------------------------------------------------------------
export function render25dDiagonalElevationSlope(
  tileData: Uint8ClampedArray,
  baseData: Uint8ClampedArray,
  slopeId: string,
  settings: TileGeneratorSettings,
  outlineR: number,
  outlineG: number,
  outlineB: number,
  highlightRgb: [number, number, number],
  underlayData: ImageData | null
) {
  const depthIntensity = settings.slopeDepthIntensity ?? 0.85;
  const shadowAlpha = settings.cliffShadowIntensity;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const r = baseData[idx];
      const g = baseData[idx + 1];
      const b = baseData[idx + 2];

      let diag = 0;
      let isUpper = false;
      let isSlopeFace = false;
      let isLower = false;

      if (slopeId === 'slope_ne_fill') {
        diag = (x + y) - 31;
        if (diag < 0) isUpper = false;
        else if (diag <= 8) isSlopeFace = true;
        else isUpper = true;
      } else if (slopeId === 'slope_nw_fill') {
        diag = y - x;
        if (diag < 0) isUpper = false;
        else if (diag <= 8) isSlopeFace = true;
        else isUpper = true;
      } else if (slopeId === 'slope_se_fill') {
        diag = x - y;
        if (diag < 0) isUpper = false;
        else if (diag <= 8) isSlopeFace = true;
        else isUpper = true;
      } else if (slopeId === 'slope_sw_fill') {
        diag = 31 - (x + y);
        if (diag < 0) isUpper = false;
        else if (diag <= 8) isSlopeFace = true;
        else isUpper = true;
      } else if (slopeId.startsWith('slope_gentle_')) {
        let lineY = 0;
        if (slopeId === 'slope_gentle_n1') lineY = Math.round(31 - (x * 0.5));
        else if (slopeId === 'slope_gentle_n2') lineY = Math.round(15 - (x * 0.5));
        else if (slopeId === 'slope_gentle_s1') lineY = Math.round(x * 0.5);
        else lineY = Math.round(16 + (x * 0.5));

        const dist = y - lineY;
        if (dist < 0) isUpper = false;
        else if (dist <= 6) isSlopeFace = true;
        else isUpper = true;
      }

      if (isUpper) {
        // High Plateau Floor (Z=1)
        tileData[idx] = r;
        tileData[idx + 1] = g;
        tileData[idx + 2] = b;
        tileData[idx + 3] = 255;
      } else if (isSlopeFace) {
        // 2.5D Incline Slope Face
        if (diag === 0 || diag === 1) {
          // Sunlit upper ridge
          tileData[idx] = Math.min(255, Math.round(r * 1.25 + highlightRgb[0] * 0.2));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.25 + highlightRgb[1] * 0.2));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.25 + highlightRgb[2] * 0.2));
        } else {
          // Terraced step incline
          const step = Math.floor(diag / 2);
          const slopeShade = Math.max(0.55, 1.05 - (step * 0.12 * depthIntensity));
          tileData[idx] = Math.round(r * slopeShade);
          tileData[idx + 1] = Math.round(g * slopeShade);
          tileData[idx + 2] = Math.round(b * slopeShade);
        }
        tileData[idx + 3] = 255;
      } else {
        // Lower elevation (Z=0) with slope base shadow
        if (settings.underlayType === 'transparent') {
          if (diag >= -3) {
            tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB;
            tileData[idx + 3] = Math.round(shadowAlpha * 180);
          } else {
            applyBgPixel(tileData, idx, settings, underlayData);
          }
        } else {
          const shadowFactor = (diag >= -3) ? (0.45 + (1 - shadowAlpha) * 0.25) : 1.0;
          tileData[idx] = Math.round(r * shadowFactor);
          tileData[idx + 1] = Math.round(g * shadowFactor);
          tileData[idx + 2] = Math.round(b * shadowFactor);
          tileData[idx + 3] = 255;
        }
      }
    }
  }
}

