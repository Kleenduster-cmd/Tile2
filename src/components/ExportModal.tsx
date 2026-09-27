import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Download, Copy, Check, FileJson, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { GeneratedTile, TileGeneratorSettings } from '../types/tileset';
import { generateTileset } from '../utils/tileGenerator';
import {
  createTilesetCanvas,
  downloadCanvasAsPng,
  copyCanvasToClipboard,
  generateTileMetadataJson,
  downloadJson,
  download32x32TransparentTileset,
} from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiles: GeneratedTile[];
  baseImage?: ImageData | null;
  settings?: TileGeneratorSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tiles,
  baseImage,
  settings,
}) => {
  const [scale, setScale] = useState<1 | 2 | 4>(1);
  const [format, setFormat] = useState<'grid_8x8' | 'grid_16x4' | 'strip_horizontal'>('grid_8x8');
  const [forceTransparent, setForceTransparent] = useState(true);
  const [copied, setCopied] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Compute clean transparent tiles if forceTransparent is on and studio had an underlay
  const exportTiles = useMemo(() => {
    if (forceTransparent && baseImage && settings && settings.underlayType !== 'transparent') {
      return generateTileset(baseImage, {
        ...settings,
        underlayType: 'transparent',
      });
    }
    return tiles;
  }, [forceTransparent, baseImage, settings, tiles]);

  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const generated = createTilesetCanvas(exportTiles, scale, format);

    canvas.width = generated.width;
    canvas.height = generated.height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(generated, 0, 0);
  }, [isOpen, exportTiles, scale, format]);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    const canvas = createTilesetCanvas(exportTiles, scale, format);
    const filename = scale === 1 && format === 'grid_8x8'
      ? 'rpg_tileset_32x32_transparent.png'
      : `rpg_tileset_32x32_${scale}x_${format}_transparent.png`;
    downloadCanvasAsPng(canvas, filename);
  };

  const handleDownloadDirect32x32 = () => {
    download32x32TransparentTileset(
      exportTiles,
      baseImage,
      settings,
      'grid_8x8',
      'rpg_tileset_32x32_transparent.png'
    );
  };

  const handleCopyClipboard = async () => {
    const canvas = createTilesetCanvas(exportTiles, scale, format);
    const success = await copyCanvasToClipboard(canvas);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    const json = generateTileMetadataJson(exportTiles, scale);
    downloadJson(json, `rpg_tileset_metadata_${scale}x.json`);
  };

  const numCols = format === 'grid_8x8' ? 8 : format === 'grid_16x4' ? 16 : exportTiles.length;
  const numRows = format === 'grid_8x8' ? 8 : format === 'grid_16x4' ? 4 : 1;
  const sheetWidth = numCols * 32 * scale;
  const sheetHeight = numRows * 32 * scale;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#15171d] border border-[#2b303d] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252a35] bg-[#121418]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Export 32×32 Transparent Tileset
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  PNG with Alpha
                </span>
              </h2>
              <p className="text-xs text-zinc-400">All 64 RPG tiles exported as one clean transparent spritesheet image</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#20242e]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick 1-Click 32x32 Download Bar */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#181d24] to-[#121418] px-6 py-3 border-b border-[#242936] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="text-xs font-semibold text-zinc-100 block">
                Standard 32×32 Tileset (1 Image, 256×256 px)
              </span>
              <span className="text-[11px] text-zinc-400">
                8×8 layout · 32×32 px per tile · 100% transparent background (ready for Godot, Unity, Tiled, RPG Maker)
              </span>
            </div>
          </div>

          <button
            onClick={handleDownloadDirect32x32}
            className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download 32×32 Transparent PNG
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 p-6 gap-6 overflow-y-auto">
          {/* Visual Preview */}
          <div className="flex flex-col items-center justify-center flex-1 bg-[#0f1115] p-4 rounded-xl border border-[#232731]">
            <div className="w-full flex justify-between items-center mb-2 px-1 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <span>Spritesheet Canvas:</span>
                <span className="font-mono text-amber-300 font-semibold">{sheetWidth}×{sheetHeight} px</span>
              </span>
              <span className="font-mono text-emerald-400 font-medium">{exportTiles.length} Tiles (32×32 px each)</span>
            </div>

            <div className="max-w-full max-h-[380px] overflow-auto border border-[#2a2f3c] rounded-lg bg-transparency-grid p-3 flex items-center justify-center shadow-inner relative">
              <canvas
                ref={previewCanvasRef}
                className="pixelated max-w-full h-auto shadow-md"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-2 text-center">
              The checkerboard pattern indicates transparent alpha pixels. Negative spaces around slopes and corners are completely empty.
            </span>
          </div>

          {/* Controls & Export Options */}
          <div className="w-full md:w-80 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3.5">
              {/* Force Transparent Background Toggle */}
              <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Transparent Background</span>
                  <span className="text-[10px] text-zinc-400">Ensures negative spaces have alpha = 0</span>
                </div>
                <button
                  onClick={() => setForceTransparent(!forceTransparent)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all ${
                    forceTransparent
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-[#1b1e26] text-zinc-500 border-[#2b303d]'
                  }`}
                >
                  {forceTransparent ? '✓ Transparent' : 'Underlay'}
                </button>
              </div>

              {/* Resolution Scale */}
              <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-300">Pixel Scale</label>
                  <span className="text-[10px] font-mono text-amber-400">{32 * scale}×{32 * scale} px/tile</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { s: 1 as const, label: '1× (32px)', desc: 'Native retro' },
                    { s: 2 as const, label: '2× (64px)', desc: 'HD pixel art' },
                    { s: 4 as const, label: '4× (128px)', desc: 'Ultra crisp' },
                  ].map((item) => (
                    <button
                      key={item.s}
                      onClick={() => setScale(item.s)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs transition-colors ${
                        scale === item.s
                          ? 'bg-amber-400 text-zinc-950 font-semibold border-amber-300 shadow-sm'
                          : 'bg-[#1a1e27] text-zinc-400 border-[#2a303d] hover:text-zinc-200'
                      }`}
                    >
                      <span className="block font-mono">{item.label}</span>
                      <span className="text-[9px] opacity-75">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Format */}
              <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">Sheet Layout</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'grid_8x8' as const, label: '8×8 Grid', size: '256×256 px' },
                    { id: 'grid_16x4' as const, label: '16×4 Grid', size: '512×128 px' },
                    { id: 'strip_horizontal' as const, label: '1×64 Strip', size: '2048×32 px' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setFormat(m.id)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs transition-colors ${
                        format === m.id
                          ? 'bg-[#292e3a] text-white border-amber-400/60 font-semibold'
                          : 'bg-[#1a1e27] text-zinc-400 border-[#2a303d] hover:text-zinc-200'
                      }`}
                    >
                      <span className="block text-[11px] font-medium">{m.label}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{m.size}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Engine Compatibility Guide */}
              <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] text-[11px] text-zinc-400 space-y-1 leading-relaxed">
                <div className="font-semibold text-zinc-300 mb-1">Layout Guide (64 Tiles):</div>
                <div>· Row 0: Center & Variations, Stairs, Cliffs</div>
                <div>· Row 1: Cardinal Walls & Edges (N, S, W, E), Endcaps</div>
                <div>· Row 2: Outer 90° Corners & Cliff Lip/Base</div>
                <div>· Row 3: Inner Concave Corners & Crossroads</div>
                <div>· Row 4: 2D 45° Slopes & 2:1 Shallow Slopes</div>
                <div>· Row 5: Smooth Convex & Concave Curves</div>
                <div className="text-emerald-400 font-medium">· Row 6: 2.5D Elevation Ramps & Lateral Ledges</div>
                <div className="text-emerald-400 font-medium">· Row 7: 2.5D Diagonal Cliff Elevation Slopes</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#232731]">
              <button
                onClick={handleDownloadPng}
                className="w-full py-2.5 px-4 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-amber-400/20"
              >
                <Download className="w-4 h-4" />
                Download {sheetWidth}×{sheetHeight} Transparent PNG
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyClipboard}
                  className="flex-1 py-2 px-3 text-xs font-medium text-zinc-200 bg-[#20242e] hover:bg-[#282d3a] border border-[#2f3544] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy PNG
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="flex-1 py-2 px-3 text-xs font-medium text-zinc-200 bg-[#20242e] hover:bg-[#282d3a] border border-[#2f3544] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  title="Download Tiled / Godot Tilemap metadata JSON"
                >
                  <FileJson className="w-3.5 h-3.5 text-sky-400" />
                  JSON Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
