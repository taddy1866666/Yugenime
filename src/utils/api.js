export const fetchAniList = async (query, variables = {}) => {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const result = await res.json();
    return result.data?.Page?.media || result.data?.Page?.airingSchedules || [];
  } catch (e) {
    console.error("AniList Error:", e);
    return [];
  }
};
