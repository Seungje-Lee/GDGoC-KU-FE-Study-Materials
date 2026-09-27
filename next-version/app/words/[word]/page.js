/**
 * ==================================================================
 * app/words/[word]/page.js — "/words/serendipity" 단어 상세 (SSR)
 * ==================================================================
 *
 * [폴더 이름의 대괄호가 곧 라우팅입니다]
 *
 *   app/words/[word]/page.js   →  /words/무엇이든
 *
 *   App Router 에서는 라우팅 설정 파일이 따로 없습니다.
 *   **폴더 구조가 곧 주소**입니다.
 *   [word] 처럼 대괄호를 쓰면 "이 자리는 값이 바뀐다"는 뜻이고,
 *   그 값이 아래 params.word 로 들어옵니다.
 *
 * ★★★ 1회차 "새로고침하면 404" 문제와 대비되는 지점입니다 ★★★
 *
 *   1회차·3회차에서 겪은 일:
 *     Vite 로 만든 SPA 를 nginx 에 올리고 /about 에서 새로고침 → 404
 *     이유: nginx 는 /about 이라는 **파일**을 찾는데 그런 파일이 없다.
 *     해결: try_files $uri $uri/ /index.html;  (SPA fallback)
 *           = "파일이 없으면 무조건 index.html 을 줘라. 나머지는 JS 가 알아서 한다"
 *
 *   지금 이 페이지:
 *     /words/serendipity 로 **직접 접속하거나 새로고침해도** 정상입니다.
 *     fallback 설정이 필요 없습니다.
 *     Node 서버가 그 주소를 진짜로 알고 있고, 그 자리에서 HTML 을 만들어 주니까요.
 *
 *   ★ 이게 "정적 파일 서빙"과 "서버 렌더링"의 결정적 차이입니다.
 *     대신 그 대가로, 서버가 계속 살아 있어야 합니다. (= Vercel 이 해주던 일)
 *
 *   확인:
 *     curl -s http://localhost:3000/words/serendipity | grep 뜻밖의
 * ==================================================================
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWord, getWords } from '../../../lib/words';

// 이 페이지도 요청마다 서버에서 렌더합니다. (app/page.js 의 설명 참고)
export const dynamic = 'force-dynamic';

/**
 * generateMetadata — 페이지마다 <title> 과 OG 태그를 서버에서 만들어 줍니다.
 *
 * ★ 심화 포인트:
 *   CSR 앱에서 이걸 하려면 브라우저가 JS 를 실행해야만 제목이 바뀝니다.
 *   그래서 카톡에 링크를 붙였을 때 제목이 안 나옵니다.
 *   여기서는 서버가 보내는 첫 HTML 에 이미 들어 있습니다.
 *
 *   params 는 아래 페이지 컴포넌트와 똑같이 { word: '...' } 모양으로 들어옵니다.
 */
export async function generateMetadata({ params }) {
  const target = decodeURIComponent(params.word);
  const found = await getWord(target);

  if (!found) {
    return { title: '단어를 찾을 수 없습니다 · 나만의 단어장' };
  }

  return {
    title: `${found.word} · 나만의 단어장`,
    description: `${found.word} — ${found.meaning}`,
  };
}

/**
 * 동적 라우트의 페이지 컴포넌트.
 *
 * ★ params 사용법 (Next.js 14 App Router):
 *   페이지 컴포넌트는 { params, searchParams } 를 props 로 받습니다.
 *   [word] 폴더에서 왔으니 params.word 에 주소의 그 자리 값이 들어 있습니다.
 *
 *     /words/serendipity   →  params = { word: 'serendipity' }
 *
 *   주소에 한글이나 공백이 들어올 수 있으므로 decodeURIComponent 로 풀어줍니다.
 *   (예: /words/hello%20world → 'hello world')
 */
export default async function WordDetailPage({ params }) {
  const target = decodeURIComponent(params.word);

  // 서버에서 데이터 조회. 여기서도 useEffect 는 필요 없습니다.
  const found = await getWord(target);

  // notFound() 를 부르면 Next 가 404 페이지를 보여줍니다.
  // ★ 이때 HTTP 상태 코드도 진짜 404 로 나갑니다.
  //   CSR 앱은 "없는 페이지"를 보여줘도 상태 코드는 200 입니다.
  //   (검색 엔진이 없는 페이지를 정상 페이지로 착각하는 원인)
  if (!found) {
    notFound();
  }

  // 아래쪽 "다른 단어 보기"용 목록
  const words = await getWords();
  const others = words.filter((w) => w.word !== found.word);

  return (
    <main>
      <p className="breadcrumb">
        <Link href="/">← 목록으로</Link>
      </p>

      <article className="detail">
        <header className="detail-head">
          <h2 className="detail-word">{found.word}</h2>
          {found.pron && <p className="card-pron">{found.pron}</p>}
          {found.pos && <span className="card-pos">{found.pos}</span>}
        </header>

        <p className="detail-meaning">{found.meaning}</p>

        {found.example && <p className="card-example">{found.example}</p>}
      </article>

      <section className="notice">
        <p>
          이 주소(<code>/words/{found.word}</code>)에서 <strong>새로고침(F5)</strong> 해 보세요.
        </p>
        <p className="notice-sub">
          404 가 나지 않습니다. nginx 의 SPA fallback 설정 없이도 됩니다. 서버가 이 주소를 진짜로
          알고 있기 때문입니다.
        </p>
      </section>

      <section className="plain-list">
        <h3>다른 단어</h3>
        <ul>
          {others.map((w) => (
            <li key={w.word}>
              <Link href={`/words/${w.word}`}>{`${w.word} — ${w.meaning}`}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
