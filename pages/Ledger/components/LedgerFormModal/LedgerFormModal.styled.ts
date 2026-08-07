import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/**
 * 항목 추가·수정 폼.
 *
 * ⚠ 공용 `InputField` 를 쓰지 않는다. 그 부품은 `aria-invalid` 와 **오류 전용 서술 id** 를 받지
 * 않아(라벨에서 파생한 `hint` 하나만 연결한다) §4.5③ 의 접근성 계약을 만들 수 없다. 게다가 이
 * 폼에는 세그먼트 라디오와 `<datalist>` 입력이 있어 어차피 로컬 마크업이 필요하다 — 한 폼 안에서
 * 두 종류의 필드 마크업이 섞이는 편이 더 나쁘다. **공용 부품을 고치지도, 새로 만들지도 않는다.**
 */

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};
  min-width: 0;

  /* 금액·분류·메모는 언제나 전폭이다 — 날짜|구분 두 칸만 나란히 선다. */
  > *:nth-of-type(n + 3) {
    grid-column: 1 / -1;
  }

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Field = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const FieldLabel = styled.label`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

const inputSurface = `
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size.base};
  transition: border-color ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  &[aria-invalid='true'] {
    border-color: ${color.danger};
  }
`;

export const FieldInput = styled.input`
  ${inputSurface}
`;

/** 금액은 자릿수를 눈으로 세게 만들지 않는다 — 데이터 서체 + tabular. */
export const AmountInput = styled(FieldInput)`
  font-family: ${font.dataNumeric};
  ${font.numeric}
`;

/** 단위(원)를 입력 오른쪽에 붙인다. 값에는 포함되지 않는 순수 표시다. */
export const AmountRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

export const AmountUnit = styled.span`
  flex: 0 0 auto;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const FieldHint = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;

/**
 * 필드 오류 한 줄.
 * 🔴 **색이 유일한 채널이 아니다** — 문구 텍스트 자체가 1차 채널이고 왼쪽 레일은 보조다
 * (`ErrorBox` 어휘의 인라인 축소판).
 */
export const FieldError = styled.p`
  margin: 0;
  padding-left: ${space[2]};
  border-left: 3px solid ${color.danger};
  color: ${color.danger};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const KindFieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
  display: grid;
  gap: ${space[2]};
`;

export const KindLegend = styled.legend`
  padding: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const KindOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[2]};
`;

/**
 * 세그먼트 라디오. 선택 상태는 **테두리 + 면 + 굵기** 셋으로 말한다 — 색 하나에 기대지 않는다.
 * 네이티브 `<input type="radio">` 를 숨기지 않고 그대로 두면 세그먼트로 안 보이므로, 접근성
 * 트리에는 남기고(시각만 숨김) 라벨 전체를 클릭 대상으로 만든다.
 *
 * 🔴 선택 상태를 `:has()` 로 읽지 않는다. ①jsdom(nwsapi)이 파싱하지 못해 이 폼처럼 `useId` 의
 * **콜론 id** 를 가진 요소가 있으면 접근명 계산·role 질의가 통째로 죽고(레포 규약:
 * `components/common/Toggle/Toggle.styled.ts` 의 `HiddenCheckbox` 주석) ②미지원 브라우저에서
 * 선택 상태의 시각 신호가 전부 사라진다. 대신 **형제 선택자**(`input:checked + span`)로 말한다 —
 * 그래서 보이는 면은 라벨이 아니라 입력 바로 뒤의 `KindOptionFace` 다.
 */
export const KindOption = styled.label`
  position: relative;
  display: grid;
  min-width: 0;
  cursor: pointer;

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  input:checked + span {
    border-color: ${color.brandBorder};
    background: ${color.brandSubtle};
    color: ${color.brandText};
    font-weight: ${font.weight.bold};
  }

  input:focus-visible + span {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 세그먼트 한 칸의 보이는 면. 선택 신호(테두리·면·굵기)는 위 형제 선택자가 여기에 얹는다. */
export const KindOptionFace = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  min-height: 44px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};
`;

/** 배너 본문 안의 재시도 버튼 줄. ≤640 에서는 본문 아래로 내려간다. */
export const BannerRow = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[3]};
`;

/**
 * 체크박스 + 라벨 한 줄. 라벨이 오른쪽에 서고 **광학 정렬**을 맞춘다 —
 * 한글 라인박스는 중심이 아래로 치우쳐 있어 `center` 만으로는 글자가 박스보다 낮게 앉는다.
 */
export const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: ${color.brand};
    cursor: pointer;
  }

  label {
    margin: 0;
    cursor: pointer;
  }
`;
