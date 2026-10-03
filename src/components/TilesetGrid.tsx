import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { GeneratedTile, TileCategory, SlopeBackgroundWallType } from '../types/tileset';
import { downloadTileAsPng } from '../utils/exportUtils';

interface TilesetGridProps {
  tiles: GeneratedTile[];
  selectedTileId: string | null;
  onSelectTile: (tile: GeneratedTile) => void;
  slopeBackgroundWall?: SlopeBackgroundWallType;
  onUpdateSlopeBackgroundWall?: (val: SlopeBackgroundWallType) => void;
  onExportTransparentTileset?: () => void;
}

interface TileCardProps {
  tile: GeneratedTile;
  isSelected: boolean;
  scale: 2 | 3;
  slopeBackgroundWall: SlopeBackgroundWallType;
  onSelect: (tile: GeneratedTile) => void;
}

// Memoized individual card to prevent re-rendering all 64 items on selection change
const TileCard: React.FC<TileCardProps> = React.memo(({
  tile,
  isSelected,
  scale,
  slopeBackgroundWall,
  onSelect,
}) => {
  const displaySize = scale === 2 ? 'w-16 h-16' : 'w-24 h-24';

  return (
    <div
      onClick={() => onSelect(tile)}
      className={`group relative flex flex-col items-center bg-[#131519] rounded-lg p-2 border transition-all cursor-pointer select-none ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/20 bg-[#1b1e25] shadow-lg'
          : 'border-[#242833] hover:border-[#3d4354] hover:bg-[#181b22]'
      }`}
    >
      {/* Tile Preview Canvas */}
      <div className={`${displaySize} bg-transparency-grid-sm rounded border border-[#2d323e] flex items-center justify-center overflow-hidden mb-2 relative shadow-inner`}>
        <img
          src={tile.dataUrl}
          alt={tile.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full pixelated group-hover:scale-105 transition-transform"
        />

        {/* Category indicator badges */}
        {tile.category === 'slopes_25d' && (
          <span className="absolute top-1 left-1 text-[8px] px-1 py-0.2 bg-emerald-400 text-black font-bold rounded shadow-sm">
            {slopeBackgroundWall === 'none' ? 'OPEN SLOPE' : '2.5D SLOPE'}
          </span>
        )}
        {tile.category === 'slopes' && (
          <span className="absolute top-1 left-1 text-[8px] px-1 py-0.2 bg-amber-500/80 text-black font-semibold rounded">
            SLOPE
          </span>
        )}
        {tile.category === 'curves' && (
          <span className="absolute top-1 left-1 text-[8px] px-1 py-0.2 bg-sky-500/80 text-black font-semibold rounded">
            CURVE
          </span>
        )}
        {tile.category === 'cliffs' && (
          <span className="absolute top-1 left-1 text-[8px] px-1 py-0.2 bg-emerald-500/80 text-black font-semibold rounded">
            CLIFF
          </span>
        )}
      </div>

      {/* Title & Coordinates */}
      <span className="text-[11px] font-medium text-zinc-200 w-full text-center truncate group-hover:text-amber-300">
        {tile.name}
      </span>
      <span className="text-[9px] font-mono text-zinc-500 truncate w-full text-center">
        [{tile.exportCol}, {tile.exportRow}] · 32×32
      </span>

      {/* Quick Actions (Hover overlay) */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/80 p-0.5 rounded backdrop-blur-sm">
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadTileAsPng(tile, 1);
          }}
          className="p-1 text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded"
          title="Download 32x32 PNG"
        >
          <Download className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});

export const TilesetGrid: React.FC<TilesetGridProps> = ({
  tiles,
  selectedTileId,
  onSelectTile,
  slopeBackgroundWall = 'none',
  onUpdateSlopeBackgroundWall,
  onExportTransparentTileset,
}) => {
  const [activeCategory, setActiveCategory] = useState<TileCategory | 'all'>('all');
  const [scale, setScale] = useState<2 | 3>(2);

  const categories = useMemo(() => [
    { id: 'all' as const, label: 'All Tiles', count: tiles.length },
    { id: 'slopes_25d' as const, label: '★ 2.5D Slopes & Ramps', count: tiles.filter(t => t.category === 'slopes_25d').length },
    { id: 'slopes' as const, label: '2D Slopes', count: tiles.filter(t => t.category === 'slopes').length },
    { id: 'cliffs' as const, label: 'Cliffs & Stairs', count: tiles.filter(t => t.category === 'cliffs').length },
    { id: 'curves' as const, label: 'Curves', count: tiles.filter(t => t.category === 'curves').length },
    { id: 'edges' as const, label: 'Walls & Edges', count: tiles.filter(t => t.category === 'edges').length },
    { id: 'corners_outer' as const, label: 'Outer Corners', count: tiles.filter(t => t.category === 'corners_outer').length },
    { id: 'corners_inner' as const, label: 'Inner Corners', count: tiles.filter(t => t.category === 'corners_inner').length },
    { id: 'parts' as const, label: 'Paths & Parts', count: tiles.filter(t => t.category === 'parts').length },
  ], [tiles]);

  const filteredTiles = useMemo(() => {
    return activeCategory === 'all'
      ? tiles
      : tiles.filter(t => t.category === activeCategory);
  }, [tiles, activeCategory]);

  return (
    <div className="bg-[#181a20] rounded-xl border border-[#262a34] p-4 flex flex-col gap-3">
      {/* Top Bar / Category Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262a34] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm shadow-amber-400/20'
                  : 'bg-[#14161a] text-zinc-400 hover:text-zinc-200 border border-[#242732]'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === cat.id ? 'bg-zinc-950/20 text-zinc-900' : 'bg-[#222632] text-zinc-500'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Zoom scale and Quick Export control */}
        <div className="flex items-center gap-2">
          {onExportTransparentTileset && (
            <button
              onClick={onExportTransparentTileset}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 rounded-lg hover:bg-emerald-900 transition-colors shadow-sm shrink-0"
              title="Download all 64 tiles as a single 32x32 transparent PNG image (256x256 px)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export 32×32 PNG</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-[#14161a] p-1 rounded-lg border border-[#242732] shrink-0">
            <span className="text-[10px] text-zinc-500 px-1.5">Zoom</span>
            <button
              onClick={() => setScale(2)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                scale === 2 ? 'bg-[#2a2f3c] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2× (64px)
            </button>
            <button
              onClick={() => setScale(3)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                scale === 3 ? 'bg-[#2a2f3c] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              3× (96px)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Switcher for Slope Background Wall */}
      {onUpdateSlopeBackgroundWall && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121418] px-3 py-2 rounded-lg border border-[#232733]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-300">Slope Wall:</span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {slopeBackgroundWall === 'none'
                ? '🚫 No Background Wall (Freestanding Open Air)'
                : slopeBackgroundWall === 'natural_bank'
                ? '🌱 Soft Grassy Bank'
                : '🧱 Cliff Retaining Wall'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'none' as const, label: '🚫 No Background Wall', desc: 'Freestanding slope / open air' },
              { id: 'cliff_wall' as const, label: '🧱 Cliff Wall', desc: 'Embedded in rock cliff strata' },
              { id: 'natural_bank' as const, label: '🌱 Earthen Bank', desc: 'Smooth grass/dirt slope' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onUpdateSlopeBackgroundWall(m.id)}
                className={`px-2.5 py-1 text-[11px] rounded border transition-all ${
                  slopeBackgroundWall === m.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold shadow-sm'
                    : 'bg-[#181a22] text-zinc-400 border-[#2b303d] hover:text-zinc-200'
                }`}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Generated Tiles */}
      <div className={`grid gap-2.5 max-h-[580px] overflow-y-auto p-1 ${
        scale === 2
          ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
      }`}>
        {filteredTiles.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            isSelected={selectedTileId === tile.id}
            scale={scale}
            slopeBackgroundWall={slopeBackgroundWall}
            onSelect={onSelectTile}
          />
        ))}
      </div>
    </div>
  );
};
