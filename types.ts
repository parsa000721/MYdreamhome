
export enum ToolType {
  SELECT = 'SELECT',
  // Draw
  WALL = 'WALL',
  LINE = 'LINE',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  // Arch
  DOOR = 'DOOR',
  WINDOW = 'WINDOW',
  OBJECT = 'OBJECT', // Generic object placement
  // Annotation/Utils
  TEXT = 'TEXT',
  ERASER = 'ERASER',
  MEASURE = 'MEASURE'
}

export enum ElementType {
  WALL = 'WALL',
  DOOR = 'DOOR',
  WINDOW = 'WINDOW',
  TEXT = 'TEXT',
  LINE = 'LINE',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  OBJECT = 'OBJECT' // New generic type for library items
}

export interface Point {
  x: number;
  y: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

export interface ArchElement {
  id: string;
  type: ElementType;
  layerId: string;
  x: number;
  y: number;
  width?: number; 
  height?: number; 
  rotation: number;
  properties: Record<string, any>; // Will hold subtype, category, label, bevelEnabled, bevelRadius, uvScaleX, uvScaleY, uvFlipX, uvFlipY, strokeEnabled, strokeWidth, strokeColor
  selected?: boolean;
}

export interface ProjectState {
  elements: ArchElement[];
  layers: Layer[];
  view: {
    x: number;
    y: number;
    zoom: number;
  };
  selectedIds: string[];
}

export interface RenderSettings {
  quality: 'draft' | 'high';
  style: 'photorealistic' | 'sketch' | 'blueprint';
  prompt: string;
}

export interface LibraryItem {
  id: string;
  label: string;
  category: string;
  subtype: string;
  defaultWidth: number;
  defaultHeight: number; // depth/thickness
  defaultProps: Record<string, any>;
}

export interface AppSettings {
  theme: 'Dark' | 'Light';
  autoSaveInterval: number; // in milliseconds
  gridSize: number;
  snapToGrid: boolean;
  showDimensions: boolean;
  renderQuality: 'Draft' | 'High';
  renderStyle: 'Photorealistic' | 'Sketch' | 'Blueprint';
}
