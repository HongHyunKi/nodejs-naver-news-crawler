# Naver News API Sample Project

네이버 뉴스 검색 API를 활용한 Node.js 샘플 프로젝트입니다.

## 주요 기능

- 네이버 뉴스 검색 API 연동
- 검색 키워드로 뉴스 기사 검색
- 정렬 옵션 지원 (유사도순, 최신순)
- HTML 태그 제거 및 결과 포맷팅
- 에러 핸들링

## 설치 방법

1. 저장소 클론 또는 다운로드
2. 의존성 패키지 설치:
```bash
npm install
```

## 환경 설정

`.env` 파일을 생성하고 네이버 개발자센터에서 발급받은 API 키를 입력하세요:

```env
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
```

### 네이버 API 키 발급 방법

1. [네이버 개발자센터](https://developers.naver.com/main/) 접속
2. 로그인 후 'Application > 애플리케이션 등록' 메뉴 선택
3. '검색' API 선택
4. Client ID와 Client Secret 확인

## 사용 방법

### 프로젝트 실행

```bash
npm start
```

### 개발 모드 (nodemon)

```bash
npm run dev
```

## API 함수 사용법

### searchNaverNews(query, display, start, sort)

네이버 뉴스를 검색하는 함수입니다.

**파라미터:**
- `query` (string, 필수): 검색 키워드
- `display` (number, 선택): 검색 결과 개수 (1-100, 기본값: 10)
- `start` (number, 선택): 검색 시작 위치 (1-1000, 기본값: 1)
- `sort` (string, 선택): 정렬 방식
  - `'sim'`: 정확도순 (기본값)
  - `'date'`: 날짜순

**반환값:**
```javascript
{
  success: true,
  total: 12345,          // 전체 검색 결과 수
  start: 1,              // 검색 시작 위치
  display: 10,           // 출력 개수
  items: [
    {
      title: "뉴스 제목",
      originalLink: "원본 기사 URL",
      link: "네이버 뉴스 URL",
      description: "뉴스 설명",
      pubDate: "Tue, 02 Dec 2025 17:28:00 +0900"
    },
    ...
  ]
}
```

### 사용 예제

```javascript
// 예제 1: 최신 뉴스 5개 검색
const result = await searchNaverNews('인공지능', 5, 1, 'date');

// 예제 2: 정확도순으로 10개 검색
const result = await searchNaverNews('Node.js', 10, 1, 'sim');

// 예제 3: 11번째부터 20개 검색 (페이지네이션)
const result = await searchNaverNews('React', 20, 11, 'date');
```

## 프로젝트 구조

```
nodejs-naver-news-crawler/
├── index.js           # 메인 애플리케이션 파일
├── .env               # 환경 변수 (API 키)
├── .gitignore         # Git 제외 파일 목록
├── package.json       # 프로젝트 설정 및 의존성
├── .prettierrc.js     # Prettier 코드 포맷팅 설정
└── README.md          # 프로젝트 문서
```

## 코드 포맷팅

Prettier를 사용하여 코드 스타일을 관리합니다:

```bash
npx prettier --write .
```

## 주의사항

- `.env` 파일은 Git에 커밋되지 않도록 이미 `.gitignore`에 포함되어 있습니다
- API 키는 절대 공개 저장소에 업로드하지 마세요
- 네이버 검색 API는 일일 호출 한도가 있으니 참고하세요

## API 제한사항

- 검색 결과는 최대 100개까지 한 번에 요청 가능
- start 파라미터는 1부터 1000까지 지정 가능
- 일일 API 호출 횟수 제한이 있음 (네이버 개발자센터에서 확인)

## 라이선스

ISC

## 참고 문서

- [네이버 검색 API 가이드](https://developers.naver.com/docs/serviceapi/search/news/news.md)
- [Node.js 공식 문서](https://nodejs.org/)
- [Axios 문서](https://axios-http.com/)