// @vitest-environment node — index.html 원문을 문자열로 읽어 본다 (DOM 불필요)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HOME_COPY } from '@/pages/Home/copy';
import { LANDING_GOALS, landingGoalPath } from '@/shared/constants/landingGoals';
import { ABOUT_PATH } from '@/shared/constants/routes';

/**
 * **첫 화면(`/`) 정적 셸 ↔ 화면 카피의 드리프트 방지.**
 *
 * `index.html` 의 `.app-shell-fallback` 은 **JS 를 실행하지 않는 소비자**(네이버 Yeti·Daumoa·
 * 카카오 스크래퍼·AI 답변 엔진)가 보는 `/` 의 전부다. 문구의 정본은 `pages/Home/copy` 와
 * `shared/constants/landingGoals` 이고 셸은 그 사본인데, 사본은 **화면에 안 보이므로** 어긋나도
 * 아무도 눈치채지 못한다 — `/` 가 랜딩이던 시절 그 사고가 실제로 났고, 하필 바뀐 낱말이 "추천"이라
 * 셸만 투자 권유를 하고 있었다(`landingShellCopyParity.test.ts` 머리말).
 *
 * 잠그는 것 넷:
 *  ① 여섯 목표의 **라벨·설명이 정본 그대로** 셸에 있다.
 *  ② 목표마다 **계산기로 가는 링크**가 있다 — 셸이 막다른 길이면 크롤러에게 죽은 문서다.
 *  ③ 🔴 **출구(`/about`)가 있다** — 이 링크가 이 사이트의 설명형 색인 대상으로 가는 유일한 내부 경로다.
 *  ④ 🔴 **설명을 되가져오지 않았다** — `/about` 본문이 여기 다시 실리면 두 색인 대상이 중복된다.
 */

const readRepoFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf-8');

const INDEX_HTML = readRepoFile('index.html');

/** 사람이 실제로 읽는 본문만 남긴다 — 주석·태그를 걷고 줄바꿈 들여쓰기를 한 칸으로 접는다. */
const shellText = (() => {
  const start = INDEX_HTML.indexOf('class="app-shell-fallback"');
  return INDEX_HTML.slice(start)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
})();

describe('① 목표 여섯이 셸에 정본 그대로 있다', () => {
  it.each(LANDING_GOALS.map((goal) => [goal.id, goal.label, goal.caption] as const))(
    '%s — 라벨과 설명이 함께 있다',
    (_id, label, caption) => {
      expect(shellText).toContain(label);
      expect(shellText).toContain(caption);
    }
  );

  it('제목과 리드도 정본 그대로다', () => {
    expect(shellText).toContain(HOME_COPY.hero.title);
    // 셸은 줄바꿈으로 접혀 있으므로 공백을 접은 뒤 비교한다.
    expect(shellText).toContain(HOME_COPY.hero.lede.replace(/\s+/g, ' '));
  });
});

describe('② 목표마다 계산기로 가는 링크가 있다', () => {
  it.each(LANDING_GOALS.map((goal) => [goal.id, landingGoalPath(goal)] as const))(
    '%s → %s',
    (_id, href) => {
      expect(INDEX_HTML).toContain(`href="${href}"`);
    }
  );
});

describe('③ 출구', () => {
  it('🔴 `/about` 으로 가는 링크가 있다 — 이 사이트의 설명형 색인 대상으로 가는 유일한 내부 경로다', () => {
    expect(INDEX_HTML).toContain(`href="${ABOUT_PATH}"`);
  });
});

describe('④ 설명을 되가져오지 않았다', () => {
  /**
   * 🔴 `/` 와 `/about` 이 같은 본문을 내려주면 두 색인 대상이 중복 콘텐츠가 된다. 아래 문장들은
   * `/about` 셸(`tools/seo/shells/about.body.html`)이 소유하는 것이라 여기 있으면 안 된다.
   */
  it.each(['배당을 알기 전에', '자주 묻는 질문', '실제 투자 전에 스스로 확인할 것', 'ETF는 여러 종목을'])(
    '"%s" 은 `/` 셸에 없다',
    (phrase) => {
      expect(shellText).not.toContain(phrase);
    }
  );

  it('🔴 문서 메타도 첫 화면의 것이다 — `/about` 제목이 남아 있으면 두 주소가 같은 페이지로 보인다', () => {
    expect(INDEX_HTML).toContain(`<title>${HOME_COPY.meta.title} - Hungry Hippo</title>`);
    expect(INDEX_HTML).not.toContain('배당 재투자 계산기와 배당 알아보기 - Hungry Hippo');
  });
});
