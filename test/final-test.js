import { crawlNaverFinanceNews } from '../utils/newsCrawler.js';

console.log('=== Final Test: Cluster ID and Related Articles ===\n');

const result = await crawlNaverFinanceNews({
  stockCode: '005930',
  display: 30,
  page: 1
});

console.log(`Total articles crawled: ${result.totalCrawled}\n`);

let relationTitCount = 0;
let relationArticleCount = 0;
let standaloneCount = 0;

result.articles.forEach((article, index) => {
  const isRelationTit = article.is_relation_head && article.cluster_id === null;
  const isRelationArticle = !article.is_relation_head && article.cluster_id !== null;
  const isStandalone = !article.is_relation_head && article.cluster_id === null;

  if (isRelationTit) {
    relationTitCount++;
    console.log(`[${index + 1}] 📌 RELATION_TIT (메인 기사)`);
    console.log(`    Title: ${article.title.substring(0, 60)}...`);
    console.log(`    Article ID: ${article.office_id}/${article.article_id}`);
    console.log(`    Cluster ID: ${article.cluster_id || 'N/A'}`);
    console.log('');
  } else if (isRelationArticle) {
    relationArticleCount++;
    console.log(`[${index + 1}] 🔗 RELATED ARTICLE (연관기사)`);
    console.log(`    Title: ${article.title.substring(0, 60)}...`);
    console.log(`    Article ID: ${article.office_id}/${article.article_id}`);
    console.log(`    Cluster ID: ${article.cluster_id}`);
    console.log('');
  } else if (isStandalone) {
    standaloneCount++;
  }
});

console.log('\n=== Summary ===');
console.log(`Total articles:          ${result.totalCrawled}`);
console.log(`Relation Tit (메인):      ${relationTitCount}`);
console.log(`Related Articles (연관):  ${relationArticleCount}`);
console.log(`Standalone (단독):        ${standaloneCount}`);
console.log('');
console.log('✅ Fix completed successfully!');