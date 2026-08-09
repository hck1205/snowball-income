// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 공유 카드 **이미지 파일**의 계약을 잠근다.
 *
 * ## 🔴 왜 이게 필요한가 (2026-08-09, 실제로 몇 주간 틀린 그림이 나갔다)
 *
 * 이름을 Hungry Hippo 로 바꾸고 공유 이미지도 새로 만들었는데, 카카오톡 공유 카드에는 계속
 * **Snowball Income 그림**이 나왔다. 서버는 처음부터 올바른 파일을 주고 있었다 — 카카오가 이미지를
 * **주소 기준**으로 따로 캐시하기 때문이다. OG 초기화 도구는 메타 태그를 다시 긁을 뿐이고, 태그가
 * 가리키는 주소가 `/og-image.png` 로 그대로면 이미 받아 둔 그림을 계속 쓴다.
 *
 * 그래서 처방은 **파일 이름을 바꾸는 것**이다. 그런데 그 처방에는 조용한 함정이 둘 있다:
 *
 * 1. `index.html`(정적 태그)과 `Og.tsx`(실패 시 302 폴백)에 **같은 경로가 두 번** 적혀 있다.
 *    HTML 이 TS 상수를 못 읽어서 어쩔 수 없이 벌어진 중복이다. 한쪽만 바꾸면 폴백이 **없는 파일로
 *    302** 하고, 수집기는 404 를 만나 카드를 통째로 포기한다.
 * 2. 이름만 바꾸고 `public/` 에 파일을 안 두면 **모든 미리보기가 사라진다.**
 *
 * 둘 다 **오류를 내지 않는다.** 앱은 멀쩡히 돌고, 공유 카드만 조용히 없어지거나 옛 그림이 남는다.
 * 그건 우리 화면에 안 보여서 아무도 모른다 — 그래서 파일을 읽어서 잠근다.
 *
 * ⚠ 파일을 읽는 테스트라 모듈 그래프에 안 잡힌다. `verify --quick` 의 레포 전수 가드로 돈다.
 */

const REPO_ROOT = join(__dirname, '../..');

const indexHtml = readFileSync(join(REPO_ROOT, 'index.html'), 'utf8');
const ogSource = readFileSync(join(REPO_ROOT, 'server/handlers/Og/Og.tsx'), 'utf8');

/** `content="%VITE_SITE_URL%/파일이름"` 에서 경로만 빼낸다. */
const metaImagePath = (attribute: string, name: string): string | null => {
  const pattern = new RegExp(`${attribute}="${name}"\\s+content="[^"]*?(/[^"/]+\\.(?:png|jpg|webp))"`);
  return indexHtml.match(pattern)?.[1] ?? null;
};

describe('🔴 공유 카드 이미지는 실재하는 한 파일을 가리킨다', () => {
  it('⭐ og:image 가 public/ 에 실제로 있는 파일이다 — 없으면 미리보기가 통째로 사라진다', () => {
    const path = metaImagePath('property', 'og:image');

    expect(path, 'index.html 에서 og:image 를 못 찾았다').not.toBeNull();
    expect(existsSync(join(REPO_ROOT, 'public', path!)), `public${path} 가 없다`).toBe(true);
  });

  it('twitter:image 가 og:image 와 같은 파일이다', () => {
    expect(metaImagePath('name', 'twitter:image')).toBe(metaImagePath('property', 'og:image'));
  });

  it('⭐ Og.tsx 의 실패 폴백이 같은 파일을 가리킨다 — 어긋나면 404 로 302 한다', () => {
    /*
     * 폴백은 "카드를 못 그렸을 때"만 타는 길이라 평소에 안 밟힌다. 여기서 안 잡으면
     * 실제로 폰트가 안 오는 날에야 드러나는데, 그날 원인을 찾기는 어렵다.
     */
    const fallback = ogSource.match(/const STATIC_OG_IMAGE = '([^']+)'/)?.[1];

    expect(fallback, 'Og.tsx 에서 STATIC_OG_IMAGE 를 못 찾았다').toBeTruthy();
    expect(fallback).toBe(metaImagePath('property', 'og:image'));
  });
});

describe('🔴 브랜드가 바뀌면 이름도 바뀐다', () => {
  it('⭐ 파일 이름이 `og-image` 같은 무명이 아니다 — 덮어쓰기로는 캐시를 못 깬다', () => {
    /*
     * 이름이 내용과 함께 바뀌어야 수집기 캐시가 깨진다. 무명 파일(`og-image.png`)로 돌아가면
     * 다음 개편 때 같은 사고가 반복된다 — 실제로 그렇게 몇 주를 보냈다.
     *
     * ⚠ `public/og-image.png` 자체는 아직 지우지 않았다. 옛 HTML 을 캐시해 둔 수집기가 나중에
     *   그 주소로 이미지를 받으러 오기 때문이다. 여기서 막는 것은 **그 파일을 다시 가리키는 것**이다.
     */
    expect(metaImagePath('property', 'og:image')).not.toBe('/og-image.png');
  });
});
