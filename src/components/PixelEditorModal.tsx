import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Paintbrush,
  Eraser,
  Pipette,
  PaintBucket,
  RotateCcw,
  RotateCw,
  Check,
  Grid3X3,
  Sparkles,
} from 'lucide-react';
import { hexToRgb, createBlankImageData } from '../utils/tileGenerator';

interface PixelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageData: ImageData;
  onSave: (img: ImageData) => void;
}

type Tool = 'pencil' | 'eraser' | 'bucket' | 'eyedropper' | 'dither';

const PALETTES: { name: string; colors: string[] }[] = [
  {
    name: '16-Bit RPG Meadow',
    colors: [
      '#1b1c24', '#3d992a', '#4baa34', '#58bc3f', '#68ce4e',
      '#8f563b', '#692411', '#222034', '#45283c', '#d77643',
      '#fbf236', '#639bff', '#5fcde4', '#cbdbfc', '#ffffff', '#000000',
    ],
  },
  {
    name: 'PICO-8 Classic',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236',
      '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300',
      '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
    ],
  },
  {
    name: 'Dungeon Stone & Crypt',
    colors: [
      '#141619', '#242830', '#3a404c', '#545c6e', '#778299',
      '#9eaec4', '#314436', '#49614f', '#66826c', '#593220',
      '#804a32', '#aa6747', '#cf8e67', '#e8c09e', '#ffffff', '#0a0b0d',
    ],
  },
];

export const PixelEditorModal: React.FC<PixelEditorModalProps> = ({
  isOpen,
  onClose,
  initialImageData,
  onSave,
}) => {
  const [pixels, setPixels] = useState<Uint8ClampedArray>(() => new Uint8ClampedArray(initialImageData.data));
  const [selectedColor, setSelectedColor] = useState('#4baa34');
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [activePaletteIdx, setActivePaletteIdx] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  // Undo / Redo history
  const [undoStack, setUndoStack] = useState<Uint8ClampedArray[]>([]);
  const [redoStack, setRedoStack] = useState<Uint8ClampedArray[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync when opened
  useEffect(() => {
    if (isOpen) {
      setPixels(new Uint8ClampedArray(initialImageData.data));
      setUndoStack([new Uint8ClampedArray(initialImageData.data)]);
      setRedoStack([]);
    }
  }, [isOpen, initialImageData]);

  // Render main 32x32 canvas (scaled to 320x320)
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Temporary 32x32 canvas
    const temp = document.createElement('canvas');
    temp.width = 32;
    temp.height = 32;
    const tCtx = temp.getContext('2d')!;
    const imgData = tCtx.createImageData(32, 32);
    imgData.data.set(pixels);
    tCtx.putImageData(imgData, 0, 0);

    ctx.clearRect(0, 0, 320, 320);
    ctx.drawImage(temp, 0, 0, 32, 32, 0, 0, 320, 320);

    // Pixel Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 32; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 10, 0);
        ctx.lineTo(i * 10, 320);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * 10);
        ctx.lineTo(320, i * 10);
        ctx.stroke();
      }
    }
  }, [isOpen, pixels, showGrid]);

  // Render 3x3 wrap canvas
  useEffect(() => {
    if (!isOpen || !wrapCanvasRef.current) return;
    const canvas = wrapCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const temp = document.createElement('canvas');
    temp.width = 32;
    temp.height = 32;
    const tCtx = temp.getContext('2d')!;
    const imgData = tCtx.createImageData(32, 32);
    imgData.data.set(pixels);
    tCtx.putImageData(imgData, 0, 0);

    ctx.clearRect(0, 0, 96, 96);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.drawImage(temp, 0, 0, 32, 32, c * 32, r * 32, 32, 32);
      }
    }
  }, [isOpen, pixels]);

  if (!isOpen) return null;

  const pushUndo = (newPixels: Uint8ClampedArray) => {
    setUndoStack((prev) => [...prev.slice(-25), new Uint8ClampedArray(newPixels)]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];
    setRedoStack((prev) => [...prev, current]);
    setUndoStack((prev) => prev.slice(0, -1));
    setPixels(new Uint8ClampedArray(previous));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, next]);
    setPixels(new Uint8ClampedArray(next));
  };

  const applyBrush = (clientX: number, clientY: number, isInitialClick = false) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * 32);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 32);

    if (x < 0 || x >= 32 || y < 0 || y >= 32) return;

    const idx = (y * 32 + x) * 4;

    if (activeTool === 'eyedropper') {
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      setSelectedColor(hex);
      setActiveTool('pencil');
      return;
    }

    if (activeTool === 'bucket' && isInitialClick) {
      // 4-way flood fill
      floodFill(x, y);
      return;
    }

    const next = new Uint8ClampedArray(pixels);
    const rgb = hexToRgb(selectedColor);

    if (activeTool === 'pencil') {
      next[idx] = rgb[0];
      next[idx + 1] = rgb[1];
      next[idx + 2] = rgb[2];
      next[idx + 3] = 255;
    } else if (activeTool === 'eraser') {
      next[idx + 3] = 0;
    } else if (activeTool === 'dither') {
      // Checkerboard dither
      if ((x + y) % 2 === 0) {
        next[idx] = rgb[0];
        next[idx + 1] = rgb[1];
        next[idx + 2] = rgb[2];
        next[idx + 3] = 255;
      }
    }

    setPixels(next);
  };

  const floodFill = (startX: number, startY: number) => {
    const next = new Uint8ClampedArray(pixels);
    const targetIdx = (startY * 32 + startX) * 4;
    const tR = next[targetIdx];
    const tG = next[targetIdx + 1];
    const tB = next[targetIdx + 2];
    const tA = next[targetIdx + 3];

    const fillRgb = hexToRgb(selectedColor);
    if (tR === fillRgb[0] && tG === fillRgb[1] && tB === fillRgb[2] && tA === 255) return;

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(32 * 32);

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      const pos = cy * 32 + cx;
      if (visited[pos]) continue;
      visited[pos] = 1;

      const pIdx = pos * 4;
      if (
        next[pIdx] === tR &&
        next[pIdx + 1] === tG &&
        next[pIdx + 2] === tB &&
        next[pIdx + 3] === tA
      ) {
        next[pIdx] = fillRgb[0];
        next[pIdx + 1] = fillRgb[1];
        next[pIdx + 2] = fillRgb[2];
        next[pIdx + 3] = 255;

        if (cx > 0) queue.push([cx - 1, cy]);
        if (cx < 31) queue.push([cx + 1, cy]);
        if (cy > 0) queue.push([cx, cy - 1]);
        if (cy < 31) queue.push([cx, cy + 1]);
      }
    }

    setPixels(next);
    pushUndo(next);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    applyBrush(e.clientX, e.clientY, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    applyBrush(e.clientX, e.clientY, false);
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      pushUndo(pixels);
    }
  };

  const handleSaveAndApply = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(32, 32);
    imgData.data.set(pixels);
    onSave(imgData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#16181e] border border-[#2b303d] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252a35] bg-[#121418]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Paintbrush className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">32×32 Pixel Art Studio</h2>
              <p className="text-xs text-zinc-400">Craft or touch-up your seamless RPG terrain base</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              className="p-1.5 rounded-lg border border-[#2a2f3c] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg border border-[#2a2f3c] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#20242e]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col md:flex-row flex-1 p-6 gap-6 overflow-y-auto">
          {/* Main Drawing Canvas */}
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative group">
              <div className="w-[320px] h-[320px] rounded-xl overflow-hidden border-2 border-[#333948] bg-transparency-grid shadow-2xl flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={320}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="w-[320px] h-[320px] pixelated cursor-crosshair select-none"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-1">
                <span>10× Zoom (320×320 px)</span>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="hover:text-zinc-300 transition-colors"
                >
                  {showGrid ? 'Hide Grid' : 'Show Grid'}
                </button>
              </div>
            </div>
          </div>

          {/* Tools & Palette Sidebar */}
          <div className="w-full md:w-72 flex flex-col gap-4">
            {/* Tool Selector */}
            <div className="bg-[#121418] p-3 rounded-xl border border-[#232731]">
              <span className="text-xs font-semibold text-zinc-300 block mb-2">Draw Tools</span>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'pencil', icon: Paintbrush, label: 'Pencil' },
                  { id: 'eraser', icon: Eraser, label: 'Eraser' },
                  { id: 'bucket', icon: PaintBucket, label: 'Fill' },
                  { id: 'eyedropper', icon: Pipette, label: 'Pick' },
                  { id: 'dither', icon: Sparkles, label: 'Dither' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t.id as Tool)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      activeTool === t.id
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-300 shadow-sm'
                        : 'bg-[#1a1e27] text-zinc-400 hover:text-white border-[#2c3240]'
                    }`}
                    title={t.label}
                  >
                    <t.icon className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Retro Palette</span>
                <select
                  value={activePaletteIdx}
                  onChange={(e) => setActivePaletteIdx(parseInt(e.target.value))}
                  className="bg-[#1b1f28] border border-[#2e3442] text-[11px] text-zinc-300 rounded px-2 py-0.5 focus:outline-none"
                >
                  {PALETTES.map((p, idx) => (
                    <option key={p.name} value={idx}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Palette Grid */}
              <div className="grid grid-cols-8 gap-1.5">
                {PALETTES[activePaletteIdx].colors.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setSelectedColor(hex)}
                    className={`w-6 h-6 rounded border transition-transform ${
                      selectedColor.toLowerCase() === hex.toLowerCase()
                        ? 'ring-2 ring-white scale-110 border-white z-10'
                        : 'border-[#383e4e] hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>

              {/* Current Color Indicator & Custom Hex */}
              <div className="flex items-center justify-between pt-2 border-t border-[#232731]">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-white/20 shadow-sm"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-xs font-mono text-zinc-300">{selectedColor}</span>
                </div>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  title="Pick custom color"
                />
              </div>
            </div>

            {/* 3x3 Seamless Repeat Checker */}
            <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-300 block">3×3 Seamless Check</span>
                <span className="text-[10px] text-zinc-500">Live repeating preview</span>
              </div>
              <div className="w-20 h-20 rounded border border-[#303646] overflow-hidden bg-transparency-grid-sm flex items-center justify-center">
                <canvas ref={wrapCanvasRef} width={96} height={96} className="w-20 h-20 pixelated" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#252a35] bg-[#121418]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-[#20242e] border border-[#2d323f] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndApply}
            className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-amber-400/20"
          >
            <Check className="w-4 h-4" />
            Apply to Tileset
          </button>
        </div>
      </div>
    </div>
  );
};
