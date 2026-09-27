# 나만의 단어장 — Next.js 버전 (4회차 완성본)

프론트엔드 스터디 **4회차** 심화 파트용 완성본입니다.
수강생이 이 앱을 처음부터 만들 필요는 없습니다. **띄우고, 비교하고, 배포하는 것**이 목적입니다.

- Next.js 14 (App Router) · JavaScript
- 서버 컴포넌트에서 데이터를 가져와 **SSR** 로 렌더링
- `output: 'standalone'` + Node 서버 + Docker 로 **Vercel 없이** 직접 배포

---

## 1. 이 앱의 교육 목적

> **"내가 만든 앱의 HTML 안에는 아무 내용도 없었다"** 를 눈으로 확인하는 것.

1~3회차에서 만든 Vite 앱(CSR)은 서버가 이런 HTML 을 보냅니다.

```html
<body>
  <div id="root"></div>   <!-- 비어 있습니다 -->
</body>
```

내용은 브라우저가 JS 를 내려받아 실행한 뒤에야 채워집니다.
그래서 **JS 를 실행하지 않는 쪽**(검색 엔진 크롤러, 카톡·슬랙 링크 미리보기, `curl`)에는
아무것도 안 보입니다.

이 Next.js 앱은 **서버가 HTML 을 다 만들어서 보냅니다.**
그래서 같은 `curl` 명령에 단어와 뜻이 글자 그대로 나옵니다.

이 두 출력을 나란히 놓고 보는 것이 4회차 심화 파트의 핵심입니다.

### 함께 보는 두 번째 포인트 — "새로고침 404"

1회차·3회차에서 SPA 를 nginx 에 올리고 `/about` 에서 새로고침하면 **404** 가 났습니다.
nginx 가 `/about` 이라는 **파일**을 찾는데 그런 파일이 없었기 때문입니다.
그래서 `try_files $uri $uri/ /index.html;` (SPA fallback) 이 필요했습니다.

이 앱의 `/words/serendipity` 는 **새로고침해도 404 가 나지 않습니다.**
fallback 설정도 필요 없습니다. 서버가 그 주소를 진짜로 알고, 그 자리에서 HTML 을 만들기 때문입니다.

대신 그 대가로 **Node 프로세스가 계속 살아 있어야 합니다.**
그 프로세스를 살려두는 일이 바로 "Vercel 이 대신 해주던 일"입니다.

---

## 2. 실행

```bash
cd next-version

npm install
npm run dev
```

→ http://localhost:3000

| 주소 | 내용 |
|---|---|
| `/` | 단어 카드 목록 (SSR) |
| `/words/serendipity` | 단어 상세 (동적 라우트, SSR) |
| `/words/없는단어` | 404 (상태 코드도 진짜 404) |

---

## 3. ★ SSR 확인 방법 (수업에서 직접 치는 부분)

### Step 1. Vite 버전 (CSR) — 아무것도 안 나옵니다

3회차 결과물을 nginx 나 `npm run preview` 로 띄워둔 상태에서:

```bash
curl -s http://localhost:8080 | grep serendipity
# (아무 출력 없음)

curl -s http://localhost:8080 | grep -o serendipity | wc -l
# 0

curl -s http://localhost:8080 | head -20
# <div id="root"></div> 만 보입니다
```

### Step 2. Next.js 버전 (SSR) — 단어와 뜻이 그대로 나옵니다

```bash
curl -s http://localhost:3000 | grep -o "serendipity" | wc -l
# 11   (0 이 아닙니다)
```

**단어와 뜻을 한 줄로 뽑아보기** — 이게 수업에서 화면에 띄울 그림입니다.

```bash
curl -s http://localhost:3000 | tr '<' '\n' | grep "^li>"
# li>serendipity — 뜻밖의 행운을 우연히 발견하는 것
# li>resilience — 회복력, 다시 일어서는 힘
# li>ubiquitous — 어디에나 있는, 아주 흔한
# li>container — 그릇, 용기 / 격리된 실행 환경
# li>render — 표현하다, 그려내다 / (웹) 화면을 그려내다
# li>deploy — 배치하다, 배포하다
```

> `tr '<' '\n'` 은 태그가 시작되는 자리마다 줄바꿈을 넣어주는 것뿐입니다.
> Next 가 보낸 HTML 이 한 줄이라 눈으로 읽기 어려워서 넣은 장치입니다.
> **같은 명령을 Vite 버전(8080)에 치면 한 줄도 안 나옵니다.**

한글 뜻으로도 찾아보세요.

```bash
curl -s http://localhost:3000 | grep -o "뜻밖의[^<]*" | head -1
# 뜻밖의 행운을 우연히 발견하는 것
```

동적 라우트도 같습니다.

```bash
curl -s http://localhost:3000/words/serendipity | tr '<' '\n' | grep "detail-"
# h2 class="detail-word">serendipity
# p class="detail-meaning">뜻밖의 행운을 우연히 발견하는 것
```

> 💡 **`grep -c` 를 쓰면 왜 1 이 나오나요?**
> `grep -c` 는 "일치한 **줄** 수"를 셉니다. 그런데 Next.js 는 HTML 을 압축해서
> **줄바꿈 없이 한 줄로** 보냅니다. 그래서 몇 개가 들어 있든 항상 1 입니다.
> 개수를 세려면 위처럼 `grep -o ... | wc -l` 을 쓰세요.
> (CSR 쪽은 아예 없으므로 어느 쪽을 써도 0 입니다 — 비교 자체는 성립합니다)

`<title>` 과 OG 태그도 서버에서 만들어집니다. (카톡 링크 미리보기가 되는 이유)

```bash
curl -s http://localhost:3000/words/serendipity | grep -o "<title>[^<]*</title>"
# <title>serendipity · 나만의 단어장</title>
```

### Step 3. 브라우저로도 같은 걸 확인

`curl` 이 낯설면 브라우저에서 **`Cmd+U` / `Ctrl+U` (페이지 소스 보기)** 로 보세요.

> ⚠️ **개발자도구 Elements 탭과 헷갈리지 마세요.**
> - **페이지 소스 보기** = 서버가 보낸 **원본 HTML**
> - **Elements 탭** = JS 가 실행된 **지금의 DOM**
>
> Elements 탭은 CSR 앱에서도 내용이 보입니다. 그래서 비교가 안 됩니다.

### Step 4. 요청마다 서버가 렌더한다는 증거

첫 화면 위쪽에 **"이 HTML 은 ○○ 에 서버에서 만들어졌습니다"** 라는 시각이 있습니다.
새로고침하면 이 시각이 바뀝니다. → 요청이 올 때마다 서버가 새로 만들고 있다는 뜻입니다.
(`app/page.js` 의 `export const dynamic = 'force-dynamic'` 이 이걸 보장합니다)

### Step 5. "Next.js 를 쓰면 자동으로 SSR" 이 아니라는 것

`app/components/FlipCard.js` 는 `'use client'` 컴포넌트입니다.
그런데도 카드 안의 단어와 뜻은 `curl` 결과에 들어 있습니다.

> `'use client'` = "브라우저에서만 렌더된다" 가 **아닙니다.**
> "서버에서 첫 HTML 을 만들고, 브라우저에서도 살아나서 클릭에 반응한다" 는 뜻입니다.

반대로 **클라이언트 컴포넌트에서 `useEffect` 로 데이터를 fetch** 하면
그 데이터는 서버가 보낸 HTML 에 **없습니다.** Next.js 를 써도 `curl` 결과가 비어 있게 됩니다.
프레임워크를 쓰는 것과 그 기능을 쓰는 것은 다릅니다.

---

## 4. ★ standalone 빌드 (Vercel 없이 직접 배포)

### 4-1. 빌드

```bash
npm run build
```

`next.config.js` 에 `output: 'standalone'` 이 있으므로 빌드가 끝나면 이 폴더가 생깁니다.

```bash
ls .next/standalone
# server.js  node_modules  package.json  .next
```

- `server.js` — **Next 가 만들어 준 실행 파일. 이게 우리의 웹서버입니다.**
- `node_modules` — 전체가 아니라 **실제로 쓰이는 것만** 추려서 담겨 있습니다.

> 이 옵션이 없으면 `.next/standalone` 자체가 안 생깁니다.
> 그 상태로 Docker 빌드를 하면 `"/app/.next/standalone": not found` 에러가 납니다.
> 4회차에서 가장 흔한 실수 1위입니다.

### 4-2. ⚠️ 반드시 함께 복사해야 하는 두 폴더

`standalone` 은 **"서버 실행에 필요한 것"만** 담습니다.
아래 두 가지는 **포함되지 않습니다.**

| 빠뜨리면 | 증상 |
|---|---|
| `.next/static` 미복사 | 페이지는 뜨는데 **CSS 와 JS 가 전부 깨집니다** |
| `public` 미복사 | 이미지·`robots.txt` 등이 **404** |

그래서 로컬에서 standalone 을 직접 실행할 때도 **수동 복사가 필요합니다.**

```bash
npm run build

# ★ 이 두 줄을 빠뜨리면 스타일이 깨집니다
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

node .next/standalone/server.js
```

→ http://localhost:3000

```bash
# 포트를 바꾸고 싶으면
PORT=3100 node .next/standalone/server.js
```

> **왜 `next start` 가 아니라 `node server.js` 인가?**
> `next start` 는 `next` 패키지 전체가 설치돼 있어야 합니다.
> `server.js` 는 그 자체로 완결돼 있어서, **`next` 가 없는 환경에서도 돕니다.**
> 그래서 Docker 이미지가 작아집니다.

`Dockerfile` 은 위 `cp` 두 줄을 `COPY --from=builder` 로 그대로 옮겨놓은 것입니다.

---

## 5. Docker 로 배포

### 5-1. 빌드 · 실행

```bash
cd next-version

# ★ package-lock.json 이 없으면 npm ci 가 실패합니다. 먼저 npm install 을 한 번.
npm install

docker build -t my-vocab-next:v1 .
docker run --rm -p 3000:3000 --name vocab-next my-vocab-next:v1
```

→ http://localhost:3000

```bash
# 컨테이너 안에서도 SSR 이 되는지 확인
curl -s http://localhost:3000 | tr '<' '\n' | grep "^li>"
```

### 5-2. 이미지 크기 비교

```bash
docker images | grep -E "my-vocab"
```

Vite 버전(`nginx:alpine` 기반, 약 50MB)보다는 큽니다.
**당연합니다. 안에 Node 런타임이 살아 있어야 하니까요.**
"파일을 배포하는 것"과 "프로세스를 배포하는 것"의 차이가 숫자로 드러나는 지점입니다.

### 5-3. 자주 나는 사고

| 증상 | 원인 | 해결 |
|---|---|---|
| `"/app/.next/standalone": not found` | `output: 'standalone'` 없음 | `next.config.js` 확인 |
| `npm ci` 실패 | `package-lock.json` 없음 | 호스트에서 `npm install` 한 번 |
| CSS 가 전부 깨짐 | `.next/static` 미복사 | Dockerfile 의 `COPY ... /app/.next/static` 확인 |
| 이미지·robots.txt 404 | `public` 미복사 | Dockerfile 의 `COPY ... /app/public` 확인 |
| `-p` 로 뚫었는데 접속 안 됨 | `127.0.0.1` 에만 바인딩 | `ENV HOSTNAME=0.0.0.0` 확인 (**매년 나오는 사고**) |
| `port is already allocated` | 3000 사용 중 | 왼쪽 숫자만 바꾸기: `-p 3100:3000` |

### 5-4. 환경변수 — 빌드 시점 vs 실행 시점

이 앱에는 성격이 다른 환경변수 두 개가 일부러 함께 들어 있습니다.

| 변수 | 읽는 시점 | 어디까지 가나 | 바꾸는 방법 |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_NAME` | **빌드 시점** | 브라우저 번들까지 (= 비밀 못 담음) | `--build-arg` (재빌드 필요) |
| `API_URL` | **실행 시점** | 서버에만 (브라우저는 못 봄) | `-e` (재빌드 불필요) |

```bash
# NEXT_PUBLIC_* → 빌드 시점에 코드에 박힙니다 (VITE_* 와 똑같은 규칙)
docker build --build-arg NEXT_PUBLIC_SITE_NAME="사내 단어장" -t my-vocab-next:stg .
docker run --rm -p 3000:3000 my-vocab-next:stg

curl -s http://localhost:3000 | grep -o "<title>[^<]*</title>"
# <title>사내 단어장 (Next.js SSR)</title>   ← 헤더 제목도 함께 바뀝니다
```

```bash
# 반대로 -e 로는 안 바뀝니다. 이미 코드에 박혀 있으니까요. (3회차 함정과 같은 구조)
docker run --rm -p 3000:3000 -e NEXT_PUBLIC_SITE_NAME="이걸로바뀔까" my-vocab-next:v1
curl -s http://localhost:3000 | grep -o "<title>[^<]*</title>"
# <title>나만의 단어장 (Next.js SSR)</title>   ← 안 바뀝니다
```

```bash
# 서버에서만 읽는 값 → 실행 시점에 바꿀 수 있습니다 (이게 SSR 의 이점)
docker run --rm -p 3000:3000 -e API_URL=http://host.docker.internal:3001 my-vocab-next:v1
```

> `API_URL` 은 `NEXT_PUBLIC_` 이 안 붙었습니다.
> 그래서 **서버에서만 읽히고, 브라우저 번들에 들어가지 않으며, 실행 시점에 바꿀 수 있습니다.**
> Vite(CSR)에서는 불가능했던 일입니다. (`-e` 를 아무리 줘도 이미 구워진 파일은 안 바뀝니다)

---

## 6. 데이터 소스 — 내장 목록 / 미니 API

`lib/words.js` 가 두 경로를 모두 지원합니다.

| 조건 | 동작 |
|---|---|
| 기본 (`API_URL` 없음) | **내장 단어 목록**을 사용합니다. 외부 의존 0 — 수업이 안 끊깁니다 |
| `API_URL` 있음 | `${API_URL}/api/words` 에서 가져옵니다 |
| `API_URL` 은 있는데 API 가 안 뜸 | 경고 로그만 남기고 **내장 목록으로 자동 대체** |

```bash
# 미니 API(저장소의 mini-api/)를 띄워 둔 상태에서
API_URL=http://localhost:3001 npm run dev
```

> **CORS 가 나지 않습니다.** 브라우저가 API 를 부르는 게 아니라 **서버가 서버를 부르기** 때문입니다.
> 3회차에서 겪은 CORS 문제의 또 다른 해법입니다.

---

## 7. 파일 구조

```
next-version/
├── package.json
├── next.config.js          ★ output: 'standalone'
├── .dockerignore
├── Dockerfile              standalone 배포용 멀티스테이지
├── README.md
├── public/
│   └── robots.txt
├── lib/
│   └── words.js            서버에서만 도는 데이터 조회
└── app/
    ├── layout.js           <html lang="ko"> · metadata
    ├── page.js             "/" 목록 (서버 컴포넌트 · SSR)
    ├── globals.css
    ├── words/
    │   └── [word]/
    │       └── page.js     "/words/:word" 상세 (동적 라우트 · SSR)
    └── components/
        └── FlipCard.js     'use client' — 브라우저에서 도는 유일한 컴포넌트
```

**서버 / 클라이언트 경계**

```
[서버에서만 실행]                        [브라우저로 내려가는 것]
lib/words.js                             app/components/FlipCard.js
app/page.js                                └ useState, onClick
app/words/[word]/page.js
app/layout.js
  └ await getWords()  ← useEffect 없음
```

`app/` 안의 파일은 **기본이 서버 컴포넌트**입니다.
`'use client'` 를 쓴 파일만 브라우저로 내려갑니다. 이 방향이 헷갈리기 쉬우니 주의하세요.

---

## 8. 정리 — 오늘의 결론으로 이어지는 질문

이 앱을 직접 운영한다면 이런 것들이 필요해집니다.

- 프로세스가 죽으면 누가 다시 띄우나? (`restart: always`, systemd, Kubernetes)
- 트래픽이 늘면 몇 개를 띄우나? 어느 서버에?
- 배포 중에 서비스가 끊기면?
- 정적 자산은 CDN 에 어떻게 올리나?
- HTTPS 인증서는 누가 갱신하나?

**이 질문들의 목록이 곧 "Vercel 이 대신 해주던 일"입니다.**

Next.js 를 쓰지 말자는 이야기가 아닙니다.
**"남들이 쓰니까" 가 아니라 "이 프로젝트에 이게 필요해서" 라고 말할 수 있게 되는 것**이 목표입니다.
