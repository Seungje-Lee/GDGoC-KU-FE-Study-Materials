/**
 * ==================================================================
 * app/layout.js — 모든 페이지를 감싸는 껍데기 (App Router 필수 파일)
 * ==================================================================
 *
 * App Router 에서는 이 파일이 <html> 과 <body> 를 직접 만듭니다.
 * Vite 프로젝트의 index.html 자리를 이 파일이 대신한다고 보면 됩니다.
 *
 * ★ 이 파일에도 'use client' 가 없습니다 → 서버 컴포넌트입니다.
 *   즉 이 레이아웃은 서버에서 HTML 문자열로 만들어져서 브라우저로 갑니다.
 *
 * [한글 깨짐 방지]
 *   <html lang="ko"> 로 언어를 명시합니다.
 *   <meta charset="utf-8"> 는 Next.js 가 자동으로 넣어주므로 직접 쓰지 않습니다.
 *   (App Router 에서 <head> 를 직접 쓰지 않고 metadata 로 다루는 게 규칙입니다)
 * ==================================================================
 */

import './globals.css';
import Link from 'next/link';

/**
 * NEXT_PUBLIC_SITE_NAME — 빌드 시점에 코드로 박히는 환경변수입니다.
 *
 * ★ 3회차에서 배운 VITE_* 규칙과 **정확히 같습니다.**
 *   NEXT_PUBLIC_ 으로 시작하는 값은 빌드할 때 문자열로 치환되어
 *   번들 안에 들어갑니다. 그래서 컨테이너를 docker run -e 로 띄워도 안 바뀝니다.
 *   바꾸려면 다시 빌드해야 합니다.
 *
 *     docker build --build-arg NEXT_PUBLIC_SITE_NAME="사내 단어장" -t my-vocab-next:stg .
 *
 *   반대로 lib/words.js 의 API_URL 은 NEXT_PUBLIC_ 이 안 붙어서
 *   서버에서만 읽히고, 실행 시점에 -e 로 바꿀 수 있습니다.
 *   같은 앱 안에 두 종류의 환경변수가 공존하는 셈입니다. 이 차이를 꼭 짚으세요.
 *
 *   ※ 서버 컴포넌트에서 process.env 를 읽을 때는 반드시 이렇게
 *     "전체 이름을 그대로" 써야 합니다. process.env[변수명] 처럼 동적으로 쓰면
 *     빌드 시점 치환이 일어나지 않습니다.
 */
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || '나만의 단어장';

/**
 * metadata — App Router 방식의 <head> 설정입니다.
 * 이 값들은 **서버에서** <title>, <meta> 태그로 렌더됩니다.
 *
 * ★ 4회차 심화 포인트:
 *   CSR 앱은 이 태그들을 브라우저가 JS 를 실행한 뒤에야 바꿉니다.
 *   그래서 카톡·슬랙 링크 미리보기 봇은 아무것도 못 봅니다.
 *   SSR 은 처음 보낸 HTML 에 이미 들어 있습니다. 직접 확인해 보세요.
 *
 *     curl -s http://localhost:3000 | grep -o 'og:title[^>]*' | head -1
 */
export const metadata = {
  title: `${SITE_NAME} (Next.js SSR)`,
  description: '서버에서 미리 렌더링된 단어장입니다. 페이지 소스 보기로 확인해 보세요.',
  openGraph: {
    title: `${SITE_NAME} (Next.js SSR)`,
    description: '서버가 만들어서 보낸 HTML 에 단어와 뜻이 그대로 들어 있습니다.',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <header className="page-header">
          <p className="page-badge">Next.js 14 · App Router · SSR</p>
          <h1 className="page-title">
            {/* 빌드 시점에 박힌 값. --build-arg 로 바꾸면 여기 제목이 바뀝니다. */}
            <Link href="/">{SITE_NAME}</Link>
          </h1>
          <p className="page-subtitle">
            이 화면의 HTML 은 브라우저가 아니라 <strong>서버</strong>가 만들었습니다.
          </p>
        </header>

        {/* 각 페이지(page.js)의 내용이 여기에 들어옵니다. */}
        {children}

        <footer className="page-footer">
          <p>프론트엔드 스터디 4회차 · CSR vs SSR 비교용 완성본</p>
        </footer>
      </body>
    </html>
  );
}
