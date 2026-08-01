import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * 공용 페이지 푸터.
 *
 * 앞서 이 앱에는 푸터가 **네 벌**로 흩어져 있었다: 시뮬레이터의 `LandingDisclaimer`(가운데 정렬 문단),
 * 내 포트폴리오와 배당 캘린더의 `FootNoteCard`(좌측 2px 레일 + 각주 줄), 그리고 티커 허브는 아예
 * 아무것도 없었다. 같은 성격의 고지가 화면마다 다른 자리·다른 모양으로 나오면 사용자는 그것을
 * "이 화면에만 붙은 특별한 경고"로 읽는다.
 *
 * 모양은 **좌측 레일**(포트폴리오·캘린더가 쓰던 것)을 정본으로 삼았다 — 가운데 정렬 문단보다
 * 본문 흐름에서 덜 튀고, 각주가 여러 줄로 늘어나도 무게가 커지지 않는다.
 *
 * 색은 `textMuted`(각주)와 `textSecondary`(공통 고지)를 나눠 쓴다. 공통 고지는 **법적 성격**이 있어
 * 각주보다 한 단계 더 읽히는 쪽에 둔다(`LandingDisclaimer` 가 세워 둔 근거를 그대로 승계 —
 * `textSecondary` 는 앱 배경 위에서 WCAG AA 4.5:1 을 만족한다).
 */
export const FooterRoot = styled.footer`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[3]} ${space[4]};
  border-left: 2px solid ${color.border};
`;

export const NotesGroup = styled.div`
  display: grid;
  gap: ${space[1]};
`;

export const NotesTitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const Note = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/** 전 화면 공통 고지. 접힘·닫기 없이 항상 읽힌다(aria-hidden 금지). */
export const SiteNotice = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

/**
 * 법무 문서 링크 줄(개인정보처리방침·이용약관).
 *
 * 공통 고지보다 **한 단계 작고 흐리게** 둔다 — 이 줄은 "여기 있다"는 표시이지 읽히는 것이 목적인
 * 문장이 아니다(고지 본문은 위 SiteNotice 가 소유한다). 그래도 각주(textMuted)보다는 진하게 둬서
 * 누를 수 있는 것으로 읽히게 한다.
 *
 * 링크 밑줄은 남긴다. 푸터의 흐린 텍스트 사이에서 색만으로 링크를 구분하면 색각 이상 사용자가
 * 구분하지 못한다(WCAG 1.4.1).
 */
export const LegalLinks = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[3]};
`;

export const LegalLink = styled.a`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  text-underline-offset: 2px;

  &:hover {
    color: ${color.text};
  }
`;
