import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { env } from "@/shared/config/env";

export interface AetherMindLogoProps {
  /** Whether to show the text wordmark alongside the symbol */
  showWordmark?: boolean;
  /** Size variant for symbol and text */
  size?: "sm" | "md" | "lg";
  /** Shorthand to hide wordmark */
  iconOnly?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for the SVG icon */
  iconClassName?: string;
  /** Custom class name for the wordmark */
  textClassName?: string;
  /** Whether to render as an interactive Link to /dashboard */
  linkToHome?: boolean;
}

/**
 * Modern geometric brand symbol for AetherMind:
 * Represents AI intelligence, neural connection, and streamlined productivity.
 */
export function AetherMindSymbol({
  className,
  size = 26,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="aethermind-logo-grad"
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" stopOpacity="1" />
          <stop offset="0.5" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Rounded ambient background squircle */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        className="fill-primary"
      />

      {/* Interconnected Intelligent Neural Apex / Aether Spark Symbol */}
      <path
        d="M16 6.5L23.5 21H19.5L16 13.8L12.5 21H8.5L16 6.5Z"
        className="fill-primary-foreground"
      />
      {/* Central Radiant Neural Core / Crossbar */}
      <circle
        cx="16"
        cy="17.5"
        r="2.2"
        className="fill-primary-foreground"
      />
      {/* Subtle Orbital Sync Nodes */}
      <circle
        cx="16"
        cy="24.5"
        r="1.3"
        className="fill-primary-foreground opacity-80"
      />
    </svg>
  );
}

export function AetherMindLogo({
  showWordmark = true,
  size = "md",
  iconOnly = false,
  className,
  iconClassName,
  textClassName,
  linkToHome = true,
}: AetherMindLogoProps) {
  const shouldShowText = showWordmark && !iconOnly;

  const sizeConfig = {
    sm: { iconSize: 22, textClass: "text-sm font-semibold tracking-tight" },
    md: { iconSize: 26, textClass: "text-base font-bold tracking-tight" },
    lg: { iconSize: 32, textClass: "text-lg font-bold tracking-tight" },
  }[size];

  const content = (
    <div
      className={cn(
        "group flex items-center gap-2.5 transition-opacity duration-150 hover:opacity-90 active:scale-[0.99]",
        className,
      )}
    >
      <div className="flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <AetherMindSymbol size={sizeConfig.iconSize} className={iconClassName} />
      </div>

      {shouldShowText && (
        <span
          className={cn(
            "bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-foreground font-heading select-none",
            sizeConfig.textClass,
            textClassName,
          )}
        >
          {env.appName || "AetherMind"}
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        to="/dashboard"
        aria-label={`${env.appName || "AetherMind"} home`}
        className="inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default AetherMindLogo;
