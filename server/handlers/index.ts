/*
  ⚠ **의도적으로 비어 있는 배럴**이다(`.cursor/rules` 는 빈 index.ts 를 명시적으로 허용한다).

  여기서 6개 핸들러를 재export 하면 **여섯 개의 의존성 그래프가 하나로 융합된다**. 각 핸들러는
  `tools/apiBundle` 이 **개별 엔트리**로 번들하는 대상이고(→ `api/<name>.js`), 소비처(테스트)도 항상
  하나씩만 필요하다. 배럴을 만들면:
    - `@vercel/og`(satori + resvg.wasm)가 sitemap 같은 가벼운 핸들러의 테스트에까지 끌려 들어오고,
    - `Og.tsx` 의 모듈 스코프 폰트 캐시(`fontsPromise`)가 무관한 스위트에 얹혀 격리가 깨진다
      (근거: .claude/knowledge/pitfalls.md — og 스위트는 폰트를 항상 실패시켜야 안전하다).

  그래서 소비는 **핸들러 폴더 단위**로만 한다: `import { handler } from '@/server/handlers/Sitemap'`.
*/
export {};
