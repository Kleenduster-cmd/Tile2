import React from 'react';
import { Sliders, Sparkles, Mountain, Layers, Eye } from 'lucide-react';
import { TileGeneratorSettings, EdgeStyle } from '../types/tileset';
import { PRESET_TEXTURES } from '../utils/pixelPresets';

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
          <h2 className="text-sm font-semibold text-white tracking-tight">Generation & Shading Styles</h2>
        </div>
        <span className="text-[11px] text-zinc-400">Slopes · Curves · Walls · Corners</span>
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
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            2.5D Elevation
          </span>
        </div>

        {/* Perspective Quick Presets (Pokemon D&P vs Dragon Quest) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#0e1014] p-2 rounded-lg border border-[#202430]">
          <span className="text-[11px] font-semibold text-zinc-300">RPG Presets:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                onChange({
                  ...settings,
                  rampSurfaceType: 'mud_slide',
                  slopeBackgroundWall: 'none',
                  edgeStyle: 'pixel_outline',
                  cliffShadowIntensity: 0.6,
                });
              }}
              className={`px-2.5 py-1 text-[11px] rounded border transition-all ${
                settings.rampSurfaceType === 'mud_slide'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold shadow-sm'
                  : 'bg-[#161820] text-zinc-400 border-[#262a36] hover:text-zinc-200'
              }`}
            >
              🔴 Pokémon D&P (Sinnoh Slopes)
            </button>
            <button
              onClick={() => {
                onChange({
                  ...settings,
                  rampSurfaceType: 'stepped',
                  slopeBackgroundWall: 'none',
                  edgeStyle: 'soft_bevel',
                  cliffShadowIntensity: 0.65,
                });
              }}
              className={`px-2.5 py-1 text-[11px] rounded border transition-all ${
                settings.rampSurfaceType === 'stepped'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-semibold shadow-sm'
                  : 'bg-[#161820] text-zinc-400 border-[#262a36] hover:text-zinc-200'
              }`}
            >
              🛡️ Dragon Quest (DS Terraces)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ramp Surface Type */}
          <div className="flex flex-col justify-between">
            <span className="text-[11px] font-medium text-zinc-300 mb-1.5">2.5D Ramp Tread Type</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'mud_slide' as const, label: 'Pokémon Mud Slide', desc: 'Chevron ruts' },
                { id: 'stepped' as const, label: 'Dragon Quest Steps', desc: 'Stone risers' },
                { id: 'natural' as const, label: 'Natural Dirt', desc: 'Ruts & soil' },
                { id: 'plank' as const, label: 'Wood Planks', desc: 'Timber logs' },
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

          {/* Cliff Drop Shadow Intensity */}
          <div className="flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-medium text-zinc-300">2.5D Drop Shadow Depth</span>
              <span className="text-xs font-mono text-emerald-400">
                {Math.round(settings.cliffShadowIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={0.9}
              step={0.05}
              value={settings.cliffShadowIntensity}
              onChange={(e) => updateSetting('cliffShadowIntensity', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-[#252a35] rounded-lg"
            />
            <span className="text-[10px] text-zinc-500 mt-1">
              Depth of ambient occlusion cast by 2.5D slopes & cliffs
            </span>
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
              <option value="preset">Secondary Preset</option>
              <option value="color">Solid Color</option>
            </select>

            {settings.underlayType === 'preset' && (
              <select
                value={settings.underlayPresetId}
                onChange={(e) => updateSetting('underlayPresetId', e.target.value)}
                className="bg-[#1a1e27] border border-[#2d3340] text-xs text-zinc-200 rounded px-2 py-1 focus:outline-none max-w-[110px]"
              >
                {PRESET_TEXTURES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

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
