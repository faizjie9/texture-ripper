import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface AnimatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
  glowColor?: string;
}

export const AnimatedSelect = React.forwardRef<HTMLSelectElement, AnimatedSelectProps>(
  ({ className, options, glowColor = "rgba(59, 130, 246, 0.3)", ...props }, ref) => {
    return (
      <motion.select
        ref={ref}
        className={cn(
          "bg-gray-800/80 text-white rounded-xl px-3 py-2 text-sm",
          "border border-white/10 focus:border-blue-500/50",
          "outline-none transition-all duration-300",
          "hover:border-white/20",
          "backdrop-blur-sm shadow-lg",
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          boxShadow: `0 0 15px ${glowColor}`,
        }}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-gray-800"
          >
            {option.label}
          </option>
        ))}
      </motion.select>
    );
  }
);

AnimatedSelect.displayName = "AnimatedSelect";
