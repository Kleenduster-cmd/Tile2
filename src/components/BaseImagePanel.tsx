import React, { useRef, useState, useEffect } from 'react';
import { Upload, Grid3X3, Eye, Repeat } from 'lucide-react';
import { makeTextureSeamless } from '../utils/tileGenerator';

interface BaseImagePanelProps {
  baseImage: ImageData;
  onUpdateBaseImage: (img: ImageData, sourceName: string) => void;
  onOpenPixelEditor: () => void;
}

export const BaseImagePanel: React.FC<BaseImagePanelProps> = ({
  baseImage,
  onUpdateBaseImage,
  onOpenPixelEditor,
}) => {
  const [showGrid, setShowGrid] = useState(true);
  const [showWrapPreview, setShowWrapPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvases
  const singleCanvasRef = useRef<HTMLCanvasElement>(null);
  const wrapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render single 32x32 magnified preview
  useEffect(() => {
    if (!singleCanvasRef.current) return;
    const canvas = singleCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Draw 32x32 scaled to 128x128
    const temp = document.createElement('canvas');
    temp.width = 32;
    temp.height = 32;
    const tCtx = temp.getContext('2d')!;
    tCtx.putImageData(baseImage, 0, 0);

    ctx.clearRect(0, 0, 128, 128);
    ctx.drawImage(temp, 0, 0, 32, 32, 0, 0, 128, 128);

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 32; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i * 4, 0);
        ctx.lineTo(i * 4, 128);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * 4);
        ctx.lineTo(128, i * 4);
        ctx.stroke();
      }
    }
  }, [baseImage, showGrid]);

  // Render 3x3 wrap preview (96x96 repeated with zero subpixel seam gap)
  useEffect(() => {
    if (!wrapCanvasRef.current) return;
    const canvas = wrapCanvasRef.current;
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const temp = document.createElement('canvas');
    temp.width = 32;
    temp.height = 32;
    const tCtx = temp.getContext('2d')!;
    tCtx.putImageData(baseImage, 0, 0);

    ctx.clearRect(0, 0, 96, 96);
    // Draw 3x3 tiles, each exactly 32px with zero subpixel rounding gap
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.drawImage(temp, 0, 0, 32, 32, c * 32, r * 32, 32, 32);
      }
    }
  }, [baseImage, showWrapPreview]);

  // Handle image upload and downscaling to 32x32
  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false; // Nearest neighbor for crisp pixel look
        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32);
        onUpdateBaseImage(data, file.name.replace(/\.[^/.]+$/, ''));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#181a20] rounded-xl border border-[#262a34] p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">Base Terrain Texture</h2>
          <p className="text-xs text-zinc-400">Single 32×32 pixel foundation for the entire tileset</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const seamless = makeTextureSeamless(baseImage);
              onUpdateBaseImage(seamless, 'seamless_texture');
            }}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md border bg-[#20232b] text-zinc-300 border-[#2d323e] hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-colors flex items-center gap-1.5"
            title="Auto-harmonize texture edges so ground tiles connect with zero gap"
          >
            <Repeat className="w-3 h-3 text-emerald-400" />
            Seamless Edges
          </button>

          <button
            onClick={() => setShowWrapPreview(!showWrapPreview)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
              showWrapPreview
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-[#20232b] text-zinc-400 border-[#2d323e] hover:text-zinc-200'
            }`}
            title="Toggle 3x3 repeating wrap preview"
          >
            <Grid3X3 className="w-3 h-3" />
            3×3 Wrap Test
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-md border transition-colors ${
              showGrid
                ? 'bg-zinc-700/50 text-white border-zinc-600'
                : 'bg-[#20232b] text-zinc-400 border-[#2d323e] hover:text-zinc-200'
            }`}
            title="Toggle 4px Grid Guide"
          >
            <Eye className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Base Texture Viewport */}
      <div className="flex items-center gap-5 p-3.5 bg-[#121418] rounded-lg border border-[#22252e]">
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-lg overflow-hidden border border-[#323745] bg-transparency-grid flex items-center justify-center shadow-inner">
            {showWrapPreview ? (
              <canvas
                ref={wrapCanvasRef}
                width={96}
                height={96}
                className="w-32 h-32 pixelated"
              />
            ) : (
              <canvas
                ref={singleCanvasRef}
                width={128}
                height={128}
                className="w-32 h-32 pixelated cursor-pointer"
                onClick={onOpenPixelEditor}
              />
            )}
          </div>
          <div className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 pointer-events-none">
            32×32 px
          </div>
        </div>

        <div className="flex flex-col justify-center h-32 flex-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-zinc-200">Interactive Canvas</span>
              <span className="text-[11px] text-zinc-500">4× scale preview</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Every corner, slope, wall, and cliff in the tileset is automatically synthesized from this base image.
            </p>
          </div>
        </div>
      </div>

      {/* Upload File / Drag and Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) processUploadedFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
          dragOver
            ? 'border-amber-400 bg-amber-500/5 text-amber-300'
            : 'border-[#2d323e] hover:border-zinc-500 bg-[#14161a] text-zinc-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) processUploadedFile(e.target.files[0]);
          }}
        />
        <Upload className="w-6 h-6 text-zinc-400 mb-0.5" />
        <p className="text-xs font-medium text-zinc-200">
          Click to upload or drag & drop texture
        </p>
        <p className="text-[11px] text-zinc-500">
          PNG, JPG, WebP — automatically downsampled to 32×32 pixel art
        </p>
      </div>
    </div>
  );
};
