import { crawlNaverFinanceNews } from '../utils/newsCrawler.js';

async function testFullCrawl() {
  console.log('=== Full Page Crawl Test ===\n');

  try {
    const result = await crawlNaverFinanceNews({
      stockCode: '005930',
      display: 50, // 최대 50개 크롤링
      page: 1
    });

    console.log(`Total Crawled: ${result.totalCrawled} articles\n`);

    // "코리아 테크" 또는 "광고" 키워드 검색
    const keywords = ['코리아 테크', '페스티벌', 'LG전자', '광고'];

    keywords.forEach((keyword) => {
      console.log(`\n--- Searching for: "${keyword}" ---`);
      const found = result.articles.filter((article) =>
        article.title.includes(keyword)
      );

      if (found.length > 0) {
        found.forEach((article, idx) => {
          console.log(`[${idx + 1}] ${article.title}`);
          console.log(`    Provider: ${article.provider}`);
          console.log(`    URL: ${article.origin_url}`);
        });
      } else {
        console.log(`Not found`);
      }
    });

    console.log('\n\n--- All Titles ---');
    result.articles.forEach((article, index) => {
      console.log(`[${index + 1}] ${article.title}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFullCrawl();