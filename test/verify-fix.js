import { crawlNaverFinanceNews } from '../utils/newsCrawler.js';

console.log('=== Verifying Cluster ID Fix ===\n');

const result = await crawlNaverFinanceNews({
  stockCode: '005930',
  display: 20,
  page: 1
});

console.log(`✓ Successfully crawled ${result.totalCrawled} articles\n`);

// Analyze cluster IDs
const stats = {
  total: result.totalCrawled,
  withClusterId: 0,
  withoutClusterId: 0,
  relationHeads: 0,
  standalone: 0
};

result.articles.forEach((article, index) => {
  if (article.cluster_id) {
    stats.withClusterId++;
    console.log(`[${index + 1}] ✓ Cluster ID: ${article.cluster_id}`);
    console.log(`    Title: ${article.title.substring(0, 60)}...`);
    console.log(`    Office: ${article.office_id}, Article: ${article.article_id}`);

    // Verify pattern: clusterId = officeId + articleId
    const expectedClusterId = article.office_id + article.article_id;
    if (article.cluster_id === expectedClusterId) {
      console.log(`    Pattern: CORRECT ✓`);
    } else {
      console.log(`    Pattern: MISMATCH! Expected ${expectedClusterId}`);
    }
  } else {
    stats.withoutClusterId++;
  }

  if (article.is_relation_head) {
    stats.relationHeads++;
  } else {
    stats.standalone++;
  }

  if (article.cluster_id) {
    console.log('');
  }
});

console.log('\n=== Summary ===');
console.log(`Total articles:           ${stats.total}`);
console.log(`With cluster ID:          ${stats.withClusterId}`);
console.log(`Without cluster ID:       ${stats.withoutClusterId}`);
console.log(`Relation heads:           ${stats.relationHeads}`);
console.log(`Standalone articles:      ${stats.standalone}`);

// Verify fix
const allRelationHeadsHaveClusterId = result.articles
  .filter(a => a.is_relation_head)
  .every(a => a.cluster_id !== null);

console.log('\n=== Verification ===');
if (allRelationHeadsHaveClusterId) {
  console.log('✓ All relation heads have cluster IDs - FIX SUCCESSFUL! ✓');
} else {
  console.log('✗ Some relation heads are missing cluster IDs - ISSUE DETECTED');
}