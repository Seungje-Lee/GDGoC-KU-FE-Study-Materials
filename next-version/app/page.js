/**
 * ==================================================================
 * app/page.js — "/" 단어 카드 목록 (서버 컴포넌트 · SSR)
 * ==================================================================
 *
 * ★★★ 이 파일이 4회차 심화 파트의 주인공입니다 ★★★
 *
 * 이 파일 맨 위에 'use client' 가 **없습니다.**
 * App Router 에서는 그게 곧 "서버 컴포넌트"라는 뜻입니다.
 *
 * 그래서 이 컴포넌트는:
 *   - 서버(Node)에서 실행되고
 *   - 데이터를 await 로 직접 가져오고
 *   - 완성된 HTML 문자열이 되어 브라우저로 전송됩니다.
 *
 * 브라우저는 이 컴포넌트의 코드를 **한 줄도 내려받지 않습니다.**
 *
 * [2회차와 비교해 보세요]
 *
 *   2회차 (CSR):
 *     const [words, setWords] = useState([])
 *     const [loading, setLoading] = useState(true)
 *     useEffect(() => { fetch(...).then(...) }, [])
 *     if (loading) return <p>로딩 중...</p>
 *
 *   지금 (SSR):
 *     const words = await getWords()
 *
 *   useState 도, useEffect 도, 로딩 상태도 없습니다.
 *   ★ 서버 컴포넌트에서는 useState / useEffect 를 아예 쓸 수 없습니다.
 *     (쓰면 빌드 에러가 납니다. 상태와 이벤트는 클라이언트의 것이니까요)
 *
 * [확인 방법]
 *   curl -s http://localhost:3000 | grep serendipity
 *   → 단어와 뜻이 그대로 보입니다.
 *   Vite 버전에 같은 명령을 치면 아무것도 안 나옵니다. (빈 <div id="root">)
 * ==================================================================
 */

import Link from 'next/link';
import { getWords } from '../lib/words';
import FlipCard from './components/FlipCard';

/**
 * dynamic = 'force-dynamic'
 * ------------------------------------------------------------------
 * "요청이 올 때마다 서버에서 새로 렌더해라" 라는 뜻입니다. 즉 진짜 SSR 입니다.
 *
 * 이 줄이 없으면 Next 는 데이터가 안 변한다고 판단해서
 * **빌드 시점에 HTML 을 한 번 만들어 두고 재사용**합니다. 그게 SSG 입니다.
 *
 * SSG 도 HTML 에 내용이 들어 있어서 curl 비교 실습에는 문제가 없지만,
 * 오늘은 "요청마다 서버가 만든다"를 보여주는 것이 목적이라 강제로 켜 둡니다.
 * (아래 렌더 시각이 새로고침할 때마다 바뀌는 것으로 확인할 수 있습니다)
 *
 * 덤: API_URL 로 미니 API 를 붙였을 때, 빌드하는 순간에는 그 API 가
 * 안 떠 있을 수 있습니다. force-dynamic 이면 빌드가 API 를 부르지 않으므로
 * 그런 사고도 함께 막아줍니다.
 */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // ★ 여기가 핵심 한 줄. 서버에서 데이터를 직접 가져옵니다.
  const words = await getWords();

  // 이 시각은 "서버가 이 HTML 을 만든 시각"입니다.
  // 새로고침할 때마다 값이 바뀌면 = 요청마다 서버가 렌더하고 있다는 증거입니다.
  const renderedAt = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  });

  return (
    <main>
      <section className="notice">
        <p>
          이 HTML 은 <strong>{renderedAt}</strong> 에 서버에서 만들어졌습니다.
        </p>
        <p className="notice-sub">
          새로고침하면 이 시각이 바뀝니다. 요청이 올 때마다 서버가 새로 렌더한다는 뜻입니다.
        </p>
      </section>

      {/*
        서버 렌더링 확인용 평문 목록입니다.
        curl / 페이지 소스 보기 에서 가장 눈에 잘 띄도록 일부러 단순하게 두었습니다.

        ★ 한 줄짜리 문자열로 만든 이유:
          {w.word} — {w.meaning} 처럼 나눠 쓰면 React 가 텍스트 조각 사이에
          <!-- --> 주석을 끼워 넣습니다. (하이드레이션 때 경계를 구분하려고)
          그러면 curl 결과가 지저분해져서 수업에서 읽기 불편해집니다.
          그래서 템플릿 문자열로 합쳐 <li>serendipity — 뜻밖의 …</li> 가 되도록 했습니다.
      */}
      <section className="plain-list">
        <h2>추천 단어</h2>
        <ul>
          {words.map((w) => (
            <li key={w.word}>{`${w.word} — ${w.meaning}`}</li>
          ))}
        </ul>
      </section>

      {/*
        카드 목록.
        map() 으로 카드를 찍어내는 방식은 1회차에서 배운 그대로입니다.
        달라진 점은 이 map 이 브라우저가 아니라 서버에서 돈다는 것뿐입니다.
      */}
      <ul className="card-list">
        {words.map((w) => (
          <li key={w.word} className="card-item">
            {/*
              FlipCard 는 'use client' 컴포넌트입니다.
              서버 컴포넌트가 클라이언트 컴포넌트에 props 를 넘겨주는 형태입니다.

              ★ 오해하기 쉬운 지점:
                'use client' 라고 해서 "브라우저에서만 그려진다"는 뜻이 아닙니다.
                첫 HTML 은 이 컴포넌트도 서버에서 렌더됩니다.
                그래서 curl 결과에 카드 안의 단어와 뜻이 전부 들어 있습니다.
                'use client' 는 "이 컴포넌트는 브라우저에서도 살아나서
                (하이드레이션) 클릭에 반응한다"는 뜻입니다.
            */}
            <FlipCard word={w} />

            {/*
              Link — 페이지 이동. <a> 대신 씁니다.
              누르면 /words/serendipity 같은 주소로 갑니다.
            */}
            <Link className="detail-link" href={`/words/${w.word}`}>
              자세히 보기 →
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
