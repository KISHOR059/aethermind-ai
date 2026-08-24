import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { AetherMindLogo } from "@/shared/components/AetherMindLogo";
import { cn } from "@/shared/lib/cn";

type AuthCardProps = {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

/**
 * Shared wrapper for all auth screens (register, etc.).
 * Fully theme-aware: white/light in light mode, dark in dark mode.
 */
function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      {/* Subtle ambient glow — very low opacity, visible in both modes */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -bottom-32 -left-24 h-[400px] w-[400px] rounded-full bg-violet-500/[0.06] blur-[96px] dark:bg-violet-500/[0.10]" />
        <div className="absolute -right-24 -top-20 h-[300px] w-[300px] rounded-full bg-violet-500/[0.04] blur-[80px] dark:bg-violet-500/[0.07]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: "easeOut" }}
        className="w-full max-w-[480px]"
      >
        {/* Brand */}
        <div className="mb-7 flex flex-col items-center gap-2 text-center">
          <AetherMindLogo size="lg" linkToHome={false} />
          <p className="mt-1 text-[11px] font-medium tracking-[0.25em] text-muted-foreground/70 uppercase select-none">
            Your intelligent productivity assistant
          </p>
        </div>

        {/* Card */}
        <div className={cn(
          "rounded-2xl border border-border/60 bg-card p-8 shadow-sm",
          "dark:border-border/40 dark:shadow-none",
        )}>
          {/* Header */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Content */}
          {children}

          {/* Footer */}
          {footer && (
            <div className="mt-6 border-t border-border/50 pt-5 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default AuthCard;
