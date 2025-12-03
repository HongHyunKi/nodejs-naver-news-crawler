import {
  crawlNaverFinanceNews,
  crawlNaverFinanceNewsDetail
} from './utils/newsCrawler.js';

async function test() {
  console.log('=== Testing Naver Finance News Detail Crawler ===\n');

  try {
    // 먼저 뉴스 목록을 가져옵니다
    console.log('Step 1: Fetching news list...\n');
    const listResult = await crawlNaverFinanceNews({
      stockCode: '005930',
      display: 3,
      page: 1
    });

    console.log(`Found ${listResult.totalCrawled} articles\n`);

    // 첫 번째 기사의 상세 정보를 가져옵니다
    if (listResult.articles.length > 0) {
      const firstArticle = listResult.articles[0];
      console.log('Step 2: Fetching article detail...\n');
      console.log(`Article URL: ${firstArticle.origin_url}\n`);

      const detailResult = await crawlNaverFinanceNewsDetail(
        firstArticle.origin_url
      );

      console.log('=== Article Detail ===');
      console.log('Title:', detailResult.title);
      console.log('Provider:', detailResult.provider);
      console.log('Published:', detailResult.published_at);
      console.log('Article ID:', detailResult.article_id);
      console.log('Office ID:', detailResult.office_id);
      console.log('Images:', detailResult.images.length, 'images found');
      console.log('\nContent Preview:');
      console.log(detailResult.content.substring(0, 300) + '...');
      console.log('\n=== Full Response ===');
      console.log(JSON.stringify(detailResult, null, 2));
    } else {
      console.log('No articles found');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

test();