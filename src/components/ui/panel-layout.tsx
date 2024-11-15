import React from 'react';
import { ResizablePanel } from './resizable-panel';

interface PanelLayoutProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  onLeftPanelResize?: (width: number) => void;
  onRightPanelResize?: (width: number) => void;
}

export const PanelLayout: React.FC<PanelLayoutProps> = ({
  children,
  leftPanel,
  rightPanel,
  leftPanelWidth = 320,
  rightPanelWidth = 300,
  onLeftPanelResize,
  onRightPanelResize,
}) => {
  return (
    <div className="flex h-full bg-gray-950">
      {/* Left Panel */}
      {leftPanel && (
        <ResizablePanel
          side="right"
          defaultWidth={leftPanelWidth}
          minWidth={280}
          maxWidth={500}
          onResize={onLeftPanelResize}
          className="h-full flex-shrink-0"
        >
          <div className="h-full bg-gray-900/95 backdrop-blur-lg shadow-xl">
            {leftPanel}
          </div>
        </ResizablePanel>
      )}

      {/* Main Content */}
      <div className="flex-grow relative">
        {children}
      </div>

      {/* Right Panel */}
      {rightPanel && (
        <ResizablePanel
          side="left"
          defaultWidth={rightPanelWidth}
          minWidth={280}
          maxWidth={500}
          onResize={onRightPanelResize}
          className="h-full flex-shrink-0"
        >
          <div className="h-full bg-gray-900/95 backdrop-blur-lg shadow-xl">
            {rightPanel}
          </div>
        </ResizablePanel>
      )}
    </div>
  );
};
