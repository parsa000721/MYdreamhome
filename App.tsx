
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Share2, Layers, Sliders, Clock, Box, Eye, Library, Save } from 'lucide-react';
import Toolbar from './components/Toolbar';
import Canvas, { CanvasRef } from './components/Canvas';
import Viewport3D from './components/Viewport3D';
import PropertyPanel from './components/PropertyPanel';
import LayerPanel from './components/LayerPanel';
import MenuBar from './components/MenuBar';
import LibraryPanel from './components/LibraryPanel';
import SettingsModal from './components/SettingsModal';
import { ArchElement, ToolType, Layer, ElementType, LibraryItem, AppSettings } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'Dark',
  autoSaveInterval: 30000,
  gridSize: 20,
  snapToGrid: true,
  showDimensions: true,
  renderQuality: 'High',
  renderStyle: 'Photorealistic'
};

const App: React.FC = () => {
  // State
  const [elements, setElements] = useState<ArchElement[]>([]);
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'layer-1', name: 'Default Layer', visible: true, locked: false, color: '#3b82f6' }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-1');
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolType>(ToolType.SELECT);
  const [zoom, setZoom] = useState(1);
  const [viewPos, setViewPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [activeRightPanel, setActiveRightPanel] = useState<'properties' | 'layers' | 'history' | 'library'>('properties');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // App Settings with Lazy Initialization for Persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('architech_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // History
  const [history, setHistory] = useState<ArchElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const canvasRef = useRef<CanvasRef>(null);

  // Save Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('architech_settings', JSON.stringify(newSettings));
  };

  // Theme Application
  useEffect(() => {
    // Simple theme switcher logic
    if (settings.theme === 'Light') {
        document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
    } else {
        document.documentElement.style.filter = 'none';
    }
  }, [settings.theme]);

  // Auto-save
  useEffect(() => {
    const save = () => {
        localStorage.setItem('architech_autosave', JSON.stringify({ elements, layers }));
        setLastSaved(new Date());
    };
    const interval = setInterval(save, settings.autoSaveInterval);
    return () => clearInterval(interval);
  }, [elements, layers, settings.autoSaveInterval]);

  // Load Autosave
  useEffect(() => {
      const saved = localStorage.getItem('architech_autosave');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (parsed.elements) setElements(parsed.elements);
              if (parsed.layers) setLayers(parsed.layers);
              setLastSaved(new Date());
          } catch (e) { console.error("Failed to load autosave"); }
      }
  }, []);

  // Actions
  const addToHistory = (newElements: ArchElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setElements(newElements);
  };

  const handleAddElement = (el: ArchElement) => {
    addToHistory([...elements, el]);
  };

  const handleAddLibraryItem = (item: LibraryItem) => {
    // Add item to center of current view
    const newEl: ArchElement = {
      id: crypto.randomUUID(),
      type: ElementType.OBJECT,
      layerId: activeLayerId,
      x: -viewPos.x / zoom + (window.innerWidth / 2) / zoom, // Approx center
      y: -viewPos.y / zoom + (window.innerHeight / 2) / zoom,
      width: item.defaultWidth,
      height: item.defaultHeight,
      rotation: 0,
      properties: {
        ...item.defaultProps,
        subtype: item.subtype,
        category: item.category,
        label: item.label // Ensure label is saved for tooltips
      }
    };
    handleAddElement(newEl);
    setSelectedId(newEl.id);
    setActiveRightPanel('properties');
    // Switch to select tool to move it immediately
    setTool(ToolType.SELECT);
  };

  const handleUpdateElement = (id: string, updates: Partial<ArchElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    addToHistory(newElements);
  };

  const handleDeleteElement = (idOverride?: string) => {
    // If idOverride is passed (e.g. from Eraser), use it. Otherwise use selectedId.
    const targetId = typeof idOverride === 'string' ? idOverride : selectedId;
    if (!targetId) return;
    
    const newElements = elements.filter(el => el.id !== targetId);
    addToHistory(newElements);
    
    if (selectedId === targetId) {
        setSelectedId(null);
    }
  };

  const handleSelectElement = (id: string | null) => {
    setSelectedId(id);
    if (id) setActiveRightPanel('properties');
  };

  // Layer Actions
  const handleAddLayer = () => {
    const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${layers.length + 1}`,
        visible: true,
        locked: false,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(layers.filter(l => l.id !== id));
    if (activeLayerId === id) setActiveLayerId(layers[0].id);
  };

  // Project Actions
  const handleNewProject = () => {
      if (window.confirm("Start new project? Unsaved changes will be lost.")) {
          setElements([]);
          setHistory([]);
          setHistoryIndex(-1);
      }
  };

  const handleSaveProject = () => {
      const data = JSON.stringify({ elements, layers });
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleLoadProject = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.elements) setElements(data.elements);
              if (data.layers) setLayers(data.layers);
              setHistory([]);
              setHistoryIndex(-1);
          } catch (err) {
              alert("Failed to load project file.");
          }
      };
      reader.readAsText(file);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setElements([]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Undo/Redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        }
        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedId) handleDeleteElement(selectedId);
        }
        // Escape
        if (e.key === 'Escape') {
            setSelectedId(null);
            setTool(ToolType.SELECT);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, historyIndex, history]);

  const selectedElement = elements.find(el => el.id === selectedId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-canvas text-gray-200 font-sans overflow-hidden">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* 1. Menu Bar */}
      <MenuBar 
        onNew={handleNewProject}
        onSave={handleSaveProject}
        onLoad={handleLoadProject}
        onUndo={undo}
        onRedo={redo}
        onDelete={() => selectedId && handleDeleteElement(selectedId)}
      />

      {/* 2. Main Header */}
      <header className="h-10 bg-panel border-b border-border flex items-center justify-between px-4 z-30 shadow-sm">
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white font-bold tracking-tight">
                <div className="w-5 h-5 bg-accent rounded flex items-center justify-center text-[10px]">A</div>
                <span className="text-sm">ARCHITECH</span>
            </div>
        </div>
        <div className="flex items-center space-x-3">
             <div className="flex bg-[#121212] rounded p-0.5">
                <button 
                    onClick={() => setViewMode('2d')}
                    className={`px-3 py-0.5 text-xs rounded transition-colors ${viewMode === '2d' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    2D Plan
                </button>
                <button 
                    onClick={() => setViewMode('3d')}
                    className={`px-3 py-0.5 text-xs rounded transition-colors ${viewMode === '3d' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    3D View
                </button>
             </div>
             <div className="h-4 w-px bg-border"></div>
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-400 hover:text-white" 
                title="Settings"
             >
                <Settings size={16} />
             </button>
             <button onClick={handleSaveProject} className="bg-accent hover:bg-accent-hover text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors">
                <Share2 size={12} />
                <span>Export</span>
             </button>
        </div>
      </header>

      {/* 3. Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Toolbar - Only visible in 2D */}
        {viewMode === '2d' && (
            <Toolbar 
                activeTool={tool} 
                onToolChange={setTool}
                onUndo={undo}
                onRedo={redo}
                onZoomIn={() => setZoom(z => Math.min(z * 1.2, 5))}
                onZoomOut={() => setZoom(z => Math.max(z / 1.2, 0.2))}
                canUndo={historyIndex >= 0}
                canRedo={historyIndex < history.length - 1}
            />
        )}

        {/* Center Viewport */}
        <div className="flex-1 relative bg-[#121212] shadow-inner flex flex-col">
            {viewMode === '2d' ? (
                <Canvas
                    ref={canvasRef}
                    elements={elements}
                    layers={layers}
                    tool={tool}
                    zoom={zoom}
                    viewPos={viewPos}
                    activeLayerId={activeLayerId}
                    onElementAdd={handleAddElement}
                    onElementSelect={handleSelectElement}
                    onElementUpdate={handleUpdateElement}
                    onElementDelete={handleDeleteElement}
                    onMouseMove={setMousePos}
                    selectedId={selectedId}
                    onViewChange={(newView) => { setViewPos({x: newView.x, y: newView.y}); setZoom(newView.zoom); }}
                />
            ) : (
                <Viewport3D elements={elements} />
            )}
        </div>

        {/* Right Dockable Panel System */}
        <div className="w-80 flex flex-col border-l border-border bg-panel shadow-xl z-20">
             {/* Panel Tabs */}
             <div className="flex border-b border-border">
                <button 
                    onClick={() => setActiveRightPanel('properties')}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center space-x-1 ${activeRightPanel === 'properties' ? 'text-accent border-b-2 border-accent bg-white/5' : 'text-gray-400 hover:text-white'}`}
                >
                    <Sliders size={14} />
                    <span>Props</span>
                </button>
                <button 
                    onClick={() => setActiveRightPanel('library')}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center space-x-1 ${activeRightPanel === 'library' ? 'text-accent border-b-2 border-accent bg-white/5' : 'text-gray-400 hover:text-white'}`}
                >
                    <Library size={14} />
                    <span>Library</span>
                </button>
                <button 
                    onClick={() => setActiveRightPanel('layers')}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center space-x-1 ${activeRightPanel === 'layers' ? 'text-accent border-b-2 border-accent bg-white/5' : 'text-gray-400 hover:text-white'}`}
                >
                    <Layers size={14} />
                    <span>Layers</span>
                </button>
             </div>

             {/* Panel Content */}
             <div className="flex-1 overflow-hidden">
                {activeRightPanel === 'properties' && (
                    <PropertyPanel 
                        element={selectedElement}
                        onUpdate={handleUpdateElement}
                    />
                )}
                {activeRightPanel === 'library' && (
                    <LibraryPanel onAddItem={handleAddLibraryItem} />
                )}
                {activeRightPanel === 'layers' && (
                    <LayerPanel 
                        layers={layers}
                        activeLayerId={activeLayerId}
                        onLayerChange={handleUpdateLayer}
                        onLayerAdd={handleAddLayer}
                        onLayerDelete={handleDeleteLayer}
                        onLayerSelect={setActiveLayerId}
                    />
                )}
             </div>
        </div>
      </div>
      
      {/* 4. Status Bar */}
      <div className="h-6 bg-[#202020] border-t border-border flex items-center px-4 text-[10px] text-gray-400 justify-between select-none z-40">
        <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
                <Box size={10} />
                <span>Selected: {selectedElement ? (selectedElement.properties.label || selectedElement.type) : 'None'}</span>
            </div>
            <span>X: {Math.round(mousePos.x)} Y: {Math.round(mousePos.y)}</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex space-x-4">
             <div className="flex items-center space-x-1">
                 <Save size={10} className={lastSaved ? "text-green-500" : "text-gray-500"} />
                 <span>{lastSaved ? `Saved ${Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000)}s ago` : 'Unsaved'}</span>
             </div>
             <div className="h-3 w-px bg-white/10"></div>
             <div className="flex items-center space-x-1">
                 <Eye size={10} />
                 <span>Mode: {viewMode.toUpperCase()}</span>
             </div>
             <span>Layer: {layers.find(l => l.id === activeLayerId)?.name}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
