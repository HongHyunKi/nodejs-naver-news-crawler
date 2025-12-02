import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_NEWS_API_URL = 'https://openapi.naver.com/v1/search/news.json';

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>Naver News Browser</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 50px auto; padding: 0 20px; }
        h1 { color: #03C75A; }
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
        .tab { padding: 10px 20px; cursor: pointer; background: none; border: none; font-size: 16px; border-bottom: 3px solid transparent; }
        .tab.active { border-bottom-color: #03C75A; color: #03C75A; font-weight: bold; }
        .tab:hover { background: #f5f5f5; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        form { margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
        input, select, button { padding: 10px; margin: 5px; font-size: 16px; }
        button[type="submit"] { background: #03C75A; color: white; border: none; cursor: pointer; border-radius: 4px; }
        button[type="submit"]:hover { background: #02b350; }
        .response { margin-top: 20px; }
        pre { background: #f5f5f5; padding: 20px; border-radius: 8px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>Naver News Browser</h1>

      <div class="tabs">
        <button class="tab active" onclick="switchTab('api')">방법 1: 네이버 뉴스 API</button>
        <button class="tab" onclick="switchTab('crawling')">방법 2: 네이버 뉴스 크롤링</button>
      </div>

      <!-- 방법 1: API -->
      <div id="api" class="tab-content active">
        <h2>네이버 뉴스 API</h2>
        <p>네이버 개발자센터에서 제공하는 공식 API를 사용합니다.</p>
        <form id="apiForm">
          <input type="text" id="apiQuery" placeholder="검색어 입력" value="삼성전자" required>
          <input type="number" id="apiDisplay" placeholder="결과 수" value="5" min="1" max="100">
          <input type="number" id="apiStart" placeholder="시작 위치" value="1" min="1" max="1000">
          <select id="apiSort">
            <option value="sim">정확도순</option>
            <option value="date" selected>최신순</option>
          </select>
          <button type="submit">검색</button>
        </form>
        <div id="apiResponse" class="response"></div>
      </div>

      <!-- 방법 2: Crawling -->
      <div id="crawling" class="tab-content">
        <h2>네이버 금융 종목 뉴스 크롤링</h2>
        <p>네이버 금융 종목 뉴스 페이지를 직접 크롤링합니다. (API 키 불필요)</p>
        <form id="crawlingForm">
          <input type="text" id="crawlQuery" placeholder="종목코드 입력 (예: 005930)" value="005930" required>
          <input type="number" id="crawlDisplay" placeholder="결과 수" value="10" min="1" max="100">
          <input type="number" id="crawlPage" placeholder="페이지" value="1" min="1">
          <button type="submit">크롤링</button>
        </form>
        <div id="crawlingResponse" class="response"></div>
      </div>

      <script>
        function switchTab(tab) {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          event.target.classList.add('active');
          document.getElementById(tab).classList.add('active');
        }

        // API 검색
        document.getElementById('apiForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const query = document.getElementById('apiQuery').value;
          const display = document.getElementById('apiDisplay').value;
          const start = document.getElementById('apiStart').value;
          const sort = document.getElementById('apiSort').value;

          const responseDiv = document.getElementById('apiResponse');
          responseDiv.innerHTML = '<p>Loading...</p>';

          try {
            const response = await fetch(\`/api/search?query=\${encodeURIComponent(query)}&display=\${display}&start=\${start}&sort=\${sort}\`);
            const data = await response.json();
            responseDiv.innerHTML = '<h3>Full Response Object:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            responseDiv.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
          }
        });

        // 크롤링 검색
        document.getElementById('crawlingForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const query = document.getElementById('crawlQuery').value;
          const display = document.getElementById('crawlDisplay').value;
          const page = document.getElementById('crawlPage').value;

          const responseDiv = document.getElementById('crawlingResponse');
          responseDiv.innerHTML = '<p>Loading...</p>';

          try {
            const response = await fetch(\`/api/crawl?query=\${encodeURIComponent(query)}&display=\${display}&page=\${page}\`);
            const data = await response.json();
            responseDiv.innerHTML = '<h3>Crawled Data:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            responseDiv.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.get('/api/search', async (req, res) => {
  try {
    const { query, display = 10, start = 1, sort = 'sim' } = req.query;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return res.status(500).json({
        error: 'API credentials not found. Please check your .env file.'
      });
    }

    if (!query || query.trim() === '') {
      return res.status(400).json({
        error: 'Search query is required.'
      });
    }

    const response = await axios.get(NAVER_NEWS_API_URL, {
      params: { query, display, start, sort },
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      }
    });

    // 브라우저에서 보기 편하게 전체 response 객체를 반환
    res.json({
      axiosResponse: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: {
          url: response.config.url,
          method: response.config.method,
          params: response.config.params,
          headers: response.config.headers
        }
      },
      data: response.data
    });
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        error: `API Error: ${error.response.status} - ${error.response.statusText}`,
        details: error.response.data
      });
    } else if (error.request) {
      res.status(500).json({
        error: 'Network error: No response from server'
      });
    } else {
      res.status(500).json({
        error: error.message
      });
    }
  }
});

// 크롤링 엔드포인트 - 네이버 금융 종목 뉴스
app.get('/api/crawl', async (req, res) => {
  try {
    const { query, display = 10, page = 1 } = req.query;

    // query를 종목코드로 사용 (예: 005930 = 삼성전자)
    if (!query || query.trim() === '') {
      return res.status(400).json({
        error: 'Stock code is required (e.g., 005930 for Samsung Electronics)'
      });
    }

    // 네이버 금융 종목 뉴스 리스트 URL (iframe 내부 URL)
    const newsListUrl = `https://finance.naver.com/item/news_news.naver?code=${query}&page=${page}&sm=title_entity_id.basic&clusterId=`;

    const response = await axios.get(newsListUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: `https://finance.naver.com/item/news.naver?code=${query}`
      },
      responseType: 'arraybuffer'
    });

    // EUC-KR을 UTF-8로 변환
    const decodedData = iconv.decode(response.data, 'EUC-KR');
    const $ = cheerio.load(decodedData);
    const articles = [];

    // 뉴스 기사 파싱 (네이버 금융 테이블 구조)
    $('.type5 tbody tr').each((index, element) => {
      if (articles.length >= display) return false;

      const $row = $(element);

      // 제목이 있는 행만 처리 (광고나 공백 행 제외)
      const $title = $row.find('.title a');
      if ($title.length === 0) return;

      const title = $title.text().trim();
      const link = $title.attr('href');

      if (!title || !link) return;

      // URL에서 article_id, office_id, cluster_id 추출
      // 예: /item/news_read.naver?article_id=0002835090&office_id=009&code=005930&page=1&sm=title_entity_id.basic
      const urlParams = new URLSearchParams(link.split('?')[1]);
      const articleId = urlParams.get('article_id');
      const officeId = urlParams.get('office_id');

      // 연관기사 클래스 체크
      const isRelationHead = $row.hasClass('relation_lst');

      // 언론사명
      const provider = $row.find('.info').text().trim();

      // 날짜 파싱 (2025.12.01 19:39 형식)
      const dateStr = $row.find('.date').text().trim();
      let publishedAt = null;
      if (dateStr) {
        // "2025.12.01 19:39" -> "2025-12-01 19:39:00"
        const dateParts = dateStr.match(
          /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/
        );
        if (dateParts) {
          publishedAt = `${dateParts[1]}-${dateParts[2]}-${dateParts[3]} ${dateParts[4]}:${dateParts[5]}:00`;
        }
      }

      // 원문 링크 구성
      const originUrl = `https://finance.naver.com${link}`;

      // cluster_id는 연관기사 링크에서 추출 가능
      let clusterId = null;
      const $clusterLink = $row.find('.relation_lst_link');
      if ($clusterLink.length > 0) {
        const clusterUrl = $clusterLink.attr('href');
        if (clusterUrl) {
          const clusterParams = new URLSearchParams(clusterUrl.split('?')[1]);
          clusterId = clusterParams.get('clusterId');
        }
      }

      if (title && articleId && officeId) {
        articles.push({
          stock_code: query,
          article_id: articleId,
          office_id: officeId,
          title,
          provider,
          published_at: publishedAt,
          origin_url: originUrl,
          cluster_id: clusterId,
          is_relation_head: isRelationHead
        });
      }
    });

    res.json({
      method: 'crawling',
      stockCode: query,
      page: parseInt(page),
      display: parseInt(display),
      totalCrawled: articles.length,
      articles,
      sourceUrl: newsListUrl,
      crawledAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Crawling failed',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`Open your browser and go to http://localhost:${PORT}\n`);
});
