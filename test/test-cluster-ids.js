import { crawlNaverFinanceNews } from '../utils/newsCrawler.js';

console.log('=== Testing Cluster ID Extraction ===\n');

const result = await crawlNaverFinanceNews({
  stockCode: '005930',
  display: 15,
  page: 1
});

console.log(`Total articles crawled: ${result.totalCrawled}\n`);

result.articles.forEach((article, index) => {
  console.log(`[${index + 1}] ${article.title.substring(0, 50)}`);
  console.log(`    Cluster ID: ${article.cluster_id || 'N/A'}`);
  console.log(`    Is Relation Head: ${article.is_relation_head}`);
  console.log('');
});

// Count how many have cluster IDs
const withCluster = result.articles.filter(a => a.cluster_id !== null).length;
const relationHeads = result.articles.filter(a => a.is_relation_head).length;

console.log(`\nSummary:`);
console.log(`- Total articles: ${result.totalCrawled}`);
console.log(`- With cluster ID: ${withCluster}`);
console.log(`- Relation heads: ${relationHeads}`);