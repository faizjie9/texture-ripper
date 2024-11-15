export interface Point {
  x: number;
  y: number;
}

export type Tool = 'select' | 'auto' | 'edit';

export interface TextureSlice {
  id: string;
  points: Point[];
  texture: string;
}

export interface DetectionSettings {
  transparencyThreshold: number;
  padding: number;
  minSize: number;
}
