# nginx 설정 — 3회차 실습

빌드 결과물(`dist/`)을 nginx 로 직접 서빙하고, 마지막에는 리버스 프록시로
CORS 문제까지 없애봅니다. 설정 파일 **세 개를 순서대로** 적용하면서
"무엇이 안 되는지 → 왜 안 되는지 → 어떻게 고치는지"를 차례로 겪는 구성입니다.

| 순서 | 파일 | 추가되는 것 | 이 단계에서 겪는 일 |
| --- | --- | --- | --- |
| 1단계 | `nginx.conf` | 정적 서빙만 | `/about` 새로고침 시 **404** (의도된 실패) |
| 2단계 | `nginx-spa.conf` | SPA fallback + 캐시 헤더 | 404 해결. 대신 API 호출은 **CORS 에러** |
| 3단계 | `nginx-proxy.conf` | `/api/` 리버스 프록시 | CORS 에러도 **사라짐** |

> 세 파일은 서로를 덮어쓰는 관계가 아니라 **누적**됩니다.
> 3단계 파일 안에 1·2단계 내용이 전부 들어 있습니다.

---

## 0. 준비 — dist 만들기

먼저 앱을 빌드해서 `dist/` 폴더를 만들어 둡니다.

```bash
cd <단어장-앱-폴더>
npm run build
ls dist            # index.html, assets/ 가 보이면 성공
```

아래 명령어들은 **`dist` 가 있는 폴더에서** 실행한다고 가정합니다.
설정 파일 경로는 각자 위치에 맞게 바꿔주세요.

---

## 1단계 — `nginx.conf` : 새로고침 404 를 직접 만나보기

### 띄우기

```bash
docker run --rm -p 8080:80 \
  -v "$(pwd)/dist:/usr/share/nginx/html:ro" \
  -v "$(pwd)/../nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  --name study-web \
  nginx:alpine
```

- `-v A:B:ro` : 내 컴퓨터의 폴더 A 를 컨테이너 안 경로 B 에 **읽기 전용**으로 연결합니다
  (이미지를 다시 빌드하지 않아도 파일이 바로 반영됩니다)
- `/etc/nginx/conf.d/default.conf` : `nginx:alpine` 이미지가 기본으로 읽는 설정 파일 위치입니다.
  여기를 우리 파일로 덮어씁니다
- `-p 8080:80` : 내 컴퓨터의 8080 → 컨테이너의 80

### 확인 방법

| 해볼 것 | 성공(= 이 단계에서 기대하는 모습) |
| --- | --- |
| `http://localhost:8080/` 접속 | ✅ 앱 화면이 뜬다 |
| 화면 안에서 다른 페이지로 이동 | ✅ 잘 이동한다 (React Router 가 처리) |
| 그 상태에서 **F5 새로고침** | ❌ **404 Not Found** ← 이게 이 단계의 목표입니다 |
| 주소창에 `/about` 직접 입력 | ❌ **404 Not Found** |

**404 가 떠야 정상입니다.** 안 뜨면 설정 파일이 제대로 안 붙은 것입니다.

### 왜 404 인가요

새로고침을 하면 브라우저가 nginx 에게 `GET /about` 파일을 진짜로 요청합니다.
그런데 `dist/` 안에는 `about` 이라는 파일이 없습니다. `index.html` 하나뿐입니다.
없는 파일을 달라고 하니 nginx 는 정직하게 404 를 돌려줍니다.

`npm run dev` 에서는 잘 됐던 이유는, Vite 개발 서버가 이 처리를 **대신 해주고 있었기** 때문입니다.

### 정리

```bash
docker stop study-web
```

---

## 2단계 — `nginx-spa.conf` : SPA fallback 으로 404 고치기

### 띄우기

1단계와 똑같고 설정 파일 이름만 바뀝니다.

```bash
docker run --rm -p 8080:80 \
  -v "$(pwd)/dist:/usr/share/nginx/html:ro" \
  -v "$(pwd)/../nginx/nginx-spa.conf:/etc/nginx/conf.d/default.conf:ro" \
  --name study-web \
  nginx:alpine
```

### 무엇이 바뀌었나

핵심은 `try_files` 마지막 인자 한 군데입니다.

```nginx
# 1단계
try_files $uri $uri/ =404;         # 파일 없으면 404

# 2단계
try_files $uri $uri/ /index.html;  # 파일 없으면 index.html 을 준다
```

`index.html` 이 내려가면 → JS 가 실행되고 → React Router 가 주소창의
`/about` 을 읽고 알맞은 화면을 그립니다.

여기에 캐시 헤더도 함께 넣었습니다.

| 대상 | 헤더 | 이유 |
| --- | --- | --- |
| `index.html` | `no-cache, must-revalidate` | 어떤 JS 를 불러올지 적힌 **목차** 파일. 캐시되면 배포해도 안 바뀜 |
| `/assets/*` | `public, max-age=31536000, immutable` | 파일 이름에 **해시**가 붙어 있음. 내용이 바뀌면 이름이 바뀌므로 1년 캐시해도 안전 |

### 확인 방법

| 해볼 것 | 성공 | 실패 |
| --- | --- | --- |
| `/about` 에서 F5 | ✅ 화면이 정상적으로 나온다 | ❌ 여전히 404 → 설정 파일이 안 붙음 |
| 개발자도구 Network → `index.html` 클릭 | ✅ Response Headers 에 `Cache-Control: no-cache...` | |
| Network → `assets/index-xxxx.js` 클릭 | ✅ `Cache-Control: public, max-age=31536000, immutable` | |
| 앱에서 API 호출 | ❌ **콘솔에 CORS 에러** ← 다음 단계에서 해결 | |

터미널에서도 확인할 수 있습니다.

```bash
curl -I http://localhost:8080/about        # 404 가 아니라 200 이면 성공
curl -I http://localhost:8080/index.html   # Cache-Control 확인
```

### 정리

```bash
docker stop study-web
```

---

## 3단계 — `nginx-proxy.conf` : 리버스 프록시로 CORS 없애기

이 단계는 **API 서버가 같이 떠 있어야** 합니다.
그리고 nginx 가 `mini-api` 라는 이름으로 API 서버를 찾을 수 있어야 합니다.

### 방법 A. docker compose (권장 — 4회차와 동일한 방식)

준비물이 조금 있습니다. 자세한 내용은 `../docker/README.md` 를 보세요.

```bash
# 1) 앱 프로젝트 루트에 Dockerfile.vite 와 nginx-proxy.conf 를 복사
# 2) docker/.env 에 앱 경로를 적기 (docker/ 폴더는 4회차에 공개됩니다)
#      APP_DIR=../../my-vocabulary
# 3) 실행
cd docker
docker compose up --build
```

compose 가 두 컨테이너를 같은 네트워크에 올려주고, 서비스 이름 `mini-api` 가
그대로 호스트 이름이 됩니다. 브라우저에서 `http://localhost` 로 접속합니다.
(이 방식에서는 포트가 8080 이 아니라 **80** 입니다)

### 방법 B. docker network 로 직접 (compose 없이 원리만 보고 싶을 때)

```bash
# 1) 두 컨테이너가 서로를 이름으로 찾을 수 있는 네트워크를 만듭니다
docker network create study-net

# 2) API 서버를 그 네트워크에 --name mini-api 로 띄웁니다
#    (이 이름이 nginx.conf 의 proxy_pass 주소와 일치해야 합니다)
cd mini-api
docker build -t mini-api .
docker run -d --rm --network study-net --name mini-api mini-api

# 3) nginx 를 같은 네트워크에 띄웁니다 (dist 가 있는 폴더에서)
docker run --rm -p 8080:80 \
  --network study-net \
  -v "$(pwd)/dist:/usr/share/nginx/html:ro" \
  -v "$(pwd)/../nginx/nginx-proxy.conf:/etc/nginx/conf.d/default.conf:ro" \
  --name study-web \
  nginx:alpine
```

> **순서가 중요합니다.** nginx 는 시작할 때 `proxy_pass` 의 호스트 이름을
> 한 번 해석합니다. `mini-api` 컨테이너가 먼저 떠 있지 않으면
> `host not found in upstream "mini-api"` 라며 **nginx 가 아예 시작되지 않습니다.**
> 이 에러를 보면 API 컨테이너부터 확인하세요.

정리할 때는

```bash
docker stop study-web mini-api
docker network rm study-net
```

### 프론트엔드 코드도 한 줄 바꿉니다

```js
// 변경 전 — 호스트와 포트를 직접 적음 (= 다른 출처 = CORS 대상)
fetch('http://localhost:3001/api/words')

// 변경 후 — 호스트를 아예 적지 않음 (= 지금 보고 있는 사이트에 그대로 요청)
fetch('/api/words')
```

### 확인 방법

| 해볼 것 | 성공 | 실패 |
| --- | --- | --- |
| 앱에서 단어 목록 불러오기 | ✅ 데이터가 화면에 뜬다. **콘솔에 CORS 에러 없음** | ❌ CORS 에러가 남아있다 → `fetch` 주소를 아직 `localhost:3001` 로 쓰고 있는지 확인 |
| **API 서버 터미널 로그** | ✅ `[19:42:07] GET /api/words -> 200` 이 찍힌다 | ❌ 안 찍힌다 → 프록시가 요청을 전달하지 못함 |
| `curl -i http://localhost:8080/api/words` | ✅ 단어 JSON 이 온다 | ❌ HTML 이 오면 `/api/` location 이 안 잡힌 것 |
| `curl -i http://localhost:8080/api/health` | ✅ `{"status":"ok"}` | |
| 브라우저 Network 탭에서 요청 URL | ✅ `http://localhost:8080/api/words` (포트 3001 이 안 보임) | |

**API 서버 터미널의 로그가 가장 확실한 증거입니다.**
브라우저 주소창에는 3001 이라는 포트가 한 번도 등장하지 않는데
API 서버 터미널에는 요청이 찍힌다면 — nginx 가 대신 전달해 준 것입니다.

### 왜 CORS 가 사라졌나요

바뀐 것은 **브라우저가 보는 주소**뿐입니다.

```
[변경 전]  화면 http://localhost:8080  ─┐
           API  http://localhost:3001  ─┴─ 포트가 다름 = 다른 출처 = CORS 검사 → 차단

[변경 후]  화면 http://localhost:8080/        ─┐
           API  http://localhost:8080/api/... ─┴─ 완전히 같은 출처 = 검사 안 함
```

API 서버는 여전히 CORS 헤더를 하나도 보내지 않습니다. **코드를 안 고쳤습니다.**
교차 출처라는 상황 자체가 없어졌기 때문에 검사할 일이 없어진 것입니다.

nginx 와 mini-api 사이의 통신은 서버끼리의 통신입니다.
CORS 는 브라우저의 규칙이므로, 서버끼리 주고받는 데에는 적용되지 않습니다.

> 이것이 실무에서 프론트엔드 앞에 nginx 를 두는 큰 이유 중 하나입니다.
> 덤으로 API 주소를 코드에 박을 필요가 없어져서, 환경별로 빌드를 다시 할 일도 줄어듭니다.

---

## 자주 나는 오류

| 에러 메시지 / 증상 | 원인 | 해결 |
| --- | --- | --- |
| `host not found in upstream "mini-api"` | nginx 시작 시점에 API 컨테이너가 없음 | API 를 먼저 띄우거나 compose 사용. 같은 네트워크인지 확인 |
| `Bind for 0.0.0.0:8080 failed: port is already allocated` | 8080 포트를 이미 다른 컨테이너가 사용 중 | `docker ps` 로 확인 후 `docker stop`, 또는 `-p 8081:80` |
| 앱은 뜨는데 화면이 비어 있음 | `dist` 를 마운트 안 했거나 빌드 전 | `npm run build` 후 `dist` 경로 확인 |
| `Unexpected token '<', "<!doctype "... is not valid JSON` | API 요청이 프록시로 안 가고 `index.html` 로 감 | `location /api/` 블록이 있는지, 요청 경로가 `/api/` 로 시작하는지 확인 |
| API 요청이 404 | `proxy_pass` 끝에 `/` 를 붙임 (`http://mini-api:3001/`) | 슬래시를 빼세요. 붙이면 `/api` 를 떼고 전달합니다 |
| 설정을 고쳤는데 반영이 안 됨 | nginx 는 시작할 때 설정을 읽음 | 컨테이너 재시작 (`docker restart study-web`) |
| 파일을 바꿨는데 브라우저가 옛날 걸 보여줌 | 브라우저 캐시 | 개발자도구 열고 새로고침 버튼 우클릭 → 캐시 비우기 및 강력 새로고침 |

### 설정 문법이 맞는지 미리 검사하기

```bash
docker run --rm \
  -v "$(pwd)/nginx-proxy.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine nginx -t
```

`syntax is ok` / `test is successful` 이 나오면 문법은 정상입니다.
(단, `proxy_pass` 의 `mini-api` 호스트는 해석하지 못해 이 검사에서 실패할 수 있습니다.
그 경우는 문법 문제가 아니라 네트워크 문제입니다.)

### 실행 중인 컨테이너 안의 설정 확인

```bash
docker exec study-web cat /etc/nginx/conf.d/default.conf   # 내가 의도한 파일이 맞는지
docker logs study-web                                       # nginx 에러 로그
```
