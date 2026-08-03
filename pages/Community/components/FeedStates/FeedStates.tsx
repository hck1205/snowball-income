import { BrandGlyph, Button, PickCardGrid } from '@/components/common';
import { AlertIcon } from '@/components/community';
import type { FeedEmptyProps, FeedErrorProps, FeedSkeletonProps, FeedTailProps } from './FeedStates.types';
import {
  EmptyActions,
  EmptyBody,
  EmptyMark,
  EmptyRoot,
  EmptySubtitle,
  EmptyTitle,
  ErrorActions,
  ErrorBody,
  ErrorMark,
  ErrorPanel,
  ErrorText,
  ErrorTitle,
  ErrorWrap,
  SkeletonBar,
  SkeletonCard,
  SkeletonGlyph,
  SkeletonList,
  SkeletonMetaStrip,
  SkeletonRail,
  SkeletonRow,
  SkeletonRowMain,
  SkeletonRowRail,
  SkeletonTile,
  TailEndCap,
  TailEndLabel,
  TailRetry,
  TailRoot,
  TailSpinner
} from './FeedStates.styled';

/** 첫 로딩 — 카드 격자. 실제 카드와 같은 기하·같은 블록 배치라 도착 시 목록이 튀지 않는다. */
export function FeedCardSkeletons({ count = 6 }: FeedSkeletonProps) {
  return (
    <div aria-hidden="true">
      <PickCardGrid as="ul" minColumnWidth="300px">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} $delay={index * 90}>
            <SkeletonRail />
            <SkeletonGlyph />
            <SkeletonBar $w="82%" $h="20px" />
            <SkeletonBar $w="38%" $h="10px" />
            <SkeletonTile>
              <SkeletonBar $w="34%" $h="10px" />
              <SkeletonBar $w="62%" $h="28px" />
              <SkeletonBar $w="48%" $h="10px" />
            </SkeletonTile>
            <SkeletonMetaStrip>
              <SkeletonBar $w="46%" $h="10px" />
              <SkeletonBar $w="28px" $h="28px" $r="8px" />
            </SkeletonMetaStrip>
          </SkeletonCard>
        ))}
      </PickCardGrid>
    </div>
  );
}

/** 첫 로딩 — 목록 행. 계수 레일 자리까지 잡아 둔다(좁은 폭에서는 레일이 없으므로 함께 사라진다). */
export function FeedRowSkeletons({ count = 6 }: FeedSkeletonProps) {
  return (
    <div aria-hidden="true">
      <SkeletonList>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonRow key={index} $delay={index * 70}>
            <SkeletonRowMain>
              <SkeletonBar $w="26%" $h="10px" />
              <SkeletonBar $w="68%" $h="18px" />
              <SkeletonBar $w="88%" $h="12px" />
            </SkeletonRowMain>
            <SkeletonRowRail>
              <SkeletonBar $w="52px" $h="10px" />
              <SkeletonBar $w="52px" $h="10px" />
              <SkeletonBar $w="52px" $h="10px" />
            </SkeletonRowRail>
          </SkeletonRow>
        ))}
      </SkeletonList>
    </div>
  );
}

/**
 * 빈 목록 / 검색 무결과 / 필터 무결과.
 *
 * 제목·부제·행동이 **같은 부모(EmptyBody)** 안에 선다 — 화면에서 한 덩어리로 읽히는 묶음이
 * DOM 에서도 한 덩어리여야 한다.
 */
export function FeedEmpty({ title, subtitle, action, mark }: FeedEmptyProps) {
  return (
    <EmptyRoot>
      <EmptyMark>{mark ?? <BrandGlyph size={96} />}</EmptyMark>
      <EmptyBody>
        <EmptyTitle>{title}</EmptyTitle>
        {subtitle ? <EmptySubtitle>{subtitle}</EmptySubtitle> : null}
        {action ? <EmptyActions>{action}</EmptyActions> : null}
      </EmptyBody>
    </EmptyRoot>
  );
}

/** 첫 로드 실패 — `role="alert"` 는 패널이 진다(제목·본문·재시도가 한 번에 읽힌다). */
export function FeedError({ title, body, retryLabel, onRetry }: FeedErrorProps) {
  return (
    <ErrorWrap>
      <ErrorPanel role="alert">
        <ErrorMark aria-hidden="true">
          <AlertIcon size={20} strokeWidth={1.8} />
        </ErrorMark>
        <ErrorBody>
          <ErrorTitle>{title}</ErrorTitle>
          <ErrorText>{body}</ErrorText>
          <ErrorActions>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          </ErrorActions>
        </ErrorBody>
      </ErrorPanel>
    </ErrorWrap>
  );
}

/** 목록의 꼬리 — 더 불러오는 중 / 추가 로드 실패 / 종료 표시. 세 상태가 한 라이브 리전에 산다. */
export function FeedTail({
  isLoadingMore,
  loadMoreError,
  reachedEnd,
  loadingLabel,
  endLabel,
  errorLabel,
  retryLabel,
  onRetry
}: FeedTailProps) {
  return (
    <TailRoot role="status" aria-live="polite">
      {loadMoreError ? (
        <>
          {errorLabel}{' '}
          <TailRetry type="button" onClick={onRetry}>
            {retryLabel}
          </TailRetry>
        </>
      ) : isLoadingMore ? (
        <>
          <TailSpinner aria-hidden="true" />
          {loadingLabel}
        </>
      ) : reachedEnd ? (
        <TailEndCap>
          <TailEndLabel>{endLabel}</TailEndLabel>
        </TailEndCap>
      ) : null}
    </TailRoot>
  );
}
