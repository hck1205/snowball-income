import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { Button } from '@/components/common';
import { isChunkLoadError, reloadOnceForChunkError } from '@/shared/lib/chunkRecovery';
import { ErrorActions, ErrorBody, ErrorRoot, ErrorTitle } from './RouteError.styled';

/**
 * 라우트에서 예외가 났을 때 **화면 전체가 영문 스택으로 대체되는 것**을 막는 마지막 안전망.
 *
 * ## 🔴 이것이 없어서 실제로 사고가 났다 (2026-08-07)
 * 새 배포로 lazy 청크 해시가 바뀌자, 이미 열려 있던 탭이 없는 파일을 가져오려다 실패했고
 * react-router 의 기본 에러 화면이 떴다:
 *
 *     Unexpected Application Error!
 *     Failed to fetch dynamically imported module: …/assets/index-XXXX.js
 *
 * 사용자에게는 **"사이트가 깨졌다"** 로 보인다 — 실제로는 새로고침 한 번이면 끝나는 상태인데
 * 그 사실을 아무도 알려 주지 않았다. 게다가 그 화면은 한국어도 아니고 돌아갈 길도 없다.
 *
 * ## 두 갈래로 다룬다
 * ① **사라진 청크**(배포 스큐) — 자동으로 한 번 새로고침한다. 사용자는 아무것도 안 해도 된다.
 *    ⚠ 자동 복구가 이미 한 번 있었으면(무한 루프 방지) 아래 화면이 그대로 남고, 버튼이 그 일을 맡는다.
 * ② **그 밖의 오류** — 무엇을 할 수 있는지 한국어로 말하고 홈으로 가는 길을 준다.
 *
 * ⚠ 이 화면은 **셸 밖**이다(헤더·푸터가 없다). 헤더를 그리려면 그 컴포넌트들이 정상이어야 하는데,
 *   여기 왔다는 것은 무언가 정상이 아니라는 뜻이다 — 에러 화면이 다시 에러를 내면 손쓸 방법이 없다.
 */
export default function RouteError() {
  const error = useRouteError();
  const isChunk = isChunkLoadError(error) || isChunkLoadError((error as { message?: string })?.message);

  useEffect(() => {
    /* 전역 핸들러(installChunkRecovery)를 빠져나온 경우를 여기서 한 번 더 잡는다. */
    if (isChunk) reloadOnceForChunkError();
  }, [isChunk]);

  return (
    <ErrorRoot role="alert">
      <ErrorTitle>{isChunk ? '새 버전이 배포되었습니다' : '화면을 여는 중 문제가 생겼습니다'}</ErrorTitle>
      <ErrorBody>
        {isChunk
          ? '앱이 업데이트되어 이전 화면 정보가 더 이상 맞지 않습니다. 새로고침하면 최신 버전으로 이어서 보실 수 있습니다.'
          : '잠시 후 다시 시도해 주세요. 계속 같은 문제가 생기면 새로고침하거나 처음 화면으로 돌아가 주세요.'}
      </ErrorBody>
      <ErrorActions>
        <Button variant="primary" onClick={() => window.location.reload()}>
          새로고침
        </Button>
        {/* ⚠ 라우터 링크가 아니라 통짜 이동이다 — 라우터가 이미 실패한 상태라 그 안에서 이동하면 같은 곳에 남는다. */}
        <Button variant="secondary" onClick={() => window.location.assign('/')}>
          처음 화면으로
        </Button>
      </ErrorActions>
    </ErrorRoot>
  );
}
