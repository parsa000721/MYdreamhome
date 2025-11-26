import React from 'react';
import { 
  MousePointer2, Square, DoorOpen, LayoutTemplate, Type, Eraser, 
  Minus, Circle, RectangleHorizontal, Ruler,
  Undo, Redo, ZoomIn, ZoomOut
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, 
  onToolChange, 
  onUndo, 
  onRedo, 
  onZoomIn, 
  onZoomOut,
  canUndo,
  canRedo
}) => {
  
  const ToolButton = ({ tool, icon: Icon, label }: { tool: ToolType, icon: any, label: string }) => (
    <button
        onClick={() => onToolChange(tool)}
        className={`p-2.5 rounded-lg transition-all duration-200 group relative flex justify-center ${
            activeTool === tool 
            ? 'bg-accent text-white shadow-lg shadow-accent/20' 
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
    >
        <Icon size={18} strokeWidth={2} />
        <span className="absolute left-12 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
            {label}
        </span>
    </button>
  );

  return (
    <div className="w-14 bg-panel border-r border-border flex flex-col items-center py-2 z-20 shadow-xl custom-scrollbar overflow-y-auto overflow-x-hidden">
      
      {/* Selection */}
      <div className="flex flex-col space-y-1 w-full px-2 mb-2">
        <ToolButton tool={ToolType.SELECT} icon={MousePointer2} label="Select" />
      </div>
      
      <div className="w-8 h-px bg-border my-1 opacity-50"></div>

      {/* 2D Shapes */}
      <div className="flex flex-col space-y-1 w-full px-2 mb-2">
         <ToolButton tool={ToolType.LINE} icon={Minus} label="Line" />
         <ToolButton tool={ToolType.RECTANGLE} icon={RectangleHorizontal} label="Rectangle" />
         <ToolButton tool={ToolType.CIRCLE} icon={Circle} label="Circle" />
      </div>

      <div className="w-8 h-px bg-border my-1 opacity-50"></div>

      {/* Architectural */}
      <div className="flex flex-col space-y-1 w-full px-2 mb-2">
        <ToolButton tool={ToolType.WALL} icon={Square} label="Wall" />
        <ToolButton tool={ToolType.DOOR} icon={DoorOpen} label="Door" />
        <ToolButton tool={ToolType.WINDOW} icon={LayoutTemplate} label="Window" />
      </div>

      <div className="w-8 h-px bg-border my-1 opacity-50"></div>

      {/* Annotations & Utils */}
      <div className="flex flex-col space-y-1 w-full px-2 mb-2">
        <ToolButton tool={ToolType.TEXT} icon={Type} label="Text" />
        <ToolButton tool={ToolType.MEASURE} icon={Ruler} label="Measure" />
        <ToolButton tool={ToolType.ERASER} icon={Eraser} label="Eraser" />
      </div>

      <div className="w-8 h-px bg-border my-1 opacity-50"></div>

      {/* History */}
      <div className="flex flex-col space-y-1 w-full px-2 mb-2">
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`p-2 rounded-lg flex justify-center ${!canUndo ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          <Undo size={16} />
        </button>
        <button 
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg flex justify-center ${!canRedo ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          <Redo size={16} />
        </button>
      </div>

      <div className="w-8 h-px bg-border my-1 opacity-50"></div>

      {/* View */}
      <div className="flex flex-col space-y-1 w-full px-2">
        <button onClick={onZoomIn} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg flex justify-center">
          <ZoomIn size={16} />
        </button>
        <button onClick={onZoomOut} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg flex justify-center">
          <ZoomOut size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;