# ==================================================================
# 4회차 · Next.js 배포용 멀티스테이지 Dockerfile (standalone 모드)
# ==================================================================
# Vite 앱은 결과물이 정적 파일(HTML/JS/CSS)이라 nginx 로 서빙하면 끝이었습니다.
# Next.js 는 SSR 을 하므로 요청이 올 때마다 서버에서 HTML 을 만들어야 합니다.
# 즉 최종 이미지 안에 **Node 서버가 계속 살아 있어야** 합니다.
# 그래서 마지막 스테이지가 nginx 가 아니라 node 입니다.
#
# ★ 사전 준비 두 가지
#   1) next.config.js 에 output: 'standalone' 이 있어야 합니다.
#      없으면 .next/standalone 이 생기지 않아 아래 COPY 가 실패합니다.
#   2) package-lock.json 이 있어야 합니다. (npm ci 는 lock 파일을 요구합니다)
#      없다면 먼저 호스트에서 `npm install` 을 한 번 실행하세요.
#
# 빌드:  docker build -t my-vocab-next:v1 .
# 실행:  docker run --rm -p 3000:3000 --name vocab-next my-vocab-next:v1
# 접속:  http://localhost:3000
# ==================================================================


# ------------------------------------------------------------------
# 1단계 — deps : 의존성만 설치하는 스테이지
# ------------------------------------------------------------------
# 왜 굳이 스테이지를 따로 나누나요?
#   의존성 설치는 느리고, 소스코드보다 훨씬 덜 바뀝니다.
#   따로 떼어놓으면 소스코드를 아무리 고쳐도 이 스테이지는 캐시가 재사용됩니다.
FROM node:20-alpine AS deps

WORKDIR /app

# 의존성 목록만 먼저 복사 (레이어 캐시를 살리기 위해)
COPY package.json package-lock.json ./

# npm ci : lock 파일 그대로 설치. 항상 같은 결과가 나옵니다.
RUN npm ci


# ------------------------------------------------------------------
# 2단계 — builder : 앱을 빌드
# ------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 1단계에서 설치해 둔 node_modules 를 그대로 가져옵니다 (다시 설치하지 않습니다).
COPY --from=deps /app/node_modules ./node_modules

# 소스코드 전체 복사 (.dockerignore 에 적힌 것은 빠집니다)
COPY . .

# Next.js 텔레메트리(익명 사용 통계 전송)를 끕니다. 빌드가 조금 빨라집니다.
ENV NEXT_TELEMETRY_DISABLED=1

# 빌드타임 환경변수.
# Next 에서도 NEXT_PUBLIC_ 으로 시작하는 값은 Vite 의 VITE_ 와 똑같이
# 빌드 시점에 클라이언트 번들 안으로 박힙니다. 그래서 여기서 주입합니다.
#   docker build --build-arg NEXT_PUBLIC_SITE_NAME="사내 단어장" -t ... .
ARG NEXT_PUBLIC_SITE_NAME="나만의 단어장"
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME

# 빌드. output:'standalone' 덕분에 .next/standalone/ 이 생성됩니다.
RUN npm run build


# ------------------------------------------------------------------
# 3단계 — runner : 실제로 배포될 이미지
# ------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ---- non-root 유저로 실행 ----
# 컨테이너 안의 기본 유저는 root 입니다.
# 컨테이너가 뚫렸을 때 피해 범위를 줄이기 위해 권한이 낮은 유저를 만들어 씁니다.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# ---- 빌드 결과물 복사 ----
# public/ : 정적 파일 (robots.txt, 이미지 등)
# ※ COPY 는 원본이 없으면 실패합니다. 이 프로젝트에는 public/robots.txt 가 있습니다.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# standalone/ : 서버 실행에 필요한 최소 구성 + 자체 server.js
# 이 폴더 "안의 내용물"이 /app 바로 아래로 펼쳐집니다.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# static/ : 해시가 붙은 JS/CSS 청크.
# standalone 안에는 포함되지 않아서 별도로 복사해야 합니다.
# ★ 이걸 빼먹으면 페이지는 뜨는데 스타일과 JS 가 전부 깨집니다. (가장 흔한 실수)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 여기서부터의 명령은 nextjs 유저 권한으로 실행됩니다.
USER nextjs

EXPOSE 3000

ENV PORT=3000
# ★ 0.0.0.0 으로 바인딩해야 컨테이너 밖에서 접속할 수 있습니다.
#   localhost 로 두면 -p 로 포트를 열어도 접속이 안 됩니다. (아주 흔한 함정)
ENV HOSTNAME=0.0.0.0

# ★ next start 가 아니라 node server.js 입니다.
#   standalone 모드가 만들어준 server.js 를 직접 실행합니다.
#   그래서 최종 이미지에 next 패키지 전체가 없어도 동작합니다.
#
#   3회차와 오늘 앞부분에서 배포한 것은 "파일"이었습니다.
#   지금 배포하는 것은 "프로세스"입니다. 이게 결정적 차이입니다.
CMD ["node", "server.js"]
