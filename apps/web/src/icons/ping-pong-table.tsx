import type { SVGProps } from "react";

type PingPongTableProps = SVGProps<SVGSVGElement> & {
  color?: string;
  size?: number | string;
  strokeWidth?: number | string;
  title?: string;
};

export default function PingPongTable({
  color = "currentColor",
  height,
  size = 24,
  strokeWidth,
  title,
  width,
  ...props
}: PingPongTableProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      fill="none"
      height={height ?? size}
      role={title ? "img" : undefined}
      viewBox="0 0 64 64"
      width={width ?? size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <rect
        height={48}
        rx={3}
        stroke={color}
        strokeWidth={strokeWidth ?? 4}
        width={44}
        x={10}
        y={8}
      />
      <line
        stroke={color}
        strokeWidth={strokeWidth ?? 3}
        x1={32}
        x2={32}
        y1={8}
        y2={56}
      />
      <line
        stroke={color}
        strokeWidth={strokeWidth ?? 4}
        x1={10}
        x2={54}
        y1={32}
        y2={32}
      />
      <circle cx={23} cy={20} fill={color} r={2.5} />
    </svg>
  );
}
