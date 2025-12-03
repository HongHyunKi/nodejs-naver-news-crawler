import { crawlNaverFinanceNews } from './utils/newsCrawler.js';

async function test() {
  console.log('=== Testing Naver Finance News Crawler ===\n');

  try {
    const result = await crawlNaverFinanceNews({
      stockCode: '005930',
      display: 5,
      page: 1
    });

    console.log('Crawling Result:');
    console.log('- Method:', result.method);
    console.log('- Stock Code:', result.stockCode);
    console.log('- Page:', result.page);
    console.log('- Total Crawled:', result.totalCrawled);
    console.log('- Source URL:', result.sourceUrl);
    console.log('\nArticles:\n');

    result.articles.forEach((article, index) => {
      console.log(`[${index + 1}] ${article.title}`);
      console.log(`    Provider: ${article.provider}`);
      console.log(`    Published: ${article.published_at}`);
      console.log(`    URL: ${article.origin_url}`);
      console.log(
        `    Article ID: ${article.article_id}, Office ID: ${article.office_id}`
      );
      console.log(`    Cluster ID: ${article.cluster_id || 'N/A'}`);
      console.log(`    Is Relation Head: ${article.is_relation_head}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

test();