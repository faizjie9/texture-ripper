import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Text, Arrow, Shape } from 'react-konva';
import { AnimatedButton } from './ui/animated-button';
import { GlassPanel } from './ui/glass-panel';
import { Point } from '../types';
import { extractTexture, applyTransformToCanvas, createPerspectivePreview } from '../utils/texture';
import { 
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Grid,
  Download,
  HelpCircle,
  XCircle,
  RefreshCcw,
  Info,
  Keyboard
} from 'lucide-react';

export interface TransformOptions {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

const Canvas: React.FC<{
  image: HTMLImageElement;
  onTextureExtracted: (texture: string) => void;
}> = ({ image, onTextureExtracted }) => {
  // State for points in image coordinates
  const [points, setPoints] = useState<Point[]>([]);
  const [previewTexture, setPreviewTexture] = useState<string | null>(null);
  const [transform, setTransform] = useState<TransformOptions>({
    rotation: 0,
    flipX: false,
    flipY: false
  });

  // Stage state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Grid overlay state
  const [showGrid, setShowGrid] = useState(true);
  const [gridDensity, setGridDensity] = useState(10); // Number of grid lines
  const [showHelp, setShowHelp] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  // Update stage size when container size changes
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      setStageSize({
        width: container.clientWidth,
        height: container.clientHeight
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Center image when it loads
  useEffect(() => {
    if (!image || !containerRef.current) return;
    
    const container = containerRef.current;
    const scaleX = container.clientWidth / image.width;
    const scaleY = container.clientHeight / image.height;
    const newScale = Math.min(scaleX, scaleY) * 0.8;

    setScale(newScale);
    setPosition({
      x: (container.clientWidth - image.width * newScale) / 2,
      y: (container.clientHeight - image.height * newScale) / 2
    });
  }, [image, stageSize]);

  // Convert stage coordinates to image coordinates
  const stageToImageCoords = (point: Point): Point => {
    return {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale
    };
  };

  // Convert image coordinates to stage coordinates
  const imageToStageCoords = (point: Point): Point => {
    return {
      x: point.x * scale + position.x,
      y: point.y * scale + position.y
    };
  };

  // Update preview when points or transform changes
  useEffect(() => {
    if (points.length === 4) {
      generatePreview();
    } else {
      setPreviewTexture(null);
    }
  }, [points, transform]);

  const generatePreview = async () => {
    if (points.length !== 4) return;

    try {
      // Calculate preview size based on the selected area
      const previewSize = calculatePreviewSize();
      
      // Create perspective preview
      const previewDataUrl = createPerspectivePreview(
        image,
        points,
        previewSize.width,
        previewSize.height
      );
      
      // Apply additional transformations (rotation, flips)
      const previewImage = new Image();
      previewImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = previewImage.width;
        canvas.height = previewImage.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(previewImage, 0, 0);
        const transformedCanvas = applyTransformToCanvas(canvas, transform);
        setPreviewTexture(transformedCanvas.toDataURL());
      };
      previewImage.src = previewDataUrl;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setPreviewTexture(null);
    }
  };

  // Calculate appropriate preview size based on selected area
  const calculatePreviewSize = () => {
    if (points.length !== 4) {
      return { width: 512, height: 512 }; // Default size
    }

    // Calculate the average width and height of the selected area
    const [p1, p2, p3, p4] = points;
    
    // Calculate width (average of top and bottom edges)
    const topWidth = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    );
    const bottomWidth = Math.sqrt(
      Math.pow(p3.x - p4.x, 2) + Math.pow(p3.y - p4.y, 2)
    );
    const avgWidth = (topWidth + bottomWidth) / 2;

    // Calculate height (average of left and right edges)
    const leftHeight = Math.sqrt(
      Math.pow(p4.x - p1.x, 2) + Math.pow(p4.y - p1.y, 2)
    );
    const rightHeight = Math.sqrt(
      Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2)
    );
    const avgHeight = (leftHeight + rightHeight) / 2;

    // Maintain aspect ratio while limiting maximum size
    const maxSize = 1024;
    const ratio = avgWidth / avgHeight;
    
    let width, height;
    if (ratio > 1) {
      width = Math.min(maxSize, avgWidth);
      height = width / ratio;
    } else {
      height = Math.min(maxSize, avgHeight);
      width = height * ratio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale
    };

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 
      ? Math.max(0.1, oldScale / scaleBy)
      : Math.min(10, oldScale * scaleBy);

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    });
  };

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Prevent default right-click menu
    if (e.evt.button === 2) {
      e.evt.preventDefault();
    }

    // Right or middle mouse button for panning
    if (e.evt.button === 1 || e.evt.button === 2) {
      setIsDragging(true);
      const pos = stage.getPointerPosition();
      if (pos) {
        setDragStart(pos);
      }
      return;
    }

    // Left click for point placement
    if (e.evt.button === 0 && e.target === stage && points.length < 4) {
      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Convert stage coordinates to image coordinates for storage
      const imagePoint = stageToImageCoords(pos);
      setPoints([...points, imagePoint]);
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    if (isDragging && dragStart) {
      const pos = stage.getPointerPosition();
      if (!pos) return;

      setPosition({
        x: position.x + (pos.x - dragStart.x),
        y: position.y + (pos.y - dragStart.y)
      });
      setDragStart(pos);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handlePointDragMove = (index: number, e: any) => {
    const pos = e.target.position();
    if (!pos) return;

    // Convert stage coordinates to image coordinates for storage
    const imagePoint = stageToImageCoords(pos);
    const newPoints = [...points];
    newPoints[index] = imagePoint;
    setPoints(newPoints);
  };

  const handleRotate = (direction: 'left' | 'right') => {
    const newRotation = (transform.rotation + (direction === 'left' ? -90 : 90) + 360) % 360;
    setTransform({ ...transform, rotation: newRotation });
  };

  const handleFlip = (axis: 'x' | 'y') => {
    setTransform({
      ...transform,
      flipX: axis === 'x' ? !transform.flipX : transform.flipX,
      flipY: axis === 'y' ? !transform.flipY : transform.flipY
    });
  };

  const handleExtract = () => {
    if (!previewTexture) return;
    onTextureExtracted(previewTexture);
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (points.length !== 4) return;

      switch (e.key.toLowerCase()) {
        case 'g':
          setShowGrid(!showGrid);
          break;
        case 'r':
          if (e.shiftKey) {
            handleRotate('left');
          } else {
            handleRotate('right');
          }
          break;
        case 'h':
          handleFlip('x');
          break;
        case 'v':
          handleFlip('y');
          break;
        case '[':
          setGridDensity(Math.max(4, gridDensity - 1));
          break;
        case ']':
          setGridDensity(Math.min(20, gridDensity + 1));
          break;
        case '?':
          setShowHelp(!showHelp);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGrid, gridDensity, points.length, showHelp]);

  const renderPoints = () => {
    return points.map((point, i) => {
      // Convert image coordinates to stage coordinates for rendering
      const stagePoint = imageToStageCoords(point);
      return (
        <React.Fragment key={i}>
          <Circle
            x={stagePoint.x}
            y={stagePoint.y}
            radius={6}
            fill="#00ff00"
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            onDragMove={(e) => handlePointDragMove(i, e)}
            onDragEnd={generatePreview}
          />
          <Text
            x={stagePoint.x + 10}
            y={stagePoint.y - 10}
            text={(i + 1).toString()}
            fontSize={14}
            fill="#ffffff"
            stroke="#000000"
            strokeWidth={0.5}
          />
        </React.Fragment>
      );
    });
  };

  const renderLines = () => {
    if (points.length < 2) return null;

    // Convert image coordinates to stage coordinates for rendering
    const stagePoints = points.map(imageToStageCoords);
    const linePoints = [...stagePoints];
    if (points.length === 4) {
      linePoints.push(stagePoints[0]); // Close the shape
    }

    return (
      <Line
        points={linePoints.flatMap(p => [p.x, p.y])}
        stroke="#00ff00"
        strokeWidth={2}
        closed={points.length === 4}
        fill={points.length === 4 ? "rgba(0, 255, 0, 0.1)" : undefined}
      />
    );
  };

  const renderPerspectiveDirections = () => {
    if (points.length !== 4) return null;

    const stagePoints = points.map(imageToStageCoords);
    const arrows = [];

    // Helper function to get midpoint
    const getMidpoint = (p1: Point, p2: Point) => ({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    });

    // Helper function to get direction vector
    const getDirection = (from: Point, to: Point) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      return {
        x: dx / length,
        y: dy / length
      };
    };

    // Helper function to create arrow points
    const createArrowPoints = (from: Point, to: Point, arrowLength: number = 20) => {
      const dir = getDirection(from, to);
      const mid = getMidpoint(from, to);
      
      // Arrow head points
      const angle = Math.PI / 6; // 30 degrees
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const leftPoint = {
        x: mid.x - arrowLength * (dir.x * cos + dir.y * sin),
        y: mid.y - arrowLength * (-dir.x * sin + dir.y * cos)
      };
      
      const rightPoint = {
        x: mid.x - arrowLength * (dir.x * cos - dir.y * sin),
        y: mid.y - arrowLength * (dir.x * sin + dir.y * cos)
      };

      return [
        from.x, from.y,
        to.x, to.y,
        'M', mid.x, mid.y,
        'L', leftPoint.x, leftPoint.y,
        'M', mid.x, mid.y,
        'L', rightPoint.x, rightPoint.y
      ];
    };

    // Horizontal arrows (left to right)
    const topArrow = createArrowPoints(stagePoints[0], stagePoints[1]);
    const bottomArrow = createArrowPoints(stagePoints[3], stagePoints[2]);

    // Vertical arrows (top to bottom)
    const leftArrow = createArrowPoints(stagePoints[0], stagePoints[3]);
    const rightArrow = createArrowPoints(stagePoints[1], stagePoints[2]);

    arrows.push(
      // Left to right arrows
      <Shape
        key="top-arrow"
        stroke="#FF6B6B"
        strokeWidth={2}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(topArrow[0], topArrow[1]);
          context.lineTo(topArrow[2], topArrow[3]);
          context.moveTo(topArrow[5], topArrow[6]);
          context.lineTo(topArrow[8], topArrow[9]);
          context.moveTo(topArrow[11], topArrow[12]);
          context.lineTo(topArrow[14], topArrow[15]);
          context.strokeShape(shape);
        }}
      />,
      <Shape
        key="bottom-arrow"
        stroke="#FF6B6B"
        strokeWidth={2}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(bottomArrow[0], bottomArrow[1]);
          context.lineTo(bottomArrow[2], bottomArrow[3]);
          context.moveTo(bottomArrow[5], bottomArrow[6]);
          context.lineTo(bottomArrow[8], bottomArrow[9]);
          context.moveTo(bottomArrow[11], bottomArrow[12]);
          context.lineTo(bottomArrow[14], bottomArrow[15]);
          context.strokeShape(shape);
        }}
      />,
      // Top to bottom arrows
      <Shape
        key="left-arrow"
        stroke="#4ECDC4"
        strokeWidth={2}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(leftArrow[0], leftArrow[1]);
          context.lineTo(leftArrow[2], leftArrow[3]);
          context.moveTo(leftArrow[5], leftArrow[6]);
          context.lineTo(leftArrow[8], leftArrow[9]);
          context.moveTo(leftArrow[11], leftArrow[12]);
          context.lineTo(leftArrow[14], leftArrow[15]);
          context.strokeShape(shape);
        }}
      />,
      <Shape
        key="right-arrow"
        stroke="#4ECDC4"
        strokeWidth={2}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(rightArrow[0], rightArrow[1]);
          context.lineTo(rightArrow[2], rightArrow[3]);
          context.moveTo(rightArrow[5], rightArrow[6]);
          context.lineTo(rightArrow[8], rightArrow[9]);
          context.moveTo(rightArrow[11], rightArrow[12]);
          context.lineTo(rightArrow[14], rightArrow[15]);
          context.strokeShape(shape);
        }}
      />
    );

    return arrows;
  };

  const renderPerspectiveGrid = () => {
    if (!showGrid || points.length !== 4) return null;

    const stagePoints = points.map(imageToStageCoords);
    const gridLines = [];

    // Helper function to interpolate between two points
    const interpolate = (p1: Point, p2: Point, t: number) => ({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    });

    // Create horizontal grid lines
    for (let i = 0; i <= gridDensity; i++) {
      const t = i / gridDensity;
      const leftPoint = interpolate(stagePoints[0], stagePoints[3], t);
      const rightPoint = interpolate(stagePoints[1], stagePoints[2], t);

      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[leftPoint.x, leftPoint.y, rightPoint.x, rightPoint.y]}
          stroke={i === 0 || i === gridDensity ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.2)"}
          strokeWidth={i === 0 || i === gridDensity ? 2 : 1}
          dash={i === 0 || i === gridDensity ? undefined : [5, 5]}
        />
      );
    }

    // Create vertical grid lines
    for (let i = 0; i <= gridDensity; i++) {
      const t = i / gridDensity;
      const topPoint = interpolate(stagePoints[0], stagePoints[1], t);
      const bottomPoint = interpolate(stagePoints[3], stagePoints[2], t);

      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[topPoint.x, topPoint.y, bottomPoint.x, bottomPoint.y]}
          stroke={i === 0 || i === gridDensity ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.2)"}
          strokeWidth={i === 0 || i === gridDensity ? 2 : 1}
          dash={i === 0 || i === gridDensity ? undefined : [5, 5]}
        />
      );
    }

    return gridLines;
  };

  return (
    <div className="flex h-full w-full relative">
      <div 
        ref={containerRef} 
        className="flex-1 relative overflow-hidden bg-black/10"
        onContextMenu={(e) => e.preventDefault()}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-black/5"
          style={{
            cursor: points.length >= 4 ? 'default' : 'crosshair'
          }}
        >
          <Layer>
            <KonvaImage
              image={image}
              width={image.width * scale}
              height={image.height * scale}
              x={position.x}
              y={position.y}
              listening={false}
            />
            {renderPoints()}
            {renderLines()}
            {renderPerspectiveDirections()}
            {renderPerspectiveGrid()}
          </Layer>
        </Stage>

        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <AnimatedButton
            onClick={() => {
              setPoints([]);
              setPreviewTexture(null);
              setTransform({
                rotation: 0,
                flipX: false,
                flipY: false
              });
            }}
            variant="secondary"
            className="text-sm px-4 py-2 bg-black/20 hover:bg-black/30 transition-colors"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reset
          </AnimatedButton>
          
          <div className="flex space-x-2">
            <AnimatedButton
              onClick={() => handleRotate('left')}
              variant="secondary"
              className="text-sm px-3 py-2 bg-black/20 hover:bg-black/30 transition-colors"
              disabled={points.length !== 4}
              title="Rotate Left"
            >
              <RotateCcw className="w-4 h-4" />
            </AnimatedButton>
            <AnimatedButton
              onClick={() => handleRotate('right')}
              variant="secondary"
              className="text-sm px-3 py-2 bg-black/20 hover:bg-black/30 transition-colors"
              disabled={points.length !== 4}
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4" />
            </AnimatedButton>
            <AnimatedButton
              onClick={() => handleFlip('x')}
              variant="secondary"
              className="text-sm px-3 py-2 bg-black/20 hover:bg-black/30 transition-colors"
              disabled={points.length !== 4}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </AnimatedButton>
            <AnimatedButton
              onClick={() => handleFlip('y')}
              variant="secondary"
              className="text-sm px-3 py-2 bg-black/20 hover:bg-black/30 transition-colors"
              disabled={points.length !== 4}
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" />
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setShowGrid(!showGrid)}
              variant="secondary"
              className="text-sm px-3 py-2 bg-black/20 hover:bg-black/30 transition-colors"
              disabled={points.length !== 4}
              title="Toggle Grid"
            >
              <Grid className="w-4 h-4" />
            </AnimatedButton>
          </div>

          <AnimatedButton
            onClick={handleExtract}
            disabled={!previewTexture || points.length !== 4}
            variant="primary"
            className="text-sm px-4 py-2 bg-blue-500/80 hover:bg-blue-500/90 disabled:bg-gray-500/50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Extract
          </AnimatedButton>
        </div>

        {points.length < 4 && (
          <div className="absolute top-4 left-4 right-4 flex justify-center">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-white/90 text-sm">
              Click to place points ({points.length}/4)
            </div>
          </div>
        )}

        {points.length === 4 && (
          <div className="absolute top-16 left-4 flex flex-col space-y-2">
            {showLegend && (
              <div 
                className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 text-white/90 text-xs 
                  animate-fade-slide-in opacity-0 [animation-fill-mode:forwards]"
                style={{
                  animationDelay: '50ms'
                }}
              >
                <div className="mb-2 font-medium">Legend</div>
                <div className="flex items-center mb-1 transition-transform hover:translate-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Control Points</span>
                </div>
                <div className="flex items-center mb-1 transition-transform hover:translate-x-1">
                  <div className="w-4 h-0.5 bg-[#FF6B6B] mr-2"></div>
                  <span>Left to Right Flow</span>
                </div>
                <div className="flex items-center mb-1 transition-transform hover:translate-x-1">
                  <div className="w-4 h-0.5 bg-[#4ECDC4] mr-2"></div>
                  <span>Top to Bottom Flow</span>
                </div>
                <div className="flex items-center transition-transform hover:translate-x-1">
                  <div className="w-4 h-0.5 bg-white/30 mr-2"></div>
                  <span>Grid Lines</span>
                </div>
              </div>
            )}

            {showShortcuts && (
              <div 
                className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 text-white/90 text-xs
                  animate-fade-slide-in opacity-0 [animation-fill-mode:forwards]"
                style={{
                  animationDelay: '100ms'
                }}
              >
                <div className="mb-2 font-medium">Keyboard Shortcuts</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    { key: 'G', action: 'Toggle Grid' },
                    { key: 'R', action: 'Rotate Right' },
                    { key: '⇧+R', action: 'Rotate Left' },
                    { key: 'H', action: 'Flip Horizontal' },
                    { key: 'V', action: 'Flip Vertical' },
                    { key: ['[', ']'], action: 'Grid Density' },
                    { key: '?', action: 'Toggle Help' }
                  ].map(({ key, action }, index) => (
                    <div 
                      key={Array.isArray(key) ? key.join('') : key}
                      className="flex items-center transition-transform hover:translate-x-1"
                      style={{
                        animationDelay: `${150 + index * 50}ms`
                      }}
                    >
                      {Array.isArray(key) ? (
                        <>
                          <kbd className="px-1.5 py-0.5 bg-black/20 rounded mr-1">{key[0]}</kbd>
                          <kbd className="px-1.5 py-0.5 bg-black/20 rounded mr-2">{key[1]}</kbd>
                        </>
                      ) : (
                        <kbd className="px-1.5 py-0.5 bg-black/20 rounded mr-2">{key}</kbd>
                      )}
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="absolute top-4 right-4 flex space-x-2">
          <div 
            className="bg-black/30 backdrop-blur-sm rounded-lg p-1 text-white/90 cursor-pointer 
              hover:bg-black/40 transition-all hover:scale-110 active:scale-95"
            onClick={() => setShowLegend(!showLegend)}
            title="Toggle Legend"
          >
            <Info className="w-5 h-5" />
          </div>
          <div 
            className="bg-black/30 backdrop-blur-sm rounded-lg p-1 text-white/90 cursor-pointer 
              hover:bg-black/40 transition-all hover:scale-110 active:scale-95"
            onClick={() => setShowShortcuts(!showShortcuts)}
            title="Toggle Keyboard Shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </div>
          <div 
            className="bg-black/30 backdrop-blur-sm rounded-lg p-1 text-white/90 cursor-pointer 
              hover:bg-black/40 transition-all hover:scale-110 active:scale-95"
            onClick={() => setShowHelp(!showHelp)}
            title="Toggle Basic Controls"
          >
            {showHelp ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>
          {showHelp && (
            <>
              <div 
                className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1 text-white/90 text-xs
                  animate-fade-slide-in opacity-0 [animation-fill-mode:forwards]"
                style={{
                  animationDelay: '50ms'
                }}
              >
                Right-click + drag to pan
              </div>
              <div 
                className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1 text-white/90 text-xs
                  animate-fade-slide-in opacity-0 [animation-fill-mode:forwards]"
                style={{
                  animationDelay: '100ms'
                }}
              >
                Mouse wheel to zoom
              </div>
            </>
          )}
        </div>

        {showGrid && points.length === 4 && (
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1 text-white/90 text-xs flex items-center">
              <span className="mr-2">Grid Density:</span>
              <input
                type="range"
                min="4"
                max="20"
                value={gridDensity}
                onChange={(e) => setGridDensity(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="ml-2">{gridDensity}</span>
            </div>
          </div>
        )}
      </div>

      <GlassPanel 
        className="w-80 border-l border-white/5 flex flex-col glass-effect"
        glow
        glowColor="rgba(0, 0, 0, 0.5)"
      >
        <div className="border-b border-white/5 p-4">
          <h2 className="text-lg font-semibold gradient-text">
            Live Preview
          </h2>
        </div>
        <div className="flex-1 p-4">
          <div 
            className="w-full aspect-square glass-effect rounded-xl overflow-hidden relative flex items-center justify-center"
            style={{
              minHeight: '256px',
              background: 'rgba(0, 0, 0, 0.2)'
            }}
          >
            {previewTexture ? (
              <img
                src={previewTexture}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : points.length === 4 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-center p-4">
                <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                Generating preview...
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-center p-4">
                Select 4 points to see preview
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default Canvas;
