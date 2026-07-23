import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={
        className
          ? `flex flex-wrap items-start justify-between gap-4 ${className}`
          : "flex flex-wrap items-start justify-between gap-4"
      }
    >
      <div className="min-w-0 flex-1">
        {title}
        {description ? <div className="mt-2">{description}</div> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
