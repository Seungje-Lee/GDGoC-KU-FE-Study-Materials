/**
 * ==================================================================
 * lib/words.js — 단어 데이터를 가져오는 곳
 * ==================================================================
 *
 * 이 파일의 함수들은 **서버에서만 실행됩니다.**
 * (app/page.js, app/words/[word]/page.js 는 서버 컴포넌트이고,
 *  서버 컴포넌트에서만 이 함수들을 부르기 때문입니다)
 *
 * 브라우저는 이 코드를 아예 내려받지 않습니다.
 * → 나중에 여기에 DB 접속 정보나 API 키를 써도 브라우저로 새어나가지 않습니다.
 *   3회차에서 배운 "프론트엔드에 비밀을 두지 말라"의 정확한 반대편입니다.
 *
 * [데이터 소스 두 가지]
 *
 *  1) 기본 — 아래 WORDS 배열 (내장 데이터)
 *     외부에 아무것도 의존하지 않습니다. 인터넷이 끊겨도, 미니 API 를 안 띄워도
 *     수업이 끊기지 않도록 일부러 이렇게 만들었습니다.
 *
 *  2) 선택 — 환경변수 API_URL 이 있으면 미니 API 에서 가져옵니다.
 *     예)  API_URL=http://localhost:3001 npm run dev
 *          docker compose 안이라면 API_URL=http://api:3001
 *
 *     ★ 이름이 NEXT_PUBLIC_ 으로 시작하지 않는다는 점에 주목하세요.
 *       NEXT_PUBLIC_* 은 Vite 의 VITE_* 와 똑같이 빌드 시점에 코드에 박히고,
 *       브라우저까지 따라갑니다.
 *       반면 그냥 API_URL 은 **서버에서만 읽히는 값**이라
 *       docker run -e API_URL=... 처럼 "실행 시점"에 바꿀 수 있습니다.
 *       이게 CSR 과 SSR 의 실무적인 차이 중 하나입니다.
 * ==================================================================
 */

/**
 * 내장 단어 목록 (기본 데이터 소스)
 * 1~3회차에서 쓰던 "나만의 단어장"과 같은 단어들입니다.
 */
export const WORDS = [
  {
    word: 'serendipity',
    pron: '/ˌser.ənˈdɪp.ə.ti/',
    pos: '명사',
    meaning: '뜻밖의 행운을 우연히 발견하는 것',
    example: 'Finding that little bookshop was pure serendipity.',
  },
  {
    word: 'resilience',
    pron: '/rɪˈzɪl.i.əns/',
    pos: '명사',
    meaning: '회복력, 다시 일어서는 힘',
    example: 'Her resilience helped her recover from the injury.',
  },
  {
    word: 'ubiquitous',
    pron: '/juːˈbɪk.wɪ.təs/',
    pos: '형용사',
    meaning: '어디에나 있는, 아주 흔한',
    example: 'Smartphones have become ubiquitous in daily life.',
  },
  {
    word: 'container',
    pron: '/kənˈteɪ.nər/',
    pos: '명사',
    meaning: '그릇, 용기 / 격리된 실행 환경',
    example: 'Each container runs in its own isolated environment.',
  },
  {
    word: 'render',
    pron: '/ˈren.dər/',
    pos: '동사',
    meaning: '표현하다, 그려내다 / (웹) 화면을 그려내다',
    example: 'The server can render the whole page before sending it.',
  },
  {
    word: 'deploy',
    pron: '/dɪˈplɔɪ/',
    pos: '동사',
    meaning: '배치하다, 배포하다',
    example: 'They deploy the new version every Friday afternoon.',
  },
];

/**
 * 미니 API 가 주는 모양을 이 앱이 쓰는 모양으로 맞춰줍니다.
 * 미니 API: { word, meaning, partOfSpeech, example }
 * 이 앱:    { word, pron, pos, meaning, example }
 */
function normalize(item) {
  const POS_LABEL = {
    noun: '명사',
    verb: '동사',
    adjective: '형용사',
    adverb: '부사',
  };

  return {
    word: item.word,
    pron: item.pron ?? '',
    pos: item.pos ?? POS_LABEL[item.partOfSpeech] ?? item.partOfSpeech ?? '',
    meaning: item.meaning ?? '',
    example: item.example ?? '',
  };
}

/**
 * 단어 목록 전체를 가져옵니다.
 *
 * async 함수라는 점이 중요합니다.
 * Next.js 14 App Router 에서는 서버 컴포넌트를 async 로 만들고
 * 그 안에서 그냥 await 하면 됩니다.
 * (2회차에서 쓰던 useEffect + useState + 로딩 상태 조합이 통째로 사라집니다)
 */
export async function getWords() {
  const apiUrl = process.env.API_URL;

  // API_URL 이 없으면 내장 데이터를 그대로 씁니다. (기본 경로)
  if (!apiUrl) {
    return WORDS;
  }

  try {
    // cache: 'no-store' — 요청이 올 때마다 새로 가져옵니다.
    // 이걸 빼면 Next 가 응답을 캐시해서 "빌드 시점 데이터"로 굳어버릴 수 있습니다.
    const res = await fetch(`${apiUrl}/api/words`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API 응답 실패: ${res.status}`);

    const data = await res.json();
    return data.map(normalize);
  } catch (error) {
    // ★ 수업이 끊기지 않는 것이 최우선입니다.
    //   API 가 안 떠 있어도 내장 데이터로 넘어가서 화면은 정상적으로 나옵니다.
    //   이 console.warn 은 브라우저가 아니라 **서버 터미널**에 찍힙니다.
    console.warn('[words] 미니 API 호출 실패 → 내장 데이터로 대체합니다:', error.message);
    return WORDS;
  }
}

/**
 * 단어 하나를 가져옵니다. 없으면 null 을 돌려줍니다.
 * app/words/[word]/page.js 에서 사용합니다.
 */
export async function getWord(word) {
  const target = String(word).toLowerCase();
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return WORDS.find((w) => w.word.toLowerCase() === target) ?? null;
  }

  try {
    const res = await fetch(`${apiUrl}/api/words/${encodeURIComponent(target)}`, {
      cache: 'no-store',
    });

    // 미니 API 는 없는 단어에 404 + JSON 을 돌려줍니다.
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API 응답 실패: ${res.status}`);

    return normalize(await res.json());
  } catch (error) {
    console.warn('[words] 미니 API 호출 실패 → 내장 데이터로 대체합니다:', error.message);
    return WORDS.find((w) => w.word.toLowerCase() === target) ?? null;
  }
}
