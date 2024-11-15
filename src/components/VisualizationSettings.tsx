import React, { useState } from 'react';
import { VisualizationSettings } from '../types';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

interface Props {
  settings: VisualizationSettings;
  onSettingsChange: (settings: VisualizationSettings) => void;
  onClose?: () => void;
}

const SettingsPanel: React.FC<Props> = ({ settings, onSettingsChange, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['points', 'grid', 'helpers']);

  const handleChange = (category: keyof VisualizationSettings, subcategory: string, value: any) => {
    onSettingsChange({
      ...settings,
      [category]: {
        ...settings[category],
        [subcategory]: value
      }
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderSection = (title: string, id: string, content: React.ReactNode) => {
    const isExpanded = expandedSections.includes(id);
    return (
      <div className="border border-gray-700 rounded-lg overflow-hidden mb-2">
        <button
          className="w-full px-4 py-2 flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors"
          onClick={() => toggleSection(id)}
        >
          <span className="text-lg font-semibold">{title}</span>
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {isExpanded && (
          <div className="p-4 space-y-4 bg-gray-800">
            {content}
          </div>
        )}
      </div>
    );
  };

  const renderColorInput = (label: string, value: string, onChange: (value: string) => void) => (
    <div className="flex items-center space-x-2">
      <label className="flex-grow text-sm">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 bg-gray-700 rounded text-sm"
        />
      </div>
    </div>
  );

  const renderSlider = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    min: number,
    max: number,
    step: number = 1
  ) => (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label className="text-sm">{label}</label>
        <span className="text-sm text-gray-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );

  const renderCheckbox = (label: string, checked: boolean, onChange: (checked: boolean) => void) => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg text-white overflow-hidden">
      <div className="p-4 bg-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-bold">Visualization Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {renderSection("Point Settings", "points", (
          <>
            {renderSlider("Size", settings.points.size, (v) => handleChange("points", "size", v), 4, 16)}
            {renderSlider("Hover Size", settings.points.hoverSize, (v) => handleChange("points", "hoverSize", v), 6, 20)}
            {renderSlider("Active Size", settings.points.activeSize, (v) => handleChange("points", "activeSize", v), 6, 20)}
            {renderColorInput("Point Color", settings.points.color, (v) => handleChange("points", "color", v))}
            {renderSlider("Border Width", settings.points.borderWidth, (v) => handleChange("points", "borderWidth", v), 0, 5)}
            {renderColorInput("Border Color", settings.points.borderColor, (v) => handleChange("points", "borderColor", v))}
            {renderCheckbox("Show Labels", settings.points.showLabels, (v) => handleChange("points", "showLabels", v))}
            {settings.points.showLabels && (
              <>
                {renderColorInput("Label Color", settings.points.labelColor, (v) => handleChange("points", "labelColor", v))}
                <div className="flex items-center space-x-2">
                  <label className="text-sm flex-grow">Label Font</label>
                  <select
                    value={settings.points.labelFont}
                    onChange={(e) => handleChange("points", "labelFont", e.target.value)}
                    className="bg-gray-700 rounded px-2 py-1"
                  >
                    <option value="12px Arial">Small</option>
                    <option value="14px Arial">Medium</option>
                    <option value="16px Arial">Large</option>
                  </select>
                </div>
              </>
            )}
          </>
        ))}

        {renderSection("Grid Settings", "grid", (
          <>
            {renderCheckbox("Show Grid", settings.grid.enabled, (v) => handleChange("grid", "enabled", v))}
            {settings.grid.enabled && (
              <>
                {renderColorInput("Grid Color", settings.grid.color, (v) => handleChange("grid", "color", v))}
                {renderSlider("Opacity", settings.grid.opacity, (v) => handleChange("grid", "opacity", v), 0, 1, 0.1)}
                {renderSlider("Line Width", settings.grid.lineWidth, (v) => handleChange("grid", "lineWidth", v), 0.5, 3, 0.5)}
                {renderSlider("Density", settings.grid.density, (v) => handleChange("grid", "density", v), 2, 20)}
                {renderSlider("Subdivisions", settings.grid.subdivisions, (v) => handleChange("grid", "subdivisions", v), 0, 8)}
                {renderCheckbox("Show Inner Lines", settings.grid.showInnerLines, (v) => handleChange("grid", "showInnerLines", v))}
              </>
            )}
          </>
        ))}

        {renderSection("Helper Settings", "helpers", (
          <>
            {renderCheckbox("Show Edge Lines", settings.helpers.showEdgeLines, (v) => handleChange("helpers", "showEdgeLines", v))}
            {settings.helpers.showEdgeLines && (
              <>
                {renderColorInput("Edge Color", settings.helpers.edgeColor, (v) => handleChange("helpers", "edgeColor", v))}
                {renderSlider("Edge Width", settings.helpers.edgeWidth, (v) => handleChange("helpers", "edgeWidth", v), 1, 5)}
              </>
            )}
            {renderCheckbox("Show Angles", settings.helpers.showAngles, (v) => handleChange("helpers", "showAngles", v))}
            {settings.helpers.showAngles && (
              <>
                {renderColorInput("Angle Color", settings.helpers.angleColor, (v) => handleChange("helpers", "angleColor", v))}
              </>
            )}
            {renderCheckbox("Show Distances", settings.helpers.showDistances, (v) => handleChange("helpers", "showDistances", v))}
            {settings.helpers.showDistances && (
              <>
                {renderColorInput("Distance Color", settings.helpers.distanceColor, (v) => handleChange("helpers", "distanceColor", v))}
                <div className="flex items-center space-x-2">
                  <label className="text-sm flex-grow">Distance Font</label>
                  <select
                    value={settings.helpers.distanceFont}
                    onChange={(e) => handleChange("helpers", "distanceFont", e.target.value)}
                    className="bg-gray-700 rounded px-2 py-1"
                  >
                    <option value="10px Arial">Small</option>
                    <option value="12px Arial">Medium</option>
                    <option value="14px Arial">Large</option>
                  </select>
                </div>
              </>
            )}
          </>
        ))}

        <div className="pt-4 flex justify-end space-x-2">
          <button
            onClick={() => onSettingsChange(defaultVisualizationSettings)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

const defaultVisualizationSettings: VisualizationSettings = {
  points: {
    size: 8,
    color: '#00ff00',
    borderColor: '#ffffff',
    borderWidth: 2,
    hoverSize: 12,
    activeSize: 10,
    showLabels: true,
    labelColor: '#ffffff',
    labelFont: '12px Arial'
  },
  grid: {
    enabled: true,
    color: '#ffffff',
    opacity: 0.3,
    lineWidth: 0.5,
    density: 10,
    subdivisions: 4,
    showInnerLines: true
  },
  helpers: {
    showEdgeLines: true,
    edgeColor: '#00ff00',
    edgeWidth: 1,
    showAngles: true,
    angleColor: '#ffff00',
    showDistances: true,
    distanceColor: '#ffffff',
    distanceFont: '10px Arial'
  }
};

export default SettingsPanel;
