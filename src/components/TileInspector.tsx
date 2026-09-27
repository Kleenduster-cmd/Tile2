import React, { useRef, useState, useEffect } from 'react';
import { Download, Sliders, X, Paintbrush, Eraser, RotateCcw } from 'lucide-react';
import { GeneratedTile } from '../types/tileset';
import { downloadTileAsPng, downloadCanvasAsPng } from '../utils/exportUtils';
import { hexToRgb, imageDataToDataUrl } from '../utils/tileGenerator';

interface TileInspectorProps {
  tile: GeneratedTile | null;
  onClose: () => void;
  onUpdateTile: (updatedTile: GeneratedTile) => void;
}

export const TileInspector: React.FC<TileInspectorProps> = ({
  tile,
  onClose,
  onUpdateTile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paintColor, setPaintColor] = useState('#ffffff');
  const [activeTool, setActiveTool] = useState<'pencil' | 'eraser'>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    if (!tile || !canvasRef.current) return;
    renderCanvas();
    setHistory([tile.imageData]);
  }, [tile?.id]);

  const renderCanvas = () => {
    if (!tile || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Draw 32x32 to 256x256
    const temp = document.createElement('canvas');
    temp.width = 32;
    temp.height = 32;
    const tCtx = temp.getContext('2d')!;
    tCtx.putImageData(tile.imageData, 0, 0);

    ctx.clearRect(0, 0, 256, 256);
    ctx.drawImage(temp, 0, 0, 32, 32, 0, 0, 256, 256);

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 32; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 8, 0);
        ctx.lineTo(i * 8, 256);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * 8);
        ctx.lineTo(256, i * 8);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [showGrid, tile?.imageData]);

  if (!tile) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    applyPixel(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    applyPixel(e);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const applyPixel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !tile) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const px = Math.floor((clientX / rect.width) * 32);
    const py = Math.floor((clientY / rect.height) * 32);

    if (px < 0 || px >= 32 || py < 0 || py >= 32) return;

    // Clone image data
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(tile.imageData, 0, 0);
    const imgData = ctx.getImageData(0, 0, 32, 32);
    const d = imgData.data;
    const idx = (py * 32 + px) * 4;

    if (activeTool === 'pencil') {
      const rgb = hexToRgb(paintColor);
      d[idx] = rgb[0];
      d[idx + 1] = rgb[1];
      d[idx + 2] = rgb[2];
      d[idx + 3] = 255;
    } else {
      // Eraser
      d[idx + 3] = 0;
    }

    const updatedTile: GeneratedTile = {
      ...tile,
      imageData: imgData,
      dataUrl: imageDataToDataUrl(imgData),
    };
    onUpdateTile(updatedTile);
  };

  return (
    <div className="bg-[#181a20] rounded-xl border border-[#262a34] p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            Tile Inspector
            <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-[#242834] text-zinc-300">
              {tile.name}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">{tile.description}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#232731]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Editor & Magnified View */}
      <div className="flex flex-col sm:flex-row gap-5 items-center bg-[#121418] p-4 rounded-lg border border-[#22252e]">
        {/* Canvas */}
        <div className="relative group shrink-0">
          <div className="w-64 h-64 rounded-lg overflow-hidden border border-[#303544] bg-transparency-grid flex items-center justify-center shadow-inner">
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-64 h-64 pixelated cursor-crosshair"
            />
          </div>
          <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 pointer-events-none">
            8× Zoom (256×256)
          </div>
        </div>

        {/* Controls & Details */}
        <div className="flex flex-col justify-between h-64 flex-1 w-full">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Pixel Touch-Up Tools</span>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="text-[10px] text-zinc-400 hover:text-zinc-200"
              >
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
            </div>

            {/* Tool buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTool('pencil')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  activeTool === 'pencil'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#181a20] text-zinc-400 border-[#2b303c] hover:text-zinc-200'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                Pencil
              </button>

              <button
                onClick={() => setActiveTool('eraser')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  activeTool === 'eraser'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#181a20] text-zinc-400 border-[#2b303c] hover:text-zinc-200'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                Eraser
              </button>

              <div className="flex items-center gap-1.5 bg-[#181a20] border border-[#2b303c] rounded-lg px-2 py-1">
                <input
                  type="color"
                  value={paintColor}
                  onChange={(e) => setPaintColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  title="Pencil Color"
                />
              </div>
            </div>

            {/* Quick Palette */}
            <div className="flex gap-1.5 flex-wrap">
              {['#ffffff', '#222222', '#3d992a', '#68ce4e', '#2c2f36', '#8b929e', '#e2b96b', '#2285c5'].map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    setPaintColor(hex);
                    setActiveTool('pencil');
                  }}
                  className="w-5 h-5 rounded border border-[#3a4050] hover:scale-110 transition-transform"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>

            {/* Metadata Info */}
            <div className="bg-[#16181f] p-2.5 rounded-lg border border-[#252834] flex flex-col gap-1 text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium text-zinc-200 uppercase">{tile.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Sheet Coordinates:</span>
                <span className="font-mono text-amber-400">Col {tile.exportCol}, Row {tile.exportRow}</span>
              </div>
              <div className="flex justify-between">
                <span>Pixel Resolution:</span>
                <span className="font-mono text-zinc-200">32 × 32 px</span>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#22252e]">
            <button
              onClick={() => downloadTileAsPng(tile, 1)}
              className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download 32px
            </button>
            <button
              onClick={() => downloadTileAsPng(tile, 2)}
              className="py-1.5 px-3 text-xs font-medium text-zinc-300 bg-[#222632] hover:bg-[#2c3242] border border-[#333948] rounded-lg transition-colors"
              title="Download scaled 2x (64x64) crisp nearest-neighbor"
            >
              64px (2×)
            </button>
            <button
              onClick={() => downloadTileAsPng(tile, 4)}
              className="py-1.5 px-3 text-xs font-medium text-zinc-300 bg-[#222632] hover:bg-[#2c3242] border border-[#333948] rounded-lg transition-colors"
              title="Download scaled 4x (128x128) crisp nearest-neighbor"
            >
              128px (4×)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
