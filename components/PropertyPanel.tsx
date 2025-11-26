
import React, { useState } from 'react';
import { ArchElement, ElementType } from '../types';
import { ChevronDown, Check, Box, Layers, Settings2, Sparkles, Type, Grid, Maximize, Cuboid, ScanFace } from 'lucide-react';

interface PropertyPanelProps {
  element: ArchElement | null;
  onUpdate: (id: string, updates: Partial<ArchElement>) => void;
}

const DOOR_PRESETS: Record<string, any> = {
  'Modern Single': { width: 90, height: 10, properties: { verticalHeight: 210, handleStyle: 'Lever', hingeType: 'Butt' } },
  'Classic Double': { width: 180, height: 10, properties: { verticalHeight: 210, handleStyle: 'Knob', hingeType: 'Butt' } },
  'Sliding': { width: 200, height: 15, properties: { verticalHeight: 210, handleStyle: 'Recessed', hingeType: 'Sliding' } },
};
const WINDOW_PRESETS: Record<string, any> = {
  'Casement': { width: 60, height: 15, properties: { verticalHeight: 120, sillHeight: 90 } },
  'Awning': { width: 100, height: 15, properties: { verticalHeight: 60, sillHeight: 150 } },
  'Picture Window': { width: 200, height: 15, properties: { verticalHeight: 150, sillHeight: 60 } },
};

const WALL_STYLES = [
  { id: 'Standard Drywall', label: 'Standard Drywall', thickness: 12, color: '#e5e5e5' },
  { id: 'Insulated Brick', label: 'Insulated Brick', thickness: 30, color: '#7f1d1d' },
  { id: 'Load-Bearing Concrete', label: 'Load-Bearing Concrete', thickness: 30, color: '#525252' },
  { id: 'Glass Curtain', label: 'Glass Curtain', thickness: 5, color: '#bfdbfe' },
  { id: 'Stud Timber', label: 'Timber Stud Wall (10cm)', thickness: 10, color: '#fcd34d' },
  { id: 'Brick 4"', label: 'Brick Partition (10cm)', thickness: 10, color: '#991b1b' },
  { id: 'Brick 9"', label: 'Standard Brick (23cm)', thickness: 23, color: '#991b1b' },
  { id: 'Concrete 6"', label: 'Concrete Wall (15cm)', thickness: 15, color: '#a3a3a3' },
  { id: 'CMU 8"', label: 'Concrete Block (20cm)', thickness: 20, color: '#d1d5db' },
  { id: 'Stone', label: 'Stone Cladding (40cm)', thickness: 40, color: '#44403c' },
  { id: 'Retaining', label: 'Retaining Wall (45cm)', thickness: 45, color: '#404040' },
  { id: 'Glass Int', label: 'Glass Partition (Frameless)', thickness: 2, color: '#e0f2fe' }
];

const INSULATION_MATERIALS = ['Fiberglass', 'Mineral Wool', 'Foam Board', 'Cellulose'];
const HANDLE_STYLES = ['Lever', 'Knob', 'Pull Bar', 'Recessed', 'None'];

const PropertyPanel: React.FC<PropertyPanelProps> = ({ element, onUpdate }) => {
  const [showWallStyleMenu, setShowWallStyleMenu] = useState(false);

  if (!element) {
    return (
      <div className="p-8 text-gray-500 text-sm flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 mb-4 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-600 rounded-full" />
        </div>
        <p>Select an element to edit properties</p>
      </div>
    );
  }

  const handleChange = (field: keyof ArchElement, value: any) => {
    onUpdate(element.id, { [field]: value });
  };

  const handlePropChange = (key: string, value: any) => {
    onUpdate(element.id, {
      properties: { ...element.properties, [key]: value }
    });
  };

  const applyPreset = (presets: Record<string, any>, key: string) => {
      const preset = presets[key];
      if (!preset) return;
      const updates: Partial<ArchElement> = {
          width: preset.width || element.width,
          height: preset.height || element.height,
          properties: { ...element.properties, ...preset.properties }
      };
      onUpdate(element.id, updates);
  };

  const InputGroup = ({ label, children, icon: Icon }: { label: string, children: React.ReactNode, icon?: any }) => (
      <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
             {Icon && <Icon size={12} />}
             <span>{label}</span>
          </div>
          {children}
      </div>
  );

  const NumberInput = ({ value, onChange, unit, label, min, max, step }: { value: any, onChange: (val: number) => void, unit?: string, label?: string, min?: number, max?: number, step?: number }) => (
      <div>
        {label && <label className="text-[10px] text-gray-500 mb-1 block">{label}</label>}
        <div className="relative group">
            <input 
                type="number" 
                value={Math.round(Number(value) || 0)} 
                onChange={(e) => onChange(Number(e.target.value))}
                min={min} max={max} step={step}
                className="w-full bg-[#121212] border border-border rounded px-3 py-2 text-sm text-gray-200 focus:border-accent focus:outline-none focus:bg-black transition-colors"
            />
            {unit && <span className="absolute right-3 top-2 text-xs text-gray-600 pointer-events-none">{unit}</span>}
        </div>
      </div>
  );

  const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
      <div className="flex items-center space-x-3 bg-[#121212] p-2 rounded border border-border">
        <div className="relative w-8 h-8 rounded border border-gray-600 overflow-hidden shrink-0">
             <input type="color" value={value || '#ffffff'} onChange={(e) => onChange(e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"/>
        </div>
        <div className="flex flex-col">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-[10px] text-gray-600 font-mono uppercase">{value}</span>
        </div>
    </div>
  );

  const SelectInput = ({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) => (
    <div>
        <label className="text-[10px] text-gray-500 mb-1 block">{label}</label>
        <div className="relative">
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-[#121212] border border-border rounded px-3 py-2 text-sm text-gray-200 focus:border-accent focus:outline-none appearance-none cursor-pointer">
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-6 border-b border-border bg-[#202020]">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-bold text-lg tracking-tight">Properties</h2>
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-gray-300`}>
                {element.type}
            </div>
        </div>
        <div className="text-[10px] text-gray-600 font-mono truncate">ID: {element.id}</div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        
        {/* Transform - Common */}
        <section className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase">
                <Box size={12} />
                <span>Geometry</span>
            </div>
            <div className="grid grid-cols-3 gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                <NumberInput label="X" value={element.x} onChange={(v) => handleChange('x', v)} />
                <NumberInput label="Y" value={element.y} onChange={(v) => handleChange('y', v)} />
                <NumberInput label="Angle" value={element.rotation} onChange={(v) => handleChange('rotation', v)} unit="°" />
            </div>
        </section>

        {/* Wall Specifics */}
        {element.type === ElementType.WALL && (
            <section className="space-y-4">
                 <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 mb-1 block">Wall Style</label>
                        <button onClick={() => setShowWallStyleMenu(!showWallStyleMenu)} className="w-full bg-[#121212] border border-border rounded px-3 py-2 flex items-center justify-between text-sm hover:border-gray-500 transition-colors">
                            <span className="truncate">{element.properties.wallType || 'Select Style'}</span>
                            <ChevronDown size={14} className="text-gray-500" />
                        </button>
                        {showWallStyleMenu && (
                             <div className="fixed inset-0 z-10" onClick={() => setShowWallStyleMenu(false)}></div>
                        )}
                        {showWallStyleMenu && (
                             <div className="absolute bg-[#2a2a2a] border border-border rounded shadow-xl z-20 w-64 max-h-60 overflow-y-auto custom-scrollbar">
                                {WALL_STYLES.map(style => (
                                    <button key={style.id} onClick={() => {
                                        onUpdate(element.id, { height: style.thickness, properties: { ...element.properties, wallType: style.id, color: style.color } });
                                        setShowWallStyleMenu(false);
                                    }} className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-white/10 flex items-center space-x-3 border-b border-white/5 last:border-0">
                                        <div className="w-3 h-3 border rounded-sm shrink-0" style={{ backgroundColor: style.color }}></div>
                                        <span>{style.label}</span>
                                    </button>
                                ))}
                             </div>
                        )}
                    </div>
                    <div className="h-px bg-white/5"></div>
                    <div className="grid grid-cols-2 gap-3">
                         <NumberInput label="Length" value={element.width} onChange={(v) => handleChange('width', v)} unit="px" />
                         <NumberInput label="Thickness" value={element.height} onChange={(v) => handleChange('height', v)} unit="px" />
                         <NumberInput label="Height (3D)" value={element.properties.verticalHeight ?? 300} onChange={(v) => handlePropChange('verticalHeight', v)} unit="cm" />
                    </div>
                    <div className="h-px bg-white/5"></div>
                    <InputGroup label="Insulation" icon={Settings2}>
                        <div className="space-y-3">
                            <SelectInput label="Material" value={element.properties.insulationMaterial || 'Fiberglass'} options={INSULATION_MATERIALS} onChange={(v) => handlePropChange('insulationMaterial', v)} />
                            <NumberInput label="Thickness" value={element.properties.insulationThickness || 0} onChange={(v) => handlePropChange('insulationThickness', v)} unit="cm" />
                        </div>
                    </InputGroup>
                    <div className="h-px bg-white/5"></div>
                    <ColorInput label="Paint" value={element.properties.color} onChange={(v) => handlePropChange('color', v)} />
                 </div>
            </section>
        )}

        {/* Door Specifics */}
        {element.type === ElementType.DOOR && (
            <section className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
                 <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase mb-2">
                    <span>Door Styles</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {Object.keys(DOOR_PRESETS).map(preset => (
                        <button key={preset} onClick={() => applyPreset(DOOR_PRESETS, preset)} className="text-xs bg-[#121212] hover:bg-white/10 text-gray-300 py-1.5 px-2 rounded border border-border transition-colors">
                            {preset}
                        </button>
                    ))}
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                     <NumberInput label="Width" value={element.width} onChange={(v) => handleChange('width', v)} unit="px" />
                     <NumberInput label="Height (3D)" value={element.properties.verticalHeight} onChange={(v) => handlePropChange('verticalHeight', v)} unit="cm" />
                     <NumberInput label="Depth" value={element.height} onChange={(v) => handleChange('height', v)} unit="cm" />
                 </div>
                 <SelectInput label="Handle" value={element.properties.handleStyle || 'Lever'} options={HANDLE_STYLES} onChange={(v) => handlePropChange('handleStyle', v)} />
            </section>
        )}

        {/* Window Specifics */}
        {element.type === ElementType.WINDOW && (
            <section className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
                 <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase mb-2">
                    <span>Window Styles</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {Object.keys(WINDOW_PRESETS).map(preset => (
                        <button key={preset} onClick={() => applyPreset(WINDOW_PRESETS, preset)} className="text-xs bg-[#121212] hover:bg-white/10 text-gray-300 py-1.5 px-2 rounded border border-border transition-colors">
                            {preset}
                        </button>
                    ))}
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                     <NumberInput label="Width" value={element.width} onChange={(v) => handleChange('width', v)} unit="px" />
                     <NumberInput label="Height (3D)" value={element.properties.verticalHeight} onChange={(v) => handlePropChange('verticalHeight', v)} unit="cm" />
                     <NumberInput label="Sill Height" value={element.properties.sillHeight} onChange={(v) => handlePropChange('sillHeight', v)} unit="cm" />
                 </div>
            </section>
        )}

        {/* OBJECT Specifics (Furniture, Columns, etc) */}
        {element.type === ElementType.OBJECT && (
            <section className="space-y-4">
                 <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
                    <InputGroup label="3D Object Properties" icon={Cuboid}>
                         <div className="space-y-4">
                            <input 
                                type="text" 
                                value={element.properties.text || ''} 
                                onChange={(e) => handlePropChange('text', e.target.value)}
                                className="w-full bg-[#121212] border border-border rounded px-3 py-2 text-sm text-gray-200"
                                placeholder="Label"
                            />
                            
                            <div className="grid grid-cols-2 gap-3">
                                <NumberInput label="Length" value={element.width} onChange={(v) => handleChange('width', v)} unit="px" />
                                <NumberInput label="Width (Depth)" value={element.height} onChange={(v) => handleChange('height', v)} unit="px" />
                                <NumberInput label="Height (3D)" value={element.properties.verticalHeight || 0} onChange={(v) => handlePropChange('verticalHeight', v)} unit="cm" />
                                <NumberInput label="Elevation" value={element.properties.elevation || 0} onChange={(v) => handlePropChange('elevation', v)} unit="cm" />
                            </div>
                         </div>
                    </InputGroup>
                    <div className="h-px bg-white/5"></div>
                    <ColorInput label="Color" value={element.properties.color} onChange={(v) => handlePropChange('color', v)} />
                 </div>

                 {/* Advanced 3D Effects */}
                 <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
                     <InputGroup label="Advanced 3D Effects" icon={ScanFace}>
                         <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                 <label className="text-xs text-gray-300">Bevel Edges</label>
                                 <input 
                                    type="checkbox" 
                                    checked={element.properties.bevelEnabled || false}
                                    onChange={(e) => handlePropChange('bevelEnabled', e.target.checked)}
                                 />
                             </div>
                             {element.properties.bevelEnabled && (
                                 <NumberInput label="Bevel Radius" value={element.properties.bevelRadius || 0} onChange={(v) => handlePropChange('bevelRadius', v)} min={0} max={10} step={0.5} unit="px" />
                             )}
                             
                             <div className="h-px bg-white/5 my-2"></div>
                             
                             <label className="text-[10px] text-gray-500 mb-1 block">Texture / UV Mapping</label>
                             <div className="grid grid-cols-2 gap-2">
                                 <NumberInput label="Scale X" value={element.properties.uvScaleX || 1} onChange={(v) => handlePropChange('uvScaleX', v)} step={0.1} />
                                 <NumberInput label="Scale Y" value={element.properties.uvScaleY || 1} onChange={(v) => handlePropChange('uvScaleY', v)} step={0.1} />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between bg-[#121212] px-2 py-1 rounded">
                                     <label className="text-[10px] text-gray-400">Flip X</label>
                                     <input type="checkbox" checked={element.properties.uvFlipX || false} onChange={(e) => handlePropChange('uvFlipX', e.target.checked)} />
                                </div>
                                <div className="flex items-center justify-between bg-[#121212] px-2 py-1 rounded">
                                     <label className="text-[10px] text-gray-400">Flip Y</label>
                                     <input type="checkbox" checked={element.properties.uvFlipY || false} onChange={(e) => handlePropChange('uvFlipY', e.target.checked)} />
                                </div>
                             </div>
                         </div>
                     </InputGroup>
                 </div>
            </section>
        )}
        
        {/* Text Specifics */}
        {element.type === ElementType.TEXT && (
             <section className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-4">
                <textarea value={element.properties.text || ''} onChange={(e) => handlePropChange('text', e.target.value)} className="w-full bg-[#121212] border border-border rounded px-3 py-2 text-sm text-gray-200 min-h-[80px]" />
                <div className="grid grid-cols-2 gap-3">
                     <NumberInput label="Font Size" value={element.properties.fontSize ?? 12} onChange={(v) => handlePropChange('fontSize', v)} unit="pt" />
                     <ColorInput label="Text Color" value={element.properties.color || '#9ca3af'} onChange={(v) => handlePropChange('color', v)} />
                </div>

                <div className="pt-2 border-t border-white/5">
                     <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase mb-3">
                         <Type size={12} />
                         <span>Stroke / Outline</span>
                     </div>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-400">Enable Outline</label>
                            <input type="checkbox" checked={element.properties.strokeEnabled || false} onChange={(e) => handlePropChange('strokeEnabled', e.target.checked)} />
                        </div>
                        {element.properties.strokeEnabled && (
                            <div className="grid grid-cols-2 gap-3">
                                <ColorInput label="Outline Color" value={element.properties.strokeColor || '#000000'} onChange={(v) => handlePropChange('strokeColor', v)} />
                                <NumberInput label="Width" value={element.properties.strokeWidth || 1} onChange={(v) => handlePropChange('strokeWidth', v)} min={0.5} step={0.5} unit="px" />
                            </div>
                        )}
                     </div>
                </div>
                
                <div className="pt-2 border-t border-white/5">
                     <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase mb-3">
                         <Sparkles size={12} />
                         <span>Shadow Effects</span>
                     </div>
                     <div className="space-y-3">
                         <div className="flex items-center justify-between">
                             <label className="text-xs text-gray-400">Drop Shadow</label>
                             <input type="checkbox" checked={element.properties.shadowEnabled || false} onChange={(e) => handlePropChange('shadowEnabled', e.target.checked)} />
                         </div>
                         {element.properties.shadowEnabled && (
                             <>
                                <ColorInput label="Shadow Color" value={element.properties.shadowColor || '#000000'} onChange={(v) => handlePropChange('shadowColor', v)} />
                                <div className="grid grid-cols-3 gap-2">
                                     <NumberInput label="Blur" value={element.properties.shadowBlur || 0} onChange={(v) => handlePropChange('shadowBlur', v)} />
                                     <NumberInput label="X" value={element.properties.shadowOffsetX || 0} onChange={(v) => handlePropChange('shadowOffsetX', v)} />
                                     <NumberInput label="Y" value={element.properties.shadowOffsetY || 0} onChange={(v) => handlePropChange('shadowOffsetY', v)} />
                                </div>
                             </>
                         )}
                     </div>
                </div>
             </section>
        )}

      </div>
    </div>
  );
};

export default PropertyPanel;
