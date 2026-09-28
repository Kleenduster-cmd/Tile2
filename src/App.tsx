import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { BaseImagePanel } from './components/BaseImagePanel';
import { StyleControls } from './components/StyleControls';
import { TilesetGrid } from './components/TilesetGrid';
import { TileInspector } from './components/TileInspector';
import { MapPlaytester } from './components/MapPlaytester';
import { PixelEditorModal } from './components/PixelEditorModal';
import { ExportModal } from './components/ExportModal';
import { PRESET_TEXTURES } from './utils/pixelPresets';
import { generateTileset } from './utils/tileGenerator';
import { download32x32TransparentTileset } from './utils/exportUtils';
import { GeneratedTile, TileGeneratorSettings } from './types/tileset';
import { Layers, Map, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'map' | 'export'>('studio');

  // Base 32x32 terrain texture
  const [baseImage, setBaseImage] = useState<ImageData>(() => {
    return PRESET_TEXTURES[0].generate();
  });
  const [baseName, setBaseName] = useState<string>('Lush Emerald Grass');

  // Generation & Shading Settings
  const [settings, setSettings] = useState<TileGeneratorSettings>({
    projectionMode: 'topdown_25d',
    projectionAngle: 30, // 30° Top-Down Bird's-Eye View (Non-Isometric Grid)
    edgeStyle: 'cliff_drop',
    outlineColor: '#000000',
    outlineOpacity: 0.85,
    highlightRim: true,
    highlightColor: '#ffffff',
    edgeThickness: 1,
    cornerRoundness: 4,
    cliffHeight: 16,
    cliffShadowIntensity: 0.7,
    cliffLedgeDrop: true,
    grassBladeFrequency: 2,
    rampSurfaceType: 'natural',
    slopeBackgroundWall: 'none', // Slopes with no background wall (freestanding open slopes & ramps)
    slopeDepthIntensity: 0.85,
    slopeWheelRuts: true,
    slope3dCurbs: true,
    slopeTrestleBracing: true,
    stairStyle: 'carved_stone',
    stairRailing: 'stone_balustrade',
    wallStrataStyle: 'rock_strata',
    underlayType: 'transparent',
    underlayPresetId: 'ancient_cobblestone',
    underlayColor: '#17191e',
  });

  // Selected tile for Inspector
  const [selectedTileId, setSelectedTileId] = useState<string | null>('slope25d_ramp_v_full');

  // Modals
  const [isPixelEditorOpen, setIsPixelEditorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate tileset in real-time
  const tiles: GeneratedTile[] = useMemo(() => {
    return generateTileset(baseImage, settings);
  }, [baseImage, settings]);

  const selectedTile = useMemo(() => {
    return tiles.find((t) => t.id === selectedTileId) || tiles[0];
  }, [tiles, selectedTileId]);

  const handleUpdateBaseImage = (newImg: ImageData, sourceName: string) => {
    setBaseImage(newImg);
    setBaseName(sourceName);
    showToast(`Base texture updated: ${sourceName}`);
  };

  const handleUpdateSingleTile = (updatedTile: GeneratedTile) => {
    // Custom touch-up on individual tile
    const idx = tiles.findIndex((t) => t.id === updatedTile.id);
    if (idx !== -1) {
      tiles[idx] = updatedTile;
    }
  };

  const handleQuickExport32x32 = () => {
    download32x32TransparentTileset(
      tiles,
      baseImage,
      settings,
      'grid_8x8',
      'rpg_tileset_32x32_transparent.png'
    );
    showToast('Downloaded 32×32 Transparent Tileset PNG (256×256 px)!');
  };

  return (
    <div className="min-h-screen bg-[#101215] text-[#e3e6ed] flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'export') {
            setIsExportOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenPixelEditor={() => setIsPixelEditorOpen(true)}
        onQuickExport32x32={handleQuickExport32x32}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1c202a] text-white px-4 py-2.5 rounded-xl border border-amber-500/30 shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Content */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Base Image & Generation Controls (4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
              <BaseImagePanel
                baseImage={baseImage}
                onUpdateBaseImage={handleUpdateBaseImage}
                onOpenPixelEditor={() => setIsPixelEditorOpen(true)}
              />

              <StyleControls
                settings={settings}
                onChange={setSettings}
              />
            </div>

            {/* Right Column: Tileset Grid & Tile Inspector (8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
              {/* Detailed Tile Inspector (Zoomed 8x view) */}
              {selectedTile && (
                <TileInspector
                  tile={selectedTile}
                  onClose={() => setSelectedTileId(null)}
                  onUpdateTile={handleUpdateSingleTile}
                />
              )}

              {/* Complete Generated Tileset Catalog */}
              <TilesetGrid
                tiles={tiles}
                selectedTileId={selectedTileId}
                onSelectTile={(tile) => setSelectedTileId(tile.id)}
                slopeBackgroundWall={settings.slopeBackgroundWall}
                onUpdateSlopeBackgroundWall={(val) => setSettings((s) => ({ ...s, slopeBackgroundWall: val }))}
                onExportTransparentTileset={handleQuickExport32x32}
              />
            </div>
          </div>
        )}

        {/* Map Playtester Tab */}
        {activeTab === 'map' && (
          <div className="flex flex-col gap-6">
            <MapPlaytester tiles={tiles} />
          </div>
        )}
      </main>

      {/* Modals */}
      <PixelEditorModal
        isOpen={isPixelEditorOpen}
        onClose={() => setIsPixelEditorOpen(false)}
        initialImageData={baseImage}
        onSave={(newImg) => handleUpdateBaseImage(newImg, 'Custom Pixel Art')}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tiles={tiles}
        baseImage={baseImage}
        settings={settings}
      />
    </div>
  );
}
