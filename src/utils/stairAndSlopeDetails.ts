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

      // 1. VERTICAL RAMP (N-S FULL 1-TILE CLIMB)
      if (tileId === 'slope25d_ramp_v_full') {
        const leftMargin = 5;
        const rightMargin = 26;

        if (x < leftMargin) {
          if (noBgWall) {
            if (x < 2) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (x === 2) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else if (x === 3) {
              // 3D Curb sunlit coping
              tileData[idx] = Math.min(255, Math.round(r * 1.35 + highlightRgb[0] * 0.25));
              tileData[idx + 1] = Math.min(255, Math.round(g * 1.35 + highlightRgb[1] * 0.25));
              tileData[idx + 2] = Math.min(255, Math.round(b * 1.35 + highlightRgb[2] * 0.25));
              tileData[idx + 3] = 255;
            } else { // x === 4
              tileData[idx] = Math.round(r * 0.7);
              tileData[idx + 1] = Math.round(g * 0.7);
              tileData[idx + 2] = Math.round(b * 0.7);
              tileData[idx + 3] = 255;
            }
          } else if (isNaturalBank) {
            const bankShade = 0.82 + (y / 80);
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx + 1] = Math.round(g * bankShade);
            tileData[idx + 2] = Math.round(b * bankShade);
            tileData[idx + 3] = 255;
          } else {
            // Retaining cliff wall
            if (x === 0) {
              tileData[idx] = 0; tileData[idx + 1] = 0; tileData[idx + 2] = 0; tileData[idx + 3] = 0;
            } else if (x === leftMargin - 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else {
              const wallShade = 0.55 + (y / 64);
              tileData[idx] = Math.round(r * wallShade);
              tileData[idx + 1] = Math.round(g * wallShade);
              tileData[idx + 2] = Math.round(b * wallShade);
              tileData[idx + 3] = 255;
            }
          }
        } else if (x > rightMargin) {
          if (noBgWall) {
            if (x === 27) {
              tileData[idx] = Math.round(r * 0.65);
              tileData[idx + 1] = Math.round(g * 0.65);
              tileData[idx + 2] = Math.round(b * 0.65);
              tileData[idx + 3] = 255;
            } else if (x === 28) {
              // Shaded right curb coping
              tileData[idx] = Math.round(r * 0.78);
              tileData[idx + 1] = Math.round(g * 0.78);
              tileData[idx + 2] = Math.round(b * 0.78);
              tileData[idx + 3] = 255;
            } else if (x === 29) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else if (isNaturalBank) {
            const bankShade = 0.80 + (y / 80);
            tileData[idx] = Math.round(r * bankShade);
            tileData[idx + 1] = Math.round(g * bankShade);
            tileData[idx + 2] = Math.round(b * bankShade);
            tileData[idx + 3] = 255;
          } else {
            if (x === 31) {
              tileData[idx] = 0; tileData[idx + 1] = 0; tileData[idx + 2] = 0; tileData[idx + 3] = 0;
            } else if (x === rightMargin + 1) {
              tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
            } else {
              const wallShade = 0.50 + (y / 64);
              tileData[idx] = Math.round(r * wallShade);
              tileData[idx + 1] = Math.round(g * wallShade);
              tileData[idx + 2] = Math.round(b * wallShade);
              tileData[idx + 3] = 255;
            }
          }
        } else {
          // Ramp Bed
          const elevLight = (1.20 + 0.12 * depthIntensity) - (y / 31) * (0.36 * depthIntensity);
          let pr = Math.min(255, Math.round(r * elevLight));
          let pg = Math.min(255, Math.round(g * elevLight));
          let pb = Math.min(255, Math.round(b * elevLight));

          // Contact curb shadows onto ramp bed
          if (settings.slope3dCurbs) {
            if (x === 5) { pr = Math.round(pr * 0.88); pg = Math.round(pg * 0.88); pb = Math.round(pb * 0.88); }
            if (x === 26) { pr = Math.round(pr * 0.82); pg = Math.round(pg * 0.82); pb = Math.round(pb * 0.82); }
          }

          if (rampStyle === 'mud_slide') {
            // Pokémon Sinnoh Mud Slide (3D chevrons + bike ruts)
            const chevronY = (y + Math.abs(x - 16) * 0.55) % 6;
            const isBikeRut = (x >= 9 && x <= 11) || (x >= 20 && x <= 22);

            if (chevronY < 1.2) {
              pr = Math.min(255, pr + 45);
              pg = Math.min(255, pg + 45);
              pb = Math.min(255, pb + 45);
            } else if (chevronY > 4.2) {
              pr = Math.round(pr * 0.56);
              pg = Math.round(pg * 0.56);
              pb = Math.round(pb * 0.56);
            }

            if (isBikeRut) {
              const isTireTooth = (y % 2 === 0);
              const factor = isTireTooth ? 0.72 : 0.88;
              pr = Math.round(pr * factor);
              pg = Math.round(pg * factor);
              pb = Math.round(pb * factor);
            }
          } else if (rampStyle === 'stepped') {
            // Dragon Quest DS terraced incline
            const stepY = y % 8;
            if (stepY === 0) {
              pr = Math.min(255, pr + 45); pg = Math.min(255, pg + 45); pb = Math.min(255, pb + 45);
            } else if (stepY === 6) {
              pr = Math.round(pr * 0.48); pg = Math.round(pg * 0.48); pb = Math.round(pg * 0.48);
            } else if (stepY === 7) {
              pr = Math.round(pr * 0.62); pg = Math.round(pg * 0.62); pb = Math.round(pb * 0.62);
            }
          } else if (rampStyle === 'plank') {
            const isSeam = (y % 6 === 0);
            const isPin = (x === 7 || x === 24) && (y % 6 === 2);
            if (isSeam) {
              pr = Math.round(r * 0.38); pg = Math.round(g * 0.38); pb = Math.round(b * 0.38);
            } else if (isPin) {
              pr = 30; pg = 30; pb = 35;
            } else if (y % 6 === 1) {
              pr = Math.min(255, pr + 30); pg = Math.min(255, pg + 30); pb = Math.min(255, pb + 30);
            }
          } else if (rampStyle === 'cobblestone') {
            const cobDist = Math.hypot((x % 6) - 3, (y % 5) - 2.5);
            if (cobDist > 2.6) {
              pr = Math.round(pr * 0.55); pg = Math.round(pg * 0.55); pb = Math.round(pb * 0.55);
            } else if (cobDist < 1.2) {
              pr = Math.min(255, pr + 28); pg = Math.min(255, pg + 28); pb = Math.min(255, pb + 28);
            }
          } else {
            // Natural dirt / wagon ruts
            if (settings.slopeWheelRuts) {
              const isRut = (x >= 9 && x <= 11) || (x >= 20 && x <= 22);
              const isShoulder = (x === 8 || x === 12 || x === 19 || x === 23);
              if (isRut) {
                pr = Math.round(pr * 0.78); pg = Math.round(pg * 0.78); pb = Math.round(pb * 0.78);
              } else if (isShoulder && (y % 4 === 1)) {
                pr = Math.min(255, pr + 24); pg = Math.min(255, pg + 24); pb = Math.min(255, pb + 24);
              }
            }
            if (x >= 14 && x <= 17) {
              pr = Math.min(255, pr + 8); pg = Math.min(255, pg + 8); pb = Math.min(255, pb + 8);
            }
          }

          if (y === 0) {
            pr = Math.min(255, pr + 22); pg = Math.min(255, pg + 22); pb = Math.min(255, pb + 22);
          } else if (y >= 30) {
            const bShadow = noBgWall ? 0.90 : (0.75 - shadowAlpha * 0.2);
            pr = Math.round(pr * bShadow); pg = Math.round(pg * bShadow); pb = Math.round(pb * bShadow);
          }

          tileData[idx] = pr;
          tileData[idx + 1] = pg;
          tileData[idx + 2] = pb;
          tileData[idx + 3] = 255;
        }
      }

      // 2. VERTICAL RAMP TOP CREST
      else if (tileId === 'slope25d_ramp_v_top') {
        const flareLeft = Math.round(2 + (y * 3 / 31));
        const flareRight = Math.round(29 - (y * 3 / 31));

        if (x < flareLeft || x > flareRight) {
          if (noBgWall) {
            applyBgPixel(tileData, idx, settings, underlayData);
          } else if (isNaturalBank) {
            const bankShade = 0.85 + (y / 80);
            tileData[idx] = Math.round(r * bankShade); tileData[idx + 1] = Math.round(g * bankShade); tileData[idx + 2] = Math.round(b * bankShade); tileData[idx + 3] = 255;
          } else if (y < 8) {
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            const wingShade = 0.6 + (y / 64);
            tileData[idx] = Math.round(r * wingShade); tileData[idx + 1] = Math.round(g * wingShade); tileData[idx + 2] = Math.round(b * wingShade); tileData[idx + 3] = 255;
          }
        } else if (x === flareLeft || x === flareRight) {
          tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
        } else {
          // Plateau threshold lip
          if (y < 4) {
            tileData[idx] = Math.min(255, Math.round(r * 1.18));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.18));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.18));
          } else {
            const elev = 1.16 - (y / 60);
            tileData[idx] = Math.min(255, Math.round(r * elev));
            tileData[idx + 1] = Math.min(255, Math.round(g * elev));
            tileData[idx + 2] = Math.min(255, Math.round(b * elev));
          }
          tileData[idx + 3] = 255;
        }
      }

      // 3. VERTICAL RAMP BASE APRON
      else if (tileId === 'slope25d_ramp_v_base') {
        if (y < 16) {
          if (x < 6 || x > 25) {
            if (noBgWall) {
              applyBgPixel(tileData, idx, settings, underlayData);
            } else if (isNaturalBank) {
              const baseWallShade = 0.78 + (y / 50);
              tileData[idx] = Math.round(r * baseWallShade); tileData[idx + 1] = Math.round(g * baseWallShade); tileData[idx + 2] = Math.round(b * baseWallShade); tileData[idx + 3] = 255;
            } else {
              const baseWallShade = 0.55 + (y / 40);
              tileData[idx] = Math.round(r * baseWallShade); tileData[idx + 1] = Math.round(g * baseWallShade); tileData[idx + 2] = Math.round(b * baseWallShade); tileData[idx + 3] = 255;
            }
          } else if (x === 6 || x === 25) {
            tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
          } else {
            tileData[idx] = Math.round(r * 0.94); tileData[idx + 1] = Math.round(g * 0.94); tileData[idx + 2] = Math.round(b * 0.94); tileData[idx + 3] = 255;
          }
        } else if (y >= 16 && y <= 21) {
          // Curved base apron shadow
          const distFromCurb = Math.min(x, 31 - x);
          const shadowFactor = noBgWall ? (0.84 - (6 - Math.min(6, distFromCurb)) * 0.03) : (0.55 - shadowAlpha * 0.25);
          tileData[idx] = Math.round(r * shadowFactor);
          tileData[idx + 1] = Math.round(g * shadowFactor);
          tileData[idx + 2] = Math.round(b * shadowFactor);
          tileData[idx + 3] = 255;
        } else {
          // Fan-out gravel
          if (y <= 25 && (x + y) % 5 === 0 && x >= 8 && x <= 23) {
            tileData[idx] = Math.min(255, Math.round(r * 1.15));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.15));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.15));
          } else {
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
          }
          tileData[idx + 3] = 255;
        }
      }

      // 4. LATERAL RAMP W->E TOP
      else if (tileId === 'slope25d_ramp_lat_w2e_top') {
        const rampY = Math.round(24 - (x * 16 / 31));
        const distFromRamp = y - rampY;

        if (distFromRamp < -4) {
          if (noBgWall) {
            applyBgPixel(tileData, idx, settings, underlayData);
          } else if (isNaturalBank) {
            const bgShade = 0.82 + ((y % 4) * 0.04);
            tileData[idx] = Math.round(r * bgShade); tileData[idx + 1] = Math.round(g * bgShade); tileData[idx + 2] = Math.round(b * bgShade); tileData[idx + 3] = 255;
          } else {
            const bgShade = 0.65 + ((y % 4) * 0.05);
            tileData[idx] = Math.round(r * bgShade); tileData[idx + 1] = Math.round(g * bgShade); tileData[idx + 2] = Math.round(b * bgShade); tileData[idx + 3] = 255;
          }
        } else if (distFromRamp === -4) {
          tileData[idx] = Math.min(255, Math.round(r * 1.35 + 30));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.35 + 30));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.35 + 30));
          tileData[idx + 3] = 255;
        } else if (distFromRamp >= -3 && distFromRamp <= 3) {
          const inclineLight = 0.95 + (x / 31) * 0.22;
          const isTread = (x + y) % 5 === 0;
          const mult = isTread ? inclineLight * 0.88 : inclineLight;
          tileData[idx] = Math.min(255, Math.round(r * mult));
          tileData[idx + 1] = Math.min(255, Math.round(g * mult));
          tileData[idx + 2] = Math.min(255, Math.round(b * mult));
          tileData[idx + 3] = 255;
        } else if (distFromRamp === 4) {
          tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
        } else {
          if (noBgWall) {
            const isPillar = (x === 6 || x === 18 || x === 28);
            if (isPillar && distFromRamp <= 12 && settings.slopeTrestleBracing) {
              tileData[idx] = Math.round(r * 0.45); tileData[idx + 1] = Math.round(g * 0.45); tileData[idx + 2] = Math.round(b * 0.45); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            tileData[idx] = Math.round(r * 0.5); tileData[idx + 1] = Math.round(g * 0.5); tileData[idx + 2] = Math.round(b * 0.5); tileData[idx + 3] = 255;
          }
        }
      }

      // 5. LATERAL RAMP W->E WEDGE WALL
      else if (tileId === 'slope25d_ramp_lat_w2e_wall') {
        const wallBottom = Math.round(6 + (x * 20 / 31));

        if (y < wallBottom) {
          if (noBgWall) {
            const isPillar = (x === 6 || x === 18 || x === 28);
            if (isPillar && settings.slopeTrestleBracing) {
              tileData[idx] = Math.round(r * 0.45); tileData[idx + 1] = Math.round(g * 0.45); tileData[idx + 2] = Math.round(b * 0.45); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const strata = Math.sin(y * 1.1 + (x % 3) * 0.4) * 0.12;
            const wallShade = Math.max(0.4, Math.min(0.85, 0.60 + strata));
            tileData[idx] = Math.round(r * wallShade); tileData[idx + 1] = Math.round(g * wallShade); tileData[idx + 2] = Math.round(b * wallShade); tileData[idx + 3] = 255;
          }
        } else if (y >= wallBottom && y <= wallBottom + 3) {
          if (noBgWall) {
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            tileData[idx] = Math.round(r * (0.45 - shadowAlpha * 0.15)); tileData[idx + 1] = Math.round(g * (0.45 - shadowAlpha * 0.15)); tileData[idx + 2] = Math.round(b * (0.45 - shadowAlpha * 0.15)); tileData[idx + 3] = 255;
          }
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
        }
      }

      // 6. LATERAL RAMP E->W TOP
      else if (tileId === 'slope25d_ramp_lat_e2w_top') {
        const rampY = Math.round(8 + (x * 16 / 31));
        const distFromRamp = y - rampY;

        if (distFromRamp < -4) {
          if (noBgWall) {
            applyBgPixel(tileData, idx, settings, underlayData);
          } else if (isNaturalBank) {
            const bgShade = 0.82 + ((y % 4) * 0.04);
            tileData[idx] = Math.round(r * bgShade); tileData[idx + 1] = Math.round(g * bgShade); tileData[idx + 2] = Math.round(b * bgShade); tileData[idx + 3] = 255;
          } else {
            const bgShade = 0.65 + ((y % 4) * 0.05);
            tileData[idx] = Math.round(r * bgShade); tileData[idx + 1] = Math.round(g * bgShade); tileData[idx + 2] = Math.round(b * bgShade); tileData[idx + 3] = 255;
          }
        } else if (distFromRamp === -4) {
          tileData[idx] = Math.min(255, Math.round(r * 1.35 + 30));
          tileData[idx + 1] = Math.min(255, Math.round(g * 1.35 + 30));
          tileData[idx + 2] = Math.min(255, Math.round(b * 1.35 + 30));
          tileData[idx + 3] = 255;
        } else if (distFromRamp >= -3 && distFromRamp <= 3) {
          const inclineLight = 0.95 + ((31 - x) / 31) * 0.22;
          const isTread = (31 - x + y) % 5 === 0;
          const mult = isTread ? inclineLight * 0.88 : inclineLight;
          tileData[idx] = Math.min(255, Math.round(r * mult));
          tileData[idx + 1] = Math.min(255, Math.round(g * mult));
          tileData[idx + 2] = Math.min(255, Math.round(b * mult));
          tileData[idx + 3] = 255;
        } else if (distFromRamp === 4) {
          tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
        } else {
          if (noBgWall) {
            const isPillar = (x === 4 || x === 14 || x === 26);
            if (isPillar && distFromRamp <= 12 && settings.slopeTrestleBracing) {
              tileData[idx] = Math.round(r * 0.45); tileData[idx + 1] = Math.round(g * 0.45); tileData[idx + 2] = Math.round(b * 0.45); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            tileData[idx] = Math.round(r * 0.5); tileData[idx + 1] = Math.round(g * 0.5); tileData[idx + 2] = Math.round(b * 0.5); tileData[idx + 3] = 255;
          }
        }
      }

      // 7. LATERAL RAMP E->W WEDGE WALL
      else if (tileId === 'slope25d_ramp_lat_e2w_wall') {
        const wallBottom = Math.round(26 - (x * 20 / 31));

        if (y < wallBottom) {
          if (noBgWall) {
            const isPillar = (x === 4 || x === 14 || x === 26);
            if (isPillar && settings.slopeTrestleBracing) {
              tileData[idx] = Math.round(r * 0.45); tileData[idx + 1] = Math.round(g * 0.45); tileData[idx + 2] = Math.round(b * 0.45); tileData[idx + 3] = 255;
            } else {
              applyBgPixel(tileData, idx, settings, underlayData);
            }
          } else {
            const strata = Math.sin(y * 1.1 + (x % 3) * 0.4) * 0.12;
            const wallShade = Math.max(0.4, Math.min(0.85, 0.60 + strata));
            tileData[idx] = Math.round(r * wallShade); tileData[idx + 1] = Math.round(g * wallShade); tileData[idx + 2] = Math.round(b * wallShade); tileData[idx + 3] = 255;
          }
        } else if (y >= wallBottom && y <= wallBottom + 3) {
          if (noBgWall) {
            tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
          } else {
            tileData[idx] = Math.round(r * (0.45 - shadowAlpha * 0.15)); tileData[idx + 1] = Math.round(g * (0.45 - shadowAlpha * 0.15)); tileData[idx + 2] = Math.round(b * (0.45 - shadowAlpha * 0.15)); tileData[idx + 3] = 255;
          }
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
        }
      }

      // 8. ROLLING HILL / 2.5D MOUND (Topographic contour bands)
      else if (tileId === 'slope25d_natural_hill') {
        const dx = x - 13;
        const dy = y - 11;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let factor = 1.0;

        // 3 Distinct contour terrace rings
        const ring = Math.floor(dist / 5);
        const ringStep = dist % 5;

        if (dist < 6) {
          // Sunlit peak crown
          factor = 1.30 - (dist / 20);
        } else if (dist < 18) {
          const angle = Math.atan2(dy, dx);
          const sunlit = (Math.cos(angle - 2.3) + 1) / 2; // NW sun
          const baseRingLight = 1.15 - (ring * 0.08);
          const lipHighlight = (ringStep < 1.2 && sunlit > 0.4) ? 0.15 : 0;
          factor = baseRingLight + lipHighlight - ((1 - sunlit) * 0.28 * (dist / 18));
        } else {
          // Lower ground shadow falloff
          const angle = Math.atan2(dy, dx);
          const shadowBias = (Math.sin(angle - 0.7) + 1) / 2;
          factor = 1.0 - shadowBias * 0.32 * Math.min(1.0, (dist - 18) / 8);
        }

        tileData[idx] = Math.max(0, Math.min(255, Math.round(r * factor)));
        tileData[idx + 1] = Math.max(0, Math.min(255, Math.round(g * factor)));
        tileData[idx + 2] = Math.max(0, Math.min(255, Math.round(b * factor)));
        tileData[idx + 3] = 255;
      }

      // 9. DIAGONAL CLIFF SLOPE NW (Multi-tier terraced rock ledges)
      else if (tileId === 'cliff_diag_slope_nw') {
        const diag = x + y;
        if (diag < 16) {
          if (noBgWall) {
            applyBgPixel(tileData, idx, settings, underlayData);
          } else {
            tileData[idx] = Math.min(255, Math.round(r * 1.12));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.12));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.12));
            tileData[idx + 3] = 255;
          }
        } else if (diag === 16 || diag === 17) {
          tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
        } else if (diag >= 18 && diag <= 30) {
          const tier = (diag - 18) % 4;
          if (tier === 0) {
            // Sunlit rock shelf ledge
            tileData[idx] = Math.min(255, Math.round(r * 1.18 + highlightRgb[0] * 0.15));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.18 + highlightRgb[1] * 0.15));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.18 + highlightRgb[2] * 0.15));
          } else if (tier === 3) {
            // Rock shelf under-shadow
            tileData[idx] = Math.round(r * 0.58);
            tileData[idx + 1] = Math.round(g * 0.58);
            tileData[idx + 2] = Math.round(b * 0.58);
          } else {
            const slopeShade = 0.92 - ((diag - 18) / 12) * 0.22;
            tileData[idx] = Math.round(r * slopeShade);
            tileData[idx + 1] = Math.round(g * slopeShade);
            tileData[idx + 2] = Math.round(b * slopeShade);
          }
          tileData[idx + 3] = 255;
        } else if (diag >= 31 && diag <= 34) {
          const bShadow = noBgWall ? 0.92 : (0.35 + (1 - shadowAlpha) * 0.2);
          tileData[idx] = Math.round(r * bShadow);
          tileData[idx + 1] = Math.round(g * bShadow);
          tileData[idx + 2] = Math.round(b * bShadow);
          tileData[idx + 3] = 255;
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
        }
      }

      // 10. DIAGONAL CLIFF SLOPE NE
      else if (tileId === 'cliff_diag_slope_ne') {
        const diag = (31 - x) + y;
        if (diag < 16) {
          if (noBgWall) {
            applyBgPixel(tileData, idx, settings, underlayData);
          } else {
            tileData[idx] = Math.min(255, Math.round(r * 1.12));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.12));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.12));
            tileData[idx + 3] = 255;
          }
        } else if (diag === 16 || diag === 17) {
          tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
        } else if (diag >= 18 && diag <= 30) {
          const tier = (diag - 18) % 4;
          if (tier === 0) {
            tileData[idx] = Math.min(255, Math.round(r * 1.18 + highlightRgb[0] * 0.15));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.18 + highlightRgb[1] * 0.15));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.18 + highlightRgb[2] * 0.15));
          } else if (tier === 3) {
            tileData[idx] = Math.round(r * 0.58);
            tileData[idx + 1] = Math.round(g * 0.58);
            tileData[idx + 2] = Math.round(b * 0.58);
          } else {
            const slopeShade = 0.92 - ((diag - 18) / 12) * 0.22;
            tileData[idx] = Math.round(r * slopeShade);
            tileData[idx + 1] = Math.round(g * slopeShade);
            tileData[idx + 2] = Math.round(b * slopeShade);
          }
          tileData[idx + 3] = 255;
        } else if (diag >= 31 && diag <= 34) {
          const bShadow = noBgWall ? 0.92 : (0.35 + (1 - shadowAlpha) * 0.2);
          tileData[idx] = Math.round(r * bShadow);
          tileData[idx + 1] = Math.round(g * bShadow);
          tileData[idx + 2] = Math.round(b * bShadow);
          tileData[idx + 3] = 255;
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
        }
      }

      // 11. DIAGONAL CLIFF SLOPE SW
      else if (tileId === 'cliff_diag_slope_sw') {
        const diag = (31 - y) + x;
        if (diag < 16) {
          if (noBgWall) {
            applyBgPixel(tileData, idx, settings, underlayData);
          } else {
            tileData[idx] = Math.min(255, Math.round(r * 1.12));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.12));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.12));
            tileData[idx + 3] = 255;
          }
        } else if (diag === 16 || diag === 17) {
          tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
        } else if (diag >= 18 && diag <= 28) {
          const slopeShade = 1.02 - ((diag - 18) / 10) * 0.22;
          tileData[idx] = Math.round(r * slopeShade);
          tileData[idx + 1] = Math.round(g * slopeShade);
          tileData[idx + 2] = Math.round(b * slopeShade);
          tileData[idx + 3] = 255;
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
        }
      }

      // 12. DIAGONAL CLIFF SLOPE SE
      else if (tileId === 'cliff_diag_slope_se') {
        const diag = (31 - y) + (31 - x);
        if (diag < 16) {
          if (noBgWall) {
            applyBgPixel(tileData, idx, settings, underlayData);
          } else {
            tileData[idx] = Math.min(255, Math.round(r * 1.12));
            tileData[idx + 1] = Math.min(255, Math.round(g * 1.12));
            tileData[idx + 2] = Math.min(255, Math.round(b * 1.12));
            tileData[idx + 3] = 255;
          }
        } else if (diag === 16 || diag === 17) {
          tileData[idx] = outlineR; tileData[idx + 1] = outlineG; tileData[idx + 2] = outlineB; tileData[idx + 3] = 255;
        } else if (diag >= 18 && diag <= 28) {
          const slopeShade = 1.02 - ((diag - 18) / 10) * 0.22;
          tileData[idx] = Math.round(r * slopeShade);
          tileData[idx + 1] = Math.round(g * slopeShade);
          tileData[idx + 2] = Math.round(b * slopeShade);
          tileData[idx + 3] = 255;
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b; tileData[idx + 3] = 255;
        }
      }

      // 13. DIAGONAL CLIFF LIP NW
      else if (tileId === 'cliff_diag_top_nw') {
        const diag = x + y;
        if (diag < 20) {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        } else if (diag >= 20 && diag <= 22) {
          tileData[idx] = Math.round(r * 0.45); tileData[idx + 1] = Math.round(g * 0.45); tileData[idx + 2] = Math.round(b * 0.45);
        } else {
          const depth = 0.55 + ((diag - 22) / 20);
          tileData[idx] = Math.round(r * depth); tileData[idx + 1] = Math.round(g * depth); tileData[idx + 2] = Math.round(b * depth);
        }
        tileData[idx + 3] = 255;
      }

      // 14. DIAGONAL CLIFF LIP NE
      else if (tileId === 'cliff_diag_top_ne') {
        const diag = (31 - x) + y;
        if (diag < 20) {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        } else if (diag >= 20 && diag <= 22) {
          tileData[idx] = Math.round(r * 0.45); tileData[idx + 1] = Math.round(g * 0.45); tileData[idx + 2] = Math.round(b * 0.45);
        } else {
          const depth = 0.55 + ((diag - 22) / 20);
          tileData[idx] = Math.round(r * depth); tileData[idx + 1] = Math.round(g * depth); tileData[idx + 2] = Math.round(b * depth);
        }
        tileData[idx + 3] = 255;
      }

      // 15. DIAGONAL CLIFF BASE NW
      else if (tileId === 'cliff_diag_base_nw') {
        const diag = x + y;
        if (diag < 10) {
          const wallShade = 0.65 + (diag / 20);
          tileData[idx] = Math.round(r * wallShade); tileData[idx + 1] = Math.round(g * wallShade); tileData[idx + 2] = Math.round(b * wallShade);
        } else if (diag >= 10 && diag <= 15) {
          tileData[idx] = Math.round(r * (0.35 + (1 - shadowAlpha) * 0.2));
          tileData[idx + 1] = Math.round(g * (0.35 + (1 - shadowAlpha) * 0.2));
          tileData[idx + 2] = Math.round(b * (0.35 + (1 - shadowAlpha) * 0.2));
        } else {
          tileData[idx] = r; tileData[idx + 1] = g; tileData[idx + 2] = b;
        }
        tileData[idx + 3] = 255;
      }

      // 16. DIAGONAL CLIFF BASE NE
      else if (tileId === 'cliff_diag_base_ne') {
        const diag = (31 - x) + y;
        if (diag < 10) {
          const wallShade = 0.65 + (diag / 20);
          tileData[idx] = Math.round(r * wallShade); tileData[idx + 1] = Math.round(g * wallShade); tileData[idx + 2] = Math.round(b * wallShade);
        } else if (diag >= 10 && diag <= 15) {
          tileData[idx] = Math.round(r * (0.35 + (1 - shadowAlpha) * 0.2));
          tileData[idx + 1] = Math.round(g * (0.35 + (1 - shadowAlpha) * 0.2));
          tileData[idx + 2] = Math.round(b * (0.35 + (1 - shadowAlpha) * 0.2));
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

