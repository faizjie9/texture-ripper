import React from 'react';
import { Tool } from '../types';
import { MousePointer, Move, RotateCcw, Trash2 } from 'lucide-react';

interface ToolbarProps {
  className?: string;
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const tools = [
  { id: 'select' as Tool, icon: MousePointer, label: 'Select' },
  { id: 'move' as Tool, icon: Move, label: 'Move' },
  { id: 'rotate' as Tool, icon: RotateCcw, label: 'Rotate' },
  { id: 'delete' as Tool, icon: Trash2, label: 'Delete' },
];

const Toolbar: React.FC<ToolbarProps> = ({
  className = '',
  activeTool,
  onToolChange,
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === tool.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
};

export default Toolbar;
