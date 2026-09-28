# docker/ — compose 파일 모음 (4회차)

**이 폴더의 파일은 직접 쓰지 않습니다. 실행만 합니다.**
4회차에 문법을 외우는 것이 목표가 아니라, **동작을 보고 두 가지를 가져가는 것**이 목표입니다.

---

## 1. 왜 필요한가 — 프론트엔드 입장에서

**Vercel은 프론트엔드만 호스팅합니다.** 그런데 우리 앱은 혼자 못 돕니다.
단어 목록을 주는 **API가 옆에 떠 있어야** 화면이 채워집니다.

지금까지는 **터미널 두 개**로 해결했습니다. 앱 하나, API 하나.
그런데 이걸 남에게 넘길 때 문제가 됩니다 —
"API부터 켜세요", "포트는 3001이에요", "순서 지켜주세요"를 **말로** 전달해야 합니다.

**compose는 그 구두 전달을 파일 하나로 바꾸는 도구입니다.**

---

## 2. 파일 두 개

| 파일 | 쓰는 곳 | 띄우는 것 |
|---|---|---|
| `docker-compose.yml` | 4회차 §7 | 우리 앱(nginx) + 미니 API |
| `docker-compose.next.yml` | 4회차 §10 | Next.js + 앞단 게이트웨이 nginx |
| `gateway.nginx.conf` | §10에서 쓰임 | 게이트웨이 nginx 설정 |

**실행은 반드시 이 폴더 안에서 합니다.** 파일 안의 `context: ../week4-start` 가
형제 폴더를 가리키기 때문입니다.

```bash
cd docker
docker compose up --build              # §7
docker compose -f docker-compose.next.yml up --build   # §10
docker compose down                    # 정리
```

> ⚠️ `docker-compose.yml` 을 쓰기 전에 `week4-start/Dockerfile` 의 COPY 줄이
> `nginx.conf` 인지 확인하세요. `nginx-solo.conf` 로 되어 있으면 `/api/` 프록시가
> 없어서 **추천 단어 영역이 비어 있습니다.**

---

## 3. 가져갈 것은 두 개뿐입니다

### ① 프론트와 API가 **같은 출처**가 됩니다

브라우저가 아는 주소는 `http://localhost:8080` **하나뿐**입니다.
화면도 거기서, `/api/words` 도 거기서 받습니다.
**그래서 CORS 검사가 애초에 일어나지 않습니다.**

3회차에 nginx 설정 몇 줄로 만든 그 구조를, 이제 **파일 하나가 매번 똑같이 재현**해 줍니다.

`nginx.conf` 의 `proxy_pass http://mini-api:3001;` 에서 `mini-api` 는
**이 compose 파일의 서비스 이름**입니다. 3회차에는 `--name mini-api` 로 직접 붙인
컨테이너 이름이었고, 지금은 compose가 같은 것을 해줍니다 —
**설정 파일은 한 글자도 안 바뀌었습니다.**

### ② `ports` 가 없는 서비스는 바깥에서 안 보입니다

직접 쳐보세요.

```bash
curl http://localhost:3001/api/words    # 실패합니다
curl http://localhost:8080/api/words    # 잘 됩니다
```

`mini-api` 에는 **`ports` 가 없습니다. 일부러입니다.**

> **`ports` 는 컨테이너끼리 통신하기 위한 설정이 아니라,
> 바깥 세상(내 컴퓨터)에 구멍을 뚫을 때만 필요합니다.**

`web`(nginx)은 같은 네트워크 안에 있으니 `mini-api` 라는 **이름**으로 그냥 접근합니다.
실무에서 DB나 내부 API를 정확히 이렇게 배치합니다 —
**외부에 열린 입구는 nginx 하나뿐**입니다.

> 3001이 **성공**한다면, 3회차에 띄운 `node server.js` 가 아직 살아 있는 것입니다.
> 그 터미널에서 `Ctrl+C` 로 끄고 다시 해보세요. (`lsof -i :3001` 로 확인)

---

## 4. 나머지 설정은 안 외워도 됩니다

`depends_on`, `healthcheck`, `restart` 는 **"순서와 재시작을 적어두는 칸"** 정도로만
알아두면 충분합니다. 지금 단계에서 외울 필요 없습니다.

한 가지만 참고로 — `healthcheck` 의 주소가 `localhost` 가 아니라 `127.0.0.1` 입니다.
Alpine 컨테이너 안에서 `localhost` 는 IPv6 `::1` 로 먼저 해석되는데
서버는 IPv4 에만 바인딩해서, `localhost` 로 쓰면 헬스체크가 영원히 실패합니다.
**서버는 멀쩡한데 헬스체크만 실패하는** 종류의 버그입니다.
