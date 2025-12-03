import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

/**
 * 웹사이트와 크롤링 결과 차이 분석 스크립트
 */
async function analyzeDifference() {
  const stockCode = '005930';

  console.log('=== 웹사이트 vs 크롤링 결과 차이 분석 ===\n');

  // 1. URL 파라미터 차이 테스트
  console.log('### 1. URL 파라미터 차이 테스트 ###\n');

  const urlWithoutSm = `https://finance.naver.com/item/news_news.naver?code=${stockCode}&page=1&clusterId=`;
  const urlWithSm = `https://finance.naver.com/item/news_news.naver?code=${stockCode}&page=1&sm=title_entity_id.basic&clusterId=`;

  console.log('URL 1 (sm 파라미터 없음):');
  console.log(urlWithoutSm);
  console.log('\nURL 2 (sm 파라미터 있음):');
  console.log(urlWithSm);

  const results = {};

  for (const [name, url] of [
    ['without_sm', urlWithoutSm],
    ['with_sm', urlWithSm]
  ]) {
    console.log(`\n크롤링 중: ${name}...`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: `https://finance.naver.com/item/news.naver?code=${stockCode}`
      },
      responseType: 'arraybuffer'
    });

    const decodedData = iconv.decode(response.data, 'EUC-KR');
    const $ = cheerio.load(decodedData);

    const articles = [];
    $('.type5 > tbody > tr').each((index, element) => {
      const $row = $(element);

      // relation_lst 건너뛰기
      if ($row.hasClass('relation_lst')) return true;

      const $titleLink = $row.find('.title a');
      const title = $titleLink.text().trim();

      if (title) {
        articles.push({
          class: $row.attr('class') || 'none',
          title: title,
          provider: $row.find('.info').text().trim(),
          date: $row.find('.date').text().trim()
        });
      }
    });

    results[name] = articles;
    console.log(`  → 총 ${articles.length}개 기사 크롤링됨`);
  }

  // 2. 결과 비교
  console.log('\n\n### 2. 크롤링 결과 비교 ###\n');

  console.log(
    `URL 1 (sm 없음): ${results.without_sm.length}개 기사`
  );
  console.log(`URL 2 (sm 있음): ${results.with_sm.length}개 기사`);

  // 3. 특정 키워드 검색
  console.log('\n\n### 3. 특정 키워드 검색 ###\n');

  const keywords = ['코리아 테크', '페스티벌', 'LG전자'];

  for (const keyword of keywords) {
    console.log(`\n"${keyword}" 검색 결과:`);

    for (const [name, articles] of Object.entries(results)) {
      const found = articles.filter((a) => a.title.includes(keyword));
      console.log(`  ${name}: ${found.length}개 발견`);
      found.forEach((article) => {
        console.log(`    - ${article.title}`);
        console.log(`      (${article.provider}, ${article.date})`);
      });
    }
  }

  // 4. 상위 10개 기사 제목 출력
  console.log('\n\n### 4. 상위 10개 기사 비교 ###\n');

  console.log('--- URL 1 (sm 없음) ---');
  results.without_sm.slice(0, 10).forEach((article, idx) => {
    console.log(`[${idx + 1}] ${article.title}`);
  });

  console.log('\n--- URL 2 (sm 있음) ---');
  results.with_sm.slice(0, 10).forEach((article, idx) => {
    console.log(`[${idx + 1}] ${article.title}`);
  });

  // 5. 시간 정보
  console.log('\n\n### 5. 크롤링 시간 정보 ###\n');
  console.log(`크롤링 시각: ${new Date().toISOString()}`);
  console.log(
    `로컬 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
  );

  // 6. 보고서용 요약
  console.log('\n\n=== 보고서용 요약 ===\n');
  console.log('웹사이트와 크롤링 결과가 다른 주요 원인:');
  console.log(
    '\n1. 시간 차이: 뉴스는 실시간으로 업데이트되며, 웹 브라우저로 확인한 시점과'
  );
  console.log('   크롤링 시점 사이에 기사 목록이 변경될 수 있습니다.');
  console.log(
    '\n2. URL 파라미터: sm 파라미터 유무에 따라 다른 결과가 반환될 수 있습니다.'
  );
  console.log(
    '\n3. 동적 콘텐츠: 웹 브라우저는 JavaScript를 실행하여 추가 콘텐츠를 로드할 수 있으나,'
  );
  console.log('   정적 크롤러(axios)는 초기 HTML만 가져옵니다.');
  console.log(
    '\n4. display 제한: 크롤러 설정에서 가져올 기사 수를 제한하면 일부 기사가'
  );
  console.log('   누락될 수 있습니다.');
}

analyzeDifference().catch(console.error);
