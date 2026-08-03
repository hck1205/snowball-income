import { Check } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import { ICON } from '@/shared/styles';
import type { PickCardCap, PickCardGridProps, PickCardProps } from './PickCard.types';
import { resolveCapPaint, resolveControlKind } from './PickCard.utils';
import {
  PickCardActions,
  PickCardBody,
  PickCardCapGlyph,
  PickCardCapLabel,
  PickCardGlyphBadge,
  PickCardGridRoot,
  PickCardHead,
  PickCardRail,
  PickCardRoot,
  PickCardSelectedBadge,
  PickCardStretchAnchor,
  PickCardStretchButton,
  PickCardStretchLink,
  PickCardSubtitle,
  PickCardTintCap,
  PickCardTitle,
  PickCardTitleGroup,
  PickCardTitleRight
} from './PickCard.styled';

/**
 * ── 고르는 면(brand)의 공용 카드 ──────────────────────────────────────────────
 *
 * 판정 기준 한 줄: **"여기서 무언가를 고르면 화면이 바뀌는가."** 그렇다면 이 카드다
 * (프리셋·티커 허브·비교 후보·대가·갤러리·404 목적지·가계부 진입). 결과 요약·차트·표는
 * **읽는 면**이므로 공용 `Card` 를 그대로 쓴다.
 *
 * ## 이 부품이 존재하는 이유
 * 같은 모양의 "고르는 카드"가 이미 7곳에 각자 복제돼 있었다. 히어로가 3벌로 갈렸다가 한 벌로
 * 수렴한 이력(`shared/styles/heroTitleRow.ts` 머리말)과 같은 실패의 8번째 반복을 막는다.
 *
 * ## 색을 다루는 규칙 (부품이 강제하는 것)
 * - 색은 **호출부가 축 이름 또는 CSS 변수로** 준다. 부품이 hex 를 만들지 않는다.
 * - `cap.glyph` 는 **필수**다 — 색이 단독 채널이 되는 순간 회색조·색각이상에서 카드가 구분되지 않는다.
 * - `cap.kind` 가 예산을 가른다: `rail`(6px, 면으로 안 세어짐) vs `tint`(48~88px, 세어짐).
 *   틴트 캡을 쓰는 격자는 `PickCardGrid cluster` 로 감싸라.
 *
 * ## 카드 전체를 누르게 만드는 방식
 * `to` / `href` / `onClick` 중 하나를 주면 제목을 감싼 컨트롤이 의사요소로 카드 전체를 덮는다.
 * 🔴 카드 자체를 `button`/`a` 로 만들지 않는 이유는 **카드 안에 또 다른 버튼이 들어오기 때문**이다
 * (버튼 안의 버튼은 유효하지 않은 HTML 이다). 그런 버튼은 `titleRight` · `actions` 슬롯에 넣으면
 * 자동으로 컨트롤 위로 올라간다.
 */
export default function PickCard({
  title,
  titleRight,
  subtitle,
  cap,
  children,
  actions,
  to,
  href,
  onClick,
  ariaLabel,
  selected = false,
  disabled = false,
  as = 'article',
  titleAs = 'h3',
  dataTour,
  className
}: PickCardProps) {
  const controlKind = resolveControlKind({ to, href, onClick });
  const interactive = controlKind !== 'none';

  const blockWhenDisabled = (event: MouseEvent) => {
    if (!disabled) return;
    event.preventDefault();
  };

  const renderControl = (label: ReactNode): ReactNode => {
    if (controlKind === 'router' && to) {
      return (
        <PickCardStretchLink
          to={to}
          aria-label={ariaLabel}
          aria-current={selected ? true : undefined}
          aria-disabled={disabled || undefined}
          onClick={blockWhenDisabled}
        >
          {label}
        </PickCardStretchLink>
      );
    }
    if (controlKind === 'anchor' && href) {
      return (
        <PickCardStretchAnchor
          href={href}
          aria-label={ariaLabel}
          aria-current={selected ? true : undefined}
          aria-disabled={disabled || undefined}
          onClick={blockWhenDisabled}
        >
          {label}
        </PickCardStretchAnchor>
      );
    }
    if (controlKind === 'button') {
      return (
        <PickCardStretchButton
          type="button"
          aria-label={ariaLabel}
          aria-pressed={selected ? true : undefined}
          disabled={disabled}
          onClick={onClick}
        >
          {label}
        </PickCardStretchButton>
      );
    }
    return label;
  };

  return (
    <PickCardRoot
      as={as}
      className={className}
      data-tour={dataTour}
      $selected={selected}
      $disabled={disabled}
      $interactive={interactive}
    >
      {cap ? <PickCardCapView cap={cap} /> : null}

      <PickCardHead>
        <PickCardTitleGroup>
          <PickCardTitle as={titleAs}>{renderControl(title)}</PickCardTitle>
          {subtitle ? <PickCardSubtitle>{subtitle}</PickCardSubtitle> : null}
        </PickCardTitleGroup>
        {selected || titleRight ? (
          <PickCardTitleRight>
            {selected ? (
              <PickCardSelectedBadge>
                <Check size={ICON.xs} strokeWidth={ICON.stroke} aria-hidden />
                선택됨
              </PickCardSelectedBadge>
            ) : null}
            {titleRight}
          </PickCardTitleRight>
        ) : null}
      </PickCardHead>

      {children ? <PickCardBody>{children}</PickCardBody> : null}
      {actions ? <PickCardActions>{actions}</PickCardActions> : null}
    </PickCardRoot>
  );
}

/**
 * 캡 한 벌. 형태(레일/틴트)에 따라 **다른 DOM** 을 낸다 — 같은 요소의 높이만 바꾸면
 * 6px 짜리에도 캡 안 라벨 자리가 남아 레이아웃이 어긋난다.
 */
function PickCardCapView({ cap }: { cap: PickCardCap }) {
  const paint = resolveCapPaint(cap);

  if (cap.kind === 'rail') {
    return (
      <>
        <PickCardRail $rail={paint.rail} aria-hidden />
        <PickCardGlyphBadge $ink={paint.ink} aria-hidden>
          {cap.glyph}
        </PickCardGlyphBadge>
        {cap.label ? <PickCardCapLabel>{cap.label}</PickCardCapLabel> : null}
      </>
    );
  }

  return (
    <PickCardTintCap $fill={paint.fill} $ink={paint.ink} $edge={paint.edge} $height={cap.height ?? 'md'}>
      <PickCardCapGlyph aria-hidden>{cap.glyph}</PickCardCapGlyph>
      {cap.label ? <PickCardCapLabel>{cap.label}</PickCardCapLabel> : null}
    </PickCardTintCap>
  );
}

/**
 * 고르는 카드들의 격자.
 *
 * `cluster` 를 켜면 `data-tint-cluster="pick-grid"` 를 낸다 — `tintscan` 이 이 격자 안의 **같은
 * 배경값 캡들을 합쳐 1면**으로 센다. 값을 부품이 고정하는 이유는 **라우트당 한 값만** 허용되기
 * 때문이다(값이 갈리면 집계 단계가 exit 1 로 막는다). 호출부가 문자열을 적을 여지를 주지 않는다.
 */
export function PickCardGrid({
  children,
  cluster = false,
  minColumnWidth = '260px',
  as = 'div',
  className
}: PickCardGridProps) {
  return (
    <PickCardGridRoot
      as={as}
      className={className}
      data-tint-cluster={cluster ? 'pick-grid' : undefined}
      $min={minColumnWidth}
    >
      {children}
    </PickCardGridRoot>
  );
}
