import type { Metadata } from "next";
import CompanyPreferenceCard from "@/components/CompanyPreferenceCard";
import PersonPreferenceCard from "@/components/PersonPreferenceCard";
import PreferencesDashboard from "@/components/PreferencesDashboard";
import {
  searchCompanies,
  searchPeople,
  type PersonSearchResult,
} from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Preferences",
  description:
    "Favori oyuncularını, yönetmenlerini ve yapım şirketlerini seç ve yönet.",
};

type PreferencesPageProps = {
  searchParams: Promise<{
    actorQuery?: string;
    directorQuery?: string;
    companyQuery?: string;
  }>;
};

// TMDB kişi araması rolü kesin ayırt etmez; sonuçlar ilgili departmana göre
// önceliklendirilir (stabil sort, TMDB'nin kendi alaka sırasını grup içinde
// korur) ama diğer departmanlar tamamen dışlanmaz — nihai kararı kullanıcı
// (departman etiketini görerek) verir.
function sortByDepartment(
  results: PersonSearchResult[],
  department: string
): PersonSearchResult[] {
  return [...results].sort((a, b) => {
    const aRank = a.known_for_department === department ? 0 : 1;
    const bRank = b.known_for_department === department ? 0 : 1;

    return aRank - bRank;
  });
}

function getKnownForTitles(person: PersonSearchResult): string[] {
  return person.known_for
    .map((item) => item.title ?? item.name)
    .filter((title): title is string => Boolean(title))
    .slice(0, 2);
}

export default async function PreferencesPage({
  searchParams,
}: PreferencesPageProps) {
  const {
    actorQuery = "",
    directorQuery = "",
    companyQuery = "",
  } = await searchParams;

  const trimmedActorQuery = actorQuery.trim();
  const trimmedDirectorQuery = directorQuery.trim();
  const trimmedCompanyQuery = companyQuery.trim();

  const [actorResults, directorResults, companyResults] = await Promise.all([
    trimmedActorQuery ? searchPeople(trimmedActorQuery) : null,
    trimmedDirectorQuery ? searchPeople(trimmedDirectorQuery) : null,
    trimmedCompanyQuery ? searchCompanies(trimmedCompanyQuery) : null,
  ]);

  const actors = actorResults
    ? sortByDepartment(actorResults.results, "Acting")
    : [];
  const directors = directorResults
    ? sortByDepartment(directorResults.results, "Directing")
    : [];
  const companies = companyResults?.results ?? [];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          Tercihler
        </p>

        <h1 className="mt-4 text-4xl font-bold">Preferences</h1>

        <p className="mt-4 max-w-2xl text-neutral-400">
          Favori oyuncularını, yönetmenlerini ve yapım şirketlerini burada
          seç. Bu tercihler şimdilik yalnızca bu cihazda saklanır; henüz
          kişisel öneri veya CiNeA Match hesaplamasında kullanılmıyor.
        </p>

        {/* 1. Favori Oyuncular */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold">1. Favori Oyuncular</h2>

          <form
            action="/preferences"
            method="GET"
            className="mt-6 flex max-w-xl gap-3"
          >
            <input type="hidden" name="directorQuery" value={directorQuery} />
            <input type="hidden" name="companyQuery" value={companyQuery} />

            <label htmlFor="actorQuery" className="sr-only">
              Oyuncu ara
            </label>

            <input
              id="actorQuery"
              type="text"
              name="actorQuery"
              defaultValue={actorQuery}
              placeholder="Örneğin: Leonardo DiCaprio"
              className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-yellow-400"
            />

            <button
              type="submit"
              className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
            >
              Ara
            </button>
          </form>

          {!trimmedActorQuery ? (
            <p className="mt-6 text-neutral-500">
              Bir oyuncu adı aramaya başla.
            </p>
          ) : actors.length === 0 ? (
            <p className="mt-6 text-neutral-500">
              “{trimmedActorQuery}” için sonuç bulunamadı.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {actors.map((person) => (
                <PersonPreferenceCard
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  profilePath={person.profile_path}
                  department={person.known_for_department}
                  knownForTitles={getKnownForTitles(person)}
                  role="actor"
                />
              ))}
            </div>
          )}
        </section>

        {/* 2. Favori Yönetmenler */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold">2. Favori Yönetmenler</h2>

          <form
            action="/preferences"
            method="GET"
            className="mt-6 flex max-w-xl gap-3"
          >
            <input type="hidden" name="actorQuery" value={actorQuery} />
            <input type="hidden" name="companyQuery" value={companyQuery} />

            <label htmlFor="directorQuery" className="sr-only">
              Yönetmen ara
            </label>

            <input
              id="directorQuery"
              type="text"
              name="directorQuery"
              defaultValue={directorQuery}
              placeholder="Örneğin: Christopher Nolan"
              className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-yellow-400"
            />

            <button
              type="submit"
              className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
            >
              Ara
            </button>
          </form>

          <p className="mt-3 text-xs text-neutral-500">
            TMDB kişi araması rolü kesin göstermeyebilir; sonuçlar
            &quot;Directing&quot; departmanına göre önceliklendirilir ama
            nihai kararı departman etiketine bakarak sen verirsin.
          </p>

          {!trimmedDirectorQuery ? (
            <p className="mt-6 text-neutral-500">
              Bir yönetmen adı aramaya başla.
            </p>
          ) : directors.length === 0 ? (
            <p className="mt-6 text-neutral-500">
              “{trimmedDirectorQuery}” için sonuç bulunamadı.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {directors.map((person) => (
                <PersonPreferenceCard
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  profilePath={person.profile_path}
                  department={person.known_for_department}
                  knownForTitles={getKnownForTitles(person)}
                  role="director"
                />
              ))}
            </div>
          )}
        </section>

        {/* 3. Favori Stüdyolar */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold">3. Favori Stüdyolar</h2>

          <form
            action="/preferences"
            method="GET"
            className="mt-6 flex max-w-xl gap-3"
          >
            <input type="hidden" name="actorQuery" value={actorQuery} />
            <input type="hidden" name="directorQuery" value={directorQuery} />

            <label htmlFor="companyQuery" className="sr-only">
              Stüdyo ara
            </label>

            <input
              id="companyQuery"
              type="text"
              name="companyQuery"
              defaultValue={companyQuery}
              placeholder="Örneğin: A24"
              className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-yellow-400"
            />

            <button
              type="submit"
              className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300"
            >
              Ara
            </button>
          </form>

          {!trimmedCompanyQuery ? (
            <p className="mt-6 text-neutral-500">
              Bir yapım şirketi aramaya başla.
            </p>
          ) : companies.length === 0 ? (
            <p className="mt-6 text-neutral-500">
              “{trimmedCompanyQuery}” için sonuç bulunamadı.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {companies.map((company) => (
                <CompanyPreferenceCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  logoPath={company.logo_path}
                  originCountry={company.origin_country}
                />
              ))}
            </div>
          )}
        </section>

        {/* Mevcut favoriler */}
        <section className="mt-16 border-t border-neutral-800 pt-10">
          <h2 className="text-2xl font-bold">Mevcut Favorilerin</h2>

          <PreferencesDashboard />
        </section>
      </section>
    </main>
  );
}
