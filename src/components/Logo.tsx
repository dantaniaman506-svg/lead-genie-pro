import logo from "@/assets/lead-hunter-logo.png.asset.json";

export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className="flex items-center">
      <img src={logo.url} alt="Lead Hunter" className={`${className} w-auto object-contain dark:brightness-0 dark:invert-0`} />
    </div>
  );
}

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`${className} overflow-hidden`} aria-hidden>
      <img
        src={logo.url}
        alt=""
        className="h-full w-[860%] max-w-none object-cover object-left"
        style={{ objectPosition: "21% 50%" }}
      />
    </div>
  );
}
