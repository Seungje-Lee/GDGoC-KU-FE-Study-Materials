# week4-start — 4회차 시작 코드

**"나만의 단어장" 스터디 4회차(컨테이너와 Next.js)의 시작점입니다.**

이 폴더는 **3회차(빌드와 웹서버)를 끝까지 따라왔을 때의 상태**입니다.
3회차를 못 따라오셨거나 결석하셨어도, 이 코드로 시작하면 4회차를 그대로 함께 진행할 수 있습니다.

> **앱 로직은 week3-start 와 거의 같습니다.** 달라진 것은 "배포 준비"입니다.
> 환경변수, nginx 설정, Dockerfile 이 갖춰져 있고, 미니 API 를 호출하는 코드가 들어 있습니다.

---

## 1. 실행 방법 (기본)

```bash
cd week4-start
cp .env.example .env      # 환경변수 파일을 만듭니다
npm install
npm run dev
```

터미널에 뜨는 주소(보통 `http://localhost:5173`)를 브라우저로 엽니다.

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버를 띄웁니다. 코드를 고치면 즉시 반영됩니다 |
| `npm run build` | `dist/` 폴더에 배포용 파일을 굽습니다 |
| `npm run preview` | 구워진 `dist/` 를 웹서버로 띄워서 확인합니다 |

> ⚠️ `.env` 를 만들지 않아도 앱은 뜹니다. 다만 "추천 단어" 영역이 에러를 보여줍니다.
> `VITE_API_URL` 이 비어 있으면 상대경로 `/api/words` 로 요청하는데,
> `npm run dev` 상태에서는 그 경로를 받아줄 서버가 없기 때문입니다.

---

## 2. 미니 API 를 함께 띄우기

추천 단어 영역은 미니 API(저장소의 `mini-api/`)에서 목록을 받아옵니다.
**터미널을 하나 더 열어서** 아래를 실행하세요. (의존성 0개, `npm install` 불필요)

```bash
cd ../mini-api
node server.js
```

이렇게 뜨면 성공입니다.

```
────────────────────────────────────────────────────────────
  미니 API 서버가 떴습니다: http://localhost:3001
────────────────────────────────────────────────────────────
```

먼저 브라우저 없이 서버 자체를 확인해 보세요.

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/words
```

### ⚠️ 여기서 CORS 에러가 나는 것이 정상입니다

`.env` 를 `VITE_API_URL=http://localhost:3001` 로 두고 `npm run dev` 를 하면,
앱은 `localhost:5173` 인데 API 는 `localhost:3001` 입니다. **포트가 다르니 다른 출처**입니다.
미니 API 는 **일부러** CORS 헤더를 보내지 않으므로 브라우저가 응답을 차단합니다.

```
Access to fetch at 'http://localhost:3001/api/words' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**서버는 정상적으로 200을 보냈습니다.** 미니 API 터미널의 로그를 보세요. 요청이 찍혀 있습니다.
막은 것은 서버가 아니라 **브라우저**입니다. 그래서 `curl` 로는 잘 됩니다.

해결은 두 가지 중 하나입니다.

| 방법 | 어떻게 |
| --- | --- |
| ① nginx 리버스 프록시 뒤에 배포 | 아래 4번(Docker) 참고. **이 스터디가 쓰는 방법입니다** |
| ② 개발 서버에도 프록시를 붙임 | `vite.config.js` 의 `server.proxy` (3회차 선택 과제) |

미니 API 서버 코드에는 **절대 CORS 헤더를 추가하지 마세요.** 실습이 통째로 무의미해집니다.

---

## 3. `VITE_API_URL` 이 하는 일

`src/hooks/useApiWords.js` 는 이렇게 주소를 정합니다.

```js
const API_BASE = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
// ...
fetch(`${API_BASE}/api/words`)
```

| `VITE_API_URL` 값 | 실제 요청 주소 | 언제 쓰나 |
| --- | --- | --- |
| `http://localhost:3001` | `http://localhost:3001/api/words` | `npm run dev` + mini-api 직접 실행 (⚠️ CORS 발생) |
| 비어 있음 / 없음 | `/api/words` (상대경로) | **nginx 프록시 뒤** — 같은 출처라서 CORS 가 발생하지 않음 |

**값을 바꾸면 반드시 다시 빌드해야 합니다. 예외 없습니다.**
`VITE_*` 는 "실행할 때 읽는 값"이 아니라 **"빌드할 때 코드에 박히는 텍스트"** 이기 때문입니다.
직접 확인해 보세요.

```bash
npm run build
grep -r "localhost:3001" dist/     # → 값이 문자열로 박혀 있는 게 보입니다
```

그래서 컨테이너를 실행할 때 `-e VITE_API_URL=...` 로 넘겨봐야 아무 소용이 없고,
**빌드 시점에** `--build-arg` 로 주입해야 합니다. Dockerfile 의 `ARG` 가 그 장치입니다.

---

## 4. Docker 로 빌드하고 띄우기

### 준비

```bash
cd week4-start
npm install        # ← package-lock.json 을 만들기 위해 반드시 먼저 실행
```

Dockerfile 안에서 `npm ci` 를 쓰는데, `npm ci` 는 `package-lock.json` 이 있어야 동작합니다.
(`npm install` 은 알아서 해석해서 버전이 미묘하게 달라질 수 있지만,
`npm ci` 는 lock 파일에 적힌 버전 그대로 설치해서 **항상 같은 결과**를 냅니다)

### 빌드

```bash
docker build -t my-vocab .
```

기본값으로 `VITE_API_URL=/api` 가 주입됩니다. 바꾸고 싶다면

```bash
docker build --build-arg VITE_API_URL= -t my-vocab .
```

### 실행

```bash
docker run --rm -p 8080:80 --name my-vocab my-vocab
```

`http://localhost:8080` 으로 접속합니다.

### ⚠️ 단독 실행하면 컨테이너가 바로 죽습니다

```
host not found in upstream "mini-api"
```

`nginx.conf` 의 프록시 대상이 `http://mini-api:3001` 인데,
`mini-api` 는 **docker compose 의 서비스 이름**이라서 단독 실행 환경에는 그런 호스트가 없습니다.
둘 중 하나로 해결하세요.

1. **compose 로 함께 띄운다 (권장)** — `docker/docker-compose.yml` (4회차에 공개)

   ```bash
   cd ../docker
   docker compose up --build
   ```

   여기서는 mini-api 의 포트가 바깥으로 열리지 않습니다.
   `http://localhost:3001` 로는 접속이 안 되고, 오직 `http://localhost/api/...` 로만 접근됩니다.
   **이게 4회차의 교육 포인트입니다.**

2. **`nginx.conf` 의 `location /api/ { ... }` 블록을 통째로 주석 처리**하고 다시 빌드한다
   (추천 단어는 안 나오지만 앱 화면은 정상적으로 뜹니다)

---

## 5. 배포 준비 파일 네 개 — 왜 앱 루트에 있나

| 파일 | 원본 위치 | 하는 일 |
| --- | --- | --- |
| `Dockerfile` | `docker/Dockerfile.vite` (4회차 공개) | 멀티스테이지 빌드 (node 로 빌드 → nginx 로 서빙) |
| `nginx.conf` | 저장소의 `nginx/nginx-proxy.conf` | SPA fallback + `/api/` 리버스 프록시 + 캐시 헤더 |
| `.dockerignore` | `docker/.dockerignore` (4회차 공개) | `node_modules`, `dist`, `.env` 를 이미지에 안 넣기 |
| `.env.example` | (신규) | 필요한 환경변수 목록 견본 |

**`nginx.conf` 를 굳이 복사해 둔 이유가 중요합니다.**

`docker build` 는 마지막 인자로 준 폴더(= **빌드 컨텍스트**) 전체를 도커 엔진에 먼저 전송하고,
`COPY` 는 **그 컨텍스트 안의 파일만** 가져올 수 있습니다. 상위 폴더로 거슬러 올라갈 수 없습니다.

```dockerfile
COPY ../../실습코드/nginx/nginx-proxy.conf /etc/nginx/conf.d/default.conf   # ❌ 안 됩니다
```

그래서 원본을 앱 루트에 `nginx.conf` 라는 이름으로 복사해 두고, Dockerfile 은 그것을 씁니다.
실무에서 설정 파일이 저장소 여기저기 흩어져 있지 않고 앱 루트에 모여 있는 이유가 이것입니다.

> `.dockerignore` 는 `.env` 를 제외하고 `.env.example` 만 남깁니다.
> `.env` 에 든 값이 이미지 안에 들어가면 그 이미지를 받은 사람 누구나 꺼내볼 수 있기 때문입니다.

---

## 6. 이미 구현되어 있는 것

week3-start 의 모든 기능(사전 검색, 로딩/에러 화면, 경쟁 상태 방지, localStorage 저장/복원)에 더해

| 파일 | 무엇이 들어 있나 |
| --- | --- |
| `src/hooks/useApiWords.js` | 미니 API 의 `/api/words` 호출. `VITE_API_URL` 이 비면 상대경로 사용 |
| `src/components/RecommendedWords.jsx` | 추천 단어 목록 + "추가" 버튼. 로딩/에러/빈 상태 표시 |
| `src/App.jsx` | 사전 검색 결과와 추천 단어를 같은 `addWord()` 로 단어장에 담습니다 |

미니 API 의 응답에는 `id` 와 `phonetic` 이 없습니다.
`useApiWords.js` 의 `toWord()` 가 우리 앱이 쓰는 모양(`id, word, phonetic, partOfSpeech, meaning, example`)으로
번역해 줍니다. **바깥 세상의 데이터 모양을 내 앱의 모양으로 번역하는 층**입니다.

---

## 7. 동작 확인 체크리스트

미니 API 를 띄운 상태에서 아래가 전부 동작해야 정상입니다.

1. 검색창에 `serendipity` → 뜻이 나오고 "내 단어장에 추가" 가 동작한다
2. **새로고침해도 내가 추가한 단어가 남아 있다** (`localStorage` 키: `my-vocabulary`)
3. "추천 단어" 영역에 미니 API 의 단어 8개가 보인다
4. 미니 API 터미널에 `GET /api/words -> 200` 로그가 찍힌다
5. `npm run build` → `grep -r "api/words" dist/` 가 히트한다

---

## 8. 자주 나는 문제

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| 추천 단어가 CORS 에러 | 정상입니다 (의도된 동작) | 위 2번 참고. nginx 프록시 뒤에서는 사라집니다 |
| 추천 단어가 `Failed to fetch` | 미니 API 가 안 떠 있음 | `node server.js` 실행 확인, `curl` 로 먼저 확인 |
| `import.meta.env.VITE_API_URL` 이 `undefined` | `.env` 없음 / 접두사 누락 / dev 서버 재시작 안 함 | `.env` 는 `package.json` 과 같은 폴더에. `VITE_` 접두사 필수 |
| `.env` 를 고쳤는데 빌드 결과가 그대로 | 재빌드를 안 함 | `npm run build` 다시. **예외 없습니다** |
| `docker build` 가 `npm ci` 에서 실패 | `package-lock.json` 이 없음 | 먼저 `npm install` 실행 |
| 컨테이너가 뜨자마자 죽음 | `host not found in upstream "mini-api"` | 위 4번 참고 (compose 사용 또는 `/api/` 블록 주석) |
| `8080` 포트가 이미 쓰이는 중 | 다른 프로세스가 점유 | `-p 3000:80` 처럼 포트만 바꿔서 진행 |
| 컨테이너는 떴는데 nginx 기본 페이지 | 빌드가 제대로 안 됨 | `docker build` 로그를 위로 스크롤해 **첫 번째** 에러를 확인 |
