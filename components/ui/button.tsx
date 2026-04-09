import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:scale-[1.03] tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFB3]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E19]",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.4)] active:bg-slate-950",
        primary:
          "bg-[#00FFB3] text-[#030305] font-black hover:brightness-110 shadow-[0_10px_30px_-10px_rgba(0,255,179,0.25)] hover:shadow-[0_20px_40px_-10px_rgba(0,255,179,0.35)] active:brightness-95",
        secondary:
          "bg-slate-200 text-slate-900 hover:bg-slate-300 border border-slate-300 active:bg-slate-400",
        outline:
          "border border-white/15 text-white/80 hover:border-[#00FFB3]/50 hover:text-white hover:bg-white/5 dark:border-white/15 dark:text-white/80 dark:hover:border-[#00FFB3]/50 dark:hover:text-white dark:hover:bg-white/5 active:bg-white/10",
        ghost: "text-slate-700 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10",
        premium: "bg-[#030305] text-white relative overflow-hidden group/btn border border-[#00FFB3]/20 hover:border-[#00FFB3]/40 shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-[0_30px_60px_rgba(0,255,179,0.12)] active:brightness-90",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-[0_10px_30px_-10px_rgba(239,68,68,0.3)] active:bg-red-700",
      },
      size: {
        sm: "h-10 px-6 text-sm",
        default: "h-12 px-8 text-base",
        lg: "h-14 px-10 text-lg",
        xl: "h-16 px-12 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {variant === "premium" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FFB3]/8 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
        )}
        <span className="relative z-10 flex items-center gap-2">
          {props.children}
        </span>
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
