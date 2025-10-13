// Utility helpers for consistent animations across the app
// All animations are CSS-based for optimal performance

export const animations = {
  // Page entry animation
  pageEnter: "animate-in fade-in-0 duration-300",
  
  // List item with stagger support
  listItem: (index: number) => {
    const delay = Math.min(index * 50, 300);
    return `animate-in fade-in-0 slide-in-from-bottom-2 duration-200 fill-mode-both delay-[${delay}ms]`;
  },
  
  // Interactive cards and elements
  interactiveCard: "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
  
  // Table row hover state
  tableRow: "transition-all duration-150 hover:bg-muted/50 hover:border-l-4 hover:border-l-primary/50",
  
  // Skeleton shimmer effect
  skeleton: "animate-pulse",
  
  // Button press feedback
  buttonPress: "active:scale-[0.98] transition-transform duration-100",
  
  // Icon hover animation
  iconHover: "transition-transform duration-200 group-hover:scale-110",
  
  // Smooth fade in
  fadeIn: "animate-in fade-in-0 duration-300",
  
  // Slide in from bottom
  slideInBottom: "animate-in slide-in-from-bottom-2 duration-300",
};

// Helper to calculate stagger delays dynamically
export function getStaggerDelay(index: number, baseDelay = 50, maxDelay = 300): number {
  return Math.min(index * baseDelay, maxDelay);
}

// Helper to apply stagger animation with inline style
export function getStaggerStyle(index: number, baseDelay = 50, maxDelay = 300) {
  return {
    animationDelay: `${getStaggerDelay(index, baseDelay, maxDelay)}ms`,
  };
}
