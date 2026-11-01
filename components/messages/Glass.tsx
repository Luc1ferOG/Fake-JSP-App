import React from "react";
export function GlassSurface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`glass-surface ${className}`}>{children}</div>;
}
export function GlassButton({
  className = "",
  round = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { round?: boolean }) {
  return (
    <button
      {...props}
      className={`glass-button ${round ? "glass-round" : ""} ${className}`}
    />
  );
}
