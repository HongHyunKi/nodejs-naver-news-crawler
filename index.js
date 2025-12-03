import dotenv from 'dotenv';

dotenv.config();

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_NEWS_API_URL = 'https://openapi.naver.com/v1/search/news.json';

/**
 * Search Naver News API
 * @param {string} query - Search keyword
 * @param {number} display - Number of results (1-100, default: 10)
 * @param {number} start - Start index (1-1000, default: 1)
 * @param {string} sort - Sort order ('sim': similarity, 'date': recent date, default: 'sim')
 * @returns {Promise<Object>} Search results
 */
async function searchNaverNews(query, display = 10, start = 1, sort = 'sim') {
  try {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      throw new Error(
        'API credentials not found. Please check your .env file.'
      );
    }

    if (!query || query.trim() === '') {
      throw new Error('Search query is required.');
    }

    const url = new URL(NAVER_NEWS_API_URL);
    url.searchParams.append('query', query);
    url.searchParams.append('display', display);
    url.searchParams.append('start', start);
    url.searchParams.append('sort', sort);

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `API Error: ${response.status} - ${response.statusText}`,
        details: errorData
      };
    }

    const data = await response.json();

    return {
      success: true,
      total: data.total,
      start: data.start,
      display: data.display,
      items: data.items.map((item) => ({
        title: item.title.replace(/<[^>]*>/g, ''),
        originalLink: item.originallink,
        link: item.link,
        description: item.description.replace(/<[^>]*>/g, ''),
        pubDate: item.pubDate
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Display news search results
 */
function displayResults(results) {
  console.log('\n=== Naver News Search Results ===\n');

  if (!results.success) {
    console.error('Error:', results.error);
    if (results.details) {
      console.error('Details:', results.details);
    }
    return;
  }

  console.log(`Total Results: ${results.total}`);
  console.log(
    `Displaying: ${results.display} items (Starting from ${results.start})\n`
  );

  results.items.forEach((item, index) => {
    console.log(`[${index + 1}] ${item.title}`);
    console.log(`   Published: ${item.pubDate}`);
    console.log(`   Link: ${item.link}`);
    console.log(`   Description: ${item.description}`);
    console.log('');
  });
}

// Example usage
async function main() {
  console.log('=== Naver News API Sample Project ===\n');

  // Example 1: Search for "인공지능" (AI) news
  console.log('Example 1: Searching for "인공지능" news...');
  const result1 = await searchNaverNews('인공지능', 5, 1, 'date');
  displayResults(result1);

  // Example 2: Search for "Node.js" news
  console.log('\nExample 2: Searching for "Node.js" news...');
  const result2 = await searchNaverNews('Node.js', 3, 1, 'sim');
  displayResults(result2);
}

main();
