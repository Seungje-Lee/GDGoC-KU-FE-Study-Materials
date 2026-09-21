# ==================================================================
# 4회차 · 멀티스테이지 빌드 — Vite 앱 배포용 (실무에서 쓰는 형태)
# ==================================================================
# Dockerfile.simple 은 "내가 만든 dist 를 넣기만" 했습니다.
# 여기서는 빌드까지 컨테이너 안에서 합니다. 누가 어디서 빌드해도 결과가 같습니다.
#
# [멀티스테이지가 뭔가요]
#   FROM 을 두 번 씁니다. 각 FROM 부터가 하나의 "스테이지" 입니다.
#
#     1단계 builder : node 이미지에서 npm ci && npm run build 를 돌린다
#     2단계 runtime : nginx 이미지에 1단계 결과물(dist)만 꺼내 온다
#
#   최종 이미지에는 마지막 스테이지만 남습니다.
#   node_modules, 소스코드, npm 캐시는 1단계에 남아 최종 이미지에 들어가지 않습니다.
#   → 이미지가 1GB 대에서 50MB 안팎으로 줄어듭니다.
#     (docker images 로 직접 비교해 보세요)
#
# [사전 준비]
#   이 파일(Dockerfile)과 nginx.conf 는 이미 앱 루트에 복사되어 있습니다.
#   docker build 는 "빌드 컨텍스트(= 마지막 인자로 준 폴더)" 밖의 파일을
#   COPY 할 수 없기 때문에, 필요한 파일은 전부 앱 루트에 있어야 합니다.
#   (원본은 materials/실습코드/docker/Dockerfile.vite,
#           materials/실습코드/nginx/nginx-proxy.conf 입니다)
#
#   ⚠️ 빌드 전에 반드시 `npm install` 을 한 번 실행하세요.
#      아래 npm ci 는 package-lock.json 이 있어야 동작합니다.
#      시작 코드에는 lock 파일을 넣지 않았으므로 처음 한 번은 직접 만들어야 합니다.
#
# 빌드:  docker build -t my-vocab .
# 실행:  docker run --rm -p 8080:80 --name my-vocab my-vocab
#
# 빌드타임 환경변수를 넣고 싶다면:
#   docker build --build-arg VITE_API_URL=/api -t my-vocab .
#
# ⚠️ 단독 실행 주의
#   아래에서 복사하는 nginx.conf 는 /api/ 요청을 'mini-api' 호스트로 넘깁니다.
#   'mini-api' 는 docker compose 의 서비스 이름이라서,
#   compose 없이 이 컨테이너만 띄우면 nginx 가 그 이름을 찾지 못하고 바로 죽습니다.
#     host not found in upstream "mini-api"
#   compose 로 함께 띄우거나, nginx.conf 의 location /api/ 블록을
#   잠시 주석 처리하고 실행하세요. (자세한 내용은 README 참고)
# ==================================================================


# ------------------------------------------------------------------
# 1단계 — builder : 앱을 빌드하는 임시 작업장
# ------------------------------------------------------------------
# 'AS builder' 로 이름을 붙여두면 2단계에서 이 스테이지를 가리킬 수 있습니다.
FROM node:20-alpine AS builder

WORKDIR /app

# ★ package.json 을 먼저, 소스코드는 나중에 복사하는 이유 (레이어 캐시)
#   Docker 는 명령어 한 줄마다 결과를 캐시해 둡니다.
#   어떤 줄에서 입력이 바뀌면 그 줄부터 아래는 전부 다시 실행됩니다.
#
#   소스코드를 먼저 다 복사해 버리면, 컴포넌트 한 글자만 고쳐도
#   npm ci 부터 다시 돌아서 매번 몇 분씩 걸립니다.
#
#   의존성 목록(package.json, package-lock.json)만 먼저 복사해 두면
#   패키지를 추가/삭제하지 않는 한 npm ci 결과가 캐시에서 재사용됩니다.
COPY package.json package-lock.json ./

# npm install 이 아니라 npm ci 를 씁니다.
#   npm install : package.json 을 보고 알아서 해석 → 버전이 미묘하게 달라질 수 있음
#   npm ci      : package-lock.json 에 적힌 버전 그대로 설치 → 항상 동일한 결과
#                 (그래서 lock 파일이 반드시 있어야 하고, 없으면 실패합니다)
RUN npm ci

# 이제 나머지 소스코드를 복사합니다.
COPY . .

# ------------------------------------------------------------------
# ★ 빌드타임 환경변수 — 3회차 "환경변수 함정" 의 해법
# ------------------------------------------------------------------
# Vite 의 VITE_ 로 시작하는 환경변수는 런타임에 읽는 값이 아닙니다.
# 빌드할 때 그 자리에 값이 문자열로 그대로 치환되어 JS 파일에 박힙니다.
#
#   소스:      fetch(import.meta.env.VITE_API_URL + '/words')
#   빌드 결과: fetch("/api" + '/words')      ← 값이 코드에 박혀버림
#
# 그래서 컨테이너를 실행할 때 -e VITE_API_URL=... 로 넘겨봐야 아무 소용이 없습니다.
# 이미 빌드가 끝난 JS 파일 안의 문자열은 바뀌지 않기 때문입니다.
# ("환경변수 바꿨는데 왜 안 먹죠?" 의 정체가 이것입니다)
#
# 반드시 빌드 "시점"에 주입해야 합니다. 그래서 ARG 를 씁니다.
#
#   ARG : 빌드할 때만 존재하는 변수 (docker build --build-arg 로 전달)
#   ENV : 컨테이너 실행 중에도 남아있는 환경변수
#
# ARG 값을 ENV 로 옮겨야 아래 npm run build 프로세스가 환경변수로 읽을 수 있습니다.
#
# 기본값을 /api 로 둔 이유:
#   nginx 리버스 프록시를 쓰면 호스트를 적을 필요가 없습니다 (3회차 참고).
#   상대경로를 쓰면 개발/스테이징/운영에서 값을 바꿀 일 자체가 없어집니다.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# 실제 빌드. 결과물은 /app/dist 에 생성됩니다.
RUN npm run build


# ------------------------------------------------------------------
# 2단계 — runtime : 실제로 배포될 이미지
# ------------------------------------------------------------------
# 여기서부터 완전히 새로 시작합니다.
# 1단계의 node_modules, 소스코드는 이 이미지에 들어오지 않습니다.
FROM nginx:alpine

# --from=builder : 1단계 스테이지에서 파일을 꺼내옵니다.
# 결과물인 dist 폴더 "안의 내용물"만 가져옵니다.
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# nginx 설정 (SPA fallback + /api 리버스 프록시 + 캐시 헤더)
# 앱 루트의 nginx.conf 를 nginx 의 기본 사이트 설정 자리에 넣습니다.
# ※ compose 없이 단독 실행할 때는 mini-api 호스트를 못 찾아 nginx 가 안 뜹니다.
#   그 경우 nginx.conf 의 location /api/ 블록을 잠시 주석 처리하세요.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx:alpine 의 기본 CMD 를 그대로 씁니다.
# (참고로 기본 CMD 는 nginx 를 포그라운드로 실행합니다:
#  nginx -g "daemon off;" — 컨테이너는 메인 프로세스가 끝나면 종료되므로
#  데몬으로 백그라운드에 보내면 컨테이너가 바로 죽어버립니다)
