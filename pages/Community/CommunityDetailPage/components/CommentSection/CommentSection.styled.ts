import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/**
 * ── 댓글 (2026-08-03 리워크) ────────────────────────────────────────────────
 *
 * 바뀐 것은 **구조**다.
 *
 * 1. 한 댓글이 세로 스택(아바타+이름 한 줄 → 본문 → 액션)이었다 → **아바타 거터 격자**.
 *    아바타가 왼쪽 칼럼에 고정되고 이름·본문·액션이 오른쪽 한 줄에 정렬된다. 스레드가 길어져도
 *    시선이 타는 세로선이 하나로 유지된다.
 * 2. 입력칸과 [등록] 버튼이 **따로 떠 있는 형제**였다 → 하나의 **패널로 융합**.
 *    테두리·포커스링을 패널이 소유하고, 안에서 textarea 와 하단 바가 hairline 으로 갈린다.
 * 3. 대댓글이 왼쪽 2px 세로선 + 패딩이었다 → 부모 본문 칼럼과 같은 선에 맞춘 **들여쓰기 + 실선**.
 */

/** 슬래브(CommentsBand) 안에 앉는다 — 자체 상단 구분선은 슬래브 경계가 대신하므로 호출부가 상쇄한다. */
export const Section = styled.section`
  margin-top: ${space[8]};
  padding-top: ${space[6]};
  border-top: 1px solid ${color.border};
`;

export const SectionHeading = styled.h2`
  margin: 0 0 ${space[5]};
  color: ${color.text};
  /* 본문 h2 와 같은 대역으로 올렸다 — 댓글은 "부록"이 아니라 이 화면의 두 번째 지면이다. */
  font-size: clamp(${font.size['2xl']}, 2.4vw, ${font.size['3xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  ${font.numeric}
`;

/**
 * 입력 패널. textarea 와 하단 바를 하나의 테두리 안으로 합쳤다.
 * 포커스 신호는 **패널이** 낸다(안쪽 textarea 는 자기 outline 을 끈다) — 컨트롤이 하나로 보이므로
 * 링도 하나여야 한다.
 */
export const Composer = styled.form`
  display: grid;
  margin-bottom: ${space[6]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
  overflow: hidden;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:focus-within {
    border-color: ${color.brand};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

export const CommentTextarea = styled.textarea`
  width: 100%;
  min-height: 88px;
  padding: ${space[4]};
  border: 0;
  border-radius: 0;
  background: transparent;
  color: ${color.text};
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  resize: vertical;
  font-family: inherit;

  &::placeholder {
    color: ${color.textMuted};
  }

  /* 패널이 focus-within 으로 링을 그린다 — 안에서 또 그리면 링이 두 겹이 된다. */
  &:focus,
  &:focus-visible {
    outline: none;
  }
`;

export const ComposerBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  padding: ${space[2]} ${space[3]};
  border-top: 1px solid ${color.border};
  background: ${color.surfaceSunken};
`;

export const ComposerCounter = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

/** 비로그인 안내 — 입력 패널이 서 있을 자리를 점선으로 잡아 둔다(빈칸이 아니라 "잠긴 칸"). */
export const LoginPrompt = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[4]};
  flex-wrap: wrap;
  padding: ${space[6]} ${space[4]};
  margin-bottom: ${space[6]};
  border-radius: ${radius.lg};
  border: 1px dashed ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  text-align: center;
`;

export const ThreadList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[6]};
`;

/* ── 한 댓글 = 아바타 거터 격자 ─────────────────────────────────────────────
 *   [avatar] [이름 · 시간]
 *      .     [본문        ]
 *      .     [액션        ]
 * 아바타가 세로 기준선을 잡아 스레드가 길어져도 눈이 흔들리지 않는다. */

export const CommentRoot = styled.div<{ pending?: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: ${space[3]};
  row-gap: ${space[2]};
  opacity: ${({ pending }) => (pending ? 0.55 : 1)};
  transition: opacity ${motion.fast} ${motion.ease};
`;

export const CommentAvatar = styled.div`
  grid-row: span 3;
  display: flex;
  align-items: flex-start;
`;

export const CommentHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};

  b {
    color: ${color.text};
    font-size: ${font.size.md};
    font-weight: ${font.weight.bold};
  }

  time {
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    ${font.numeric}
  }
`;

export const CommentBody = styled.p<{ deleted?: boolean }>`
  margin: 0;
  color: ${({ deleted }) => (deleted ? color.textMuted : color.text)};
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  white-space: pre-wrap;
  word-break: break-word;
  font-style: ${({ deleted }) => (deleted ? 'italic' : 'normal')};
`;

/**
 * 삭제된 댓글은 아바타가 없다 — 거터를 비우지 않고 두 칼럼을 통째로 쓴다.
 *
 * 🔴 면색으로 구분하지 않는다. 이 목록은 `CommentsBand`(= `surfaceSunken`) 위에 앉으므로
 * 여기에 `surfaceSunken` 을 깔면 **배경과 같은 색이 되어 상자가 사라진다**(실측 확인).
 * 점선 테두리는 어느 지면 위에 놓여도 남는 형태 채널이고, "지워진 자리"라는 뜻과도 맞는다.
 */
export const DeletedBody = styled(CommentBody)`
  grid-column: 1 / -1;
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.md};
  border: 1px dashed ${color.border};
  background: transparent;
`;

export const CommentActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/** 답글·삭제 — 좋아요 pill 옆에서 형태로 구분되게 테두리 없는 텍스트 칩. */
export const TextAction = styled.button`
  height: 30px;
  padding: 0 ${space[2]};
  border: 0;
  border-radius: ${radius.pill};
  background: transparent;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition: color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/* ── 대댓글 ────────────────────────────────────────────────────────────────
 * 부모의 **본문 칼럼 왼쪽 끝**에 맞춰 들여쓴다 — 답글이 "부모 아래"가 아니라 "부모의 말 옆"에
 * 붙어 보인다. 세로 실선은 스레드 경계를 잇는 한 줄이다.
 *
 * 🔴 값의 출처: `CommentAvatar` 안의 `Avatar size="md"` 가 **32px**(Avatar.styled.ts 의 DIMENSION)
 * 이고 `CommentRoot` 의 column-gap 이 `space[3]`(12px)이라 본문 칼럼은 44px 에서 시작한다.
 * 아바타 크기를 바꾸면 이 값도 함께 바꿔야 정렬이 유지된다. */

const REPLY_INDENT = '44px';

export const ReplyList = styled.ul`
  list-style: none;
  margin: ${space[4]} 0 0 ${REPLY_INDENT};
  padding: 0 0 0 ${space[4]};
  border-left: 1px solid ${color.border};
  display: grid;
  gap: ${space[4]};

  ${media.down('mobile')} {
    margin-left: ${space[4]};
  }
`;

export const ReplyComposerForm = styled(Composer)`
  margin: ${space[4]} 0 0 ${REPLY_INDENT};

  ${media.down('mobile')} {
    margin-left: ${space[4]};
  }
`;

export const StateText = styled.p`
  margin: 0;
  padding: ${space[6]} 0;
  color: ${color.textMuted};
  font-size: ${font.size.md};
  text-align: center;
`;

export const BannerAction = styled.div`
  margin-top: ${space[3]};
`;

/** 등록/삭제/좋아요 실패 안내 — 컴포저·목록 근처에서 role="alert"로 노출한다. */
export const InlineAlert = styled.p`
  margin: 0;
  padding: ${space[2]} ${space[4]};
  color: ${color.danger};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

/* ── 무한 스크롤 (루트 댓글 20개 단위) ─────────────────────────────────────── */

export const LoadMoreWrap = styled.div`
  display: grid;
  gap: ${space[2]};
  justify-items: center;
  margin-top: ${space[6]};
  padding-top: ${space[5]};
  border-top: 1px solid ${color.border};
`;

/** IntersectionObserver 관찰 지점 — 시각 요소가 아니다. */
export const CommentsSentinel = styled.div`
  width: 100%;
  min-height: 1px;
`;

export const LoadStatusText = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
