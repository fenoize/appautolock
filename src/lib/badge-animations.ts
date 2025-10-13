// Badge animation utilities

export function getBadgeAnimation(count: number | undefined): string {
  return count && count > 0 
    ? "animate-in fade-in-0 zoom-in-75 duration-200"
    : "";
}

export function getBadgeClass(variant?: "default" | "secondary" | "outline" | "destructive"): string {
  const baseClass = "transition-all duration-200";
  
  switch (variant) {
    case "default":
      return `${baseClass} hover:shadow-sm`;
    case "outline":
      return `${baseClass} hover:bg-muted/50`;
    default:
      return baseClass;
  }
}
