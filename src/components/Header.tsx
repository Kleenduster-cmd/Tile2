import React from 'react';
import { Download, Sparkles, Palette } from 'lucide-react';

interface HeaderProps {
  onOpenExport: () => void;
  onOpenPixelEditor: () => void;
  onQuickExport32x32?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExport,
  onOpenPixelEditor,
  onQuickExport32x32,
}) => {
  return (
    <header className="flex items-center justify-end px-6 py-3 bg-[#14161a] border-b border-[#252830] select-none sticky top-0 z-30">
      {/* Primary Actions & Export */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenPixelEditor}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-[#222630] border border-[#313645] rounded-lg hover:bg-[#2c3240] hover:text-white transition-colors whitespace-nowrap"
          title="Open 32x32 Pixel Art Painter"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Edit Base Pixel Art</span>
        </button>

        {onQuickExport32x32 && (
          <button
            onClick={onQuickExport32x32}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 rounded-lg hover:bg-emerald-900 transition-colors shadow-sm whitespace-nowrap"
            title="Download all 64 tiles as a strict 32x32 transparent PNG (256x256 px image)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export 32×32 PNG</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/80 text-emerald-200 font-mono">
              Transparent
            </span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors shadow-sm shadow-amber-400/20 whitespace-nowrap"
          title="Open Export Modal for 32x32 Spritesheets, 64-Tile ZIP, Tiled TSX, and JSON"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Export Center</span>
        </button>
      </div>
    </header>
  );
};
