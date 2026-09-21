import StatusMessage from './StatusMessage.jsx'
import { useApiWords } from '../hooks/useApiWords.js'

// 미니 API 에서 받아온 "추천 단어" 목록입니다.
//
// 이 컴포넌트가 3회차·4회차의 관찰 대상입니다.
//   - 개발자도구 Network 탭에서 이 요청의 주소가 무엇인지 보세요.
//   - mini-api 를 띄운 터미널에 로그가 찍히는지 보세요.
//     주소창은 http://localhost 인데 저 터미널에 로그가 찍힌다면,
//     nginx 가 요청을 대신 전달해 줬다는 증거입니다.
export default function RecommendedWords({ onAdd, addedWords }) {
  const { data, loading, error } = useApiWords()

  return (
    <section className="recommend">
      <h2 className="recommend-title">추천 단어</h2>
      <p className="recommend-subtitle">
        미니 API 서버가 알려준 단어들입니다.
      </p>

      {/* 로딩 / 에러 / 빈 목록 — 세 갈래를 전부 화면으로 표현합니다.
          데이터가 없는 화면에도 보여줄 것이 있습니다. */}
      <StatusMessage
        loading={loading}
        error={error}
        empty={!loading && !error && data.length === 0}
        loadingText="추천 단어를 불러오는 중…"
        emptyText="추천 단어가 없습니다."
      />

      {!loading && !error && data.length > 0 && (
        <ul className="recommend-list">
          {data.map((item) => {
            const already = addedWords.includes(item.word)

            return (
              <li className="recommend-item" key={item.id}>
                <div className="recommend-item-body">
                  <span className="recommend-item-word">{item.word}</span>
                  <span className="card-pos">{item.partOfSpeech}</span>
                  <span className="recommend-item-meaning">{item.meaning}</span>
                </div>

                <button
                  className="recommend-item-add"
                  onClick={() => onAdd(item)}
                  disabled={already}
                >
                  {already ? '추가됨' : '추가'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
