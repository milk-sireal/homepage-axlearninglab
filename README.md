# AX러닝랩 홈페이지

기업 AX 교육 및 컨설팅을 소개하는 반응형 단일 페이지 정적 사이트입니다. HTML·CSS·JavaScript와 Vite를 사용합니다. 로그인, 데이터베이스, 환경 변수, 유료 API가 필요하지 않습니다. 3D 비주얼은 CSS로 구현하며 이미지·폰트·스크립트를 외부 서버에서 불러오지 않습니다.

## 로컬 개발

Node.js 22.12 이상(권장: Node.js 24 LTS)에서 저장소 루트를 작업 디렉터리로 사용합니다.

```sh
npm ci
npm run dev
```

## 프로덕션 빌드

```sh
npm run build
npm run preview
```

결과는 `dist/`에 생성됩니다. 배포할 소스는 `index.html`, `src/`, `public/`, `package.json`, `package-lock.json`, `vercel.json`입니다. 생성물과 node_modules는 Git에 포함하지 않습니다.

## 기능 검사

개발 서버(5173)와 preview 서버(4173)를 실행한 상태에서 다음 명령을 실행합니다.

```sh
npm run test:browser
```

Chromium이 `/usr/bin/chromium`에 설치되어 있어야 합니다. 다른 위치라면 `CHROMIUM_PATH`로 실행 파일 경로를 지정하세요. 이는 테스트 도구용 선택 설정이며 사이트 실행·Vercel 배포에는 필요하지 않습니다.

실제 Chromium에서 두 서버 각각 1440·768·390·320px 화면을 검사합니다. 영역 이동, 문의 영역 이동, mailto 링크, 앵커 대상, CSS 3D 비주얼, 파비콘, 가로 넘침, JavaScript 오류, HTTP 오류, 외부 요청 유무를 확인합니다. 스크린샷은 `/tmp/ax-test-results/`에 저장됩니다. 이메일 링크 검사는 주소 연결 검사이며 메일 발송·수신 검사는 아닙니다.

## Vercel 배포 준비

Vercel에서 이 GitHub 저장소를 가져올 때:

- Framework Preset: **Vite**
- Root Directory: 저장소 루트(`.`)
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js Version: **24.x**
- Environment Variables: 없음

`vercel.json`에 설치·빌드·출력 경로가 명시되어 있습니다. 모든 메뉴는 `/#about` 등의 문서 내 앵커를 사용하므로 별도 서버 라우팅이나 rewrite가 필요하지 않습니다. 빌드된 CSS·JavaScript는 `/assets/`, 파비콘은 `/favicon.svg`에 위치합니다. Vercel 도메인 루트 배포를 기준으로 합니다.

실제 Vercel 연결과 배포는 수행하지 않았습니다. 배포 이후 Vercel URL의 응답은 별도로 확인해야 합니다.

## 콘텐츠 수정

문구와 문의 주소는 `index.html`, 스타일과 자체 3D 비주얼은 `src/style.css`에서 수정합니다. `contact@example.com`은 요청받은 예시 주소입니다. 실제 운영 전 수신 가능한 주소로 교체하세요. 고객사·교육 실적은 임의로 작성하지 않았습니다.
