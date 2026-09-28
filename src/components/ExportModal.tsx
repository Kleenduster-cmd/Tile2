import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileJson,
  Layers,
  Sparkles,
  CheckCircle2,
  Archive,
  FileCode,
  ZoomIn,
} from 'lucide-react';
import { GeneratedTile, TileGeneratorSettings } from '../types/tileset';
import { generateTileset } from '../utils/tileGenerator';
import {
  createTilesetCanvas,
  downloadCanvasAsPng,
  copyCanvasToClipboard,
  generateTileMetadataJson,
  generateTiledTsx,
  downloadAll32x32TilesZip,
  downloadJson,
  downloadTextFile,
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
  const [format, setFormat] = useState<'grid_8x8' | 'grid_16x4' | 'strip_horizontal'>('grid_8x8');
  const [previewZoom, setPreviewZoom] = useState<1 | 2 | 3>(2);
  const [forceTransparent, setForceTransparent] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
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

  // Render native 32x32 per tile canvas to preview
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    // Strictly scale = 1 so every tile is guaranteed 32x32 px
    const generated = createTilesetCanvas(exportTiles, 1, format);

    canvas.width = generated.width;
    canvas.height = generated.height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(generated, 0, 0);
  }, [isOpen, exportTiles, format]);

  if (!isOpen) return null;

  // Exact 32x32 px per tile export
  const handleDownloadPng = () => {
    // scale = 1 guarantees each tile is 32x32
    const canvas = createTilesetCanvas(exportTiles, 1, format);
    const filename = `rpg_tileset_32x32_${format}_transparent.png`;
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

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadAll32x32TilesZip(exportTiles, 'rpg_tileset_32x32_individual_tiles.zip');
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyClipboard = async () => {
    const canvas = createTilesetCanvas(exportTiles, 1, format);
    const success = await copyCanvasToClipboard(canvas);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    const json = generateTileMetadataJson(exportTiles, format);
    downloadJson(json, `rpg_tileset_32x32_${format}_metadata.json`);
  };

  const handleDownloadTsx = () => {
    const tsx = generateTiledTsx(`rpg_tileset_32x32_${format}_transparent.png`, format);
    downloadTextFile(tsx, `rpg_tileset_32x32_${format}.tsx`, 'application/xml');
  };

  const numCols = format === 'grid_8x8' ? 8 : format === 'grid_16x4' ? 16 : exportTiles.length;
  const numRows = format === 'grid_8x8' ? 8 : format === 'grid_16x4' ? 4 : 1;
  const sheetWidth = numCols * 32;
  const sheetHeight = numRows * 32;

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
                  Strict 32×32 px Retained
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                All 64 tiles retain their exact 32×32 pixel size in exported spritesheets and game engine assets
              </p>
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
              <span className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                Standard 32×32 Tileset (8×8 Grid, 256×256 px)
                <span className="text-[10px] font-mono text-emerald-400 font-normal">
                  Each Tile: 32×32 px
                </span>
              </span>
              <span className="text-[11px] text-zinc-400">
                100% transparent background · 1:1 pixel fidelity · Ready for Godot, Unity, Tiled, RPG Maker, Phaser
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
                <span>Export Image Dimensions:</span>
                <span className="font-mono text-amber-300 font-semibold">{sheetWidth}×{sheetHeight} px</span>
              </span>
              <span className="font-mono text-emerald-400 font-semibold">
                {exportTiles.length} Tiles · 32×32 px each
              </span>
            </div>

            <div className="max-w-full max-h-[380px] overflow-auto border border-[#2a2f3c] rounded-lg bg-transparency-grid p-3 flex items-center justify-center shadow-inner relative">
              <canvas
                ref={previewCanvasRef}
                style={{
                  width: `${sheetWidth * previewZoom}px`,
                  height: `${sheetHeight * previewZoom}px`,
                  maxWidth: 'none',
                }}
                className="pixelated shadow-md transition-all duration-150"
              />
            </div>

            <div className="w-full flex items-center justify-between mt-2.5 px-1">
              <span className="text-[10px] text-zinc-500">
                Checkerboard pattern indicates transparent alpha. Negative spaces around slopes and corners are alpha = 0.
              </span>

              {/* Preview Zoom Controls */}
              <div className="flex items-center gap-1 bg-[#14161a] p-0.5 rounded-lg border border-[#242732] shrink-0">
                <span className="text-[10px] text-zinc-500 px-1.5 flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-zinc-400" />
                  View
                </span>
                {[1, 2, 3].map((z) => (
                  <button
                    key={z}
                    onClick={() => setPreviewZoom(z as 1 | 2 | 3)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                      previewZoom === z
                        ? 'bg-[#2a2f3c] text-amber-300 font-semibold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={`Magnify preview ${z}× (downloaded file remains exact 32×32)`}
                  >
                    {z}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls & Export Options */}
          <div className="w-full md:w-80 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3.5">
              {/* Tile Size Specification Card */}
              <div className="bg-[#121418] p-3 rounded-xl border border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-[#121418] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    32×32 Tile Size Retained
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-600/40">
                    32×32 px
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Every tile retains its standard 32×32 pixel geometry in the exported image. Ready to drop into your 32px grid in Tiled, Godot, Unity, or RPG Maker.
                </p>
              </div>

              {/* Force Transparent Background Toggle */}
              <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Transparent Background</span>
                  <span className="text-[10px] text-zinc-400">Slopes & cliffs cut out cleanly</span>
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

              {/* Layout Format */}
              <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">Sheet Layout (32×32 tiles)</label>
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
                      <span className="text-[9px] text-zinc-400 font-mono">{m.size}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Package Downloads: All 64 Individual 32x32 Tiles & Tiled TSX */}
              <div className="bg-[#121418] p-3 rounded-xl border border-[#232731] flex flex-col gap-2">
                <span className="text-xs font-semibold text-zinc-300">Game Engine Packages</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="p-2 text-left bg-[#1a1e27] hover:bg-[#232734] border border-[#2b3140] hover:border-amber-400/40 rounded-lg transition-colors flex flex-col gap-1 group"
                    title="Download all 64 individual 32x32 PNG tile files in a ZIP archive"
                  >
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
                      <Archive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{isZipping ? 'Packing...' : '64 Tiles .ZIP'}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 leading-tight">
                      Individual 32×32 PNGs
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadTsx}
                    className="p-2 text-left bg-[#1a1e27] hover:bg-[#232734] border border-[#2b3140] hover:border-sky-400/40 rounded-lg transition-colors flex flex-col gap-1 group"
                    title="Download Tiled Map Editor TSX XML definition"
                  >
                    <div className="flex items-center gap-1.5 text-sky-300 text-xs font-semibold">
                      <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>Tiled TSX</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 leading-tight">
                      tilewidth=32 XML
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#232731]">
              <button
                onClick={handleDownloadPng}
                className="w-full py-2.5 px-4 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-amber-400/20"
              >
                <Download className="w-4 h-4" />
                Download {sheetWidth}×{sheetHeight} Transparent PNG (32×32 tiles)
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyClipboard}
                  className="flex-1 py-2 px-3 text-xs font-medium text-zinc-200 bg-[#20242e] hover:bg-[#282d3a] border border-[#2f3544] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  title="Copy 32x32 spritesheet image directly to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy 32×32 PNG
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="flex-1 py-2 px-3 text-xs font-medium text-zinc-200 bg-[#20242e] hover:bg-[#282d3a] border border-[#2f3544] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  title="Download Tiled / Godot Tilemap metadata JSON with 32x32 coordinates"
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
