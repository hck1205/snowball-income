import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';
import { PRIVACY_DOCUMENT, TERMS_DOCUMENT } from '@/pages/Legal/copy';

/**
 * 법무 고지문 라우트(`/privacy`·`/terms`)의 계약.
 *
 * 이 두 주소는 화면 하나가 아니라 **외부 심사와 법적 고지의 접점**이다. 그래서 잠그는 것이 세 가지다.
 *
 *  ① **경로 기반으로 존재한다.** 구글 OAuth 동의 화면 심사는 개인정보처리방침 URL 을 직접 연다.
 *     해시 라우팅(`/#/privacy`)으로 바뀌거나 라우트가 사라지면 화면상으로는 아무 일도 없어 보이고
 *     심사만 조용히 막힌다.
 *  ② 🔴 **색인을 막지 않는다.** 404 는 마운트 동안 robots 를 noindex 로 바꾼다 — 그 장치를 복사해
 *     이 화면에 붙이면 위 심사와 검색 노출이 함께 막힌다. 그래서 "바뀌지 않는다"를 명시적으로 본다.
 *  ③ **문서에 [확인 필요] 표시가 남아 있으면 알린다.** 이 초안은 변호사 검토 전이고, 확인되지 않은
 *     항목(리전·보존기간·시행일)을 그럴듯하게 채우지 않고 표시로 남겼다. 그 표시가 **사라졌는데
 *     사실이 확인되지 않은 상태**로 배포되는 것이 이 문서에서 가장 위험한 회귀다. 여기서는 표시의
 *     존재 자체를 세어, 개수가 바뀌면 사람이 한 번 더 보게 만든다.
 */

beforeAll(async () => {
  // lazy 라우트의 첫 변환 비용을 대기 창 밖으로 뺀다(notFoundRoute.test.tsx 와 같은 이유).
  await import('@/pages/Legal/PrivacyPage');
  await import('@/pages/Legal/TermsPage');
});

const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);

  return router;
};

/** 문서 모델 전체를 훑어 `[확인 필요` 로 시작하는 표시를 센다(문단·목록·표·정의 목록 전부). */
const countPending = (document: typeof PRIVACY_DOCUMENT): number => {
  const texts: string[] = [...document.meta];

  for (const section of document.sections) {
    for (const block of section.blocks) {
      if (block.kind === 'paragraph') texts.push(block.text);
      if (block.kind === 'list') texts.push(...block.items);
      if (block.kind === 'table') texts.push(...block.rows.flat());
      if (block.kind === 'definitions') texts.push(...block.items.map((item) => item.description));
    }
  }

  return texts.filter((text) => text.includes('[확인 필요')).length;
};

describe('법무 고지문 라우트', () => {
  it('/privacy 는 개인정보처리방침을 그린다', async () => {
    const router = renderAt('/privacy');

    expect(
      await screen.findByRole('heading', { level: 1, name: PRIVACY_DOCUMENT.title })
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/privacy');
  });

  it('/terms 는 이용약관을 그린다', async () => {
    const router = renderAt('/terms');

    expect(await screen.findByRole('heading', { level: 1, name: TERMS_DOCUMENT.title })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/terms');
  });

  it('🔴 색인을 막지 않는다 — robots 가 그대로 남는다', async () => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'index, follow';
    document.head.appendChild(meta);

    try {
      renderAt('/privacy');
      await screen.findByRole('heading', { level: 1, name: PRIVACY_DOCUMENT.title });

      expect(meta.content).toBe('index, follow');
    } finally {
      meta.remove();
    }
  });

  it('면책의 핵심 주장이 약관 본문에 있다 — 시뮬레이터·비자문·손실 책임', async () => {
    renderAt('/terms');
    await screen.findByRole('heading', { level: 1, name: TERMS_DOCUMENT.title });

    expect(screen.getByText(/입력한 가정을 그대로 계산해 보여주는 시뮬레이터/)).toBeInTheDocument();
    expect(screen.getByText(/투자 자문이 아니며 특정 종목의 매수나 매도를 권유하지 않습니다/)).toBeInTheDocument();
    expect(screen.getByText(/투자 손실에 대해 책임지지 않습니다/)).toBeInTheDocument();
  });

  it('개인정보 보호책임자는 이름·직책·이메일로 완결된다 (전화번호 줄을 두지 않는다)', async () => {
    renderAt('/privacy');
    await screen.findByRole('heading', { level: 1, name: PRIVACY_DOCUMENT.title });

    // 권익침해 구제 기관 표에도 "전화" 열이 있으므로(그건 공공기관 안내다) 이 절로 좁혀서 본다.
    const officer = within(screen.getByRole('region', { name: '12. 개인정보 보호책임자' }));

    expect(officer.getByText('홍창규')).toBeInTheDocument();
    expect(officer.getByText('matteematics@gmail.com')).toBeInTheDocument();
    // 빈 칸·하이픈·"없음" 도 두지 않기로 한 결정 — 줄 자체가 없어야 한다.
    // (이 절의 안내 문단은 "연락처"라는 낱말을 쓴다 — 그건 이메일을 가리키는 말이라 대상이 아니다.)
    expect(officer.queryByText(/전화/)).not.toBeInTheDocument();
  });

  it('구글 스프레드시트 연동의 권한 범위와 저장 위치를 고지한다', async () => {
    renderAt('/privacy');
    await screen.findByRole('heading', { level: 1, name: PRIVACY_DOCUMENT.title });

    // 🔴 `drive.file` 이 "드라이브 전체"가 아니라는 사실은 이용자에게 유리한 고지라 반드시 남아 있어야 한다.
    expect(screen.getByText(/직접 고르신 파일에만 적용되며/)).toBeInTheDocument();
    // 🔴 가계부 내용이 운영자 서버에 저장되지 않는다는 서술 — 여기가 흐려지면 고지가 사실과 어긋난다.
    expect(screen.getByText(/가계부 항목은 한 건도 저장되지 않습니다/)).toBeInTheDocument();
  });

  it('🔴 사실 확인이 끝나지 않은 항목이 하나도 없다', () => {
    /*
     * 종전에는 "몇 건 남았나"를 세는 테스트였다(초안 상태 표시). 2026-08-09 에 13건을 전부
     * 사실로 교체하면서 **0건을 잠그는 계약**으로 바꿨다 — 이제 이 숫자는 늘어날 수 없다.
     *
     * 🔴 새 자리표시자를 넣으면 여기서 막힌다. 그게 의도다: `[확인 필요: …]` 는 **초안에서만**
     *    허용되는 표시이고, 그 문서는 이미 게시돼 있다. 값을 모르면 그 문장을 아예 쓰지 마라 —
     *    "확인 중"이라 적힌 고지문은 고지가 아니다.
     * ⚠ 그런데도 자리표시자가 필요하면(새 절을 초안으로 쓰는 중이라거나), 이 테스트를 고치는 대신
     *   **그 절을 게시하지 않는 쪽**을 먼저 검토하라.
     */
    expect(countPending(PRIVACY_DOCUMENT)).toBe(0);
    expect(countPending(TERMS_DOCUMENT)).toBe(0);
  });
});
