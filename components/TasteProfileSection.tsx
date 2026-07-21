"use client";

import Link from "next/link";
import { useTasteProfile } from "@/components/hooks/useTasteProfile";
import type { TasteProfile, WeightedPreference } from "@/lib/tasteProfile";

const CONFIDENCE_LABELS: Record<TasteProfile["confidence"], string> = {
  low: "Düşük Güven",
  medium: "Orta Güven",
  high: "Yüksek Güven",
};

const CONFIDENCE_DESCRIPTIONS: Record<TasteProfile["confidence"], string> = {
  low: "Henüz az veri var. Daha fazla filme puan verdikçe profilin daha güvenilir hale gelir.",
  medium:
    "Makul sayıda puanlanmış film var; profil genel eğilimini yansıtıyor. Daha fazla filme puan verdikçe profilin daha güvenilir hale gelir.",
  high: "Zengin bir puanlama geçmişin var; profil oldukça güvenilir.",
};

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-200">
      {label}
    </span>
  );
}

function ChipRow({ preferences }: { preferences: WeightedPreference[] }) {
  const positivePreferences = preferences.filter((p) => p.score > 0);

  if (positivePreferences.length === 0) {
    return (
      <p className="text-sm text-neutral-500">Henüz belirgin bir eğilim yok.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {positivePreferences.slice(0, 5).map((preference) => (
        <Chip key={preference.id} label={preference.label} />
      ))}
    </div>
  );
}

function getRuntimeLabel(
  runtimePreference: TasteProfile["runtimePreference"]
): string {
  const { preferredMin, preferredMax, averageRuntime } = runtimePreference;

  if (preferredMin === null) {
    return averageRuntime !== null
      ? `Ortalama ${averageRuntime} dakika`
      : "Henüz belirlenemedi";
  }

  const rangeLabel =
    preferredMax === null
      ? `${preferredMin}+ dakika (uzun filmler)`
      : preferredMin === 0
        ? `${preferredMax} dakika ve altı (kısa filmler)`
        : `${preferredMin}–${preferredMax} dakika (orta uzunlukta filmler)`;

  return averageRuntime !== null
    ? `${rangeLabel} · ortalama ${averageRuntime} dakika`
    : rangeLabel;
}

function SectionSkeleton() {
  return (
    <div className="mt-8 space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="h-4 w-40 animate-pulse rounded bg-neutral-800" />
      <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
    </div>
  );
}

export default function TasteProfileSection() {
  const { profile, isLoading, hasError } = useTasteProfile();

  if (isLoading) {
    return <SectionSkeleton />;
  }

  if (hasError || !profile) {
    return null;
  }

  const hasAnyData =
    profile.totalRatedMovies > 0 || profile.totalStatusMovies > 0;

  const explicitActorCount = profile.explicitFavoriteActorIds.length;
  const explicitDirectorCount = profile.explicitFavoriteDirectorIds.length;
  const explicitCompanyCount = profile.explicitFavoriteCompanyIds.length;

  return (
    <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Zevk Profilin</h2>

        <span className="rounded-full border border-yellow-400/40 px-3 py-1 text-xs font-semibold text-yellow-400">
          {CONFIDENCE_LABELS[profile.confidence]}
        </span>
      </div>

      <p className="mt-2 text-sm text-neutral-400">
        Bu profil verdiğin puanlar ve izleme durumlarına göre oluşur.{" "}
        {CONFIDENCE_DESCRIPTIONS[profile.confidence]}
      </p>

      {!hasAnyData ? (
        <p className="mt-6 text-sm text-neutral-500">
          Henüz yeterli veri yok. Birkaç filme puan verdiğinde veya izleme
          durumu işaretlediğinde burada zevk profilin oluşmaya başlayacak.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Sevdiğin Türler
            </h3>

            <div className="mt-2">
              <ChipRow preferences={profile.genrePreferences} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Movie DNA Eğilimlerin
            </h3>

            <div className="mt-2">
              <ChipRow preferences={profile.dnaPreferences} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Tercih Ettiğin Süre
              </h3>

              <p className="mt-2 text-sm text-neutral-300">
                {getRuntimeLabel(profile.runtimePreference)}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Dönemler
              </h3>

              <div className="mt-2">
                {profile.eraPreferences.filter((p) => p.score > 0).length ===
                0 ? (
                  <p className="text-sm text-neutral-500">
                    Henüz belirgin bir eğilim yok.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.eraPreferences
                      .filter((p) => p.score > 0)
                      .slice(0, 3)
                      .map((era) => (
                        <Chip key={era.id} label={era.label} />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Diller
            </h3>

            <div className="mt-2">
              {profile.languagePreferences.filter((p) => p.score > 0)
                .length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Henüz belirgin bir eğilim yok.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.languagePreferences
                    .filter((p) => p.score > 0)
                    .slice(0, 3)
                    .map((language) => (
                      <Chip key={language.id} label={language.label} />
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-neutral-800 pt-4 text-sm text-neutral-300">
            <span>
              <span className="font-semibold text-white">
                {explicitActorCount}
              </span>{" "}
              favori oyuncu
            </span>

            <span>
              <span className="font-semibold text-white">
                {explicitDirectorCount}
              </span>{" "}
              favori yönetmen
            </span>

            <span>
              <span className="font-semibold text-white">
                {explicitCompanyCount}
              </span>{" "}
              favori stüdyo
            </span>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-neutral-600">
        Profil bu cihazdaki yerel verilerden hesaplanır, henüz bir hesaba
        veya buluta kaydedilmez. Favori kişiler/stüdyolar açık tercihlerindir;
        tür ve Movie DNA eğilimleri ise puanlarından çıkarılan tahminlerdir.
      </p>

      <Link
        href="/preferences"
        className="mt-4 inline-block text-sm font-semibold text-yellow-400 transition hover:text-yellow-300"
      >
        Tercihlerini Düzenle →
      </Link>
    </section>
  );
}
