"use client";

import PersonPreferenceButton from "@/components/PersonPreferenceButton";

type PersonDetailPreferenceActionsProps = {
  id: number;
  name: string;
  profilePath: string | null;
  canFavoriteAsActor: boolean;
  canFavoriteAsDirector: boolean;
};

export default function PersonDetailPreferenceActions({
  id,
  name,
  profilePath,
  canFavoriteAsActor,
  canFavoriteAsDirector,
}: PersonDetailPreferenceActionsProps) {
  if (!canFavoriteAsActor && !canFavoriteAsDirector) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {canFavoriteAsActor && (
        <PersonPreferenceButton
          id={id}
          name={name}
          profilePath={profilePath}
          role="actor"
          variant="label"
        />
      )}

      {canFavoriteAsDirector && (
        <PersonPreferenceButton
          id={id}
          name={name}
          profilePath={profilePath}
          role="director"
          variant="label"
        />
      )}
    </div>
  );
}
