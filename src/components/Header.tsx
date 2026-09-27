import React from 'react';
import { Download, Sparkles, Map, Layers, Palette } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'map' | 'export';
  setActiveTab: (tab: 'studio' | 'map' | 'export') => void;
  onOpenExport: () => void;
  onOpenPixelEditor: () => void;
  onQuickExport32x32?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  onOpenPixelEditor,
  onQuickExport32x32,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-[#14161a] border-b border-[#252830] select-none sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm shadow-amber-950/40">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
          TileForge 32
          <span className="text-[11px] font-normal px-2 py-0.5 rounded text-amber-300 bg-amber-950/60 border border-amber-800/40">
            RPG Top-Down
          </span>
        </span>
      </div>

      {/* Zone 2: Navigation Links / Mode Selectors */}
      <nav className="flex items-center gap-1 bg-[#1a1d24] p-1 rounded-lg border border-[#2b2f3a]">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'studio'
              ? 'bg-[#282c37] text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Tileset Studio
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-[#282c37] text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Map className="w-3.5 h-3.5 text-emerald-400" />
          Map Playtester
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeTab === 'export'
              ? 'bg-[#282c37] text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Export & Formats
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenPixelEditor}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-[#222630] border border-[#313645] rounded-lg hover:bg-[#2c3240] hover:text-white transition-colors whitespace-nowrap"
          title="Open 32x32 Pixel Art Painter"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          Edit Base Pixel Art
        </button>

        {onQuickExport32x32 && (
          <button
            onClick={onQuickExport32x32}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 rounded-lg hover:bg-emerald-900 transition-colors shadow-sm whitespace-nowrap"
            title="Directly download all 64 tiles as a 32x32 transparent PNG (256x256 px image)"
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
        >
          <Download className="w-3.5 h-3.5" />
          All Formats
        </button>
      </div>
    </header>
  );
};
