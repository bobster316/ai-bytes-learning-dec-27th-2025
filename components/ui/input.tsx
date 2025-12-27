import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        suppressHydrationWarning
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-base text-foreground placeholder:text-foreground/50 focus:border-[#00BFA5] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
