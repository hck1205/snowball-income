/*
  `server/` — Vercel 서버리스 함수의 **소스**가 사는 곳. 배포되는 산출물은 `api/*.js` 이며
  `tools/apiBundle` 이 여기서 번들해 만든다(`npm run api:bundle`). 자세한 배경은 `server/handlers/index.ts`.

  `.cursor/rules` 의 "모든 폴더에 index.ts" 를 지키되, 재export 는 두지 않는다 — 서버 핸들러는
  앱 코드가 import 하는 대상이 아니라 **번들러의 엔트리**라서 공용 표면이 필요 없다.
*/
export {};
