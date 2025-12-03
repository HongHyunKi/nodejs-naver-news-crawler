import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

async function debug() {
  const stockCode = '005930';
  // 사용자가 제공한 URL과 동일한 형식
  const newsListUrl = `https://finance.naver.com/item/news_news.naver?code=${stockCode}&page=1&clusterId=`;

  console.log('Testing URL WITHOUT sm parameter:');
  console.log(newsListUrl, '\n');

  console.log('Fetching:', newsListUrl, '\n');

  const response = await axios.get(newsListUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: `https://finance.naver.com/item/news.naver?code=${stockCode}`
    },
    responseType: 'arraybuffer'
  });

  const decodedData = iconv.decode(response.data, 'EUC-KR');
  const $ = cheerio.load(decodedData);

  console.log('=== Analyzing top-level <tr> elements ===\n');

  let count = 0;
  $('.type5 > tbody > tr').each((index, element) => {
    if (count >= 10) return false;

    const $row = $(element);
    const classes = $row.attr('class') || 'no-class';

    // relation_lst 건너뛰기
    if ($row.hasClass('relation_lst')) {
      console.log(`[${count}] SKIPPED - <tr class="${classes}"> (relation_lst container)`);
      return true;
    }

    const $titleLink = $row.find('.title a');
    const title = $titleLink.text().trim();
    const link = $titleLink.attr('href');
    const provider = $row.find('.info').text().trim();
    const date = $row.find('.date').text().trim();

    console.log(`[${count}] <tr class="${classes}">`);
    console.log(`    Title: ${title || 'N/A'}`);
    console.log(`    Link: ${link || 'N/A'}`);
    console.log(`    Provider: ${provider || 'N/A'}`);
    console.log(`    Date: ${date || 'N/A'}`);
    console.log('');

    count++;
  });
}

debug().catch(console.error);