import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';

const html = readFileSync('/tmp/naver-news.html', 'utf-8');
const $ = cheerio.load(html);

console.log('=== Analyzing HTML structure ===\n');

$('.type5 > tbody > tr').each((index, element) => {
  const $row = $(element);
  const classAttr = $row.attr('class') || '';

  if (classAttr.includes('relation')) {
    const title = $row.find('.title a').text().trim().substring(0, 50);
    console.log(`Row ${index}:`);
    console.log(`  Class: ${classAttr}`);
    console.log(`  Title: ${title}`);

    // Check for clusterId in class
    const clusterMatch = classAttr.match(/_clusterId(\d+)/);
    if (clusterMatch) {
      console.log(`  ClusterId found: ${clusterMatch[1]}`);
    }
    console.log('');
  }
});
