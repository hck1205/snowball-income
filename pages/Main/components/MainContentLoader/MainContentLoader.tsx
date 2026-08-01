import { memo } from 'react';
import type { MainContentLoaderProps } from './MainContentLoader.types';
import {
  LoaderLabel,
  LoaderSpinner,
  LoaderWrap,
  SkeletonBar,
  SkeletonCard,
  SkeletonStack,
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
          <SkeletonStack aria-hidden="true">
            {/* 요약 카드: hero 숫자 한 줄 + 지표 타일 줄 */}
            <SkeletonCard>
              <SkeletonBar $w="42%" $h="34px" />
              <SkeletonTileRow>
                <SkeletonBar $h="46px" />
                <SkeletonBar $h="46px" />
                <SkeletonBar $h="46px" />
              </SkeletonTileRow>
            </SkeletonCard>
            {/* 차트 카드: 제목 + 그래프 면 */}
            <SkeletonCard>
              <SkeletonBar $w="28%" />
              <SkeletonBar $h="160px" />
            </SkeletonCard>
            {/* 표 카드: 제목 + 행 세 줄 */}
            <SkeletonCard>
              <SkeletonBar $w="22%" />
              <SkeletonBar $h="18px" />
              <SkeletonBar $h="18px" />
              <SkeletonBar $h="18px" />
            </SkeletonCard>
          </SkeletonStack>
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
