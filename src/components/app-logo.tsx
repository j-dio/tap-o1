import { cn } from "@/lib/utils";

const APP_LOGO_SRC = "/Logo_png_ver.png";

export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <img
        src={APP_LOGO_SRC}
        alt="TapO(1)"
        className="absolute inset-0 h-full w-full scale-[1.28] object-contain"
        draggable={false}
      />
    </span>
  );
}
