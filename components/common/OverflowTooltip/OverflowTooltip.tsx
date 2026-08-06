import { cloneElement, useEffect, useState } from 'react';
import { Tooltip } from '@/components/common';
import type { OverflowTooltipProps } from './OverflowTooltip.types';
import { isTextClipped, observeWidth } from './OverflowTooltip.utils';

/**
 * **잘렸을 때만** 뜨는 툴팁. 말줄임표(…)로 감춰진 전체 문자열을 hover·클릭·키보드 포커스로 연다.
 *
 * 왜 `title` 이 아닌가 — 클릭으로 열 수 없고 터치 기기에서는 아예 뜨지 않는다. 그래서 공용
 * `components/common/Tooltip` 을 쓴다: hover·focus 로 열리고 **클릭은 고정 토글**이며
 * Escape 로 닫히고, 열려 있는 동안 트리거에 `aria-describedby` 를 건다(그 파일 머리말).
 *
 * 🔴 **잘리지 않은 텍스트에는 붙이지 않는다.** 다 보이는 글자에 같은 글자를 또 띄우는 것은
 * 정보가 아니라 소음이고, 쓸데없는 탭 정거장까지 만든다. 잘림은 렌더 시점 실측으로만 알 수
 * 있으므로(`isTextClipped`) 처음엔 맨 요소로 그리고, 잘린 것이 확인된 뒤에 툴팁으로 감싼다.
 * 실측 근거(2026-08-04, `tools/dev/uiprobe.mjs`): 같은 이름이 1280 에서는 잘리고(133 / 161px)
 * 390 에서는 잘리지 않는다(219 / 219px) — 폭에 따라 갈리므로 "항상 달기"는 틀린 답이다.
 *
 * 비용: 툴팁 컴포넌트는 **잘린 행에만** 마운트되고, 말풍선 DOM 은 열려 있는 동안에만 존재한다.
 * 폭 감시는 `observeWidth` 의 공유 관찰자 하나로 끝난다(행마다 만들지 않는다).
 *
 * ⚠ 접근성 트레이드오프: 잘림은 CSS 라 **스크린리더는 원래부터 전체 이름을 읽는다**. 그래서
 * 열린 동안 `aria-describedby` 로 같은 문장이 한 번 더 읽힌다(중복이지 오류는 아니다).
 * 이 툴팁이 실제로 정보를 더하는 대상은 **화면을 보는 사용자**, 특히 마우스를 못 쓰는
 * 키보드 사용자다 — 그래서 잘렸을 때만 `tabIndex={0}` 으로 정거장을 만든다.
 */
export default function OverflowTooltip({ text, children }: OverflowTooltipProps) {
  /*
   * ref 를 state 로 받는다(콜백 ref). 잘림 판정이 뒤집히면 요소가 툴팁 앵커 안팎으로 옮겨져
   * **다시 마운트**되는데, `useRef` 였다면 그 사실이 이펙트에 전달되지 않아 관찰자가 이미
   * 떨어져 나간 옛 요소를 계속 보게 된다.
   */
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    if (element === null) return undefined;

    const measure = () => setClipped(isTextClipped(element));
    measure();
    return observeWidth(element, measure);
  }, [element, text]);

  const node = cloneElement(children, {
    ref: setElement,
    children: text,
    /* 잘렸을 때만 포커스를 받는다. `AgendaName` 의 `&[tabindex]` 규칙이 이 속성을 보고 커서를 바꾼다. */
    ...(clipped ? { tabIndex: 0 } : {})
  });

  return clipped ? <Tooltip content={text}>{node}</Tooltip> : node;
}
