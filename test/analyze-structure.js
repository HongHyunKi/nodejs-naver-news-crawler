import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';

const html = readFileSync('/tmp/naver-news.html', 'utf-8');
const $ = cheerio.load(html);

console.log('=== HTML Structure Analysis ===\n');

let count = 0;
$('.type5 > tbody > tr').each((index, element) => {
  if (count >= 20) return false;
  
  const $row = $(element);
  const classAttr = $row.attr('class') || 'no-class';
  const title = $row.find('.title a').first().text().trim().substring(0, 60);
  
  if (title) {
    count++;
    console.log(`\n[${count}] Row Index: ${index}`);
    console.log(`    Class: ${classAttr}`);
    console.log(`    Title: ${title}`);
    
    // Check if it's a relation_lst
    if ($row.hasClass('relation_lst')) {
      // Count nested articles
      const nestedCount = $row.find('table.type5 tbody tr').length;
      console.log(`    Nested articles: ${nestedCount}`);
    }
    
    // Check next sibling
    const $next = $row.next();
    if ($next.length > 0) {
      const nextClass = $next.attr('class') || 'no-class';
      if (nextClass.includes('relation')) {
        console.log(`    Next sibling class: ${nextClass}`);
      }
    }
  }
});
