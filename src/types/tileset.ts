export type TileCategory = 
  | 'core' 
  | 'edges' 
  | 'corners_outer' 
  | 'corners_inner' 
  | 'slopes' 
  | 'slopes_25d'
  | 'curves' 
  | 'cliffs' 
  | 'parts';

export type EdgeStyle = 'pixel_outline' | 'soft_bevel' | 'grass_fringe' | 'cliff_drop' | 'clean_cut';

export interface TileConfig {
  id: string;
  name: string;
  category: TileCategory;
  description: string;
  // Grid position in standard export sheet (row, col)
  exportCol: number;
  exportRow: number;
}

export type SlopeBackgroundWallType = 'none' | 'cliff_wall' | 'natural_bank';
export type RampSurfaceType = 'natural' | 'plank' | 'stepped' | 'mud_slide';

export interface TileGeneratorSettings {
  edgeStyle: EdgeStyle;
  outlineColor: string; // hex
  outlineOpacity: number; // 0..1
  highlightRim: boolean;
  highlightColor: string; // hex
  edgeThickness: number; // 1, 2, 3
  cornerRoundness: number; // 1..8 px
  cliffHeight: number; // 8..16 px
  cliffShadowIntensity: number; // 0..1
  grassBladeFrequency: number; // 1..5
  rampSurfaceType: RampSurfaceType; // 2.5D ramp style (Pokemon D&P mud slide, Dragon Quest stepped, natural dirt, wood plank)
  slopeBackgroundWall: SlopeBackgroundWallType; // 'none' (freestanding open slope), 'cliff_wall', 'natural_bank'
  underlayType: 'transparent' | 'preset' | 'color';
  underlayPresetId: string;
  underlayColor: string; // hex
}

export interface GeneratedTile {
  id: string;
  name: string;
  category: TileCategory;
  description: string;
  exportCol: number;
  exportRow: number;
  // RGBA ImageData 32x32
  imageData: ImageData;
  // Data URL for immediate display
  dataUrl: string;
  // Collision/passable flag for playtesting
  isSolid?: boolean;
  isSlope?: boolean;
  slopeAngle?: number;
}

export interface PixelPreset {
  id: string;
  name: string;
  category: string;
  previewColor: string;
  description: string;
  // 32x32 array of color strings or procedural generator
  generate: () => ImageData;
}

export interface MapCell {
  tileId: string;
  isSolid: boolean;
  elevation: number;
}
