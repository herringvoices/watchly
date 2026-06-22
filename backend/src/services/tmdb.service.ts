const TMDB_BASE = 'https://api.themoviedb.org/3';

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw Object.assign(new Error('TMDB_API_KEY is not configured'), { status: 500 });
  return key;
}

async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    const body = await res.json().catch(() => ({ status_message: 'TMDB request failed' })) as { status_message?: string };
    const status = res.status === 404 ? 404 : 502;
    throw Object.assign(new Error(body.status_message ?? 'TMDB request failed'), { status });
  }

  return res.json();
}

function mapSearchResult(item: any, mediaType: 'movie' | 'tv') {
  return {
    tmdbId: item.id as number,
    title: (mediaType === 'movie' ? item.title : item.name) as string,
    overview: (item.overview ?? '') as string,
    posterPath: (item.poster_path ?? null) as string | null,
    backdropPath: (item.backdrop_path ?? null) as string | null,
    releaseDate: (mediaType === 'movie'
      ? (item.release_date ?? null)
      : (item.first_air_date ?? null)) as string | null,
    mediaType,
  };
}

export const TMDBService = {
  async search(query: string, type: 'movie' | 'tv', page = 1) {
    const data = await tmdbFetch(`/search/${type}`, { query, page: String(page) });
    return {
      results: (data.results as any[]).map((item) => mapSearchResult(item, type)),
      page: data.page as number,
      totalPages: data.total_pages as number,
      totalResults: data.total_results as number,
    };
  },

  async getDetails(type: 'movie' | 'tv', tmdbId: number) {
    const data = await tmdbFetch(`/${type}/${tmdbId}`);
    return {
      id: data.id as number,
      title: (type === 'movie' ? data.title : data.name) as string,
      overview: (data.overview ?? '') as string,
      posterPath: (data.poster_path ?? null) as string | null,
      backdropPath: (data.backdrop_path ?? null) as string | null,
      releaseDate: (type === 'movie'
        ? (data.release_date ?? null)
        : (data.first_air_date ?? null)) as string | null,
      genres: ((data.genres ?? []) as any[]).map((g) => ({ id: g.id as number, name: g.name as string })),
      mediaType: type,
    };
  },

  async getTrending(type: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
    const data = await tmdbFetch(`/trending/${type}/${timeWindow}`);
    return {
      results: (data.results as any[]).map((item) => {
        const mediaType: 'movie' | 'tv' = item.media_type === 'movie' ? 'movie' : 'tv';
        return mapSearchResult(item, mediaType);
      }),
    };
  },
};
