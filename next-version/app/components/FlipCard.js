'use client';

/**
 * ==================================================================
 * app/components/FlipCard.js — 카드 뒤집기 (클라이언트 컴포넌트)
 * ==================================================================
 *
 * ★★★ 이 파일의 첫 줄 'use client' 가 오늘의 경계선입니다 ★★★
 *
 * 이 프로젝트에서 **브라우저로 내려가서 실제로 실행되는 코드는 이 컴포넌트뿐**입니다.
 * 나머지(page.js, layout.js, lib/words.js)는 전부 서버에서만 돕니다.
 *
 * [왜 이 컴포넌트만 클라이언트여야 하나]
 *   클릭에 반응해서 카드를 뒤집으려면
 *     - 상태(useState) 가 필요하고
 *     - 이벤트 핸들러(onClick) 가 필요합니다.
 *   둘 다 "브라우저에서 살아 있어야" 가능한 것들입니다.
 *   서버 컴포넌트에서 useState 를 쓰면 빌드 에러가 납니다.
 *
 * [자주 하는 오해 — 반드시 짚고 넘어가세요]
 *
 *   ❌ "'use client' = 브라우저에서만 렌더된다"
 *   ⭕ "'use client' = 서버에서 첫 HTML 을 만들고,
 *       그 다음 브라우저에서도 한 번 더 살아나서(하이드레이션) 클릭에 반응한다"
 *
 *   그래서 curl 로 받아본 HTML 안에도 이 카드의 앞면과 뒷면이
 *   글자 그대로 들어 있습니다. 직접 확인해 보세요.
 *
 *     curl -s http://localhost:3000 | grep serendipity
 *
 * [반대로, SSR 을 망가뜨리는 방법 — 강의안 §6-D 마지막 줄]
 *
 *   만약 여기서 useEffect 로 데이터를 fetch 해서 화면에 뿌렸다면,
 *   그 데이터는 서버가 보낸 HTML 에 **없습니다.** 브라우저가 나중에 채우니까요.
 *   Next.js 를 쓴다고 자동으로 SSR 이 되는 게 아닙니다.
 *   "프레임워크를 쓰는 것"과 "그 기능을 쓰는 것"은 다릅니다.
 * ==================================================================
 */

import { useState } from 'react';

export default function FlipCard({ word }) {
  // flipped: 카드가 뒤집혔는지 여부. 브라우저 안에서만 존재하는 상태입니다.
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`flip-card ${flipped ? 'is-flipped' : ''}`}>
      {/*
        button 을 쓰는 이유:
        키보드 Tab 으로 이동하고 Enter/Space 로 누를 수 있어야 하기 때문입니다.
        div + onClick 으로 만들면 마우스 없는 사용자가 못 씁니다.
      */}
      <button
        type="button"
        className="flip-inner"
        onClick={() => setFlipped((prev) => !prev)}
        aria-label={`${word.word} 카드 뒤집기`}
      >
        {/* ---- 앞면: 단어 ---- */}
        <span className="flip-face flip-front">
          <span className="card-word">{word.word}</span>
          {word.pron && <span className="card-pron">{word.pron}</span>}
          {word.pos && <span className="card-pos">{word.pos}</span>}
          <span className="flip-hint">카드를 눌러 뜻 보기</span>
        </span>

        {/* ---- 뒷면: 뜻과 예문 ----
            CSS 로 뒤집어 감춰둘 뿐, HTML 에는 처음부터 들어 있습니다.
            (그래서 curl 결과에도 뜻이 보입니다) */}
        <span className="flip-face flip-back">
          <span className="card-meaning">{word.meaning}</span>
          {word.example && <span className="card-example">{word.example}</span>}
          <span className="flip-hint">다시 누르면 앞면</span>
        </span>
      </button>
    </div>
  );
}
