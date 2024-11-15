export interface Point {
  x: number;
  y: number;
}

export interface TextureSlice {
  id: string;
  texture: string;
  originalPoints: Point[];
  transform: {
    rotation: number;
    flipX: boolean;
    flipY: boolean;
  };
}
