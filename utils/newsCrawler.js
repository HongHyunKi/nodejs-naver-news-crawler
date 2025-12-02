import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

/**
 * 날짜 문자열을 파싱하여 ISO 형식으로 변환
 * @param {string} dateStr - "2025.12.01 19:39" 형식의 날짜 문자열
 * @returns {string|null} ISO 형식의 날짜 문자열 또는 null
 */
function parsePublishedDate(dateStr) {
  if (!dateStr) return null;

  const dateParts = dateStr.match(
    /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/
  );
  if (!dateParts) return null;

  return `${dateParts[1]}-${dateParts[2]}-${dateParts[3]} ${dateParts[4]}:${dateParts[5]}:00`;
}

/**
 * URL 파라미터에서 값을 추출
 * @param {string} url - URL 문자열
 * @param {string} paramName - 파라미터 이름
 * @returns {string|null} 파라미터 값 또는 null
 */
function extractUrlParam(url, paramName) {
  if (!url) return null;
  const urlParams = new URLSearchParams(url.split('?')[1]);
  return urlParams.get(paramName);
}

/**
 * 연관기사 그룹에서 cluster ID 추출
 * @param {cheerio.Cheerio} $row - 행 요소
 * @returns {string|null} cluster ID 또는 null
 */
function extractClusterId($row) {
  const $moreLink = $row.find('a.r_lnk');
  if ($moreLink.length === 0) return null;

  const moreLinkHref = $moreLink.attr('href');
  if (!moreLinkHref) return null;

  return extractUrlParam(moreLinkHref, 'clusterId');
}

/**
 * 뉴스 기사 HTML 요소를 파싱하여 객체로 변환
 * @param {cheerio.Cheerio} $row - 행 요소
 * @param {string} stockCode - 종목 코드
 * @returns {Object|null} 파싱된 기사 객체 또는 null
 */
function parseArticleRow($row, stockCode) {
  const $ = cheerio.load($row.html());

  // 제목이 있는 행만 처리 (광고나 공백 행 제외)
  const $title = $row.find('.title a');
  if ($title.length === 0) return null;

  const title = $title.text().trim();
  const link = $title.attr('href');

  if (!title || !link) return null;

  // URL에서 article_id, office_id 추출
  const articleId = extractUrlParam(link, 'article_id');
  const officeId = extractUrlParam(link, 'office_id');

  if (!articleId || !officeId) return null;

  // URL에서 cluster_id 직접 추출
  let clusterId = extractUrlParam(link, 'clusterId');

  // 연관기사 여부 확인
  const isRelationTit = $row.hasClass('relation_tit');
  const isRelationLst = $row.hasClass('relation_lst');
  const isRelationHead = isRelationTit || isRelationLst;

  // 연관기사 더보기 링크에서 clusterId 추출 (대표 기사인 경우)
  if (!clusterId && isRelationTit) {
    clusterId = extractClusterId($row);
  }

  // 언론사명
  const provider = $row.find('.info').text().trim();

  // 날짜 파싱
  const dateStr = $row.find('.date').text().trim();
  const publishedAt = parsePublishedDate(dateStr);

  // 원문 링크 구성
  const originUrl = `https://finance.naver.com${link}`;

  return {
    stock_code: stockCode,
    article_id: articleId,
    office_id: officeId,
    title,
    provider,
    published_at: publishedAt,
    origin_url: originUrl,
    cluster_id: clusterId,
    is_relation_head: isRelationHead
  };
}

/**
 * 네이버 금융 종목 뉴스 페이지를 크롤링
 * @param {Object} options - 크롤링 옵션
 * @param {string} options.stockCode - 종목 코드 (예: 005930)
 * @param {number} [options.display=10] - 가져올 기사 수
 * @param {number} [options.page=1] - 페이지 번호
 * @returns {Promise<Object>} 크롤링 결과
 */
export async function crawlNaverFinanceNews({
  stockCode,
  display = 10,
  page = 1
}) {
  if (!stockCode || stockCode.trim() === '') {
    throw new Error(
      'Stock code is required (e.g., 005930 for Samsung Electronics)'
    );
  }

  // 네이버 금융 종목 뉴스 리스트 URL
  const newsListUrl = `https://finance.naver.com/item/news_news.naver?code=${stockCode}&page=${page}&sm=title_entity_id.basic&clusterId=`;

  const response = await axios.get(newsListUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: `https://finance.naver.com/item/news.naver?code=${stockCode}`
    },
    responseType: 'arraybuffer'
  });

  console.log('response', response);

  // EUC-KR을 UTF-8로 변환
  const decodedData = iconv.decode(response.data, 'EUC-KR');
  const $ = cheerio.load(decodedData);
  const articles = [];

  // 뉴스 기사 파싱
  $('.type5 tbody tr').each((index, element) => {
    if (articles.length >= display) return false;

    const $row = $(element);
    const article = parseArticleRow($row, stockCode);

    if (article) {
      articles.push(article);
    }
  });

  return {
    method: 'crawling',
    stockCode,
    page: parseInt(page),
    display: parseInt(display),
    totalCrawled: articles.length,
    articles,
    sourceUrl: newsListUrl,
    crawledAt: new Date().toISOString()
  };
}
