
import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Grid, Box, 
  BedDouble, Armchair, Utensils, Droplets, 
  Zap, Wrench, Wind, Palette, Trees, Hammer,
  LayoutDashboard, ArrowUpToLine, Columns as ColumnsIcon
} from 'lucide-react';
import { LibraryItem } from '../types';

interface LibraryPanelProps {
  onAddItem: (item: LibraryItem) => void;
}

const LIBRARY_DATA: Record<string, LibraryItem[]> = {
  'Foundation': [
    { id: 'base_block', label: 'Concrete Base', category: 'Foundation', subtype: 'structure', defaultWidth: 100, defaultHeight: 100, defaultProps: { color: '#737373', verticalHeight: 20, text: 'Base' } },
    { id: 'plinth', label: 'Plinth Beam', category: 'Foundation', subtype: 'structure', defaultWidth: 200, defaultHeight: 30, defaultProps: { color: '#a3a3a3', verticalHeight: 30 } },
  ],
  'Columns': [
    { id: 'col_round', label: 'Round Column', category: 'Columns', subtype: 'structure', defaultWidth: 40, defaultHeight: 40, defaultProps: { color: '#e5e5e5', verticalHeight: 300, shape: 'cylinder' } },
    { id: 'col_square', label: 'Square Pillar', category: 'Columns', subtype: 'structure', defaultWidth: 40, defaultHeight: 40, defaultProps: { color: '#e5e5e5', verticalHeight: 300, shape: 'rect' } },
    { id: 'col_fluted', label: 'Decorative Pillar', category: 'Columns', subtype: 'structure', defaultWidth: 50, defaultHeight: 50, defaultProps: { color: '#f5f5f5', verticalHeight: 300, shape: 'cylinder' } },
  ],
  'Roofing': [
    { id: 'roof_flat', label: 'Flat Slab', category: 'Roofing', subtype: 'structure', defaultWidth: 400, defaultHeight: 400, defaultProps: { color: '#525252', verticalHeight: 15, elevation: 300 } },
    { id: 'roof_pyramid', label: 'Pyramid Roof', category: 'Roofing', subtype: 'structure', defaultWidth: 400, defaultHeight: 400, defaultProps: { color: '#b91c1c', verticalHeight: 150, elevation: 300, shape: 'pyramid' } },
  ],
  'Bedroom': [
    { id: 'bed_single', label: 'Single Bed', category: 'Bedroom', subtype: 'furniture', defaultWidth: 90, defaultHeight: 190, defaultProps: { color: '#fca5a5', verticalHeight: 50, text: 'Single Bed' } },
    { id: 'bed_double', label: 'Double Bed', category: 'Bedroom', subtype: 'furniture', defaultWidth: 150, defaultHeight: 200, defaultProps: { color: '#fca5a5', verticalHeight: 50, text: 'Double Bed' } },
    { id: 'wardrobe', label: 'Wardrobe', category: 'Bedroom', subtype: 'furniture', defaultWidth: 120, defaultHeight: 60, defaultProps: { color: '#a16207', verticalHeight: 210, text: 'Wardrobe' } },
    { id: 'dress_table', label: 'Dressing Table', category: 'Bedroom', subtype: 'furniture', defaultWidth: 90, defaultHeight: 45, defaultProps: { color: '#a16207', verticalHeight: 75, text: 'Dressing' } },
    { id: 'side_table', label: 'Side Table', category: 'Bedroom', subtype: 'furniture', defaultWidth: 45, defaultHeight: 45, defaultProps: { color: '#a16207', verticalHeight: 50 } },
    { id: 'tv_unit_bed', label: 'TV Unit', category: 'Bedroom', subtype: 'furniture', defaultWidth: 120, defaultHeight: 40, defaultProps: { color: '#404040', verticalHeight: 60, text: 'TV' } },
  ],
  'Living Room': [
    { id: 'sofa_3', label: '3-Seater Sofa', category: 'Living', subtype: 'furniture', defaultWidth: 220, defaultHeight: 90, defaultProps: { color: '#475569', verticalHeight: 85, text: 'Sofa' } },
    { id: 'sofa_1', label: 'Armchair', category: 'Living', subtype: 'furniture', defaultWidth: 90, defaultHeight: 90, defaultProps: { color: '#475569', verticalHeight: 85 } },
    { id: 'center_table', label: 'Center Table', category: 'Living', subtype: 'furniture', defaultWidth: 100, defaultHeight: 60, defaultProps: { color: '#d4a373', verticalHeight: 45 } },
    { id: 'showcase', label: 'Showcase', category: 'Living', subtype: 'furniture', defaultWidth: 150, defaultHeight: 40, defaultProps: { color: '#d4a373', verticalHeight: 180 } },
    { id: 'carpet', label: 'Carpet', category: 'Living', subtype: 'decor', defaultWidth: 250, defaultHeight: 180, defaultProps: { color: '#94a3b8', verticalHeight: 1, elevation: 0.1 } },
  ],
  'Kitchen': [
    { id: 'kitchen_slab', label: 'Kitchen Slab', category: 'Kitchen', subtype: 'structure', defaultWidth: 300, defaultHeight: 60, defaultProps: { color: '#1e293b', verticalHeight: 90 } },
    { id: 'cabinet_base', label: 'Base Cabinet', category: 'Kitchen', subtype: 'furniture', defaultWidth: 60, defaultHeight: 60, defaultProps: { color: '#d4d4d8', verticalHeight: 90 } },
    { id: 'cabinet_wall', label: 'Wall Cabinet', category: 'Kitchen', subtype: 'furniture', defaultWidth: 60, defaultHeight: 35, defaultProps: { color: '#d4d4d8', verticalHeight: 70, elevation: 150 } },
    { id: 'sink_k', label: 'Kitchen Sink', category: 'Kitchen', subtype: 'plumbing', defaultWidth: 60, defaultHeight: 50, defaultProps: { color: '#94a3b8', verticalHeight: 20, elevation: 90 } },
    { id: 'stove', label: 'Gas Stove', category: 'Kitchen', subtype: 'appliance', defaultWidth: 70, defaultHeight: 50, defaultProps: { color: '#171717', verticalHeight: 10, elevation: 90 } },
    { id: 'chimney', label: 'Chimney', category: 'Kitchen', subtype: 'appliance', defaultWidth: 60, defaultHeight: 50, defaultProps: { color: '#171717', verticalHeight: 60, elevation: 160 } },
    { id: 'fridge', label: 'Refrigerator', category: 'Kitchen', subtype: 'appliance', defaultWidth: 90, defaultHeight: 70, defaultProps: { color: '#e5e5e5', verticalHeight: 180 } },
  ],
  'Bathroom': [
    { id: 'wc_seat', label: 'WC Seat', category: 'Bathroom', subtype: 'sanitary', defaultWidth: 40, defaultHeight: 65, defaultProps: { color: '#ffffff', verticalHeight: 45 } },
    { id: 'washbasin', label: 'Wash Basin', category: 'Bathroom', subtype: 'sanitary', defaultWidth: 55, defaultHeight: 45, defaultProps: { color: '#ffffff', verticalHeight: 85 } },
    { id: 'shower_area', label: 'Shower Area', category: 'Bathroom', subtype: 'sanitary', defaultWidth: 90, defaultHeight: 90, defaultProps: { color: '#bae6fd', verticalHeight: 5, elevation: 0.1, shape: 'rect' } },
    { id: 'mirror', label: 'Mirror', category: 'Bathroom', subtype: 'decor', defaultWidth: 60, defaultHeight: 2, defaultProps: { color: '#bae6fd', verticalHeight: 90, elevation: 120 } },
    { id: 'geyser', label: 'Geyser', category: 'Bathroom', subtype: 'appliance', defaultWidth: 35, defaultHeight: 35, defaultProps: { color: '#ffffff', verticalHeight: 60, elevation: 180, shape: 'circle' } },
  ],
  'Electrical': [
    { id: 'switchboard', label: 'Switchboard', category: 'Electrical', subtype: 'electrical', defaultWidth: 20, defaultHeight: 2, defaultProps: { color: '#fcd34d', verticalHeight: 15, elevation: 120 } },
    { id: 'led_panel', label: 'LED Panel', category: 'Electrical', subtype: 'lighting', defaultWidth: 60, defaultHeight: 60, defaultProps: { color: '#fef08a', verticalHeight: 5, elevation: 295, shape: 'rect' } },
    { id: 'tubelight', label: 'Tube Light', category: 'Electrical', subtype: 'lighting', defaultWidth: 120, defaultHeight: 5, defaultProps: { color: '#fef08a', verticalHeight: 5, elevation: 240 } },
    { id: 'fan_ceiling', label: 'Ceiling Fan', category: 'Electrical', subtype: 'appliance', defaultWidth: 120, defaultHeight: 120, defaultProps: { color: '#475569', verticalHeight: 30, elevation: 270, shape: 'circle' } },
    { id: 'ac_split', label: 'Split AC (Indoor)', category: 'Electrical', subtype: 'appliance', defaultWidth: 100, defaultHeight: 20, defaultProps: { color: '#ffffff', verticalHeight: 30, elevation: 240 } },
    { id: 'ac_outdoor', label: 'AC (Outdoor)', category: 'Electrical', subtype: 'appliance', defaultWidth: 80, defaultHeight: 35, defaultProps: { color: '#94a3b8', verticalHeight: 60 } },
    { id: 'ups', label: 'UPS/Inverter', category: 'Electrical', subtype: 'appliance', defaultWidth: 40, defaultHeight: 50, defaultProps: { color: '#1e293b', verticalHeight: 30 } },
    { id: 'mcb', label: 'MCB Box', category: 'Electrical', subtype: 'electrical', defaultWidth: 40, defaultHeight: 10, defaultProps: { color: '#64748b', verticalHeight: 40, elevation: 150 } },
  ],
  'Plumbing': [
    { id: 'tank_overhead', label: 'Overhead Tank', category: 'Plumbing', subtype: 'tank', defaultWidth: 120, defaultHeight: 120, defaultProps: { color: '#000000', verticalHeight: 150, elevation: 350, shape: 'circle' } },
    { id: 'tank_septic', label: 'Septic Tank', category: 'Plumbing', subtype: 'tank', defaultWidth: 200, defaultHeight: 150, defaultProps: { color: '#3f3f46', verticalHeight: 200, elevation: -200 } },
    { id: 'pipe_drain', label: 'Drain Pipe', category: 'Plumbing', subtype: 'pipe', defaultWidth: 100, defaultHeight: 10, defaultProps: { color: '#9ca3af', verticalHeight: 10 } },
  ],
  'HVAC': [
    { id: 'duct', label: 'AC Duct', category: 'HVAC', subtype: 'duct', defaultWidth: 50, defaultHeight: 200, defaultProps: { color: '#cbd5e1', verticalHeight: 30, elevation: 270 } },
    { id: 'exhaust', label: 'Exhaust Fan', category: 'HVAC', subtype: 'appliance', defaultWidth: 30, defaultHeight: 30, defaultProps: { color: '#475569', verticalHeight: 30, elevation: 210, shape: 'circle' } },
    { id: 'vent', label: 'Vent Grill', category: 'HVAC', subtype: 'part', defaultWidth: 40, defaultHeight: 5, defaultProps: { color: '#94a3b8', verticalHeight: 20, elevation: 240 } },
    { id: 'cooling_tower', label: 'Cooling Tower', category: 'HVAC', subtype: 'unit', defaultWidth: 150, defaultHeight: 150, defaultProps: { color: '#64748b', verticalHeight: 200 } },
  ],
  'Decoration': [
    { id: 'curtains', label: 'Curtains', category: 'Decoration', subtype: 'decor', defaultWidth: 100, defaultHeight: 10, defaultProps: { color: '#f472b6', verticalHeight: 210, elevation: 0 } },
    { id: 'plant_indoor', label: 'Indoor Plant', category: 'Decoration', subtype: 'decor', defaultWidth: 40, defaultHeight: 40, defaultProps: { color: '#22c55e', verticalHeight: 80, shape: 'circle' } },
    { id: 'rug', label: 'Rug/Mat', category: 'Decoration', subtype: 'decor', defaultWidth: 120, defaultHeight: 80, defaultProps: { color: '#f87171', verticalHeight: 1, elevation: 0.1 } },
  ],
  'Exterior': [
    { id: 'gate_main', label: 'Main Gate', category: 'Exterior', subtype: 'structure', defaultWidth: 300, defaultHeight: 20, defaultProps: { color: '#171717', verticalHeight: 180 } },
    { id: 'car_park', label: 'Parking Space', category: 'Exterior', subtype: 'zone', defaultWidth: 250, defaultHeight: 500, defaultProps: { color: '#334155', verticalHeight: 1, text: 'Parking' } },
    { id: 'tree_large', label: 'Large Tree', category: 'Exterior', subtype: 'plant', defaultWidth: 200, defaultHeight: 200, defaultProps: { color: '#15803d', verticalHeight: 600, shape: 'circle' } },
    { id: 'pool_swim', label: 'Swimming Pool', category: 'Exterior', subtype: 'pool', defaultWidth: 600, defaultHeight: 300, defaultProps: { color: '#38bdf8', verticalHeight: 5, elevation: -140 } },
    { id: 'fountain', label: 'Fountain', category: 'Exterior', subtype: 'decor', defaultWidth: 150, defaultHeight: 150, defaultProps: { color: '#7dd3fc', verticalHeight: 80, shape: 'circle' } },
  ],
  'Construction': [
    { id: 'cement', label: 'Cement Bags', category: 'Construction', subtype: 'material', defaultWidth: 60, defaultHeight: 40, defaultProps: { color: '#a3a3a3', verticalHeight: 20 } },
    { id: 'sand', label: 'Sand Pile', category: 'Construction', subtype: 'material', defaultWidth: 150, defaultHeight: 150, defaultProps: { color: '#fde047', verticalHeight: 60, shape: 'circle' } },
    { id: 'brick_stack', label: 'Brick Stack', category: 'Construction', subtype: 'material', defaultWidth: 100, defaultHeight: 100, defaultProps: { color: '#b91c1c', verticalHeight: 80 } },
    { id: 'steel', label: 'Steel Bars', category: 'Construction', subtype: 'material', defaultWidth: 200, defaultHeight: 30, defaultProps: { color: '#475569', verticalHeight: 10 } },
    { id: 'paint_can', label: 'Paint Cans', category: 'Construction', subtype: 'material', defaultWidth: 40, defaultHeight: 40, defaultProps: { color: '#2563eb', verticalHeight: 30 } },
  ]
};

const CATEGORY_ICONS: Record<string, any> = {
  'Foundation': LayoutDashboard,
  'Columns': ColumnsIcon,
  'Roofing': ArrowUpToLine,
  'Bedroom': BedDouble,
  'Living Room': Armchair,
  'Kitchen': Utensils,
  'Bathroom': Droplets,
  'Electrical': Zap,
  'Plumbing': Wrench,
  'HVAC': Wind,
  'Decoration': Palette,
  'Exterior': Trees,
  'Construction': Hammer
};

const LibraryPanel: React.FC<LibraryPanelProps> = ({ onAddItem }) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'Foundation': true,
    'Columns': true,
    'Roofing': true,
    'Bedroom': false,
    'Living Room': false,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-border bg-[#202020]">
        <h2 className="text-white font-bold text-sm">Library</h2>
        <p className="text-[10px] text-gray-500">Drag items to canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {Object.entries(LIBRARY_DATA).map(([category, items]) => {
          const Icon = CATEGORY_ICONS[category] || Grid;
          const isOpen = openCategories[category];

          return (
            <div key={category} className="border-b border-border">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors sticky top-0 bg-panel z-10"
              >
                <div className="flex items-center space-x-2">
                  <Icon size={14} className="text-accent" />
                  <span>{category}</span>
                </div>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isOpen && (
                <div className="bg-[#1a1a1a] p-2 grid grid-cols-2 gap-2">
                  {items.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(item))}
                      onClick={() => onAddItem(item)}
                      title={item.label}
                      className="cursor-pointer flex flex-col items-center justify-center p-3 rounded bg-[#262626] hover:bg-white/10 border border-transparent hover:border-accent transition-all group text-center"
                    >
                      <div className="w-8 h-8 mb-2 rounded bg-black/40 flex items-center justify-center text-gray-500 group-hover:text-white overflow-hidden relative">
                         {/* Simple visual representation based on shape/color */}
                         {item.defaultProps.shape === 'circle' || item.defaultProps.shape === 'cylinder' ? (
                             <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: item.defaultProps.color, backgroundColor: item.defaultProps.color + '40' }}></div>
                         ) : item.defaultProps.shape === 'pyramid' ? (
                             <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent" style={{ borderBottomColor: item.defaultProps.color }}></div>
                         ) : (
                             <div className="w-5 h-5 border-2" style={{ borderColor: item.defaultProps.color, backgroundColor: item.defaultProps.color + '40' }}></div>
                         )}
                      </div>
                      <span className="text-[10px] text-gray-400 group-hover:text-gray-200 leading-tight">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LibraryPanel;
