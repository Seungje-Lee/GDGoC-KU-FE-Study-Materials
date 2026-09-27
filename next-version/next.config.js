/**
 * ==================================================================
 * next.config.js — 4회차의 핵심 설정 파일
 * ==================================================================
 *
 * ★★★ output: 'standalone' 이 이 파일의 전부입니다 ★★★
 *
 * [왜 필요한가]
 *
 * 3회차까지 우리가 배포한 것은 "파일"이었습니다.
 *   npm run build  →  dist/ 폴더  →  nginx 가 그 파일을 그냥 읽어서 준다.
 *
 * 그런데 Next.js 는 SSR(서버 렌더링)을 합니다.
 * 요청이 올 때마다 서버에서 HTML 을 "만들어서" 줍니다.
 * 즉 배포 대상이 파일이 아니라 **계속 살아 있는 Node 프로세스**입니다.
 *
 * 문제는, 그 Node 프로세스를 돌리려면 원래 이런 게 다 필요하다는 것입니다.
 *   - node_modules 전체 (수백 MB)
 *   - package.json
 *   - .next/ 빌드 결과물 전체
 *   - next 패키지 자체
 *
 * output: 'standalone' 을 켜면 Next 가 빌드할 때
 * "이 앱을 실제로 돌리는 데 필요한 것만" 골라서 .next/standalone/ 한 폴더에 모아줍니다.
 *
 *   .next/standalone/
 *   ├── server.js          ← Next 가 만들어 준 실행 파일. 이게 우리의 웹서버입니다.
 *   ├── node_modules/      ← 전체가 아니라, 실제로 import 되는 것만 추려서 담김
 *   ├── package.json
 *   └── .next/             ← 서버 렌더링에 필요한 빌드 결과물
 *
 * 그래서 Docker 이미지에 node_modules 전체를 넣지 않아도 됩니다.
 * (2단계 멀티스테이지 빌드에서 이미지 크기가 확 줄어드는 이유가 이것입니다)
 *
 * [빠뜨리면 어떻게 되나]
 *
 * 이 한 줄이 없으면 .next/standalone 폴더 자체가 생기지 않습니다.
 * 그 상태로 Dockerfile 을 빌드하면 이런 에러가 납니다.
 *
 *   ERROR: "/app/.next/standalone": not found
 *
 * 4회차에서 가장 흔한 실수 1위입니다.
 *
 * [주의 — standalone 의 함정]
 *
 * standalone 폴더는 "서버 실행에 필요한 것"만 담습니다.
 * public/ 과 .next/static/ (해시 붙은 JS·CSS)은 **포함되지 않습니다.**
 * 따라서 Dockerfile 에서 이 둘을 따로 복사해 줘야 합니다.
 * 빠뜨리면 페이지는 뜨는데 CSS 가 전부 깨집니다. (README 참고)
 * ==================================================================
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ★ 4회차의 핵심. 이 한 줄이 Docker 배포를 가능하게 합니다.
  output: 'standalone',

  // React 개발 모드에서 컴포넌트를 두 번 렌더해 부작용을 잡아주는 옵션입니다.
  // 프로덕션 빌드에는 영향이 없습니다.
  reactStrictMode: true,
};

module.exports = nextConfig;
