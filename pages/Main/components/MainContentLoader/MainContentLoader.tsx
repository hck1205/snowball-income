import { memo } from 'react';
import type { MainContentLoaderProps } from './MainContentLoader.types';
import {
  LoaderLabel,
  LoaderSpinner,
  LoaderWrap,
  SkeletonBand,
  SkeletonBar,
  SkeletonBoard,
  SkeletonCard,
  SkeletonPairRow,
  SkeletonRail,
  SkeletonStack,
  SkeletonTabsRow,
  SkeletonTileRow
} from './MainContentLoader.styled';

/**
 * IndexedDB 하이드레이션이 끝나기 전까지 메인 콘텐츠(좌 입력 / 우 결과)를 홀딩하는 로더.
 *
 * 기본값 화면을 잠깐 그렸다가 저장값으로 갈아끼우며 생기던 깜빡임을 없애기 위해,
 * 하이드레이션 완료 전에는 이 로더를 대신 보여준다. `role="status" + aria-busy`로
 * 보조기기에 "불러오는 중"임을 알린다.
 *
 * `variant='result'` 는 스피너 대신 **결과 그리드 모양의 스켈레톤**을 그린다 — 곧 올 화면의
 * 윤곽(요약 카드 → 차트 → 표)을 미리 보여 주면 기다리는 시간이 "빈 시간"이 아니게 된다.
 * 스켈레톤 막대는 `aria-hidden` 이다: 보조기기에는 라벨 한 줄이면 충분하고, 회색 막대 열 개를
 * 읽어 주는 것은 소음이다.
 */
function MainContentLoaderComponent({ label = '불러오는 중…', minHeight, variant = 'plain' }: MainContentLoaderProps) {
  return (
    <LoaderWrap role="status" aria-busy="true" minHeight={minHeight} $variant={variant}>
      {variant === 'result' ? (
        <>
          {/* 라벨을 먼저 둔다 — 스켈레톤 위에서 "무엇을 기다리는지"를 글자로 먼저 말한다. */}
          <LoaderLabel>{label}</LoaderLabel>
          {/* 곧 올 화면과 **같은 틀**(보드 = 머리 + 본문). 로딩이 끝날 때 프레임이 새로 그려지지 않는다. */}
          <SkeletonBoard aria-hidden="true">
            <SkeletonTabsRow>
              <SkeletonBar $w="96px" $h="28px" />
              <SkeletonBar $w="72px" $h="24px" />
            </SkeletonTabsRow>
            <SkeletonStack>
              {/* 요약 카드: hero 숫자 한 줄 + 지표 타일 줄 */}
              <SkeletonCard>
                <SkeletonBar $w="42%" $h="34px" />
                <SkeletonTileRow>
                  <SkeletonBar $h="46px" />
                  <SkeletonBar $h="46px" />
                  <SkeletonBar $h="46px" />
                </SkeletonTileRow>
              </SkeletonCard>
              {/* 조작 레일(빠른 조정): 이름표 칸 + 슬라이더 칸 */}
              <SkeletonRail>
                <SkeletonBar $w="70%" $h="16px" />
                <SkeletonBar $h="16px" />
              </SkeletonRail>
              {/* 막 머리띠: 표식 + 제목 + 룰 */}
              <SkeletonBand>
                <SkeletonBar $w="26px" $h="18px" />
                <SkeletonBar $w="60%" $h="22px" />
                <SkeletonBar $h="1px" />
              </SkeletonBand>
              {/* 차트 카드: 제목 + 그래프 면 */}
              <SkeletonCard>
                <SkeletonBar $w="28%" />
                <SkeletonBar $h="160px" />
              </SkeletonCard>
              {/* 한 행을 나눠 쓰는 두 카드 */}
              <SkeletonPairRow>
                <SkeletonCard>
                  <SkeletonBar $w="40%" />
                  <SkeletonBar $h="120px" />
                </SkeletonCard>
                <SkeletonCard>
                  <SkeletonBar $w="40%" />
                  <SkeletonBar $h="120px" />
                </SkeletonCard>
              </SkeletonPairRow>
            </SkeletonStack>
          </SkeletonBoard>
        </>
      ) : (
        <>
          <LoaderSpinner aria-hidden="true" />
          <LoaderLabel>{label}</LoaderLabel>
        </>
      )}
    </LoaderWrap>
  );
}

const MainContentLoader = memo(MainContentLoaderComponent);

export default MainContentLoader;
