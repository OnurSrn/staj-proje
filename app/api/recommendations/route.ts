import { NextResponse } from "next/server";
import {
  RECOMMENDATION_POOL_LIMITS,
  RECOMMENDATION_SOURCES,
  type RecommendationSourceId,
} from "@/lib/recommendationConfig";
import {
  getCollectionCandidates,
  type CollectionCandidateOptions,
} from "@/lib/tmdb";

function parseIdList(raw: string | null, max: number): number[] {
  if (!raw) {
    return [];
  }

  const ids = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  return Array.from(new Set(ids)).slice(0, max);
}

function parseSingleId(raw: string | null): number | undefined {
  if (!raw) {
    return undefined;
  }

  const id = Number(raw);

  return Number.isInteger(id) && id > 0 ? id : undefined;
}

type PoolResult = {
  sourceId: RecommendationSourceId;
  ids: number[];
};

async function fetchPool(
  sourceId: RecommendationSourceId,
  options: CollectionCandidateOptions
): Promise<PoolResult> {
  const data = await getCollectionCandidates(
    options,
    RECOMMENDATION_POOL_LIMITS.poolPage
  );

  return { sourceId, ids: data.results.map((movie) => movie.id) };
}

// Candidate provenance: her havuz kendi sourceId'siyle etiketlenir; aynı
// film birden fazla havuzdan gelirse TEK kopya kalır ama sourceIds
// alanında BÜTÜN kaynaklar korunur (bkz. görev talimatı Aşama 3 "candidate
// provenance korunmalı"). Havuz limitleri artık lib/recommendationConfig.ts
// RECOMMENDATION_SOURCES'tan gelir — değerler DEĞİŞMEDİ, yalnızca tek
// noktadan yönetiliyor.
export async function GET(request: Request) {
  const url = new URL(request.url);

  const genreIds = parseIdList(
    url.searchParams.get("genreIds"),
    RECOMMENDATION_POOL_LIMITS.maxGenreIds
  );
  const keywordIds = parseIdList(
    url.searchParams.get("keywordIds"),
    RECOMMENDATION_POOL_LIMITS.maxKeywordIds
  );
  const actorId = parseSingleId(url.searchParams.get("actorId"));
  const directorId = parseSingleId(url.searchParams.get("directorId"));
  const companyId = parseSingleId(url.searchParams.get("companyId"));

  // Her havuz ayrı bir Promise — biri (429/5xx/timeout) başarısız olsa da
  // allSettled sayesinde diğerleriyle devam edilir (Promise.all yerine).
  const poolRequests: Promise<PoolResult>[] = [];

  if (genreIds.length > 0) {
    const source = RECOMMENDATION_SOURCES.preferredGenreDiscovery;

    poolRequests.push(
      fetchPool(source.id, {
        candidateGenreIds: genreIds,
        sortBy: "popularity.desc",
        voteCountMin: source.voteCountMin,
        voteAverageMin: source.voteAverageMin,
      })
    );
  }

  if (keywordIds.length > 0) {
    const source = RECOMMENDATION_SOURCES.dnaKeywordDiscovery;

    poolRequests.push(
      fetchPool(source.id, {
        candidateGenreIds: [],
        candidateKeywordIds: keywordIds,
        sortBy: "popularity.desc",
        voteCountMin: source.voteCountMin,
        voteAverageMin: source.voteAverageMin,
      })
    );
  }

  if (actorId !== undefined) {
    const source = RECOMMENDATION_SOURCES.favoriteActorDiscovery;

    poolRequests.push(
      fetchPool(source.id, {
        candidateGenreIds: [],
        castId: actorId,
        sortBy: "popularity.desc",
        voteCountMin: source.voteCountMin,
        voteAverageMin: source.voteAverageMin,
      })
    );
  }

  if (directorId !== undefined) {
    const source = RECOMMENDATION_SOURCES.favoriteDirectorDiscovery;

    poolRequests.push(
      fetchPool(source.id, {
        candidateGenreIds: [],
        crewId: directorId,
        sortBy: "popularity.desc",
        voteCountMin: source.voteCountMin,
        voteAverageMin: source.voteAverageMin,
      })
    );
  }

  if (companyId !== undefined) {
    const source = RECOMMENDATION_SOURCES.favoriteCompanyDiscovery;

    poolRequests.push(
      fetchPool(source.id, {
        candidateGenreIds: [],
        companyId,
        sortBy: "popularity.desc",
        voteCountMin: source.voteCountMin,
        voteAverageMin: source.voteAverageMin,
      })
    );
  }

  // Discovery/popular havuzu her zaman dahil edilir — low confidence
  // fallback'i ve genel bir taban sağlar.
  const fallbackSource = RECOMMENDATION_SOURCES.popularFallback;

  poolRequests.push(
    fetchPool(fallbackSource.id, {
      candidateGenreIds: [],
      sortBy: "popularity.desc",
      voteCountMin: fallbackSource.voteCountMin,
      voteAverageMin: fallbackSource.voteAverageMin,
    })
  );

  const settledPools = await Promise.allSettled(poolRequests);

  const fulfilledPools = settledPools.filter(
    (result): result is PromiseFulfilledResult<PoolResult> =>
      result.status === "fulfilled"
  );

  if (fulfilledPools.length === 0) {
    return NextResponse.json(
      { message: "Öneri adayları alınamadı." },
      { status: 502 }
    );
  }

  // Provenance-preserving dedupe: id -> bu id'yi üreten TÜM sourceId'ler.
  // İlk görülme sırası korunur (deterministik) — pools her zaman aynı
  // sabit sırada push edilir.
  const sourceIdsByMovieId = new Map<number, Set<RecommendationSourceId>>();
  const orderedIds: number[] = [];

  for (const pool of fulfilledPools) {
    for (const id of pool.value.ids) {
      let sources = sourceIdsByMovieId.get(id);

      if (!sources) {
        sources = new Set();
        sourceIdsByMovieId.set(id, sources);
        orderedIds.push(id);
      }

      sources.add(pool.value.sourceId);
    }
  }

  const candidates = orderedIds
    .slice(0, RECOMMENDATION_POOL_LIMITS.maxCandidateIds)
    .map((id) => ({
      id,
      sourceIds: Array.from(sourceIdsByMovieId.get(id) ?? []),
    }));

  return NextResponse.json({ candidates });
}
