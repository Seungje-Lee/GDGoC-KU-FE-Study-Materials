# ==================================================================
# 4회차 정답지 — 멀티스테이지 빌드
# ==================================================================
# [이 파일이 하는 일 — 한 문장]
#   "소스코드만 주면, 빌드까지 알아서 해서 배포 가능한 상태로 만든다."
#
#   3회차까지는 내가 npm run build 를 하고 그 dist/ 를 이미지에 넣었습니다.
#   그러면 결과물이 "내 Node 버전, 내 node_modules" 에 의존합니다.
#   팀원과 빌드 결과가 달라지고, 어제 dist 가 그대로 배포되는 사고가 납니다.
#
# [이미 아는 이야기입니다]
#   Vercel 에 push 하면 Vercel 서버가 npm ci && npm run build 를 돌립니다.
#   내 dist/ 를 올리는 게 아닙니다. GitHub Actions 도 같습니다.
#   이 파일이 하는 일이 정확히 그것입니다.
#
# [새로 외울 줄은 두 개뿐입니다]
#   FROM ... AS builder          1단계에 이름을 붙인다
#   COPY --from=builder ...      1단계가 만든 dist/ 만 꺼내온다
#   나머지(npm ci, npm run build)는 3회차에 터미널에서 치던 그것입니다.
#
# 빌드:  docker build -t my-vocab .
# 실행:  docker run --rm -p 8080:80 --name my-vocab my-vocab
# 환경별 빌드:  docker build --build-arg VITE_API_URL=/api -t my-vocab .
#
# ⚠️ nginx 설정 두 개 — 단독 실행이면 nginx-solo.conf
#   아래는 nginx.conf(3회차 3단계)를 복사합니다. 이 설정은 /api/ 를
#   'mini-api' 로 넘기는데, 그건 docker compose 의 서비스 이름이라
#   compose 없이 이 컨테이너만 띄우면 nginx 가 즉사합니다.
#       nginx: [emerg] host not found in upstream "mini-api"
#   컨테이너 하나만 띄울 때는 COPY 대상을 nginx-solo.conf 로 바꾸세요.
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
