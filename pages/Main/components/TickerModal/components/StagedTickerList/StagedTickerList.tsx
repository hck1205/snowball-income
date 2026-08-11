import { getTickerDisplayName } from '@/shared/utils';
// 부모 배럴(../../index.ts)을 경유하면 TickerModal ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import {
  StagedHead,
  StagedRemoveButton,
  StagedSection,
  StagedTag,
  StagedTagList,
  StagedTagRemove,
  StagedTitle
} from '../../TickerModal.styled';
import type { StagedTickerListProps } from './StagedTickerList.types';

/**
 * 담은 종목(생성 대기) 목록 — **태그 줄**이다.
 *
 * 🔴 다중 생성의 **유일한 진실**이다. 프리셋에서 담은 것과 직접 입력에서 담은 것이 한 줄에 모이고,
 *    생성 버튼의 개수도 여기서 나온다. 그래서 누르기 전에 "무엇이 만들어질지"를 본다.
 * 🔴 **티커만 적는다**(2026-08-11 사용자 지시). 한 줄에 배당률·성장률까지 적던 시절에는 항목마다
 *    한 행을 먹어, 다섯 개만 담아도 이 상자가 프리셋 목록보다 커졌다. 값은 위 미리보기가 말하고,
 *    만든 뒤에는 종목 칩의 톱니에서 고칠 수 있다 — 여기서 두 번 말할 이유가 없다.
 * ⚠ 비어 있으면 `null` 이다. 빈 상자를 남기면 아직 아무것도 안 누른 첫 화면에 정체 불명의 칸이 생긴다.
 */
function StagedTickerList({ staged, onRemove, onClear }: StagedTickerListProps) {
  if (staged.length === 0) return null;

  return (
    <StagedSection aria-label="담은 종목">
      <StagedHead>
        <StagedTitle>{`담은 종목 ${staged.length}개`}</StagedTitle>
        <StagedRemoveButton type="button" aria-label="담은 종목 전체 비우기" onClick={onClear}>
          ⨯
        </StagedRemoveButton>
      </StagedHead>
      <StagedTagList>
        {staged.map((item) => {
          const label = getTickerDisplayName(item.draft.ticker, item.draft.name);
          return (
            <StagedTag key={item.key}>
              {label}
              <StagedTagRemove type="button" aria-label={`${label} 목록에서 빼기`} onClick={() => onRemove(item.key)}>
                ⨯
              </StagedTagRemove>
            </StagedTag>
          );
        })}
      </StagedTagList>
    </StagedSection>
  );
}

export default StagedTickerList;
