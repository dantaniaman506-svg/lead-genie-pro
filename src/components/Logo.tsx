import mark from "@/assets/lead-hunter-mark.png.asset.json";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return <img src={mark.url} alt="" aria-hidden className={`${className} object-contain`} />;
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const mk = size === "lg" ? "h-9 w-7" : "h-7 w-6";
  const txt = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2">
      <LogoMark className={mk} />
      <span className={`${txt} font-extrabold tracking-tight text-foreground`}>
        Lead <span className="text-brand">Hunter</span>
      </span>
    </div>
  );
}
