import { NextResponse } from "next/server";
import {
  getCollectionCandidates,
  type CollectionCandidateOptions,
} from "@/lib/tmdb";

// Compact filtreler için güvenli üst sınırlar — keyfi/çok büyük array
// kabul edilmez, her zaman bu limitlere kırpılır.
const MAX_GENRE_IDS = 3;
const MAX_KEYWORD_IDS = 3;
// Havuz başına yalnızca 1 sayfa (20 sonuç) — "tek kullanıcı ziyaretiyle
// yüzlerce TMDB isteği oluşturmamalı" kuralı; toplam en fazla 6 TMDB isteği
// (genre + dna + actor + director + company + discovery).
const POOL_PAGE = 1;
const MAX_CANDIDATE_IDS = 50;

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

async function fetchPool(
  options: CollectionCandidateOptions
): Promise<number[]> {
  const data = await getCollectionCandidates(options, POOL_PAGE);

  return data.results.map((movie) => movie.id);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const genreIds = parseIdList(url.searchParams.get("genreIds"), MAX_GENRE_IDS);
  const keywordIds = parseIdList(
    url.searchParams.get("keywordIds"),
    MAX_KEYWORD_IDS
  );
  const actorId = parseSingleId(url.searchParams.get("actorId"));
  const directorId = parseSingleId(url.searchParams.get("directorId"));
  const companyId = parseSingleId(url.searchParams.get("companyId"));

  // Her havuz ayrı bir Promise — biri (429/5xx/timeout) başarısız olsa da
  // allSettled sayesinde diğerleriyle devam edilir (Promise.all yerine).
  const poolRequests: Promise<number[]>[] = [];

  if (genreIds.length > 0) {
    poolRequests.push(
      fetchPool({
        candidateGenreIds: genreIds,
        sortBy: "popularity.desc",
        voteCountMin: 100,
        voteAverageMin: 5.5,
      })
    );
  }

  if (keywordIds.length > 0) {
    poolRequests.push(
      fetchPool({
        candidateGenreIds: [],
        candidateKeywordIds: keywordIds,
        sortBy: "popularity.desc",
        voteCountMin: 50,
        voteAverageMin: 5,
      })
    );
  }

  if (actorId !== undefined) {
    poolRequests.push(
      fetchPool({
        candidateGenreIds: [],
        castId: actorId,
        sortBy: "popularity.desc",
        voteCountMin: 30,
        voteAverageMin: 0,
      })
    );
  }

  if (directorId !== undefined) {
    poolRequests.push(
      fetchPool({
        candidateGenreIds: [],
        crewId: directorId,
        sortBy: "popularity.desc",
        voteCountMin: 30,
        voteAverageMin: 0,
      })
    );
  }

  if (companyId !== undefined) {
    poolRequests.push(
      fetchPool({
        candidateGenreIds: [],
        companyId,
        sortBy: "popularity.desc",
        voteCountMin: 30,
        voteAverageMin: 0,
      })
    );
  }

  // Discovery/popular havuzu her zaman dahil edilir — low confidence
  // fallback'i ve genel bir taban sağlar.
  poolRequests.push(
    fetchPool({
      candidateGenreIds: [],
      sortBy: "popularity.desc",
      voteCountMin: 200,
      voteAverageMin: 6,
    })
  );

  const settledPools = await Promise.allSettled(poolRequests);

  const fulfilledPools = settledPools.filter(
    (result): result is PromiseFulfilledResult<number[]> =>
      result.status === "fulfilled"
  );

  if (fulfilledPools.length === 0) {
    return NextResponse.json(
      { message: "Öneri adayları alınamadı." },
      { status: 502 }
    );
  }

  const uniqueIds = new Set<number>();

  for (const pool of fulfilledPools) {
    for (const id of pool.value) {
      uniqueIds.add(id);
    }
  }

  const candidateIds = Array.from(uniqueIds).slice(0, MAX_CANDIDATE_IDS);

  return NextResponse.json({ candidateIds });
}
