// Form-specific animation utilities

export const formAnimations = {
  // Error shake animation
  error: "animate-shake",
  
  // Success pulse animation
  success: "animate-pulse-once",
  
  // Focus ring effect
  focus: "ring-2 ring-primary/20 border-primary transition-all duration-200",
  
  // Input states
  invalid: "border-destructive focus:ring-destructive/20",
  valid: "border-accent focus:ring-accent/20",
};

// Helper to get validation class
export function getValidationClass(isValid?: boolean, hasError?: boolean): string {
  if (hasError) return formAnimations.invalid;
  if (isValid) return formAnimations.valid;
  return "";
}
