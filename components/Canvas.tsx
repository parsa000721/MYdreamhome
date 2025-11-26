
import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ArchElement, ElementType, Point, ToolType, Layer } from '../types';
import { GRID_SIZE, SNAP_THRESHOLD } from '../constants';

interface CanvasProps {
  elements: ArchElement[];
  layers: Layer[];
  tool: ToolType;
  zoom: number;
  viewPos: Point;
  activeLayerId: string;
  onElementAdd: (el: ArchElement) => void;
  onElementSelect: (id: string | null) => void;
  onElementUpdate: (id: string, updates: Partial<ArchElement>) => void;
  onElementDelete: (id: string) => void;
  onMouseMove: (pt: Point) => void;
  selectedId: string | null;
  onViewChange?: (view: { x: number; y: number; zoom: number }) => void;
  onDrop?: (item: any, pt: Point) => void;
  onDragOver?: (e: React.DragEvent) => void;
}

export interface CanvasRef {
  getSvgData: () => string;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(({
  elements,
  layers,
  tool,
  zoom,
  viewPos,
  activeLayerId,
  onElementAdd,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onMouseMove,
  selectedId,
  onViewChange,
  onDrop,
  onDragOver
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Interaction State
  const [dragState, setDragState] = useState<{
    mode: 'CREATE' | 'MOVE' | 'NONE' | 'PAN';
    start: Point; // Mouse start position
    originalElPos?: Point; // Original element position for move
    originalViewPos?: Point;
    movingId?: string;
  }>({ mode: 'NONE', start: {x:0, y:0} });

  const [currentShape, setCurrentShape] = useState<Partial<ArchElement> | null>(null);
  
  // Tooltip State
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    getSvgData: () => {
      if (!svgRef.current) return '';
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    }
  }));

  const getSvgPoint = (e: React.MouseEvent | React.DragEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const snap = (val: number): number => {
    const snapped = Math.round(val / GRID_SIZE) * GRID_SIZE;
    return Math.abs(val - snapped) < SNAP_THRESHOLD ? snapped : val;
  };

  // Drag and Drop handlers for Library items
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (onDragOver) onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const pt = getSvgPoint(e);
      const snappedPt = { x: snap(pt.x), y: snap(pt.y) };
      
      const itemData = e.dataTransfer.getData('application/json');
      if (itemData && onDrop) {
          try {
              const item = JSON.parse(itemData);
              onDrop(item, snappedPt);
          } catch (err) {
              console.error("Failed to parse dropped item", err);
          }
      }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button or Space bar pressed
    if (e.button === 1) {
        e.preventDefault();
        setDragState({ 
            mode: 'PAN', 
            start: { x: e.clientX, y: e.clientY },
            originalViewPos: { ...viewPos }
        });
        return;
    }

    const pt = getSvgPoint(e);
    const snappedPt = { x: snap(pt.x), y: snap(pt.y) };

    if (tool === ToolType.SELECT) {
       if (e.target === svgRef.current) {
          onElementSelect(null);
       }
       return;
    }

    if (tool !== ToolType.ERASER && tool !== ToolType.MEASURE) {
      setDragState({ mode: 'CREATE', start: snappedPt });
      
      let type = ElementType.WALL;
      if (tool === ToolType.DOOR) type = ElementType.DOOR;
      else if (tool === ToolType.WINDOW) type = ElementType.WINDOW;
      else if (tool === ToolType.RECTANGLE) type = ElementType.RECTANGLE;
      else if (tool === ToolType.CIRCLE) type = ElementType.CIRCLE;
      else if (tool === ToolType.LINE) type = ElementType.LINE;
      else if (tool === ToolType.TEXT) type = ElementType.TEXT;

      setCurrentShape({
        type,
        layerId: activeLayerId,
        x: snappedPt.x,
        y: snappedPt.y,
        width: 0,
        height: (tool === ToolType.WALL || tool === ToolType.LINE) ? 10 : 0, 
        rotation: 0,
        properties: { color: '#e5e5e5' }
      });
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, el: ArchElement) => {
      e.stopPropagation();
      const pt = getSvgPoint(e);
      
      if (tool === ToolType.ERASER) {
          onElementDelete(el.id);
          return;
      }

      if (tool === ToolType.SELECT) {
          onElementSelect(el.id);
          setDragState({
              mode: 'MOVE',
              start: pt, 
              originalElPos: { x: el.x, y: el.y },
              movingId: el.id
          });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Tooltip position update
    if (tooltip) {
        setTooltip(prev => prev ? ({ ...prev, x: e.clientX, y: e.clientY }) : null);
    }

    if (dragState.mode === 'PAN' && dragState.originalViewPos && onViewChange) {
        const dx = e.clientX - dragState.start.x;
        const dy = e.clientY - dragState.start.y;
        onViewChange({
            x: dragState.originalViewPos.x + dx,
            y: dragState.originalViewPos.y + dy,
            zoom
        });
        return;
    }

    const pt = getSvgPoint(e);
    const snappedPt = { x: snap(pt.x), y: snap(pt.y) };
    
    onMouseMove(snappedPt);

    if (dragState.mode === 'NONE') return;

    if (dragState.mode === 'MOVE' && dragState.movingId && dragState.originalElPos) {
        const dx = pt.x - dragState.start.x;
        const dy = pt.y - dragState.start.y;
        
        const newX = snap(dragState.originalElPos.x + dx);
        const newY = snap(dragState.originalElPos.y + dy);

        onElementUpdate(dragState.movingId, { x: newX, y: newY });
        return;
    }

    if (dragState.mode === 'CREATE' && currentShape) {
        const start = dragState.start;
        const dx = snappedPt.x - start.x;
        const dy = snappedPt.y - start.y;

        if (currentShape.type === ElementType.WALL || currentShape.type === ElementType.LINE) {
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            setCurrentShape({
                ...currentShape,
                width: length,
                rotation: angle
            });
        } else if (currentShape.type === ElementType.RECTANGLE) {
            setCurrentShape({
                ...currentShape,
                width: Math.abs(dx),
                height: Math.abs(dy),
                x: dx < 0 ? snappedPt.x : start.x,
                y: dy < 0 ? snappedPt.y : start.y
            });
        } else if (currentShape.type === ElementType.CIRCLE) {
            const radius = Math.sqrt(dx*dx + dy*dy);
            setCurrentShape({
                ...currentShape,
                width: radius, 
                height: radius
            });
        } else {
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            setCurrentShape({
                ...currentShape,
                width: length,
                rotation: angle
            });
        }
    }
  };

  const handleMouseUp = () => {
    if (dragState.mode === 'CREATE' && currentShape) {
       if ((currentShape.width && currentShape.width > 5) || (currentShape.height && currentShape.height > 5) || currentShape.type === ElementType.TEXT) {
           const newElement: ArchElement = {
            id: crypto.randomUUID(),
            type: currentShape.type as ElementType,
            layerId: activeLayerId,
            x: currentShape.x!,
            y: currentShape.y!,
            width: currentShape.width || 40,
            height: currentShape.height || 10,
            rotation: currentShape.rotation || 0,
            properties: currentShape.properties || {},
          };
          if (currentShape.type === ElementType.TEXT) {
              newElement.properties.text = "New Text";
              newElement.properties.fontSize = 12;
              newElement.properties.color = "#ffffff";
          }
          onElementAdd(newElement);
       }
    }
    
    setDragState({ mode: 'NONE', start: {x:0,y:0} });
    setCurrentShape(null);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
      if (onViewChange) {
          if (e.ctrlKey) {
              e.preventDefault();
              // Zoom
              const scale = e.deltaY > 0 ? 0.9 : 1.1;
              const newZoom = Math.min(Math.max(zoom * scale, 0.2), 5);
              onViewChange({ x: viewPos.x, y: viewPos.y, zoom: newZoom });
          } else {
              // Pan
              onViewChange({ x: viewPos.x - e.deltaX, y: viewPos.y - e.deltaY, zoom });
          }
      }
  };

  const renderElement = (el: ArchElement | Partial<ArchElement>, isPreview = false) => {
    const isSelected = !isPreview && (el as ArchElement).id === selectedId;
    
    if (!isPreview && el.layerId) {
        const layer = layers.find(l => l.id === el.layerId);
        if (layer && !layer.visible) return null;
    }

    const commonProps = {
        className: `transition-colors ${isSelected ? 'stroke-accent' : ''} ${tool === ToolType.ERASER ? 'cursor-not-allowed hover:opacity-50' : 'cursor-pointer'}`,
        onMouseDown: (e: React.MouseEvent) => !isPreview && handleElementMouseDown(e, el as ArchElement),
        onMouseEnter: (e: React.MouseEvent) => !isPreview && setTooltip({ text: el.properties?.label || el.properties?.text || el.type || '', x: e.clientX, y: e.clientY }),
        onMouseLeave: () => setTooltip(null),
        style: { pointerEvents: isPreview ? 'none' : 'all' } as React.CSSProperties
    };

    const transform = `translate(${el.x}, ${el.y}) rotate(${el.rotation})`;
    
    let content = null;

    switch (el.type) {
        case ElementType.WALL:
            content = (
                <rect 
                    x={0} y={-(el.height! / 2)} 
                    width={el.width} height={el.height} 
                    fill={el.properties?.color || '#a3a3a3'}
                    stroke={isSelected ? '#3b82f6' : '#525252'}
                    strokeWidth={isSelected ? 2 : 1}
                />
            );
            break;
        case ElementType.LINE:
            content = (
                 <line x1={0} y1={0} x2={el.width} y2={0} stroke={el.properties?.color || '#ffffff'} strokeWidth={2} />
            );
            break;
        case ElementType.RECTANGLE:
            content = (
                <rect 
                    x={0} y={0} 
                    width={el.width} height={el.height} 
                    fill={el.properties?.fill || 'none'}
                    stroke={el.properties?.color || '#ffffff'}
                    strokeWidth={2}
                />
            );
            break;
        case ElementType.CIRCLE:
             content = (
                <circle 
                    cx={0} cy={0} 
                    r={el.width} 
                    fill={el.properties?.fill || 'none'}
                    stroke={el.properties?.color || '#ffffff'}
                    strokeWidth={2}
                />
            );
            break;
        case ElementType.DOOR:
             content = (
                <g>
                    <rect x={0} y={-5} width={el.width} height={10} fill="none" stroke="#fbbf24" strokeWidth={2} />
                    <path d={`M 0,5 A ${el.width} ${el.width} 0 0 1 ${el.width} -${el.width! - 5}`} fill="none" stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 2" />
                    <rect x={0} y={5} width={el.width} height={4} transform={`rotate(-45)`} fill="#fbbf24" opacity={0.5} />
                </g>
            );
            break;
        case ElementType.WINDOW:
             content = (
                <g>
                    <rect x={0} y={-4} width={el.width} height={8} fill="#93c5fd" stroke="#3b82f6" strokeWidth={1} opacity={0.8} />
                    <line x1={0} y1={0} x2={el.width} y2={0} stroke="#1e3a8a" strokeWidth={1} />
                </g>
            );
            break;
        case ElementType.TEXT:
            content = (
                <text 
                    x={0} y={0} 
                    fill={el.properties?.color || '#ffffff'} 
                    fontSize={el.properties?.fontSize || 12}
                    fontFamily="sans-serif"
                    dominantBaseline="middle"
                    stroke={el.properties?.strokeEnabled ? (el.properties.strokeColor || '#000000') : 'none'}
                    strokeWidth={el.properties?.strokeEnabled ? (el.properties.strokeWidth || 1) : 0}
                    style={{
                        textShadow: el.properties?.shadowEnabled 
                            ? `${el.properties.shadowOffsetX}px ${el.properties.shadowOffsetY}px ${el.properties.shadowBlur}px ${el.properties.shadowColor}` 
                            : 'none'
                    }}
                >
                    {el.properties?.text || 'Text'}
                </text>
            );
            break;
        case ElementType.OBJECT:
             // Generic Object Renderer
             if (el.properties?.shape === 'circle') {
                 content = (
                    <g>
                        <circle cx={0} cy={0} r={el.width! / 2} fill={el.properties?.color || '#cccccc'} stroke={el.properties?.borderColor || '#ffffff'} strokeWidth={1} />
                        {el.properties?.text && (
                            <text x={0} y={0} textAnchor="middle" dy=".3em" fontSize={10} fill="#fff" style={{ pointerEvents: 'none' }}>
                                {el.properties.text}
                            </text>
                        )}
                    </g>
                 );
             } else {
                 content = (
                    <g>
                        <rect x={-el.width!/2} y={-el.height!/2} width={el.width} height={el.height} fill={el.properties?.color || '#cccccc'} stroke={el.properties?.borderColor || '#ffffff'} strokeWidth={1} />
                        {el.properties?.text && (
                            <text x={0} y={0} textAnchor="middle" dy=".3em" fontSize={10} fill="#fff" style={{ pointerEvents: 'none' }}>
                                {el.properties.text}
                            </text>
                        )}
                        {/* Orientation Marker */}
                        <line x1={0} y1={0} x2={el.width!/2} y2={0} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                    </g>
                 );
             }
             break;
        default:
            return null;
    }

    return (
        <g transform={transform} {...commonProps} key={isPreview ? 'preview' : (el as ArchElement).id}>
            {content}
            {isSelected && (
                <circle cx={0} cy={0} r={4} fill="#3b82f6" />
            )}
        </g>
    );
  };

  return (
    <div className="flex-1 bg-canvas relative overflow-hidden cursor-crosshair">
        <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: `linear-gradient(#404040 1px, transparent 1px), linear-gradient(90deg, #404040 1px, transparent 1px)`,
                backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
                backgroundPosition: `${viewPos.x}px ${viewPos.y}px`
            }}
        />

        <svg
            ref={svgRef}
            className="w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <g transform={`translate(${viewPos.x}, ${viewPos.y}) scale(${zoom})`}>
                {elements.map(el => renderElement(el))}
                {currentShape && renderElement(currentShape, true)}
            </g>
        </svg>

        {tooltip && (
            <div 
                className="fixed bg-black/80 text-white text-xs px-2 py-1 rounded z-50 pointer-events-none shadow-lg border border-white/20 transform -translate-x-1/2 -translate-y-full mt-[-10px]"
                style={{ top: tooltip.y, left: tooltip.x }}
            >
                {tooltip.text}
            </div>
        )}
    </div>
  );
});

export default Canvas;
