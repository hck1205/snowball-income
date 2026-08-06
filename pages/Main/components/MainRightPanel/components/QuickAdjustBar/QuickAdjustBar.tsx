import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { CAPTURE_EXCLUDE_ATTRIBUTE } from '@/pages/Main/hooks/interaction';
import {
  QuickAdjustEyebrow,
  QuickAdjustGrid,
  QuickAdjustHead,
  QuickAdjustItem,
  QuickAdjustLabel,
  QuickAdjustLegend,
  QuickAdjustNote,
  QuickAdjustRail,
  QuickAdjustSlider,
  QuickAdjustValue
} from './QuickAdjustBar.styled';
import type { QuickAdjustBarProps, QuickAdjustFieldKey } from './QuickAdjustBar.types';
import { resolveQuickAdjustFields, toTrackProgressPercent } from './QuickAdjustBar.utils';

/**
 * 결과 바로 아래에서 **드로어를 열지 않고** 조정하는 세 값(월 적립 · 투자 기간 · 목표 월배당).
 *
 * 두 가지가 설계의 핵심이다.
 *
 * ① **커밋은 손을 뗄 때 한 번.** 드래그 중에는 로컬 초안만 움직이고(숫자는 즉시 따라온다),
 *    포인터를 놓거나 키에서 손을 떼거나 포커스를 잃을 때 `onSetField` 로 한 번 커밋한다.
 *    매 스텝 커밋하면 ⓐ 전체 시뮬레이션이 수십 번 다시 돌고 ⓑ `investment_setting_changed` 가
 *    한 번의 조정에 수십 발 나가 설정 분포 지표가 망가진다.
 * ② **경로는 드로어와 완전히 같다.** 새 atom 을 만들지 않고 폼의 `setField` 를 그대로 쓴다 —
 *    자동저장·클라우드 동기화·계측이 갈라지지 않는다(퍼널이 두 갈래가 되면 비교가 불가능해진다).
 *
 * 결과 이미지 저장에서는 제외한다(`data-capture-exclude`) — 그림 속에서 누를 수 없는 슬라이더는 미끼다.
 *
 * ③ **껍데기는 카드가 아니라 레일이다**(2026-08-03 2차 리워크). 이건 데이터가 아니라 조작 장치라
 *    요약 카드와 같은 무게로 서면 안 된다 — 형태·근거는 `QuickAdjustBar.styled.ts` 가 소유한다.
 */
export default function QuickAdjustBar({ values, onSetField }: QuickAdjustBarProps) {
  const idPrefix = useId();
  const fields = useMemo(() => resolveQuickAdjustFields(values), [values]);
  /**
   * 드래그 중인 필드의 초안 값. 커밋되면 비운다(= prop 값이 다시 정본).
   * ⚠ 커밋 판정은 **ref** 로 한다 — `setState` 업데이터 안에서 부모의 setter 를 부르면 React 가
   *   "렌더 중에 다른 컴포넌트를 갱신했다"고 경고하고, 실제로 렌더 순서에 의존하는 코드가 된다.
   */
  const [draft, setDraft] = useState<{ key: QuickAdjustFieldKey; value: number } | null>(null);
  const draftRef = useRef<{ key: QuickAdjustFieldKey; value: number } | null>(null);

  const handleDraft = useCallback((key: QuickAdjustFieldKey, raw: string) => {
    const next = Number(raw);
    if (!Number.isFinite(next)) return;
    draftRef.current = { key, value: next };
    setDraft(draftRef.current);
  }, []);

  const commit = useCallback(() => {
    const current = draftRef.current;
    if (!current) return;
    draftRef.current = null;
    setDraft(null);
    if (current.value !== values[current.key]) onSetField(current.key, current.value);
  }, [onSetField, values]);

  return (
    /* 🔴 카드가 아니라 **조작 레일**이다 — 왜 그런지는 `QuickAdjustBar.styled.ts` 의 주석이 소유한다. */
    <QuickAdjustRail {...{ [CAPTURE_EXCLUDE_ATTRIBUTE]: '' }}>
      <QuickAdjustLegend>
        <QuickAdjustEyebrow>빠른 조정</QuickAdjustEyebrow>
        <QuickAdjustNote>나머지 조건은 투자 설정에서 바꿉니다.</QuickAdjustNote>
      </QuickAdjustLegend>
      <QuickAdjustGrid>
        {fields.map((field) => {
          const shown = draft?.key === field.key ? draft.value : values[field.key];
          const inputId = `${idPrefix}-${field.key}`;

          return (
            <QuickAdjustItem key={field.key}>
              <QuickAdjustHead>
                <QuickAdjustLabel htmlFor={inputId}>{field.label}</QuickAdjustLabel>
                {/*
                 * 값은 **눈으로만** 읽는다. 낭독은 슬라이더의 `aria-valuetext` 가 맡는다 —
                 * 여기에 라이브 리전(`output` 의 기본 role='status')을 두면 드래그 한 번에
                 * 같은 값이 두 번씩, 수십~수백 발 발화한다.
                 */}
                <QuickAdjustValue aria-hidden="true">{field.format(shown)}</QuickAdjustValue>
              </QuickAdjustHead>
              <QuickAdjustSlider
                id={inputId}
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={shown}
                aria-label={field.label}
                aria-valuetext={field.format(shown)}
                style={
                  {
                    '--quick-progress': `${toTrackProgressPercent(shown, field.min, field.max)}%`
                  } as CSSProperties
                }
                onChange={(event) => handleDraft(field.key, event.target.value)}
                onPointerUp={commit}
                onKeyUp={commit}
                onBlur={commit}
              />
            </QuickAdjustItem>
          );
        })}
      </QuickAdjustGrid>
    </QuickAdjustRail>
  );
}
