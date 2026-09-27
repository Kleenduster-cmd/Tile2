import React, { useRef, useState, useEffect } from 'react';
import { Upload, Sparkles, Wand2, Palette, Grid3X3, Eye } from 'lucide-react';
import { PixelPreset } from '../types/tileset';
import { PRESET_TEXTURES } from '../utils/pixelPresets';
import { createBlankImageData, hexToRgb } from '../utils/tileGenerator';
import { generateAiTexture } from '../utils/aiTextureService';

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
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'ai'>('presets');
  const [showGrid, setShowGrid] = useState(true);
  const [showWrapPreview, setShowWrapPreview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
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

  // Render 3x3 wrap preview (96x96 repeated at 128x128 scale)
  useEffect(() => {
    if (!wrapCanvasRef.current) return;
    const canvas = wrapCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const temp = document.createElement('canvas');
    temp.width = 32;
    temp.height = 32;
    const tCtx = temp.getContext('2d')!;
    tCtx.putImageData(baseImage, 0, 0);

    ctx.clearRect(0, 0, 128, 128);
    // Draw 3x3 tiles, each ~42px
    const tileSize = 128 / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.drawImage(temp, 0, 0, 32, 32, c * tileSize, r * tileSize, tileSize, tileSize);
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

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const result = await generateAiTexture(aiPrompt.trim());
      onUpdateBaseImage(result, aiPrompt.trim());
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const promptSuggestions = [
    'Enchanted Mossy Stone',
    'Volcanic Magma Crust',
    'Deep Sea Water Caustics',
    'Sci-Fi Cyber Grid',
    'Ancient Desert Sandstone',
    'Poisonous Purple Slime',
  ];

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
                width={128}
                height={128}
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

        <div className="flex flex-col justify-between h-32 flex-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-zinc-200">Interactive Canvas</span>
              <span className="text-[11px] text-zinc-500">4× scale preview</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Every corner, slope, wall, and cliff in the tileset is automatically synthesized from this base image.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPixelEditor}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded-lg hover:bg-amber-900/50 transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
              Draw & Edit Pixels
            </button>
          </div>
        </div>
      </div>

      {/* Input Mode Selector Tabs */}
      <div className="flex items-center gap-1 bg-[#14161a] p-1 rounded-lg border border-[#22252e]">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'presets' ? 'bg-[#252934] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Preset Themes
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'upload' ? 'bg-[#252934] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Upload Image
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'ai' ? 'bg-[#252934] text-amber-300 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          AI Generator
        </button>
      </div>

      {/* Tab 1: Curated RPG Presets */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
          {PRESET_TEXTURES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onUpdateBaseImage(preset.generate(), preset.name)}
              className="flex flex-col items-center p-2 rounded-lg border border-[#272b36] bg-[#14161a] hover:border-amber-500/50 hover:bg-[#1a1e27] transition-all text-left group"
              title={`${preset.name}: ${preset.description}`}
            >
              <div
                className="w-10 h-10 rounded border border-[#3b4050] mb-1.5 shadow-sm group-hover:scale-105 transition-transform"
                style={{ backgroundColor: preset.previewColor }}
              />
              <span className="text-[11px] font-medium text-zinc-300 truncate w-full text-center group-hover:text-amber-300">
                {preset.name}
              </span>
              <span className="text-[9px] text-zinc-500 truncate w-full text-center">
                {preset.category}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tab 2: Upload File / Drag and Drop */}
      {activeTab === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) processUploadedFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
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
          <Upload className="w-6 h-6 text-zinc-400 mb-1" />
          <p className="text-xs font-medium text-zinc-200">
            Click to upload or drag & drop texture
          </p>
          <p className="text-[11px] text-zinc-500">
            PNG, JPG, WebP — automatically downsampled to 32×32 pixel art
          </p>
        </div>
      )}

      {/* Tab 3: AI Texture Prompt Generator */}
      {activeTab === 'ai' && (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. glowing emerald cave crystals..."
              className="flex-1 bg-[#121418] border border-[#2c313d] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            />
            <button
              onClick={handleAiGenerate}
              disabled={isGeneratingAi || !aiPrompt.trim()}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {isGeneratingAi ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-zinc-500">Suggestions:</span>
            {promptSuggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => {
                  setAiPrompt(sug);
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-[#1a1e27] border border-[#2b303d] text-zinc-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
