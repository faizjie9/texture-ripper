import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface PanelProps {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
  className?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'preview';
}

export const Panel: React.FC<PanelProps> = ({
  children,
  title,
  onClose,
  className = '',
  actions,
  variant = 'default',
}) => {
  return (
    <motion.div 
      className={`flex flex-col h-full ${className}`}
      initial={{ opacity: 0, x: variant === 'preview' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {(title || onClose || actions) && (
        <div className={`
          flex items-center justify-between px-6 py-4 
          ${variant === 'preview' 
            ? 'border-b border-gray-800/30 bg-gray-900/50' 
            : 'border-b border-gray-800/30'
          }
        `}>
          {title && (
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-medium text-white/90 select-none">
                {title}
              </h2>
              {variant === 'preview' && (
                <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                  Preview
                </div>
              )}
            </div>
          )}
          <div className="flex items-center space-x-3">
            {actions}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-white/90 transition-colors" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex-grow overflow-auto scrollbar-thin scrollbar-thumb-gray-800/50 scrollbar-track-transparent">
        {children}
      </div>
    </motion.div>
  );
};
