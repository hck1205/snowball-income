import { memo } from 'react';
import type { MainContentLoaderProps } from './MainContentLoader.types';
import { LoaderLabel, LoaderSpinner, LoaderWrap } from './MainContentLoader.styled';

/**
 * IndexedDB 하이드레이션이 끝나기 전까지 메인 콘텐츠(좌 입력 / 우 결과)를 홀딩하는 로더.
 *
 * 기본값 화면을 잠깐 그렸다가 저장값으로 갈아끼우며 생기던 깜빡임을 없애기 위해,
 * 하이드레이션 완료 전에는 이 로더를 대신 보여준다. `role="status" + aria-busy`로
 * 보조기기에 "불러오는 중"임을 알린다.
 */
function MainContentLoaderComponent({ label = '불러오는 중…', minHeight }: MainContentLoaderProps) {
  return (
    <LoaderWrap role="status" aria-busy="true" minHeight={minHeight}>
      <LoaderSpinner aria-hidden="true" />
      <LoaderLabel>{label}</LoaderLabel>
    </LoaderWrap>
  );
}

const MainContentLoader = memo(MainContentLoaderComponent);

export default MainContentLoader;
