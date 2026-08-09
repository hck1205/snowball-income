// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * "시뮬 첨부" 배지가 **엉뚱한 글에 붙지 않게** 잠근다.
 *
 * ## 🔴 잠재 결함 (2026-08-09 파이어족들 신설 때 발견)
 *
 * `posts.has_payload` 는 **DB 생성 컬럼**이다 — `payload is not null` 그 자체다. 그런데 `payload`
 * 한 칸에는 **여러 종류**가 들어온다: 갤러리 글은 시뮬 시나리오, 파이어족들 글은 링크 메타다.
 * 그래서 파이어족들 글도 `has_payload = true` 이고, 그 값만 보고 배지를 그리면
 * **영상 카드에 "시뮬 첨부" 배지가 붙는다.**
 *
 * 지금은 안 드러난다 — 배지를 그리는 화면들이 `kind` 로 걸러 조회하기 때문이다. 하지만 언젠가
 * 통합 피드를 만들면 그날 바로 나타난다. 그때 원인을 찾기는 어렵다(오류가 아니라 **틀린 배지가
 * 그럴듯하게** 붙는 것뿐이다).
 *
 * ⚠ 그래서 소스를 읽어 잠근다. 렌더 테스트로는 "아직 안 일어나는 일"을 잡을 수 없다.
 *   같은 이유로 `--changed` 가 아니라 **레포 전수 가드**로 돈다(파일을 읽는 테스트다).
 *
 * ## 고치는 법
 *
 * `has_payload` 대신 **모양을 판정**한다 — `isScenarioPayload(post.payload)`
 * (`shared/lib/supabase/payload.ts`). 상세 화면이 이미 그렇게 고쳐졌다(같은 날, 같은 원인으로
 * 링크 글 상세가 터졌다).
 */

const REPO_ROOT = join(__dirname, '../..');

/** 배지를 그리는 화면들 — `has_payload` 를 직접 읽는 곳이 여기뿐이어야 한다. */
const BADGE_SURFACES = [
  'pages/Community/components/PostFeedRow/PostFeedRow.tsx',
  'pages/Community/components/PostGalleryCard/PostGalleryCard.tsx',
  'components/community/PostCard/PostCard.tsx',
  'components/community/PostRow/PostRow.tsx'
];

describe('🔴 "시뮬 첨부" 배지는 시나리오 글에만', () => {
  it('⭐ 배지를 그리는 화면이 늘어나면 여기서 알린다 — 새 화면은 모양 판정을 써야 한다', () => {
    /*
     * 이 목록이 곧 "지금 `has_payload` 만 보고 있는 자리"다. 늘어났다면 그 화면이
     * `isScenarioPayload` 를 쓰는지 사람이 확인해야 한다.
     */
    const found = BADGE_SURFACES.filter((path) =>
      readFileSync(join(REPO_ROOT, path), 'utf8').includes('has_payload')
    );

    expect(found.sort()).toEqual([...BADGE_SURFACES].sort());
  });

  it('🔴 통합 피드를 만들 때 이 파일을 먼저 읽어라 — 파이어족들 글도 has_payload 가 true 다', () => {
    /*
     * 판정 함수가 존재하고 export 돼 있는지만 본다. 이게 사라지면 위 처방이 사라진 것이다.
     * (동작 자체는 상세 화면 쪽 테스트가 아니라 타입과 사용처가 지킨다.)
     */
    const payload = readFileSync(join(REPO_ROOT, 'shared/lib/supabase/payload.ts'), 'utf8');

    expect(payload).toContain('export const isScenarioPayload');
    /* 모양으로 판정한다는 사실 — `kind` 를 화면까지 배선하는 방식으로 되돌아가지 않게. */
    expect(payload).toContain("'portfolio' in payload");
  });
});
