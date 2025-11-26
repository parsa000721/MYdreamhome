import React, { useState, useRef } from 'react';

interface MenuBarProps {
    onNew: () => void;
    onSave: () => void;
    onLoad: (file: File) => void;
    onUndo: () => void;
    onRedo: () => void;
    onDelete: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ onNew, onSave, onLoad, onUndo, onRedo, onDelete }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onLoad(e.target.files[0]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveMenu(null);
  };

  const menus = [
    { 
        label: 'File', 
        items: [
            { label: 'New Project', shortcut: 'Ctrl+N', action: onNew },
            { label: 'Open...', shortcut: 'Ctrl+O', action: () => fileInputRef.current?.click() },
            { type: 'separator' },
            { label: 'Save Project', shortcut: 'Ctrl+S', action: onSave },
            { type: 'separator' },
            { label: 'Export PNG', shortcut: '' },
        ] 
    },
    { 
        label: 'Edit', 
        items: [
            { label: 'Undo', shortcut: 'Ctrl+Z', action: onUndo },
            { label: 'Redo', shortcut: 'Ctrl+Y', action: onRedo },
            { type: 'separator' },
            { label: 'Delete', shortcut: 'Del', action: onDelete },
        ] 
    },
    { 
        label: 'View', 
        items: [
            { label: 'Zoom In', shortcut: 'Ctrl++' },
            { label: 'Zoom Out', shortcut: 'Ctrl+-' },
            { type: 'separator' },
            { label: 'Toggle Grid', shortcut: 'G' },
        ] 
    },
    {
        label: 'Help',
        items: [
            { label: 'About Architech' }
        ]
    }
  ];

  return (
    <div className="h-8 bg-[#202020] border-b border-border flex items-center px-2 select-none relative z-50">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />
      
      {menus.map((menu) => (
        <div 
            key={menu.label} 
            className="relative"
            onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
        >
            <button 
                className={`px-3 py-1 text-xs text-gray-300 hover:bg-white/10 rounded-sm flex items-center ${activeMenu === menu.label ? 'bg-white/10 text-white' : ''}`}
                onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
            >
                {menu.label}
            </button>
            
            {activeMenu === menu.label && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setActiveMenu(null)}
                    ></div>
                    <div className="absolute left-0 top-full mt-1 w-56 bg-[#2a2a2a] border border-border rounded shadow-xl z-50 py-1">
                        {menu.items.map((item, idx) => (
                            item.type === 'separator' ? (
                                <div key={idx} className="h-px bg-border my-1 mx-2"></div>
                            ) : (
                                <button 
                                    key={idx} 
                                    onClick={() => { item.action?.(); setActiveMenu(null); }}
                                    className="w-full text-left px-4 py-1.5 text-xs text-gray-300 hover:bg-accent hover:text-white flex justify-between group"
                                >
                                    <span>{item.label}</span>
                                    <span className="text-gray-500 group-hover:text-white/70">{item.shortcut}</span>
                                </button>
                            )
                        ))}
                    </div>
                </>
            )}
        </div>
      ))}
    </div>
  );
};

export default MenuBar;