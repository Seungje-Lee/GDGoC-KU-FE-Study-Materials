import { useState, useEffect } from 'react'

// ==================================================================
// useApiWords — 미니 API 에서 추천 단어 목록을 가져오는 훅
// ==================================================================
// 3회차에서 붙인 미니 API(materials/실습코드/mini-api)를 호출합니다.
//
//   GET /api/words        단어 목록 전체 (8개)
//   GET /api/words/:word  단어 하나
//   GET /api/health       상태 확인
//
// 응답 한 건의 모양 (id 도 phonetic 도 없습니다):
//   { "word": "proxy",
//     "meaning": "대리인, 대리 / 요청을 대신 전달해 주는 중개 서버",
//     "partOfSpeech": "noun",
//     "example": "The proxy forwards every request to the internal API server." }
//
// 구조는 useWordSearch 와 똑같습니다.
//   loading / error / data 3-state + cleanup 으로 경쟁 상태 방지.
// 다른 것은 "어디에 요청하는가" 하나뿐입니다.
// ==================================================================

// ------------------------------------------------------------------
// ★ API 주소를 정하는 규칙 — 3회차 리버스 프록시의 결론입니다
// ------------------------------------------------------------------
// import.meta.env.VITE_API_URL 은 "실행할 때 읽는 값"이 아닙니다.
// 빌드할 때 그 자리에 문자열이 그대로 치환되어 JS 파일에 박힙니다.
//
//   소스:      fetch(API_BASE + '/api/words')
//   빌드 결과: fetch("http://localhost:3001" + '/api/words')
//
// 그래서 컨테이너를 실행할 때 -e VITE_API_URL=... 로 넘겨도 아무 소용이 없습니다.
// 값을 바꾸면 반드시 다시 빌드해야 합니다.
//
// 값이 비어 있으면(또는 아예 없으면) 호스트를 적지 않은 상대경로가 됩니다.
//
//   API_BASE = ''  →  fetch('/api/words')
//
// 상대경로는 "지금 이 페이지와 같은 출처"로 요청이 나갑니다.
// nginx 리버스 프록시 뒤에서는 nginx 가 그 요청을 mini-api 로 대신 전달해 줍니다.
// 브라우저 입장에서는 화면도 API 도 전부 같은 출처라서
// 교차 출처라는 상황 자체가 발생하지 않습니다. → CORS 에러가 "사라집니다".
//
// 끝의 슬래시는 떼어냅니다. 'http://localhost:3001/' + '/api/words' 로
// 슬래시가 두 개 겹치는 흔한 실수를 막기 위해서입니다.
const API_BASE = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

/**
 * 미니 API 응답 한 건을 우리 앱이 쓰는 단어 모양으로 번역합니다.
 *
 * 미니 API 에는 id 와 phonetic 이 없습니다.
 * - id : 목록의 key 로 필요하므로 단어 이름으로 만들어 붙입니다.
 *        (내 단어장에 추가할 때는 App 에서 Date.now() 로 새로 발급합니다)
 * - phonetic : 없으므로 빈 문자열. WordCard 가 알아서 안 그립니다.
 */
function toWord(item) {
  return {
    id: `api-${item.word}`,
    word: item.word,
    phonetic: '',
    partOfSpeech: item.partOfSpeech,
    meaning: item.meaning,
    example: item.example ?? '',
  }
}

/**
 * @returns {{ data: Array, loading: boolean, error: string|null }}
 */
export function useApiWords() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true) // 화면이 뜨는 순간 이미 요청이 출발합니다
  const [error, setError] = useState(null)

  useEffect(() => {
    // 이 목록은 한 번만 받아오면 되지만, cleanup 은 그래도 짭니다.
    // 개발 모드의 StrictMode 는 effect 를 실행 → cleanup → 다시 실행 합니다.
    // cleanup 이 없으면 첫 번째 응답이 뒤늦게 도착해 화면을 건드릴 수 있습니다.
    let ignore = false
    const controller = new AbortController()

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`${API_BASE}/api/words`, {
          signal: controller.signal,
        })

        // fetch 는 404 도 500 도 예외로 던지지 않습니다. 직접 확인해야 합니다.
        if (!res.ok) {
          throw new Error(
            `단어 목록을 불러오지 못했습니다. (${res.status}) 미니 API 가 떠 있는지 확인해 주세요.`
          )
        }

        const json = await res.json()

        if (ignore) return
        setData(json.map(toWord))
        setLoading(false)
      } catch (err) {
        if (ignore || err.name === 'AbortError') return

        // CORS 로 막히면 브라우저는 'Failed to fetch' 만 알려줍니다.
        // 그대로 보여주면 사용자가 뭘 해야 할지 알 수 없으므로 안내를 덧붙입니다.
        setError(
          err.message === 'Failed to fetch'
            ? '미니 API 에 연결하지 못했습니다. 서버가 떠 있는지, CORS 로 막힌 것은 아닌지 개발자도구 Network 탭에서 확인해 보세요.'
            : err.message
        )
        setLoading(false)
      }
    }

    run()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])
  // ▲ 이 effect 안에서 쓰는 바깥 값은 API_BASE 뿐인데,
  //   그건 모듈이 로드될 때 딱 한 번 정해지는 상수라서 배열에 넣지 않습니다.

  return { data, loading, error }
}
