import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

/**
 * 날짜 문자열을 파싱하여 ISO 형식으로 변환
 * @param {string} dateStr - "2025.12.01 19:39" 또는 "2025-12-01 19:39:15" 형식의 날짜 문자열
 * @returns {string|null} ISO 형식의 날짜 문자열 또는 null
 */
function parsePublishedDate(dateStr) {
  if (!dateStr) return null;

  // 형식 1: "2025-12-01 19:39:15" (이미 표준 형식)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // 형식 2: "2025.12.01 19:39"
  const dateParts = dateStr.match(
    /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/
  );
  if (dateParts) {
    return `${dateParts[1]}-${dateParts[2]}-${dateParts[3]} ${dateParts[4]}:${dateParts[5]}:00`;
  }

  return null;
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
 * URL에서 article_id와 office_id 추출 (두 가지 형식 지원)
 * @param {string} url - URL 문자열
 * @returns {Object|null} {articleId, officeId} 또는 null
 */
function extractArticleIds(url) {
  if (!url) return null;

  // 형식 1: 파라미터 방식 (finance.naver.com/item/news_read.naver?article_id=...&office_id=...)
  let articleId = extractUrlParam(url, 'article_id');
  let officeId = extractUrlParam(url, 'office_id');

  if (articleId && officeId) {
    return { articleId, officeId };
  }

  // 형식 2: 경로 방식 (n.news.naver.com/mnews/article/{office_id}/{article_id})
  const pathMatch = url.match(/\/article\/(\d+)\/(\d+)/);
  if (pathMatch) {
    return {
      officeId: pathMatch[1],
      articleId: pathMatch[2]
    };
  }

  return null;
}

/**
 * 연관기사 그룹에서 cluster ID 추출
 * @param {cheerio.Cheerio} $row - 행 요소
 * @returns {string|null} cluster ID 또는 null
 */
function extractClusterId($row) {
  const classAttr = $row.attr('class');
  if (!classAttr) return null;

  // 예: "relation_lst _clusterId2150001233359"
  // 패턴: _clusterId{officeId}{articleId}
  const match = classAttr.match(/_clusterId(\d+)/);
  if (!match) return null;

  return match[1];
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

  // URL에서 article_id, office_id 추출 (두 가지 형식 지원)
  const ids = extractArticleIds(link);

  if (!ids) return null;

  const { articleId, officeId } = ids;

  // URL에서 cluster_id 직접 추출
  let clusterId = extractUrlParam(link, 'clusterId');

  // 연관기사 여부 확인
  const isRelationTit = $row.hasClass('relation_tit');
  const isRelationLst = $row.hasClass('relation_lst');
  const isRelationHead = isRelationTit || isRelationLst;

  // relation_tit은 cluster_id를 가지지 않음 (연관기사 그룹의 대표 기사)
  // cluster_id는 오직 relation_lst 내부의 연관기사들만 가짐
  if (isRelationTit) {
    clusterId = null;
  }

  // 언론사명
  const provider = $row.find('.info').text().trim();

  // 날짜 파싱
  const dateStr = $row.find('.date').text().trim();
  const publishedAt = parsePublishedDate(dateStr);

  // 원문 링크 구성 (절대 경로인 경우 그대로 사용, 상대 경로인 경우 도메인 추가)
  const originUrl = link.startsWith('http')
    ? link
    : `https://finance.naver.com${link}`;

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

  // display 값 유효성 검사 및 제한
  const validDisplay = Math.min(Math.max(1, parseInt(display) || 10), 100);

  // 네이버 금융 종목 뉴스 리스트 URL
  const newsListUrl = `https://finance.naver.com/item/news_news.naver?code=${stockCode}&page=${page}&sm=title_entity_id.basic&clusterId=`;

  const response = await fetch(newsListUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: `https://finance.naver.com/item/news.naver?code=${stockCode}`
    }
  });

  // ArrayBuffer로 받아서 EUC-KR을 UTF-8로 변환
  const arrayBuffer = await response.arrayBuffer();
  const decodedData = iconv.decode(Buffer.from(arrayBuffer), 'EUC-KR');
  const $ = cheerio.load(decodedData);
  const articles = [];

  // 뉴스 기사 파싱 (최상위 레벨의 tr만 선택, 중첩 테이블 제외)
  const $mainTable = $('.tb_cont > .type5').first();
  $mainTable.find('> tbody > tr').each((index, element) => {
    if (articles.length >= validDisplay) return false;

    const $row = $(element);

    // relation_lst는 연관기사 컨테이너 - 내부 기사 파싱 필요
    if ($row.hasClass('relation_lst')) {
      // relation_lst의 클래스에서 cluster_id 추출
      const clusterId = extractClusterId($row);

      // 중첩된 테이블의 기사들 파싱
      $row.find('table.type5 > tbody > tr').each((idx, nestedElement) => {
        if (articles.length >= validDisplay) return false;

        const $nestedRow = $(nestedElement);
        const nestedArticle = parseArticleRow($nestedRow, stockCode);

        if (nestedArticle) {
          // 연관기사에 cluster_id 설정
          nestedArticle.cluster_id = clusterId;
          nestedArticle.is_relation_head = false; // 연관기사는 head가 아님
          articles.push(nestedArticle);
        }
      });

      return true;
    }

    const article = parseArticleRow($row, stockCode);

    if (article) {
      articles.push(article);
    }
  });

  return {
    method: 'crawling',
    stockCode,
    page: parseInt(page),
    display: validDisplay,
    totalCrawled: articles.length,
    articles,
    sourceUrl: newsListUrl,
    crawledAt: new Date().toISOString()
  };
}

/**
 * 네이버 금융 뉴스 상세 페이지를 크롤링
 * @param {string} originUrl - 기사 원문 URL
 * @returns {Promise<Object>} 크롤링 결과
 */
export async function crawlNaverFinanceNewsDetail(originUrl) {
  if (!originUrl || originUrl.trim() === '') {
    throw new Error('Origin URL is required');
  }

  // URL에서 article_id, office_id 추출
  const ids = extractArticleIds(originUrl);
  if (!ids) {
    throw new Error('Unable to extract article_id and office_id from URL');
  }

  // 네이버 뉴스 직접 URL로 변환 (리다이렉트 없이 직접 접근)
  const directNewsUrl = `https://n.news.naver.com/mnews/article/${ids.officeId}/${ids.articleId}`;

  const response = await fetch(directNewsUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://finance.naver.com/'
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  // 제목 추출
  const title =
    $('h2#title_area span, h2.media_end_head_headline').text().trim() ||
    $('.newsct_article h2').text().trim();

  // 언론사명 추출
  const provider =
    $('img.media_end_head_top_logo_img').attr('alt')?.trim() ||
    $('.media_end_head_top_logo img').attr('alt')?.trim() ||
    $('.press_logo img').attr('alt')?.trim();

  // 날짜 추출
  const dateStr =
    $('.media_end_head_info_datestamp_time').attr('data-date-time')?.trim() ||
    $('.media_end_head_info time').text().trim() ||
    $('.article_info .t11').text().trim();
  const publishedAt = parsePublishedDate(dateStr);

  // 기사 본문 추출
  let content = '';
  const $newsContent = $('#dic_area, article#dic_area, #articeBody');
  if ($newsContent.length > 0) {
    // 본문 내용만 추출 (광고, 스크립트 등 제외)
    $newsContent.find('script, style, .ad, .aside, .link_news').remove();
    content = $newsContent.text().trim();
    // 여러 줄바꿈을 하나로 정리
    content = content.replace(/\n\s*\n/g, '\n');
  }

  // 기사 이미지 추출
  const images = [];
  $('#dic_area img, #articeBody img, .article_body img').each(
    (index, element) => {
      const imgSrc = $(element).attr('src') || $(element).attr('data-src');
      if (
        imgSrc &&
        !imgSrc.includes('blank.gif') &&
        !imgSrc.includes('logo') &&
        !imgSrc.includes('icon')
      ) {
        const absoluteUrl = imgSrc.startsWith('http')
          ? imgSrc
          : `https:${imgSrc}`;
        images.push(absoluteUrl);
      }
    }
  );

  return {
    article_id: ids.articleId,
    office_id: ids.officeId,
    title,
    provider,
    published_at: publishedAt,
    content,
    images,
    origin_url: originUrl,
    actual_url: directNewsUrl,
    crawledAt: new Date().toISOString()
  };
}
