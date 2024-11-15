import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: "sm" | "md" | "lg";
  intensity?: "light" | "medium" | "heavy";
  border?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ 
    className, 
    children, 
    blur = "md",
    intensity = "medium",
    border = true,
    glow = false,
    glowColor = "rgba(59, 130, 246, 0.5)",
    ...props 
  }, ref) => {
    const blurValues = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg"
    };

    const intensityValues = {
      light: "bg-white/5",
      medium: "bg-white/10",
      heavy: "bg-white/20"
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl",
          blurValues[blur],
          intensityValues[intensity],
          border && "border border-white/10",
          "shadow-xl",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={glow ? {
          boxShadow: `0 0 30px ${glowColor}`,
        } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";
