
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  // Sync local state when prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-panel w-96 rounded-lg shadow-2xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-white font-semibold">Application Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">General</h3>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Theme</label>
              <select 
                value={localSettings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="bg-black/30 border border-border rounded px-2 py-1 text-sm text-gray-300"
              >
                <option value="Dark">Dark</option>
                <option value="Light">Light</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Auto-Save Interval</label>
              <select 
                value={localSettings.autoSaveInterval}
                onChange={(e) => handleChange('autoSaveInterval', Number(e.target.value))}
                className="bg-black/30 border border-border rounded px-2 py-1 text-sm text-gray-300"
              >
                <option value={30000}>30 Seconds</option>
                <option value={60000}>1 Minute</option>
                <option value={300000}>5 Minutes</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Editor</h3>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Grid Size (px)</label>
              <input 
                type="number" 
                value={localSettings.gridSize} 
                onChange={(e) => handleChange('gridSize', Number(e.target.value))}
                className="w-16 bg-black/30 border border-border rounded px-2 py-1 text-sm text-gray-300 text-right" 
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Snap to Grid</label>
              <div 
                className="relative inline-block w-8 mr-2 align-middle select-none cursor-pointer"
                onClick={() => handleChange('snapToGrid', !localSettings.snapToGrid)}
              >
                <div className={`w-8 h-4 rounded-full transition-colors ${localSettings.snapToGrid ? 'bg-accent' : 'bg-gray-600'}`}></div>
                <div className={`absolute top-0 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.snapToGrid ? 'translate-x-full' : 'translate-x-0'}`}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Show Dimensions</label>
               <div 
                className="relative inline-block w-8 mr-2 align-middle select-none cursor-pointer"
                onClick={() => handleChange('showDimensions', !localSettings.showDimensions)}
              >
                <div className={`w-8 h-4 rounded-full transition-colors ${localSettings.showDimensions ? 'bg-accent' : 'bg-gray-600'}`}></div>
                <div className={`absolute top-0 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.showDimensions ? 'translate-x-full' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rendering</h3>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Render Quality</label>
              <select 
                value={localSettings.renderQuality || 'High'}
                onChange={(e) => handleChange('renderQuality', e.target.value)}
                className="bg-black/30 border border-border rounded px-2 py-1 text-sm text-gray-300"
              >
                <option value="Draft">Draft</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Render Style</label>
              <select 
                value={localSettings.renderStyle || 'Photorealistic'}
                onChange={(e) => handleChange('renderStyle', e.target.value)}
                className="bg-black/30 border border-border rounded px-2 py-1 text-sm text-gray-300"
              >
                <option value="Photorealistic">Photorealistic</option>
                <option value="Sketch">Sketch</option>
                <option value="Blueprint">Blueprint</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center space-x-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded text-sm transition-colors"
          >
            <Save size={14} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
