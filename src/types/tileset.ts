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
export type RampSurfaceType = 'natural' | 'plank' | 'stepped' | 'mud_slide' | 'cobblestone';
export type StairStyle = 'carved_stone' | 'wood_timbers' | 'ancient_cobble' | 'temple_marble';
export type StairRailing = 'stone_balustrade' | 'wood_posts' | 'open_flush';
export type WallStrataStyle = 'rock_strata' | 'masonry_brick' | 'timber_logs' | 'earthen_soil';

export type ProjectionMode = 'topdown_25d' | 'classic_rpg';

export interface TileGeneratorSettings {
  projectionMode: ProjectionMode; // 'topdown_25d' enforces 30° bird's-eye oblique elevation, cliff drop facades, and shadows
  projectionAngle: number; // 30 (degrees) - Top-down bird's-eye camera angle for non-isometric orthogonal grid
  edgeStyle: EdgeStyle;
  outlineColor: string; // hex
  outlineOpacity: number; // 0..1
  highlightRim: boolean;
  highlightColor: string; // hex
  edgeThickness: number; // 1, 2, 3
  cornerRoundness: number; // 1..8 px
  cliffHeight: number; // 8..24 px (height of 2.5D front cliff/wall facades)
  cliffShadowIntensity: number; // 0..1
  cliffLedgeDrop: boolean; // Render 2.5D vertical rock drop facade on south edges
  grassBladeFrequency: number; // 1..5
  rampSurfaceType: RampSurfaceType; // 2.5D ramp style
  slopeBackgroundWall: SlopeBackgroundWallType; // 'none' (freestanding open slope), 'cliff_wall', 'natural_bank'
  slopeDepthIntensity: number; // 0.2..1.0 - 3D depth and shadow volume
  slopeWheelRuts: boolean; // Wheel/tread indentations on slopes
  slope3dCurbs: boolean; // Beveled 3D side curbs & retaining ledges
  slopeTrestleBracing: boolean; // Support trestle posts & cross-braces for open slopes
  stairStyle: StairStyle; // Stair architectural style
  stairRailing: StairRailing; // Balustrade railing type
  wallStrataStyle: WallStrataStyle; // 2.5D front wall strata texture: 'rock_strata' | 'masonry_brick' | 'timber_logs' | 'earthen_soil'
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
