import type { PersonExternalLink } from "@/lib/personProfile";

type PersonSocialLinksProps = {
  links: PersonExternalLink[];
};

// IMDb sosyal medya değildir; küçük bir ayraçla ayrılır ama aynı metadata
// satırında kalır (bkz. görev talimatı bölüm 3).
const PLATFORM_SHORT_LABEL: Record<PersonExternalLink["platform"], string> = {
  instagram: "IG",
  x: "X",
  facebook: "FB",
  imdb: "IMDb",
};

const LINK_CLASS =
  "inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-border px-1.5 text-[10px] font-semibold text-muted transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function PersonSocialLinks({ links }: PersonSocialLinksProps) {
  if (links.length === 0) {
    return null;
  }

  const socialLinks = links.filter((link) => link.platform !== "imdb");
  const imdbLink = links.find((link) => link.platform === "imdb");

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {socialLinks.map((link) => (
        <a
          key={link.platform}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          title={link.label}
          className={LINK_CLASS}
        >
          {PLATFORM_SHORT_LABEL[link.platform]}
        </a>
      ))}

      {imdbLink && (
        <>
          {socialLinks.length > 0 && (
            <span aria-hidden="true" className="text-muted">
              |
            </span>
          )}

          <a
            href={imdbLink.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={imdbLink.label}
            title={imdbLink.label}
            className={LINK_CLASS}
          >
            {PLATFORM_SHORT_LABEL.imdb}
          </a>
        </>
      )}
    </span>
  );
}
