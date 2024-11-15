import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  glowColor?: string;
  icon?: React.ReactNode;
  hoverScale?: number;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    children, 
    variant = "primary", 
    size = "md", 
    glowColor = "rgba(59, 130, 246, 0.5)",
    hoverScale = 1.05,
    icon,
    ...props 
  }, ref) => {
    const baseStyles = cn(
      "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      "before:absolute before:inset-0 before:rounded-xl before:transition-all before:duration-300",
      "hover:before:scale-110 hover:before:opacity-100 before:opacity-0",
      "overflow-hidden backdrop-blur-sm"
    );

    const variants = {
      primary: "bg-blue-600/90 text-white hover:bg-blue-700/90 focus:ring-blue-500 before:bg-blue-600/20",
      secondary: "bg-gray-700/90 text-white hover:bg-gray-600/90 focus:ring-gray-500 before:bg-gray-600/20",
      danger: "bg-red-600/90 text-white hover:bg-red-700/90 focus:ring-red-500 before:bg-red-600/20"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ scale: hoverScale }}
        whileTap={{ scale: 0.95 }}
        style={{
          boxShadow: `0 0 20px ${glowColor}`,
        }}
        {...props}
      >
        {icon && <span className="relative z-10">{icon}</span>}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
