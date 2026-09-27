import { PixelPreset } from '../types/tileset';

function createBlank32ImageData(): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  return ctx.createImageData(32, 32);
}

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function setPixel(data: Uint8ClampedArray, x: number, y: number, r: number, g: number, b: number, a = 255) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
  const idx = (y * 32 + x) * 4;
  data[idx] = r;
  data[idx + 1] = g;
  data[idx + 2] = b;
  data[idx + 3] = a;
}

// Procedural seeded noise for deterministic crisp pixel art
function pseudoRandom(x: number, y: number, seed = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

export const PRESET_TEXTURES: PixelPreset[] = [
  {
    id: 'lush_grass',
    name: 'Lush Emerald Grass',
    category: 'Nature',
    previewColor: '#48a832',
    description: 'Vibrant RPG meadow with subtle grass blades, wild clover, and tiny blossom flecks.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const baseColors = [
        hexToRgb('#3d992a'), // deep grass
        hexToRgb('#4baa34'), // mid grass
        hexToRgb('#58bc3f'), // light grass
        hexToRgb('#68ce4e'), // highlight tip
      ];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const noise = pseudoRandom(x, y, 101);
          let col = baseColors[1];
          if (noise < 0.25) col = baseColors[0];
          else if (noise > 0.75) col = baseColors[2];
          else if (noise > 0.92) col = baseColors[3];

          // Occasional grass blade tuft
          if ((x % 6 === 2 && y % 7 === 3) || (x % 9 === 4 && y % 5 === 1)) {
            col = baseColors[3];
          }
          // Tiny yellow & white wildflowers
          if ((x === 7 && y === 12) || (x === 24 && y === 8) || (x === 18 && y === 26)) {
            setPixel(d, x, y, 255, 230, 90); // flower center
            setPixel(d, x - 1, y, 250, 250, 240);
            setPixel(d, x + 1, y, 250, 250, 240);
            continue;
          }
          setPixel(d, x, y, col[0], col[1], col[2]);
        }
      }
      return img;
    },
  },
  {
    id: 'ancient_cobblestone',
    name: 'Ancient Cobblestone',
    category: 'Urban / Village',
    previewColor: '#7b8089',
    description: 'Chunky rounded river-stone paving with dark earthen mortar lines and surface bevels.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const mortar = hexToRgb('#2c2f36');
      const stoneBase = hexToRgb('#6a707a');
      const stoneLight = hexToRgb('#8b929e');
      const stoneDark = hexToRgb('#4e535c');

      // Fill with mortar
      for (let i = 0; i < 32 * 32 * 4; i += 4) {
        d[i] = mortar[0]; d[i+1] = mortar[1]; d[i+2] = mortar[2]; d[i+3] = 255;
      }

      // Draw stones in staggered grid
      const stones = [
        { x: 1, y: 1, w: 9, h: 7 },
        { x: 12, y: 2, w: 10, h: 6 },
        { x: 24, y: 1, w: 7, h: 7 },
        { x: 2, y: 10, w: 13, h: 8 },
        { x: 17, y: 9, w: 13, h: 9 },
        { x: 1, y: 20, w: 9, h: 10 },
        { x: 12, y: 20, w: 11, h: 10 },
        { x: 25, y: 20, w: 6, h: 10 },
      ];

      stones.forEach((s, idx) => {
        for (let py = s.y; py < s.y + s.h; py++) {
          for (let px = s.x; px < s.x + s.w; px++) {
            // Round corners of stone
            const isCorner = 
              (px === s.x && py === s.y) || 
              (px === s.x + s.w - 1 && py === s.y) ||
              (px === s.x && py === s.y + s.h - 1) ||
              (px === s.x + s.w - 1 && py === s.y + s.h - 1);
            if (isCorner) continue;

            const n = pseudoRandom(px, py, idx * 37);
            let col = stoneBase;
            if (py === s.y || (px === s.x && py < s.y + s.h - 1)) {
              col = stoneLight; // top/left highlight
            } else if (py === s.y + s.h - 1 || px === s.x + s.w - 1) {
              col = stoneDark; // bottom/right shadow
            } else if (n > 0.7) {
              col = stoneLight;
            } else if (n < 0.3) {
              col = stoneDark;
            }
            setPixel(d, px, py, col[0], col[1], col[2]);
          }
        }
      });
      return img;
    },
  },
  {
    id: 'dungeon_brick',
    name: 'Dungeon Crypt Stone',
    category: 'Dungeon',
    previewColor: '#434651',
    description: 'Hewn subterranean dark slabs with chisel cracks, moss flecks, and masonry seams.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const mortar = hexToRgb('#1b1d22');
      const base = hexToRgb('#3a3d46');
      const hi = hexToRgb('#525763');
      const sh = hexToRgb('#2a2c33');
      const moss = hexToRgb('#3f5a36');

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          // Horizontal brick joints at y=8, y=16, y=24
          const isHJoint = (y % 8 === 0);
          // Vertical joints alternate
          const row = Math.floor(y / 8);
          const isVJoint = (row % 2 === 0 ? x % 16 === 0 : (x + 8) % 16 === 0);

          if (isHJoint || isVJoint) {
            setPixel(d, x, y, mortar[0], mortar[1], mortar[2]);
          } else {
            const n = pseudoRandom(x, y, 77);
            let col = base;
            if (y % 8 === 1) col = hi;
            else if (y % 8 === 7) col = sh;
            else if (n > 0.8) col = hi;
            else if (n < 0.25) col = sh;

            // Subtle moss in corners
            if ((x % 16 <= 2 || (x + 8) % 16 <= 2) && (y % 8 <= 2) && n > 0.4) {
              col = moss;
            }
            setPixel(d, x, y, col[0], col[1], col[2]);
          }
        }
      }
      return img;
    },
  },
  {
    id: 'water_shallow',
    name: 'Azure Water Ripples',
    category: 'Water',
    previewColor: '#258ac7',
    description: 'Vibrant animated-look crystal waters with light caustics and soft wave ripples.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const deep = hexToRgb('#175a96');
      const mid = hexToRgb('#2285c5');
      const light = hexToRgb('#4bb3eb');
      const foam = hexToRgb('#bce6ff');

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const wave1 = Math.sin((x * 0.4) + (y * 0.2)) * 0.5 + 0.5;
          const wave2 = Math.cos((x * 0.3) - (y * 0.5)) * 0.5 + 0.5;
          const val = (wave1 + wave2) / 2;

          let col = mid;
          if (val < 0.3) col = deep;
          else if (val > 0.75) col = foam;
          else if (val > 0.55) col = light;

          setPixel(d, x, y, col[0], col[1], col[2]);
        }
      }
      return img;
    },
  },
  {
    id: 'desert_sand',
    name: 'Sunbaked Sand Dunes',
    category: 'Desert',
    previewColor: '#d69e4d',
    description: 'Golden desert sand ridges sculpted by wind with fine grain texturing.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const cDeep = hexToRgb('#b07b36');
      const cMid = hexToRgb('#cda04f');
      const cLight = hexToRgb('#e2b96b');
      const cBright = hexToRgb('#f4d38e');

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const dune = Math.sin((x * 0.2) + (y * 0.4)) * 0.5 + 0.5;
          const noise = pseudoRandom(x, y, 555);
          let col = cMid;
          if (dune > 0.7) col = cBright;
          else if (dune > 0.45) col = cLight;
          else if (dune < 0.2) col = cDeep;

          if (noise > 0.85) col = cBright;
          else if (noise < 0.15) col = cDeep;

          setPixel(d, x, y, col[0], col[1], col[2]);
        }
      }
      return img;
    },
  },
  {
    id: 'forest_dirt',
    name: 'Autumn Forest Dirt',
    category: 'Nature',
    previewColor: '#7a5231',
    description: 'Rich loamy earthen path with embedded pebbles, dried pine needles, and soil clods.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const darkSoil = hexToRgb('#533720');
      const midSoil = hexToRgb('#714c2c');
      const lightSoil = hexToRgb('#8f643e');
      const pebble = hexToRgb('#a89b88');

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const n = pseudoRandom(x, y, 999);
          let col = midSoil;
          if (n < 0.3) col = darkSoil;
          else if (n > 0.7) col = lightSoil;

          // Occasional small pebbles
          if ((x === 6 && y === 10) || (x === 22 && y === 5) || (x === 14 && y === 24) || (x === 28 && y === 20)) {
            setPixel(d, x, y, pebble[0], pebble[1], pebble[2]);
            setPixel(d, x + 1, y, darkSoil[0], darkSoil[1], darkSoil[2]);
            continue;
          }
          setPixel(d, x, y, col[0], col[1], col[2]);
        }
      }
      return img;
    },
  },
  {
    id: 'wood_tavern',
    name: 'Tavern Oak Planks',
    category: 'Interior',
    previewColor: '#966336',
    description: 'Sturdy polished wooden floorboards with horizontal grain lines and iron nail heads.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const seam = hexToRgb('#3a210d');
      const plankBase = hexToRgb('#85542b');
      const plankLight = hexToRgb('#a66e3b');
      const plankDark = hexToRgb('#6b401e');
      const nail = hexToRgb('#231b14');

      for (let y = 0; y < 32; y++) {
        const isSeam = (y % 8 === 0);
        for (let x = 0; x < 32; x++) {
          if (isSeam) {
            setPixel(d, x, y, seam[0], seam[1], seam[2]);
          } else {
            const plankRow = Math.floor(y / 8);
            // End joints in planks
            const isJoint = (plankRow % 2 === 0 ? x === 14 : x === 26);
            if (isJoint) {
              setPixel(d, x, y, seam[0], seam[1], seam[2]);
              continue;
            }

            const n = pseudoRandom(x * 2, y, 88);
            let col = plankBase;
            if (y % 8 === 1) col = plankLight;
            else if (y % 8 === 7) col = plankDark;
            else if (n > 0.65) col = plankLight;
            else if (n < 0.25) col = plankDark;

            // Nail heads
            if ((isJoint && (y % 8 === 2 || y % 8 === 6)) || (x === 2 && (y % 8 === 2 || y % 8 === 6))) {
              col = nail;
            }
            setPixel(d, x, y, col[0], col[1], col[2]);
          }
        }
      }
      return img;
    },
  },
  {
    id: 'volcanic_rock',
    name: 'Volcanic Magma Crust',
    category: 'Fantasy / Danger',
    previewColor: '#9e2b17',
    description: 'Black cooled basalt crust split by glowing incandescent orange and yellow magma veins.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const rockDark = hexToRgb('#1a1719');
      const rockMid = hexToRgb('#2e292d');
      const rockLight = hexToRgb('#453d44');
      const lavaCore = hexToRgb('#ffea61');
      const lavaOrange = hexToRgb('#ff6214');
      const lavaRed = hexToRgb('#b51807');

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const fissure = Math.abs(Math.sin((x * 0.2) + (y * 0.15)) * 10 - (y * 0.3));
          const isLava = fissure < 1.4;
          const isGlow = fissure >= 1.4 && fissure < 2.5;

          if (isLava) {
            const coreVal = pseudoRandom(x, y, 31);
            const col = coreVal > 0.4 ? lavaCore : lavaOrange;
            setPixel(d, x, y, col[0], col[1], col[2]);
          } else if (isGlow) {
            setPixel(d, x, y, lavaRed[0], lavaRed[1], lavaRed[2]);
          } else {
            const n = pseudoRandom(x, y, 404);
            let col = rockMid;
            if (n > 0.75) col = rockLight;
            else if (n < 0.3) col = rockDark;
            setPixel(d, x, y, col[0], col[1], col[2]);
          }
        }
      }
      return img;
    },
  },
  {
    id: 'scifi_plating',
    name: 'Sci-Fi Hull Plating',
    category: 'Sci-Fi',
    previewColor: '#4d6275',
    description: 'Industrial spaceship steel bulkhead panels with recessed bolts and cyan power conduits.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const steelBase = hexToRgb('#475569');
      const steelHi = hexToRgb('#64748b');
      const steelDark = hexToRgb('#334155');
      const groove = hexToRgb('#0f172a');
      const cyanGlow = hexToRgb('#38bdf8');

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const isPanelBorder = (x === 1 || x === 30 || y === 1 || y === 30);
          const isDivider = (x === 16 || y === 16);
          const isConduit = (y === 8 && x >= 4 && x <= 27);

          if (isConduit) {
            setPixel(d, x, y, cyanGlow[0], cyanGlow[1], cyanGlow[2]);
          } else if (isDivider || isPanelBorder) {
            setPixel(d, x, y, groove[0], groove[1], groove[2]);
          } else {
            let col = steelBase;
            if (x === 2 || y === 2 || (x === 17 && y > 16) || (y === 17 && x > 16)) {
              col = steelHi;
            } else if (x === 29 || y === 29 || x === 15 || y === 15) {
              col = steelDark;
            }
            // Corner bolts
            if ((x === 4 || x === 27 || x === 13 || x === 18) && 
                (y === 4 || y === 27 || y === 13 || y === 18)) {
              col = groove;
            }
            setPixel(d, x, y, col[0], col[1], col[2]);
          }
        }
      }
      return img;
    },
  },
  {
    id: 'frozen_ice',
    name: 'Glacial Blue Ice',
    category: 'Winter',
    previewColor: '#6bc7e0',
    description: 'Deep semi-translucent polar ice with crystalline fractures and frosty highlights.',
    generate: () => {
      const img = createBlank32ImageData();
      const d = img.data;
      const deepIce = hexToRgb('#267d9d');
      const midIce = hexToRgb('#45a7c9');
      const lightIce = hexToRgb('#8be1f7');
      const frostWhite = hexToRgb('#e0f8ff');

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const isCrack = Math.abs((x - y) % 11) === 0 || Math.abs((x + y * 0.7) % 15) < 0.8;
          if (isCrack) {
            setPixel(d, x, y, frostWhite[0], frostWhite[1], frostWhite[2]);
          } else {
            const n = pseudoRandom(x, y, 712);
            let col = midIce;
            if (n > 0.8) col = frostWhite;
            else if (n > 0.5) col = lightIce;
            else if (n < 0.25) col = deepIce;
            setPixel(d, x, y, col[0], col[1], col[2]);
          }
        }
      }
      return img;
    },
  }
];
