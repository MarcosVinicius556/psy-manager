import { forwardRef, type ButtonHTMLAttributes, type ReactElement } from "react";

export const buttonVariants = {
  primary: "btn-primary",
  secondary: "btn-text",
  danger: "btn-danger",
  chip: "btn-chip",
  chipActive: "btn-chip-active",
  row: "btn-row",
  icon: "btn-icon",
  onTeal: "btn-on-teal",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function buttonClass(variant: ButtonVariant, className = "") {
  const base = buttonVariants[variant];
  return className ? `${base} ${className}` : base;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", type = "button", ...props },
  ref
): ReactElement {
  return <button ref={ref} type={type} className={buttonClass(variant, className)} {...props} />;
});
