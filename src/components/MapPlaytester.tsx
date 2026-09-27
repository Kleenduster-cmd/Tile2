import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Download, Sparkles, Paintbrush, Stamp, Eraser, Compass } from 'lucide-react';
import { GeneratedTile } from '../types/tileset';
import { resolveAutotileId } from '../utils/autotiler';
import { downloadCanvasAsPng } from '../utils/exportUtils';

interface MapPlaytesterProps {
  tiles: GeneratedTile[];
}

const MAP_COLS = 18;
const MAP_ROWS = 12;
const TILE_PX = 32;

export const MapPlaytester: React.FC<MapPlaytesterProps> = ({ tiles }) => {
  // Map grid: cell state (boolean: true = terrain present, false = empty/underlay)
  // or string for manual stamp override
  const [terrainGrid, setTerrainGrid] = useState<boolean[][]>(() => {
    return Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(false));
  });

  const [stampGrid, setStampGrid] = useState<(string | null)[][]>(() => {
    return Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(null));
  });

  const [paintMode, setPaintMode] = useState<'autotile' | 'stamp' | 'eraser'>('autotile');
  const [selectedStampTileId, setSelectedStampTileId] = useState<string>('center');
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);

  // Playable Character State
  const [isHeroPlaying, setIsHeroPlaying] = useState(false);
  const [heroPos, setHeroPos] = useState({ x: 8.5 * TILE_PX, y: 5.5 * TILE_PX });
  const [heroDirection, setHeroDirection] = useState<'down' | 'up' | 'left' | 'right'>('down');
  const [heroFrame, setHeroFrame] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Quick tile lookup map
  const tileMap = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Cache tile canvases for fast 60fps blitting
  useEffect(() => {
    tileMap.current.clear();
    tiles.forEach((t) => {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d')!;
      ctx.putImageData(t.imageData, 0, 0);
      tileMap.current.set(t.id, c);
    });
  }, [tiles]);

  // Load an initial demo map on mount
  useEffect(() => {
    loadMapPreset('slopes25d');
  }, []);

  const loadMapPreset = (preset: 'pokemon' | 'dragon_quest' | 'open_slopes' | 'slopes25d' | 'plateau' | 'island' | 'path' | 'blank') => {
    const newTerrain: boolean[][] = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(false));
    const newStamps: (string | null)[][] = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(null));

    if (preset === 'pokemon') {
      // Pokémon Diamond & Pearl Sinnoh Route (Mt. Coronet / Cycling Road Mud Slope & Jump Ledges)
      // Upper plateau / terrace
      for (let r = 1; r <= 3; r++) {
        for (let c = 2; c <= 15; c++) {
          newTerrain[r][c] = true;
        }
      }

      // Sinnoh Bike Ramp / Mud Slope cutting down from the plateau into the route
      newStamps[4][8] = 'slope25d_ramp_v_top';
      newStamps[4][9] = 'slope25d_ramp_v_top';
      newStamps[5][8] = 'slope25d_ramp_v_full';
      newStamps[5][9] = 'slope25d_ramp_v_full';
      newStamps[6][8] = 'slope25d_ramp_v_base';
      newStamps[6][9] = 'slope25d_ramp_v_base';

      // One-way jump ledges flanking the slope
      newStamps[4][4] = 'slope25d_ramp_lat_w2e_top';
      newStamps[4][5] = 'slope25d_ramp_lat_w2e_top';
      newStamps[4][12] = 'slope25d_ramp_lat_e2w_top';
      newStamps[4][13] = 'slope25d_ramp_lat_e2w_top';

      // Lower route natural rolling terrain
      newStamps[9][3] = 'slope25d_natural_hill';
      newStamps[9][4] = 'slope25d_natural_hill';
      newStamps[9][13] = 'slope25d_natural_hill';

      setHeroPos({ x: 8.5 * TILE_PX, y: 3.5 * TILE_PX });
    } else if (preset === 'dragon_quest') {
      // Dragon Quest DS Castle Village Hill Climb (Stepped terraces with stone ramps)
      for (let r = 1; r <= 4; r++) {
        for (let c = 4; c <= 13; c++) {
          newTerrain[r][c] = true;
        }
      }

      // Stepped incline ramps leading up to the village terrace
      newStamps[5][6] = 'slope25d_ramp_v_full';
      newStamps[5][11] = 'slope25d_ramp_v_full';

      // Diagonal hillside corners
      newStamps[1][4] = 'cliff_diag_slope_nw';
      newStamps[1][13] = 'cliff_diag_slope_ne';

      // Lower cobblestone courtyard elevation mounds
      newStamps[8][8] = 'slope25d_natural_hill';
      newStamps[8][9] = 'slope25d_natural_hill';

      setHeroPos({ x: 6 * TILE_PX, y: 7 * TILE_PX });
    } else if (preset === 'open_slopes') {
      // Freestanding Slopes with NO Background Wall - Open air / field elevation ramps
      // Raised upper terrace across open ground
      for (let r = 2; r <= 4; r++) {
        for (let c = 5; c <= 12; c++) {
          newTerrain[r][c] = true;
        }
      }

      // Freestanding vertical 2.5D ramps ascending to terrace with no cliff wall behind
      newStamps[5][7] = 'slope25d_ramp_v_full';
      newStamps[5][10] = 'slope25d_ramp_v_full';

      // Open lateral ramp walkway climbing onto terrace from the west
      newStamps[3][3] = 'slope25d_ramp_lat_w2e_top';
      newStamps[3][4] = 'slope25d_ramp_lat_w2e_top';

      // Open diagonal slope transitions
      newStamps[2][5] = 'cliff_diag_slope_nw';
      newStamps[2][12] = 'cliff_diag_slope_ne';

      // Freestanding rolling mounds in open clearing
      newStamps[8][3] = 'slope25d_natural_hill';
      newStamps[8][4] = 'slope25d_natural_hill';
      newStamps[8][13] = 'slope25d_natural_hill';
      newStamps[8][14] = 'slope25d_natural_hill';

      setHeroPos({ x: 7.5 * TILE_PX, y: 6.5 * TILE_PX });
    } else if (preset === 'slopes25d') {
      // 2.5D Mountain Plateau with Vertical Ramps, Diagonal Slopes, and Lateral Ledges
      for (let r = 1; r < 6; r++) {
        for (let c = 2; c < 16; c++) {
          newTerrain[r][c] = true;
        }
      }

      // Vertical 2.5D Ramp ascending the cliff in the center
      newTerrain[6][8] = false;
      newTerrain[6][9] = false;
      newStamps[6][8] = 'slope25d_ramp_v_full';
      newStamps[6][9] = 'slope25d_ramp_v_full';

      // 2.5D Diagonal Cliff Slopes cutting corners
      newTerrain[5][2] = false;
      newTerrain[6][2] = false;
      newTerrain[6][3] = false;
      newStamps[5][2] = 'cliff_diag_top_nw';
      newStamps[6][3] = 'cliff_diag_slope_nw';

      newTerrain[5][15] = false;
      newTerrain[6][15] = false;
      newTerrain[6][14] = false;
      newStamps[5][15] = 'cliff_diag_top_ne';
      newStamps[6][14] = 'cliff_diag_slope_ne';

      // 2.5D Lateral Ramp ascending along cliff on right
      newStamps[3][15] = 'slope25d_ramp_lat_w2e_top';
      newStamps[4][15] = 'slope25d_ramp_lat_w2e_wall';

      // 2.5D Rolling Hills on the lower plain
      newStamps[9][3] = 'slope25d_natural_hill';
      newStamps[9][4] = 'slope25d_natural_hill';
      newStamps[10][13] = 'slope25d_natural_hill';

      setHeroPos({ x: 8.5 * TILE_PX, y: 7.5 * TILE_PX });
    } else if (preset === 'plateau') {
      // Create an elevated plateau with cliffs and slopes
      for (let r = 2; r < 9; r++) {
        for (let c = 3; c < 15; c++) {
          newTerrain[r][c] = true;
        }
      }
      // Cutout corner for slopes
      newTerrain[2][3] = false;
      newTerrain[2][14] = false;
      newStamps[2][3] = 'slope_sw_fill';
      newStamps[2][14] = 'slope_se_fill';
      // Stairs ascending middle
      newStamps[8][8] = 'cliff_stairs';
      newStamps[8][9] = 'cliff_stairs';
      setHeroPos({ x: 9 * TILE_PX, y: 5 * TILE_PX });
    } else if (preset === 'island') {
      // Circular rounded island
      const centerX = 8.5;
      const centerY = 5.5;
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          const dist = Math.sqrt((c - centerX) ** 2 + (r - centerY) ** 2);
          if (dist < 4.6) newTerrain[r][c] = true;
        }
      }
      setHeroPos({ x: 9 * TILE_PX, y: 5 * TILE_PX });
    } else if (preset === 'path') {
      // Winding road
      for (let c = 1; c < 17; c++) newTerrain[5][c] = true;
      for (let r = 2; r < 10; r++) newTerrain[r][8] = true;
      for (let r = 2; r < 10; r++) newTerrain[r][9] = true;
      setHeroPos({ x: 9 * TILE_PX, y: 5 * TILE_PX });
    }

    setTerrainGrid(newTerrain);
    setStampGrid(newStamps);
  };

  // Keyboard navigation for Hero character
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Render & Game Loop
  useEffect(() => {
    let animId: number;
    let stepCount = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // 1. Clear background
      ctx.fillStyle = '#111317';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Render all tiles
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          const x = c * TILE_PX;
          const y = r * TILE_PX;

          const stampId = stampGrid[r][c];
          let tileToDraw: HTMLCanvasElement | undefined;

          if (stampId) {
            tileToDraw = tileMap.current.get(stampId);
          } else if (terrainGrid[r][c]) {
            // Autotile calculation
            const n = r > 0 && terrainGrid[r - 1][c];
            const s = r < MAP_ROWS - 1 && terrainGrid[r + 1][c];
            const w = c > 0 && terrainGrid[r][c - 1];
            const e = c < MAP_COLS - 1 && terrainGrid[r][c + 1];

            const nw = r > 0 && c > 0 && terrainGrid[r - 1][c - 1];
            const ne = r > 0 && c < MAP_COLS - 1 && terrainGrid[r - 1][c + 1];
            const sw = r < MAP_ROWS - 1 && c > 0 && terrainGrid[r + 1][c - 1];
            const se = r < MAP_ROWS - 1 && c < MAP_COLS - 1 && terrainGrid[r + 1][c + 1];

            const tileId = resolveAutotileId({ n, ne, e, se, s, sw, w, nw }, c, r);
            tileToDraw = tileMap.current.get(tileId);
          }

          if (tileToDraw) {
            ctx.drawImage(tileToDraw, x, y, TILE_PX, TILE_PX);
          } else {
            // Subtle dotted tile floor indicator for empty void
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(x + 1, y + 1, TILE_PX - 2, TILE_PX - 2);
          }
        }
      }

      // 3. Grid Lines
      if (showGridLines) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        for (let c = 0; c <= MAP_COLS; c++) {
          ctx.beginPath();
          ctx.moveTo(c * TILE_PX, 0);
          ctx.lineTo(c * TILE_PX, MAP_ROWS * TILE_PX);
          ctx.stroke();
        }
        for (let r = 0; r <= MAP_ROWS; r++) {
          ctx.beginPath();
          ctx.moveTo(0, r * TILE_PX);
          ctx.lineTo(MAP_COLS * TILE_PX, r * TILE_PX);
          ctx.stroke();
        }
      }

      // 4. Update & Render Playable Hero
      if (isHeroPlaying) {
        let dx = 0;
        let dy = 0;
        const speed = 2.5;

        if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
          dy -= speed;
          setHeroDirection('up');
        }
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
          dy += speed;
          setHeroDirection('down');
        }
        if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
          dx -= speed;
          setHeroDirection('left');
        }
        if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
          dx += speed;
          setHeroDirection('right');
        }

        if (dx !== 0 || dy !== 0) {
          stepCount++;
          if (stepCount % 8 === 0) {
            setHeroFrame((prev) => (prev + 1) % 4);
          }
        }

        // Clamp to map bounds
        const newX = Math.max(12, Math.min(canvas.width - 20, heroPos.x + dx));
        const newY = Math.max(12, Math.min(canvas.height - 24, heroPos.y + dy));
        setHeroPos({ x: newX, y: newY });

        // Draw Hero Sprite
        drawHero(ctx, heroPos.x, heroPos.y, heroDirection, heroFrame);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [terrainGrid, stampGrid, isHeroPlaying, heroPos, heroDirection, heroFrame, showGridLines]);

  // Cute 32x32 retro pixel hero renderer
  const drawHero = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: 'down' | 'up' | 'left' | 'right',
    frame: number
  ) => {
    ctx.save();
    ctx.translate(Math.round(x) - 12, Math.round(y) - 16);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(12, 28, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = (frame % 2 === 1) ? 1 : 0;

    // Red Hood / Cap
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(7, 4 + bob, 11, 7);
    ctx.fillRect(8, 2 + bob, 9, 3);
    // Gold buckle
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(11, 9 + bob, 3, 2);

    // Face / Skin
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(8, 11 + bob, 9, 6);

    // Eyes
    ctx.fillStyle = '#1e1b4b';
    if (dir === 'down') {
      ctx.fillRect(10, 13 + bob, 2, 2);
      ctx.fillRect(14, 13 + bob, 2, 2);
    } else if (dir === 'left') {
      ctx.fillRect(9, 13 + bob, 2, 2);
    } else if (dir === 'right') {
      ctx.fillRect(15, 13 + bob, 2, 2);
    }

    // Tunic (Blue)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(7, 17 + bob, 11, 8);
    // Belt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(7, 21 + bob, 11, 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(11, 21 + bob, 3, 2);

    // Boots (Dark brown)
    ctx.fillStyle = '#451a03';
    const legOffset = (frame === 1 ? -2 : frame === 3 ? 2 : 0);
    ctx.fillRect(8 + legOffset, 25, 4, 4);
    ctx.fillRect(13 - legOffset, 25, 4, 4);

    ctx.restore();
  };

  // Canvas paint interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsPointerDown(true);
    applyMapBrush(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown) return;
    applyMapBrush(e);
  };

  const handlePointerUp = () => {
    setIsPointerDown(false);
  };

  const applyMapBrush = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const col = Math.floor((clientX / rect.width) * MAP_COLS);
    const row = Math.floor((clientY / rect.height) * MAP_ROWS);

    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return;

    if (paintMode === 'autotile') {
      const next = terrainGrid.map((r, rIdx) =>
        r.map((cell, cIdx) => (rIdx === row && cIdx === col ? true : cell))
      );
      setTerrainGrid(next);
      // Remove any stamp at this cell
      if (stampGrid[row][col]) {
        const nextStamps = stampGrid.map((r, rIdx) =>
          r.map((s, cIdx) => (rIdx === row && cIdx === col ? null : s))
        );
        setStampGrid(nextStamps);
      }
    } else if (paintMode === 'stamp') {
      const nextStamps = stampGrid.map((r, rIdx) =>
        r.map((s, cIdx) => (rIdx === row && cIdx === col ? selectedStampTileId : s))
      );
      setStampGrid(nextStamps);
    } else if (paintMode === 'eraser') {
      const nextTerrain = terrainGrid.map((r, rIdx) =>
        r.map((cell, cIdx) => (rIdx === row && cIdx === col ? false : cell))
      );
      const nextStamps = stampGrid.map((r, rIdx) =>
        r.map((s, cIdx) => (rIdx === row && cIdx === col ? null : s))
      );
      setTerrainGrid(nextTerrain);
      setStampGrid(nextStamps);
    }
  };

  const downloadMapScreenshot = () => {
    if (!canvasRef.current) return;
    downloadCanvasAsPng(canvasRef.current, 'rpg_map_preview.png');
  };

  return (
    <div className="bg-[#181a20] rounded-xl border border-[#262a34] p-4 flex flex-col gap-4">
      {/* Header & Modes */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Interactive RPG Map Playtester
              <span className="text-[10px] font-mono text-zinc-500">18×12 Tiles · 576×384 px</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Paint with automatic 8-neighbor autotiling or stamp slopes, curves, and cliffs directly.
            </p>
          </div>
        </div>

        {/* Playable Hero Character Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHeroPlaying(!isHeroPlaying)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              isHeroPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/25 ring-2 ring-rose-400/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
            }`}
          >
            {isHeroPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Stop Walking
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Play as Hero (WASD / Arrows)
              </>
            )}
          </button>

          <button
            onClick={downloadMapScreenshot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-[#22252e] hover:bg-[#2a2f3a] border border-[#313644] rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Screenshot
          </button>
        </div>
      </div>

      {/* Toolbar: Brush Tools & Map Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131519] p-2.5 rounded-lg border border-[#242833]">
        {/* Brush Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPaintMode('autotile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              paintMode === 'autotile'
                ? 'bg-amber-400 text-zinc-950 font-semibold'
                : 'bg-[#1b1e25] text-zinc-300 hover:bg-[#252932]'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            Autotile Brush
          </button>

          <button
            onClick={() => setPaintMode('stamp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              paintMode === 'stamp'
                ? 'bg-amber-400 text-zinc-950 font-semibold'
                : 'bg-[#1b1e25] text-zinc-300 hover:bg-[#252932]'
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            Stamp Tile
          </button>

          <button
            onClick={() => setPaintMode('eraser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              paintMode === 'eraser'
                ? 'bg-rose-500 text-white font-semibold'
                : 'bg-[#1b1e25] text-zinc-300 hover:bg-[#252932]'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            Eraser
          </button>

          <button
            onClick={() => setShowGridLines(!showGridLines)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              showGridLines ? 'bg-[#272b36] text-white border-zinc-600' : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            Grid
          </button>
        </div>

        {/* Map Preset Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-zinc-500">Presets:</span>
          <button
            onClick={() => loadMapPreset('pokemon')}
            className="px-2.5 py-1 text-xs rounded bg-amber-950/90 border border-amber-400 text-amber-300 hover:bg-amber-900 font-semibold transition-all flex items-center gap-1 shadow-sm"
          >
            🔴 Pokémon D&P Route
          </button>
          <button
            onClick={() => loadMapPreset('dragon_quest')}
            className="px-2.5 py-1 text-xs rounded bg-sky-950/90 border border-sky-400 text-sky-300 hover:bg-sky-900 font-semibold transition-all flex items-center gap-1 shadow-sm"
          >
            🛡️ Dragon Quest Terrace
          </button>
          <button
            onClick={() => loadMapPreset('open_slopes')}
            className="px-2.5 py-1 text-xs rounded bg-emerald-950/90 border border-emerald-400 text-emerald-300 hover:bg-emerald-900 font-semibold transition-all flex items-center gap-1 shadow-sm"
          >
            ★ Slopes (No Background Wall)
          </button>
          <button
            onClick={() => loadMapPreset('slopes25d')}
            className="px-2.5 py-1 text-xs rounded bg-[#162520] border border-emerald-600/40 text-emerald-300/80 hover:text-emerald-200 transition-colors flex items-center gap-1"
          >
            2.5D Slopes with Cliff Wall
          </button>
          <button
            onClick={() => loadMapPreset('plateau')}
            className="px-2.5 py-1 text-xs rounded bg-[#1b1e25] border border-[#2b303d] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Cliff Plateau & Stairs
          </button>
          <button
            onClick={() => loadMapPreset('island')}
            className="px-2.5 py-1 text-xs rounded bg-[#1b1e25] border border-[#2b303d] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Curved Island
          </button>
          <button
            onClick={() => loadMapPreset('path')}
            className="px-2.5 py-1 text-xs rounded bg-[#1b1e25] border border-[#2b303d] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Crossroad Path
          </button>
          <button
            onClick={() => loadMapPreset('blank')}
            className="p-1 rounded bg-[#1b1e25] border border-[#2b303d] text-zinc-400 hover:text-rose-400"
            title="Clear map"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stamp Tile Quick Selector (Visible when stamp mode is active) */}
      {paintMode === 'stamp' && (
        <div className="flex flex-col gap-2 bg-[#14161a] p-3 rounded-lg border border-[#242833]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">Select Tile to Stamp:</span>
            <span className="text-[10px] text-zinc-500">Click a tile below, then click or drag on map</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {tiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => setSelectedStampTileId(tile.id)}
                className={`w-10 h-10 shrink-0 rounded border p-0.5 bg-transparency-grid-sm flex items-center justify-center transition-all relative group ${
                  selectedStampTileId === tile.id
                    ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105 z-10'
                    : 'border-[#2d323f] hover:border-zinc-500'
                }`}
                title={tile.name}
              >
                <img src={tile.dataUrl} alt={tile.name} className="w-full h-full pixelated" />
                {tile.category === 'slopes_25d' && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400" title="2.5D Slope" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Map Canvas Container */}
      <div className="flex flex-col items-center justify-center bg-[#0d0f12] p-4 rounded-xl border border-[#20232b] shadow-2xl relative overflow-hidden">
        {isHeroPlaying && (
          <div className="absolute top-6 left-6 z-10 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/40 text-xs font-medium text-emerald-300 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Walk Hero with WASD or Arrow Keys!
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={MAP_COLS * TILE_PX}
          height={MAP_ROWS * TILE_PX}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="border border-[#2d323f] rounded-lg pixelated cursor-crosshair max-w-full shadow-lg"
          style={{ width: MAP_COLS * TILE_PX, height: MAP_ROWS * TILE_PX }}
        />
      </div>
    </div>
  );
};
