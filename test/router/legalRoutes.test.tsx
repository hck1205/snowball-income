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

  it('⚠ 사실 확인이 끝나지 않은 항목이 남아 있다 (초안 상태 표시)', () => {
    // 이 숫자가 줄면 누군가 사실을 확인해 채웠거나 표시를 지운 것이다 — 어느 쪽인지 사람이 확인한다.
    // 10 → 12: 2026-08-01 구글 시트 가계부 개정에서 둘이 늘었다.
    //   ① 8. 국외 이전 — 가계부 연동분의 Google 데이터센터 소재 국가
    //   ② 9. 권리 행사 — 구글 계정에서 접근 권한을 회수하는 화면의 주소
    expect(countPending(PRIVACY_DOCUMENT)).toBe(12);
    expect(countPending(TERMS_DOCUMENT)).toBe(2);
  });
});
