import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import {
  crawlNaverFinanceNews,
  crawlNaverFinanceNewsDetail
} from './utils/newsCrawler.js';

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
        input[type="text"] { width: 500px; }
        button[type="submit"] { background: #03C75A; color: white; border: none; cursor: pointer; border-radius: 4px; }
        button[type="submit"]:hover { background: #02b350; }
        .response { margin-top: 20px; }
        pre { background: #f5f5f5; padding: 20px; border-radius: 8px; overflow-x: auto; max-height: 600px; }
        .article-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 10px 0; }
        .article-card h4 { margin: 0 0 10px 0; color: #333; }
        .article-card .meta { color: #666; font-size: 14px; margin: 5px 0; }
        .article-card .content { color: #444; line-height: 1.6; margin: 10px 0; white-space: pre-wrap; }
        .article-card .images { margin: 10px 0; }
        .article-card .images img { max-width: 100%; height: auto; margin: 5px 0; border-radius: 4px; }
        .test-btn { background: #0066cc; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-left: 10px; }
        .test-btn:hover { background: #0052a3; }
      </style>
    </head>
    <body>
      <h1>Naver News Browser</h1>

      <div class="tabs">
        <button class="tab active" onclick="switchTab(event, 'api')">방법 1: 네이버 뉴스 API</button>
        <button class="tab" onclick="switchTab(event, 'crawling')">방법 2: 네이버 뉴스 크롤링</button>
        <button class="tab" onclick="switchTab(event, 'detail')">뉴스 상세 크롤링</button>
      </div>

      <!-- 방법 1: API -->
      <div id="api" class="tab-content active">
        <h2>네이버 뉴스 API</h2>
        <p>네이버 개발자센터에서 제공하는 공식 API를 사용합니다.</p>
        <form id="apiForm">
          <input type="text" id="apiQuery" placeholder="검색어 입력" value="삼성전자" required>
          <input type="number" id="apiDisplay" placeholder="결과 수" value="5" min="1" >
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
          <input type="number" id="crawlDisplay" placeholder="결과 수" value="10" min="1">
          <input type="number" id="crawlPage" placeholder="페이지" value="1" min="1">
          <button type="submit">크롤링</button>
        </form>
        <div id="crawlingResponse" class="response"></div>
      </div>

      <!-- 방법 3: News Detail Crawling -->
      <div id="detail" class="tab-content">
        <h2>네이버 금융 뉴스 상세 크롤링</h2>
        <p>네이버 금융 뉴스의 상세 내용(본문, 이미지 등)을 크롤링합니다.</p>
        <form id="detailForm">
          <input type="text" id="detailUrl" placeholder="뉴스 URL 입력" value="https://finance.naver.com/item/news_read.naver?article_id=0006177016&office_id=018&code=005930" required>
          <button type="submit">상세 크롤링</button>
          <button type="button" class="test-btn" onclick="loadSampleUrl()">샘플 URL 로드</button>
        </form>
        <div id="detailResponse" class="response"></div>
      </div>

      <script>
        function switchTab(e, tab) {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          e.target.classList.add('active');
          document.getElementById(tab).classList.add('active');
        }

        // 샘플 URL 로드
        async function loadSampleUrl() {
          const responseDiv = document.getElementById('detailResponse');
          responseDiv.innerHTML = '<p>샘플 뉴스 목록을 가져오는 중...</p>';

          try {
            const response = await fetch('/api/crawl?query=005930&display=3&page=1');
            const data = await response.json();

            if (data.articles && data.articles.length > 0) {
              const firstArticle = data.articles[0];
              document.getElementById('detailUrl').value = firstArticle.origin_url;
              responseDiv.innerHTML = '<p style="color: green;">샘플 URL이 로드되었습니다. "상세 크롤링" 버튼을 클릭하세요.</p>';
            } else {
              responseDiv.innerHTML = '<p style="color: red;">뉴스를 찾을 수 없습니다.</p>';
            }
          } catch (error) {
            responseDiv.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
          }
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

        // 상세 크롤링
        document.getElementById('detailForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const url = document.getElementById('detailUrl').value;

          const responseDiv = document.getElementById('detailResponse');
          responseDiv.innerHTML = '<p>상세 정보를 크롤링하는 중...</p>';

          try {
            const response = await fetch(\`/api/crawl/detail?url=\${encodeURIComponent(url)}\`);
            const data = await response.json();

            if (data.error) {
              responseDiv.innerHTML = '<p style="color: red;">Error: ' + data.message + '</p>';
              return;
            }

            // 아티클 카드 형식으로 표시
            let html = '<div class="article-card">';
            html += '<h4>' + (data.title || 'N/A') + '</h4>';
            html += '<div class="meta">언론사: ' + (data.provider || 'N/A') + '</div>';
            html += '<div class="meta">발행일: ' + (data.published_at || 'N/A') + '</div>';
            html += '<div class="meta">Article ID: ' + data.article_id + ' | Office ID: ' + data.office_id + '</div>';

            if (data.images && data.images.length > 0) {
              html += '<div class="images">';
              html += '<strong>이미지 (' + data.images.length + '개):</strong><br>';
              data.images.forEach(img => {
                html += '<img src="' + img + '" alt="기사 이미지">';
              });
              html += '</div>';
            }

            html += '<div class="content"><strong>본문:</strong><br>' + (data.content || 'N/A') + '</div>';
            html += '</div>';

            html += '<h3>Raw JSON:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';

            responseDiv.innerHTML = html;
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

    const result = await crawlNaverFinanceNews({
      stockCode: query,
      display: parseInt(display),
      page: parseInt(page)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Crawling failed',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

// 크롤링 엔드포인트 - 네이버 금융 뉴스 상세
app.get('/api/crawl/detail', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'URL parameter is required'
      });
    }

    const result = await crawlNaverFinanceNewsDetail(url);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Crawling detail failed',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`Open your browser and go to http://localhost:${PORT}\n`);
});
