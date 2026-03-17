/**
 * AppLogo — the canonical TapO(1) icon mark.
 *
 * Design: a circle ring (the "O") with a bold "1" centred inside it,
 * set on the app's primary colour background.  Scales cleanly from
 * 7 px (favicon) to 512 px (PWA splash) with no rasterisation artefacts.
 *
 * Usage:
 *   <AppLogo className="size-8" />          sidebar / mobile header
 *   <AppLogo className="size-16" />         login card
 *   <AppLogo className="size-24" />         landing hero
 */
export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      // rx="9" in a 40×40 viewBox = 22.5% — mirror this as CSS border-radius
      // so the browser clips the transparent SVG corners on the painted element
      style={{ borderRadius: "22.5%" }}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TapO(1)"
    >
      {/* Background square */}
      <rect width="40" height="40" rx="9" className="fill-primary" />

      {/* The "O" — a circle ring */}
      <circle
        cx="20"
        cy="20"
        r="11.5"
        strokeWidth="2.5"
        className="stroke-primary-foreground"
      />

      {/* The "1" — centred inside the ring */}
      <text
        x="20"
        y="20"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        className="fill-primary-foreground"
      >
        1
      </text>
    </svg>
  );
}
