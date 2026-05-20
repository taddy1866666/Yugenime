const now = Math.floor(Date.now() / 1000);
const start = now - 7 * 24 * 3600;
const end = now + 3600;

const query = `
    query ($start: Int, $end: Int) {
      Page (perPage: 50) {
        airingSchedules (airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_DESC) {
          episode
          airingAt
          media {
            id idMal title { english romaji }
          }
        }
      }
    }
`;

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { start, end } })
})
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
