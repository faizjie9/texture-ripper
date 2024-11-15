import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <motion.select
        ref={ref}
        className={cn(
          'bg-gray-800 text-white rounded-lg px-3 py-2 text-sm',
          'border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
          'outline-none transition-all',
          'hover:border-gray-600',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </motion.select>
    );
  }
);

Select.displayName = 'Select';
