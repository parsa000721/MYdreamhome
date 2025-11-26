import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react';
import { Layer } from '../types';

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onLayerChange: (id: string, updates: Partial<Layer>) => void;
  onLayerAdd: () => void;
  onLayerDelete: (id: string) => void;
  onLayerSelect: (id: string) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ 
  layers, 
  activeLayerId, 
  onLayerChange, 
  onLayerAdd, 
  onLayerDelete,
  onLayerSelect
}) => {
  return (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center justify-between bg-[#202020]">
            <h2 className="text-white font-bold text-sm">Layers</h2>
            <button 
                onClick={onLayerAdd}
                className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white"
                title="New Layer"
            >
                <Plus size={16} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {layers.map((layer) => (
                <div 
                    key={layer.id}
                    className={`flex items-center p-2 rounded text-sm group ${
                        activeLayerId === layer.id ? 'bg-accent/20 border border-accent/30' : 'hover:bg-white/5 border border-transparent'
                    }`}
                    onClick={() => onLayerSelect(layer.id)}
                >
                    <div className="flex space-x-1 mr-2 text-gray-500">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onLayerChange(layer.id, { visible: !layer.visible }); }}
                            className={`p-1 rounded hover:bg-black/40 ${layer.visible ? 'text-gray-300' : 'text-gray-600'}`}
                        >
                            {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onLayerChange(layer.id, { locked: !layer.locked }); }}
                            className={`p-1 rounded hover:bg-black/40 ${layer.locked ? 'text-amber-500' : 'text-gray-600'}`}
                        >
                            {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                    </div>
                    
                    <div className="flex-1 flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.color }}></div>
                        <input 
                            type="text" 
                            value={layer.name}
                            onChange={(e) => onLayerChange(layer.id, { name: e.target.value })}
                            className="bg-transparent border-none focus:outline-none text-gray-200 w-full text-xs font-medium"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {layers.length > 1 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onLayerDelete(layer.id); }}
                            className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

export default LayerPanel;