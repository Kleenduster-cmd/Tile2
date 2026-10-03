import React from 'react';
import { Sliders, Sparkles, Mountain, Layers, Eye, Compass, Grid } from 'lucide-react';
import { TileGeneratorSettings, EdgeStyle } from '../types/tileset';

interface StyleControlsProps {
  settings: TileGeneratorSettings;
  onChange: (newSettings: TileGeneratorSettings) => void;
}

export const StyleControls: React.FC<StyleControlsProps> = ({
  settings,
  onChange,
}) => {
  const updateSetting = <K extends keyof TileGeneratorSettings>(
    key: K,
    value: TileGeneratorSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const edgeStyleOptions: { id: EdgeStyle; label: string; desc: string }[] = [
    { id: 'pixel_outline', label: 'Pixel Outline', desc: '16-bit RPG dark perimeter border' },
    { id: 'grass_fringe', label: 'Grass Fringe', desc: 'Ragged organic blades & overhangs' },
    { id: 'soft_bevel', label: 'Soft Bevel', desc: 'Highlight top/left & shadow bottom/right' },
    { id: 'cliff_drop', label: '2.5D Cliff Drop', desc: 'Vertical rock strata with drop shadow' },
    { id: 'clean_cut', label: 'Clean Cut', desc: 'Sharp geometric cut' },
  ];

  return (
    <div className="bg-[#181a20] rounded-xl border border-[#262a34] p-4 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white tracking-tight">Top-Down 2.5D RPG Controls</h2>
        </div>
      </div>

      {/* 30° Top-Down Bird's-Eye Projection Angle Controls */}
      <div className="bg-[#121418] p-3.5 rounded-lg border border-[#282d3b] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-100">Camera Projection Angle (Bird's-Eye View)</span>
          </div>
          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/30">
            {settings.projectionAngle ?? 30}° Angle Active
          </span>
        </div>

        {/* Projection Presets */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { angle: 30, label: '30° Bird\'s-Eye', tag: 'Standard 2.5D RPG', desc: 'Prominent cliff drop, 30° slopes (2:1)' },
            { angle: 45, label: '45° Oblique', tag: 'Balanced Tilt', desc: 'Equal vertical & horizontal ratio' },
            { angle: 60, label: '60° High Angle', tag: 'Steep Top-Down', desc: 'Larger plateau tops, short drops' },
          ].map((preset) => {
            const isSelected = (settings.projectionAngle ?? 30) === preset.angle;
            return (
              <button
                key={preset.angle}
                onClick={() => updateSetting('projectionAngle', preset.angle)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-[#181b22] text-zinc-400 border-[#252834] hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold">{preset.label}</span>
                  {isSelected && <span className="text-[9px] text-amber-400 font-mono">ACTIVE</span>}
                </div>
                <span className="text-[9px] block text-emerald-400 font-mono">{preset.tag}</span>
                <span className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">{preset.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Fine-Tuning Angle Slider & Grid Architecture Notice */}
        <div className="bg-[#161820] p-2.5 rounded-lg border border-[#222530] flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-zinc-300">Camera Pitch Angle</span>
            <span className="text-xs font-mono text-amber-400">{settings.projectionAngle ?? 30}°</span>
          </div>
          <input
            type="range"
            min={15}
            max={60}
            step={5}
            value={settings.projectionAngle ?? 30}
            onChange={(e) => updateSetting('projectionAngle', parseInt(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#252a35] rounded-lg"
          />
          <div className="flex justify-between items-center text-[9px] text-zinc-500">
            <span>15° (Low Grazing)</span>
            <span className="text-amber-400 font-semibold">30° (Standard 2.5D)</span>
            <span>45° (Oblique)</span>
            <span>60° (Steep)</span>
          </div>

          <div className="pt-2 border-t border-[#20232c] flex items-center gap-2 text-[10px] text-zinc-400">
            <Grid className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>
              <strong>Orthogonal Grid (Non-Isometric):</strong> Square 32×32 tiles drawn from a 30° bird's-eye perspective with vertical cliff facades, 30° diagonal slopes, and 30° ground shadows.
            </span>
          </div>
        </div>
      </div>

      {/* 2.5D Elevation & Cliff Facade Controls */}
      <div className="bg-[#121418] p-3.5 rounded-lg border border-[#282d3b] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-100">2.5D Vertical Wall Facade & Strata</span>
          </div>
          <span className="text-[10px] text-zinc-400">South edges drop as vertical cliff faces</span>
        </div>

        {/* Strata Architecture Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-zinc-300">Front Wall Material / Strata</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'rock_strata' as const, label: '🪨 Rock Strata', desc: 'Geological rock fissures' },
              { id: 'masonry_brick' as const, label: '🧱 Chiseled Brick', desc: 'Ashlar masonry & mortar' },
              { id: 'timber_logs' as const, label: '🪵 Timber Logs', desc: 'Stacked beams & brackets' },
              { id: 'earthen_soil' as const, label: '🌾 Earthen Soil', desc: 'Stratified soil & roots' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => updateSetting('wallStrataStyle', st.id)}
                className={`py-1.5 px-2 rounded-lg border text-left transition-all ${
                  settings.wallStrataStyle === st.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold shadow-sm'
                    : 'bg-[#181b22] text-zinc-400 border-[#252834] hover:text-zinc-200'
                }`}
              >
                <span className="text-[11px] block">{st.label}</span>
                <span className="text-[9px] text-zinc-500">{st.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cliff Drop Height & Ground Cast Shadow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-[#161820] p-2.5 rounded-lg border border-[#222530] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-medium text-zinc-300">2.5D Cliff Drop Height</span>
              <span className="text-xs font-mono text-amber-400">{settings.cliffHeight || 16} px</span>
            </div>
            <input
              type="range"
              min={8}
              max={22}
              step={1}
              value={settings.cliffHeight || 16}
              onChange={(e) => updateSetting('cliffHeight', parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#252a35] rounded-lg"
            />
            <div className="flex justify-between items-center mt-1 text-[9px] text-zinc-500">
              <span>8px (Low Ledge)</span>
              <span>16px (Half-Tile)</span>
              <span>22px (High Cliff)</span>
            </div>
          </div>

          <div className="bg-[#161820] p-2.5 rounded-lg border border-[#222530] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-medium text-zinc-300">Ground Cast Shadow</span>
              <span className="text-xs font-mono text-amber-400">
                {Math.round((settings.cliffShadowIntensity || 0.7) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.05}
              value={settings.cliffShadowIntensity || 0.7}
              onChange={(e) => updateSetting('cliffShadowIntensity', parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#252a35] rounded-lg"
            />
            <span className="text-[9px] text-zinc-500 mt-1">Ambient occlusion cast onto lower ground</span>
          </div>
        </div>
      </div>

      {/* Edge Style Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-300">Edge Treatment Style</label>
        <div className="grid grid-cols-5 gap-1.5 bg-[#121418] p-1 rounded-lg border border-[#232731]">
          {edgeStyleOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => updateSetting('edgeStyle', opt.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-center ${
                settings.edgeStyle === opt.id
                  ? 'bg-[#292e3a] text-white shadow-sm border border-[#3b4254]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1d24]'
              }`}
            >
              <span className="text-[11px] font-semibold tracking-tight">{opt.label}</span>
              <span className="text-[9px] text-zinc-500 leading-tight hidden xl:block mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Sliders & Color Modifiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Edge Thickness */}
        <div className="bg-[#121418] p-3 rounded-lg border border-[#22252e] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-zinc-300">Border Thickness</span>
            <span className="text-xs font-mono text-amber-400">{settings.edgeThickness} px</span>
          </div>
          <div className="flex gap-2 items-center">
            {[1, 2, 3].map((val) => (
              <button
                key={val}
                onClick={() => updateSetting('edgeThickness', val)}
                className={`flex-1 py-1 text-xs font-mono font-medium rounded border transition-colors ${
                  settings.edgeThickness === val
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#1b1e26] text-zinc-400 border-[#282d38] hover:text-zinc-200'
                }`}
              >
                {val}px
              </button>
            ))}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Width of outer outline border</span>
        </div>

        {/* Corner & Curve Roundness */}
        <div className="bg-[#121418] p-3 rounded-lg border border-[#22252e] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-zinc-300">Curve Radius</span>
            <span className="text-xs font-mono text-amber-400">{settings.cornerRoundness * 2 + 10} px</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={settings.cornerRoundness}
            onChange={(e) => updateSetting('cornerRoundness', parseInt(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#252a35] rounded-lg"
          />
          <span className="text-[10px] text-zinc-500 mt-1">Smoothness of circular quarter-curves</span>
        </div>

        {/* Outline Darkening / Custom Color */}
        <div className="bg-[#121418] p-3 rounded-lg border border-[#22252e] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-zinc-300">Outline Shade</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={settings.outlineColor}
                onChange={(e) => updateSetting('outlineColor', e.target.value)}
                className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                title="Pick custom border color"
              />
              <span className="text-[10px] font-mono text-zinc-400">{settings.outlineColor}</span>
            </div>
          </div>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={settings.outlineOpacity}
            onChange={(e) => updateSetting('outlineOpacity', parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#252a35] rounded-lg"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-zinc-500">Opacity: {Math.round(settings.outlineOpacity * 100)}%</span>
            <button
              onClick={() => updateSetting('outlineColor', '#000000')}
              className="text-[10px] text-amber-400/80 hover:text-amber-300 underline"
            >
              Auto shade
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: 2.5D Slopes & Elevation Ramps Settings */}
      <div className="bg-[#121418] p-3.5 rounded-lg border border-[#262b37] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-zinc-200">2.5D Slope & Ramp Incline Settings</span>
          </div>
        </div>



        {/* Stair & Steps Architecture Section */}
        <div className="bg-[#0e1014] p-3 rounded-lg border border-[#202430] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
              <span>🏛️ Stair & Step Architecture</span>
            </span>
            <span className="text-[10px] text-zinc-400">Balustrades · Nosing Specular Rim · Mortar Clefts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Stair Style */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-zinc-300">Stair Tread Style</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'carved_stone' as const, label: 'Carved Stone', desc: 'Chiseled masonry & mortar' },
                  { id: 'wood_timbers' as const, label: 'Wood Timbers', desc: 'Timber logs & iron nails' },
                  { id: 'ancient_cobble' as const, label: 'Ancient Cobble', desc: 'Weathered stone & moss' },
                  { id: 'temple_marble' as const, label: 'Temple Marble', desc: 'Polished gold inlay nosing' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateSetting('stairStyle', s.id)}
                    className={`py-1.5 px-2 rounded border text-left transition-all ${
                      settings.stairStyle === s.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium'
                        : 'bg-[#161820] text-zinc-400 border-[#252834] hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-[11px] block font-semibold">{s.label}</span>
                    <span className="text-[9px] text-zinc-500 leading-tight">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stair Railing */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-zinc-300">Stair Railing / Balustrade</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'stone_balustrade' as const, label: 'Stone Rail', desc: 'Beveled coping' },
                  { id: 'wood_posts' as const, label: 'Wood Posts', desc: 'Timber & brackets' },
                  { id: 'open_flush' as const, label: 'Open Flush', desc: 'Seamless wide steps' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => updateSetting('stairRailing', r.id)}
                    className={`py-1.5 px-2 rounded border text-center transition-all ${
                      settings.stairRailing === r.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium'
                        : 'bg-[#161820] text-zinc-400 border-[#252834] hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-[11px] block font-semibold">{r.label}</span>
                    <span className="text-[9px] text-zinc-500 leading-tight">{r.desc}</span>
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-zinc-500 mt-1">
                Tip: Choose "Open Flush" to place multiple stair tiles side-by-side into a wide grand staircase!
              </span>
            </div>
          </div>
        </div>

        {/* 2.5D Slopes & Elevation Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ramp Surface Type */}
          <div className="flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-300 mb-1.5">2.5D Ramp Tread Type</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: 'natural' as const, label: 'Natural Dirt', desc: 'Wheel ruts & soil' },
                { id: 'mud_slide' as const, label: 'Pokémon Mud Slide', desc: '3D chevron ruts' },
                { id: 'stepped' as const, label: 'Dragon Quest Steps', desc: 'Stone risers' },
                { id: 'plank' as const, label: 'Wood Planks', desc: 'Timber & nails' },
                { id: 'cobblestone' as const, label: 'Cobblestone Fan', desc: 'Arched paving' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => updateSetting('rampSurfaceType', style.id)}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    settings.rampSurfaceType === style.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium'
                      : 'bg-[#181b23] text-zinc-400 border-[#2b303d] hover:text-zinc-200'
                  }`}
                >
                  <span className="text-[11px] block">{style.label}</span>
                  <span className="text-[9px] text-zinc-500">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slope Depth Intensity & Toggles */}
          <div className="flex flex-col justify-between gap-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-medium text-zinc-300">Slope 3D Incline Depth</span>
                <span className="text-xs font-mono text-emerald-400">
                  {Math.round((settings.slopeDepthIntensity ?? 0.85) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={settings.slopeDepthIntensity ?? 0.85}
                onChange={(e) => updateSetting('slopeDepthIntensity', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-[#252a35] rounded-lg"
              />
            </div>

            {/* Toggle checkboxes */}
            <div className="flex flex-wrap gap-2 pt-1">
              <label className="flex items-center gap-1.5 text-[10px] text-zinc-300 cursor-pointer bg-[#161820] px-2 py-1 rounded border border-[#242834]">
                <input
                  type="checkbox"
                  checked={settings.slope3dCurbs}
                  onChange={(e) => updateSetting('slope3dCurbs', e.target.checked)}
                  className="rounded accent-emerald-400"
                />
                <span>3D Beveled Curbs</span>
              </label>

              <label className="flex items-center gap-1.5 text-[10px] text-zinc-300 cursor-pointer bg-[#161820] px-2 py-1 rounded border border-[#242834]">
                <input
                  type="checkbox"
                  checked={settings.slopeWheelRuts}
                  onChange={(e) => updateSetting('slopeWheelRuts', e.target.checked)}
                  className="rounded accent-emerald-400"
                />
                <span>Wheel / Bicycle Ruts</span>
              </label>

              <label className="flex items-center gap-1.5 text-[10px] text-zinc-300 cursor-pointer bg-[#161820] px-2 py-1 rounded border border-[#242834]">
                <input
                  type="checkbox"
                  checked={settings.slopeTrestleBracing}
                  onChange={(e) => updateSetting('slopeTrestleBracing', e.target.checked)}
                  className="rounded accent-emerald-400"
                />
                <span>Trestle Bracing</span>
              </label>
            </div>
          </div>
        </div>

        {/* Slope Background Wall Selector */}
        <div className="pt-2 border-t border-[#222632] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-200 flex items-center gap-1.5">
              <span>Slope Background Wall:</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {settings.slopeBackgroundWall === 'none'
                  ? 'No Background Wall (Freestanding / Open Air)'
                  : settings.slopeBackgroundWall === 'natural_bank'
                  ? 'Soft Earthen Bank'
                  : 'Cliff Retaining Wall'}
              </span>
            </span>
            <span className="text-[9px] text-zinc-400">Toggle whether slopes have rock cliff walls behind them</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'none' as const,
                label: 'No Background Wall',
                badge: 'Freestanding Open Air',
                desc: 'Slopes stand alone with transparent/open borders. No vertical rock cliff walls behind or beside the slope. Can be placed anywhere on maps or over any base ground.',
                activeColor: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300',
              },
              {
                id: 'cliff_wall' as const,
                label: 'Cliff Retaining Wall',
                badge: 'Rock Strata Face',
                desc: 'Traditional RPG cliff ramp carved into vertical rock cliff faces with stone strata and cliff wings.',
                activeColor: 'border-amber-500/60 bg-amber-950/40 text-amber-300',
              },
              {
                id: 'natural_bank' as const,
                label: 'Soft Earthen Bank',
                badge: 'Gradual Slope',
                desc: 'Gentle contoured grassy/dirt embankment without sheer vertical stone rock strata.',
                activeColor: 'border-blue-500/60 bg-blue-950/40 text-blue-300',
              },
            ].map((wallOpt) => {
              const isSelected = (settings.slopeBackgroundWall || 'none') === wallOpt.id;
              return (
                <button
                  key={wallOpt.id}
                  onClick={() => updateSetting('slopeBackgroundWall', wallOpt.id)}
                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? `${wallOpt.activeColor} ring-1 ring-emerald-500/30 font-medium`
                      : 'bg-[#161820] text-zinc-400 border-[#2b303d] hover:text-zinc-200 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-100">{wallOpt.label}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-black/40 text-zinc-300">
                      {wallOpt.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 leading-snug">{wallOpt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Highlight Rim & Underlay Terrain Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Highlight Rim Toggle */}
        <div className="bg-[#121418] p-3 rounded-lg border border-[#22252e] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-zinc-200">Top/Left Highlight Rim</span>
            </div>
            <p className="text-[10px] text-zinc-500">Adds subtle specular sunlight edge to north-facing boundaries</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.highlightColor}
              onChange={(e) => updateSetting('highlightColor', e.target.value)}
              className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
              title="Highlight Rim Color"
            />
            <button
              onClick={() => updateSetting('highlightRim', !settings.highlightRim)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.highlightRim ? 'bg-amber-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 left-1 ${
                  settings.highlightRim ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Underlay / Background Mode */}
        <div className="bg-[#121418] p-3 rounded-lg border border-[#22252e] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-medium text-zinc-200">Underlay Background</span>
            </div>
            <p className="text-[10px] text-zinc-500">Negative space fill for slopes & corners</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={settings.underlayType}
              onChange={(e) => updateSetting('underlayType', e.target.value as any)}
              className="bg-[#1a1e27] border border-[#2d3340] text-xs text-zinc-200 rounded px-2 py-1 focus:outline-none"
            >
              <option value="transparent">Transparent (PNG Alpha)</option>
              <option value="color">Solid Color</option>
            </select>

            {settings.underlayType === 'color' && (
              <input
                type="color"
                value={settings.underlayColor}
                onChange={(e) => updateSetting('underlayColor', e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
