# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Node.js project that provides multiple methods to access Korean news articles:
1. **Naver News Search API** - Official API for searching news by keyword
2. **Naver Finance News Crawler** - Web scraping for stock-specific news
3. **Naver Finance News Detail Crawler** - Web scraping for full article content

The project includes both CLI tools and a web interface for testing.

## Environment Setup

This project uses ES modules (`"type": "module"` in package.json). All imports must use ES6 syntax.

**Required Environment Variables** (in `.env` file):
- `NAVER_CLIENT_ID`: Naver API client ID from [Naver Developers](https://developers.naver.com/main/)
- `NAVER_CLIENT_SECRET`: Naver API client secret

The `.env` file is excluded from git via `.gitignore` and should never be committed.

## Common Commands

```bash
# Install dependencies
npm install

# Run the web server (recommended for testing)
node server.js
# Then visit http://localhost:3000

# Run the CLI application
npm start

# Development mode with auto-reload
npm run dev

# Test news list crawler
npm test
# or: node test/test-crawler.js

# Test news detail crawler
node test/test-detail-crawler.js

# Debug crawler
npm run test:debug
# or: node test/debug-crawler.js

# Format code with Prettier
npx prettier --write .
```

## Code Architecture

### Project Structure

```
.
├── index.js                    # CLI tool for Naver News API
├── server.js                   # Express web server with test UI
├── utils/
│   └── newsCrawler.js          # News crawling utilities
└── test/                       # Test and debugging files
    ├── test-crawler.js         # Test for news list crawler
    ├── test-detail-crawler.js  # Test for news detail crawler
    ├── test-full-crawl.js      # Test for full crawling workflow
    ├── test-cluster-ids.js     # Test for cluster ID extraction
    ├── debug-crawler.js        # Debug version of crawler
    ├── debug-html.js           # HTML structure debugging
    ├── final-test.js           # Final integration test
    ├── verify-fix.js           # Verification script
    ├── analyze-structure.js    # HTML structure analyzer
    └── analyze-difference.js   # Difference analyzer
```

### Core Components

#### 1. Naver News API (`index.js`)

**`searchNaverNews` function** (lines 18-77):
- Main entry point for Naver News API calls
- Parameters: `query`, `display` (1-100), `start` (1-1000), `sort` ('sim'|'date')
- Returns normalized response with HTML tags stripped from titles/descriptions
- Error handling covers three scenarios: API errors, network errors, and validation errors

**API Response Format**:
- Strips HTML tags from `title` and `description` using regex `.replace(/<[^>]*>/g, '')`
- Maps `originallink` to `originalLink` for consistent camelCase
- Wraps response in a standardized object with `success`, `total`, `start`, `display`, and `items`

#### 2. News Crawling Utilities (`utils/newsCrawler.js`)

**`crawlNaverFinanceNews` function** (lines 157-222):
- Crawls Naver Finance stock news list pages
- Parameters:
  - `stockCode`: Stock code (e.g., '005930' for Samsung Electronics)
  - `display`: Number of articles to fetch (1-100, default: 10)
  - `page`: Page number (default: 1)
- Returns: Article list with metadata (title, provider, published_at, origin_url, article_id, office_id, cluster_id)
- Handles EUC-KR encoding conversion to UTF-8
- Parses HTML using cheerio

**`crawlNaverFinanceNewsDetail` function** (lines 229-315):
- Crawls full article content from Naver News pages
- Parameters:
  - `originUrl`: Article URL (from news list or direct URL)
- Returns: Detailed article data including:
  - `article_id`, `office_id`: Article identifiers
  - `title`: Article title
  - `provider`: News provider name
  - `published_at`: Publication date (ISO format)
  - `content`: Full article text content
  - `images`: Array of image URLs
  - `origin_url`: Original input URL
  - `actual_url`: Resolved news URL (n.news.naver.com)
- Automatically handles redirects from finance.naver.com to n.news.naver.com
- Extracts article_id and office_id from URL parameters or path

**Helper Functions**:
- `parsePublishedDate` (lines 10-27): Parses date strings in multiple formats
- `extractUrlParam` (lines 35-39): Extracts URL query parameters
- `extractArticleIds` (lines 46-67): Extracts article_id and office_id from URLs (supports both parameter and path formats)
- `extractClusterId` (lines 74-82): Extracts cluster ID from related articles
- `parseArticleRow` (lines 90-155): Parses individual article rows from HTML

#### 3. Web Server (`server.js`)

**Express server** with three main endpoints:

1. `GET /`: Serves HTML test interface with three tabs
   - Tab 1: Naver News API search
   - Tab 2: Finance news list crawling
   - Tab 3: News detail crawling with "Load Sample URL" feature

2. `GET /api/search`: Naver News API proxy
   - Query params: `query`, `display`, `start`, `sort`
   - Requires NAVER_CLIENT_ID and NAVER_CLIENT_SECRET

3. `GET /api/crawl`: Finance news list crawler endpoint
   - Query params: `query` (stock code), `display`, `page`
   - No API credentials required

4. `GET /api/crawl/detail`: News detail crawler endpoint
   - Query params: `url` (article URL)
   - No API credentials required

### Error Handling Pattern

Three-tier error handling in all async functions:
1. API response errors (HTTP status codes)
2. Network/request errors (no response)
3. Application errors (e.g., missing credentials, invalid URL)

## Code Style

Prettier configuration (`.prettierrc.json`):
- Single quotes
- Semicolons enabled
- 2-space indentation
- No trailing commas
- 80 character line width

When editing code, maintain consistency with this Prettier config.

## Technical Details

### URL Formats Supported

The crawler supports multiple Naver news URL formats:

1. **Finance News (Parameter style)**:
   ```
   https://finance.naver.com/item/news_read.naver?article_id=0006177016&office_id=018&code=005930
   ```

2. **News Portal (Path style)**:
   ```
   https://n.news.naver.com/mnews/article/018/0006177016
   ```

Both formats are automatically recognized and article_id/office_id are extracted accordingly.

### Encoding Handling

- Naver Finance pages use **EUC-KR** encoding
- The crawler automatically converts to UTF-8 using `iconv-lite`
- Naver News portal pages use UTF-8 natively

### Date Format Parsing

The `parsePublishedDate` function supports:
- Standard format: `2025-12-03 16:18:15` (used by n.news.naver.com)
- Dot format: `2025.12.01 19:39` (used by finance.naver.com)

## API Constraints

### Naver News Search API Limitations

- Maximum 100 results per request (`display` parameter)
- Start index limited to 1-1000
- Daily API call quotas apply (check Naver Developer Console)
- Results include both original article links and Naver News links

### Web Crawling Considerations

- Respects website structure as of December 2024
- Uses proper User-Agent headers to identify requests
- Implements polite crawling with appropriate referer headers
- HTML selectors may need updates if Naver changes page structure