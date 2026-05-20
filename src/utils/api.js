export const fetchAniList = async (query, variables = {}) => {
  try {
    console.log('[AniList] Starting query...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const result = await res.json();
    const data =
      result.data?.Page?.media ||
      result.data?.Page?.airingSchedules ||
      result.data?.Media ||
      [];
    console.log('[AniList] Query successful, got', Array.isArray(data) ? data.length : 1, 'items');
    return data;
  } catch (e) {
    console.error('[AniList] Query failed:', e.message);
    return [];
  }
};

// Always use /api — Vite proxies this to localhost:3000 in dev,
// Vercel rewrites it to server/index.js in production.
export const LOCAL_API_URL = '/api';

const FALLBACK_API_URL = 'https://api-consumet-org-five.vercel.app/anime/gogoanime';

const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') throw new Error(`Timeout after ${timeout}ms`);
    throw error;
  }
};

export const consumetApi = {
  async search(query) {
    try {
      console.log(`[API] Searching: ${query}`);
      const response = await fetchWithTimeout(
        `${LOCAL_API_URL}/search/${encodeURIComponent(query)}`,
        {},
        8000,
      );

      if (response.status === 429) throw new Error('TOO_MANY_REQUESTS');
      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data = await response.json();
      if (data.results?.length) {
        console.log(`[API] ✅ Found ${data.results.length} results`);
        return data;
      }
      throw new Error('No results');
    } catch (e) {
      if (e.message === 'TOO_MANY_REQUESTS') {
        alert('You are searching too fast. Please wait a moment.');
        return [];
      }
      console.warn(`[API] ⚠️ Primary search failed: ${e.message}`);
      try {
        console.log(`[API] Trying fallback for: ${query}`);
        const response = await fetchWithTimeout(
          `${FALLBACK_API_URL}/${encodeURIComponent(query)}`,
          {},
          5000,
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        console.log(`[API] ✅ Fallback found results`);
        return data;
      } catch (err) {
        console.error(`[API] ❌ All search failed: ${err.message}`);
        return [];
      }
    }
  },

  async getInfo(id, provider = 'anilist') {
    try {
      console.log(`[API] Getting info: ${id}`);
      const response = await fetchWithTimeout(
        `${LOCAL_API_URL}/info/${id}?provider=${provider}`,
        {},
        8000,
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      if (data.episodes?.length) {
        console.log(`[API] ✅ Found ${data.episodes.length} episodes`);
        return data;
      }
      throw new Error('No episodes');
    } catch (e) {
      console.warn(`[API] ⚠️ getInfo failed: ${e.message}`);
      try {
        const response = await fetchWithTimeout(`${FALLBACK_API_URL}/info/${id}`, {}, 5000);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        console.log(`[API] ✅ Fallback getInfo found episodes`);
        return data;
      } catch (err) {
        console.error(`[API] ❌ All getInfo failed: ${err.message}`);
        return { episodes: [] };
      }
    }
  },

  async getSources(episodeId, episodeNumber, animeId) {
    // 1. Try Anify
    if (episodeId && isNaN(episodeId)) {
      try {
        const anifyRes = await fetchWithTimeout(
          `https://api.anify.tv/sources?providerId=gogoanime&watchId=${episodeId}&episodeNumber=${episodeNumber}&id=${animeId}&subType=sub`,
          {},
          5000,
        );
        if (anifyRes.ok) {
          const data = await anifyRes.json();
          if (data?.sources) {
            console.log(`[API] ✅ Anify found ${data.sources.length} sources`);
            return { sources: data.sources.map(s => ({ url: s.url, quality: s.quality || 'auto' })) };
          }
        }
      } catch (e) {
        console.warn(`[API] Anify failed: ${e.message}`);
      }
    }

    // 2. Try local server
    try {
      console.log(`[API] Getting sources: ${episodeId}`);
      const response = await fetchWithTimeout(
        `${LOCAL_API_URL}/watch/${episodeId}`,
        {},
        6000,
      );
      if (response.ok) {
        const data = await response.json();
        console.log(`[API] ✅ Local sources found`);
        return data;
      }
      throw new Error(`Status ${response.status}`);
    } catch (e) {
      console.warn(`[API] Local getSources failed: ${e.message}`);
    }

    // 3. Fallback
    try {
      const fallbackRes = await fetchWithTimeout(`${FALLBACK_API_URL}/watch/${episodeId}`, {}, 5000);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        console.log(`[API] ✅ Fallback sources found`);
        return data;
      }
      throw new Error(`Status ${fallbackRes.status}`);
    } catch (e) {
      console.error(`[API] All getSources failed: ${e.message}`);
    }

    return { sources: [], isFallback: true };
  },
};
