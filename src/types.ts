export interface Point {
  x: number;
  y: number;
}

export interface TextureSlice {
  id: string;
  points: Point[];
  width: number;
  height: number;
}

export interface TransformOptions {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  scale: number;
}

export interface VisualizationSettings {
  showGrid: boolean;
  gridDensity: number;
  showGuides: boolean;
  showPoints: boolean;
  opacity: number;
}

export type Tool = 'move' | 'point' | 'rotate' | 'scale';
