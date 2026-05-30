import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";
type Size = "md" | "sm";

const classes = (variant: Variant, size: Size, extra?: string) =>
  [
    "btn",
    variant === "primary" ? "btn-primary" : "btn-ghost",
    size === "sm" ? "btn-sm" : null,
    extra,
  ]
    .filter(Boolean)
    .join(" ");

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={classes(variant, size, className)}>
      {children}
    </button>
  );
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  external?: boolean;
  children: ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  external,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const cls = classes(variant, size, className);
  if (external) {
    return (
      <a {...rest} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
