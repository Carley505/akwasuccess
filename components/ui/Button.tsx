import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "gold";
type Size = "sm" | "md" | "lg";

const base =
  "btn inline-flex items-center justify-center gap-2 rounded-md font-semibold no-underline transition-colors duration-200 select-none disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60 text-center leading-tight";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "border-2 border-primary bg-surface text-link hover:bg-tint",
  ghost: "text-link hover:bg-tint",
  destructive: "bg-danger text-white hover:opacity-90",
  /** For dark green bands: gold outline, white text. */
  gold: "border-2 border-gold-500 bg-transparent text-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  block,
  className,
}: Pick<CommonProps, "variant" | "size" | "block" | "className">) {
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

type ButtonProps = CommonProps & Omit<ComponentProps<"button">, "children">;

export function Button({
  variant,
  size,
  loading,
  icon,
  iconRight,
  block,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : icon}
      <span>{children}</span>
      {iconRight}
    </button>
  );
}

type LinkButtonProps = CommonProps & Omit<ComponentProps<typeof Link>, "children" | "className">;

export function LinkButton({
  variant,
  size,
  icon,
  iconRight,
  block,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={buttonClasses({ variant, size, block, className })} {...rest}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </Link>
  );
}
