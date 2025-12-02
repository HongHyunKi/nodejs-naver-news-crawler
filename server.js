import express from 'express';
import axios from 'axios';
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
    <html>
    <head>
      <title>Naver News API Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 50px auto; padding: 0 20px; }
        h1 { color: #03C75A; }
        form { margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
        input, select, button { padding: 10px; margin: 5px; font-size: 16px; }
        button { background: #03C75A; color: white; border: none; cursor: pointer; border-radius: 4px; }
        button:hover { background: #02b350; }
        #response { margin-top: 20px; }
        pre { background: #f5f5f5; padding: 20px; border-radius: 8px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>Naver News API Browser</h1>
      <form id="searchForm">
        <input type="text" id="query" placeholder="검색어 입력" value="인공지능" required>
        <input type="number" id="display" placeholder="결과 수" value="5" min="1" max="100">
        <input type="number" id="start" placeholder="시작 위치" value="1" min="1" max="1000">
        <select id="sort">
          <option value="sim">정확도순</option>
          <option value="date" selected>최신순</option>
        </select>
        <button type="submit">검색</button>
      </form>
      <div id="response"></div>

      <script>
        document.getElementById('searchForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const query = document.getElementById('query').value;
          const display = document.getElementById('display').value;
          const start = document.getElementById('start').value;
          const sort = document.getElementById('sort').value;

          const responseDiv = document.getElementById('response');
          responseDiv.innerHTML = '<p>Loading...</p>';

          try {
            const response = await fetch(\`/api/search?query=\${encodeURIComponent(query)}&display=\${display}&start=\${start}&sort=\${sort}\`);
            const data = await response.json();

            responseDiv.innerHTML = '<h2>Full Response Object:</h2><pre>' + JSON.stringify(data, null, 2) + '</pre>';
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

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`Open your browser and go to http://localhost:${PORT}\n`);
});