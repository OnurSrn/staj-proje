"use client";

import Image from "next/image";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { t } from "@/lib/i18n";

type CastCardProps = {
  personId: number;
  name: string;
  character: string;
  profileUrl: string | null;
};

export default function CastCard({
  personId,
  name,
  character,
  profileUrl,
}: CastCardProps) {
  const { settings } = useSettings();
  const language = settings.language;

  return (
    <Link
      href={`/person/${personId}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:border-accent/60"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-elevated">
        {profileUrl ? (
          <Image
            src={profileUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, 180px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
            {t(language, "common", "noActorImage")}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate font-semibold text-foreground">{name}</h3>

        <p className="mt-1 line-clamp-2 text-sm text-muted">
          {character || t(language, "personDetail", "noCharacterInfo")}
        </p>
      </div>
    </Link>
  );
}
