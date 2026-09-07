// 1회차 시작점입니다.
// 사전 과제에서 만든 HTML 카드를 JSX로 그대로 옮겨놓은 상태입니다.
// 화면은 잘 나오지만, 카드 세 장의 구조가 완전히 똑같이 반복되고 있습니다.
// 오늘 수업에서 이것을 컴포넌트 / props / state 로 정리해 나갑니다.
//
// HTML과 다른 점 두 가지를 먼저 확인해 보세요.
//   1) class → className  (class 는 JavaScript 예약어라 못 씁니다)
//   2) 최상위 태그는 하나여야 해서 <> ... </> 로 감쌌습니다 (Fragment)

export default function App() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">나만의 단어장</h1>
        <p className="page-subtitle">오늘 외울 단어 3개</p>
      </header>

      <main className="card-list">
        {/* 카드 1 */}
        <article className="card">
          <div className="card-head">
            <h2 className="card-word">serendipity</h2>
            <span className="card-pron">/ˌser.ənˈdɪp.ə.ti/</span>
          </div>
          <span className="card-pos">명사</span>
          <p className="card-meaning">뜻밖의 행운을 우연히 발견하는 것</p>
          <p className="card-example">
            Finding that little bookshop was pure serendipity.
          </p>
        </article>

        {/* 카드 2 — 카드 1과 구조가 완전히 같고 내용만 다릅니다. */}
        <article className="card">
          <div className="card-head">
            <h2 className="card-word">resilience</h2>
            <span className="card-pron">/rɪˈzɪl.i.əns/</span>
          </div>
          <span className="card-pos">명사</span>
          <p className="card-meaning">회복력, 다시 일어서는 힘</p>
          <p className="card-example">
            Her resilience helped her recover from the injury.
          </p>
        </article>

        {/* 카드 3 — 또 같은 구조입니다. 카드가 30장이라면? */}
        <article className="card">
          <div className="card-head">
            <h2 className="card-word">ubiquitous</h2>
            <span className="card-pron">/juːˈbɪk.wɪ.təs/</span>
          </div>
          <span className="card-pos">형용사</span>
          <p className="card-meaning">어디에나 있는, 아주 흔한</p>
          <p className="card-example">
            Smartphones have become ubiquitous in daily life.
          </p>
        </article>
      </main>
    </>
  )
}
