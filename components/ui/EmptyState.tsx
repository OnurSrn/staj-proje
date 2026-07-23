import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={
        className
          ? `rounded-2xl border border-dashed border-accent/25 bg-gradient-to-b from-accent-soft/40 to-surface p-10 text-center ${className}`
          : "rounded-2xl border border-dashed border-accent/25 bg-gradient-to-b from-accent-soft/40 to-surface p-10 text-center"
      }
    >
      {icon ? <div className="mb-4 flex justify-center">{icon}</div> : null}

      {typeof title === "string" ? (
        <h3 className="text-xl font-semibold">{title}</h3>
      ) : (
        title
      )}

      {description ? <p className="mt-3 text-muted">{description}</p> : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
