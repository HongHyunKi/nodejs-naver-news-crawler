# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Node.js sample project that integrates with Naver News Search API to search and retrieve Korean news articles. The project provides a simple interface to search news by keyword with various sorting and pagination options.

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

# Run the application
npm start

# Development mode with auto-reload
npm run dev

# Format code with Prettier
npx prettier --write .
```

## Code Architecture

### Single-File Design
The entire application logic resides in `index.js` - this is intentional for simplicity. The file contains:

1. **API Integration** (`searchNaverNews` function, lines 18-75):
   - Main entry point for Naver News API calls
   - Parameters: `query`, `display` (1-100), `start` (1-1000), `sort` ('sim'|'date')
   - Returns normalized response with HTML tags stripped from titles/descriptions
   - Error handling covers three scenarios: API errors, network errors, and validation errors

2. **Display Logic** (`displayResults` function, lines 80-103):
   - Console output formatting for search results
   - Handles both success and error states

3. **Main Execution** (`main` function, lines 106-120):
   - Demonstrates API usage with sample queries
   - Runs automatically when script executes

### API Response Format
The `searchNaverNews` function transforms Naver's raw API response into a cleaner format:
- Strips HTML tags from `title` and `description` using regex `.replace(/<[^>]*>/g, '')`
- Maps `originallink` to `originalLink` for consistent camelCase
- Wraps response in a standardized object with `success`, `total`, `start`, `display`, and `items`

### Error Handling Pattern
Three-tier error handling in the catch block (lines 57-73):
1. API response errors (HTTP status codes)
2. Network/request errors (no response)
3. Application errors (e.g., missing credentials, empty query)

## Code Style

Prettier configuration (`.prettierrc.json`):
- Single quotes
- Semicolons enabled
- 2-space indentation
- No trailing commas
- 80 character line width

When editing code, maintain consistency with this Prettier config.

## API Constraints

Naver News Search API limitations:
- Maximum 100 results per request (`display` parameter)
- Start index limited to 1-1000
- Daily API call quotas apply (check Naver Developer Console)
- Results include both original article links and Naver News links