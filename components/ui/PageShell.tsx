import type { ReactNode } from "react";

// Geometri artık tek bir tema-duyarlı ".pattern-brand" class'ından gelir
// (bkz. app/globals.css) — burada yalnızca YOĞUNLUK seçilir. "none" veya
// prop hiç geçilmezse PageShell hiçbir pattern class'ı eklemez (mevcut
// search/collections/home kullanımları birebir aynı davranır).
type PageShellPattern = "subtle" | "medium" | "none";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  // settings/profile/collections gibi sayfalarda sayfanın üst
  // giriş alanına çok hafif marka dokusu eklemek için seçici kullanım.
  // Aynı sayfa bölümünün her paneli aynı deseni taşımamalı.
  pattern?: PageShellPattern;
};

export default function PageShell({
  children,
  className,
  pattern,
}: PageShellProps) {
  const patternClassName =
    pattern && pattern !== "none" ? `pattern-brand pattern-${pattern} relative ` : "";
  const baseClassName = `${patternClassName}mx-auto max-w-7xl px-6 py-16`;

  return (
    <section className={className ? `${baseClassName} ${className}` : baseClassName}>
      {children}
    </section>
  );
}
