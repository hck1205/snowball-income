# 가계부(`/ledger`) UI 스펙 — 구현 지시서

> 작성 2026-08-01 · `ui-ux-designer` · **구현자: `frontend-engineer`(화면) / `state-engineer`(상태·영속)**
>
> 이 문서는 **재설계 왕복 0** 을 목표로 한다. 카피 문자열·토큰명·props 시그니처·파일 경로가 전부 확정돼 있다.
> 데이터 계층(`shared/lib/googleSheets/`)은 **다른 트랙 소유** — 이 문서는 그 폴더를 만들거나 고치지 않는다.
> 이 문서가 정의하는 것은 화면·상태·카피·접근성뿐이고, 데이터 계층에 요구하는 것은 §11 의 인터페이스 목록으로만 표현한다.

---

## 0. 범위와 전제 (재논의 금지)

| 항목 | 확정 |
|---|---|
| 도메인 | **진짜 가계부(수입·지출)** — 배당 가계부가 아니다. `shared/lib/snowball/` 과 무관 |
| 데이터 원본 | **사용자 본인의 구글 시트**. 우리 DB 에 복사 저장하지 않는다 |
| 범위 | 읽기 + 쓰기 + 시트 생성. **커버율·시각화·차트·FIRE 연동은 범위 밖** |
| 라우트 | `/ledger` (lazy) |
| 페이지 hue | `accentAlt` — `/dividend/portfolio` 와 같은 축("내 실측 데이터" 한 묶음) |
| 헤더 nav | ~~🔴 **넣지 않는다**(7번째 금지)~~ → **2026-08-01 사용자 결정으로 변경: 7번째 항목으로 넣는다**(`components/PrimaryNav`, 내 포트폴리오 바로 뒤 · `isGoogleSheetsEnabled` 로 갈림). 진입점은 §2 의 두 곳 + 헤더 nav = 셋 |
| env | `isLedgerEnabled` 가 false 면 라우트 자체를 등록하지 않는다(→ `*` → 404) |

### 0.1 기각한 대안 (각 2~3줄)

| 기각안 | 사유 |
|---|---|
| ~~**A. 헤더 nav 7번째 항목**~~ **→ 2026-08-01 채택**(사용자 지시 "가계부도 메뉴를 만들어줘") | 원 기각 사유는 기록으로 남긴다: env 로 꺼진 배포가 존재해 항목이 나타났다 사라진다 · 구글 동의를 통과해야 도달하는 소수 모수 · 8번째(랜딩 개편) 예약. **실측 대가**: 1024~1066px 대역에서 nav 스크롤러가 42px 넘쳐 "ETF 소개"가 스크롤 뒤로 밀리고 스크롤바 6px 때문에 헤더가 65→71px 이 된다(1067px↑·≤1023 은 무변화). 8번째를 추가하려면 그 전에 묶음(드롭다운) 설계가 먼저다. |
| **B. 항목 추가를 사이드 드로어로** | 이 페이지에 드로어가 하나뿐이어도 `SideDrawer` 는 `body` 스크롤락을 저장·복원한다(pitfalls 2026-07-28). 폼이 5필드짜리 짧은 입력이라 중앙 모달이 360px 에서도 충분하고, `Modal` 은 `documentElement` 를 잠가 드로어와 축이 갈린다. |
| **C. 수입=파랑 / 지출=빨강 색 코딩** | 🔴 확정 결정 위반. 수입·지출은 P&L 이 아니다(환율 위젯과 같은 판정, decisions 2026-07-24). 게다가 velog 기본 프리셋은 `brand`·`accent`·`accentAlt` 가 전부 초록이라 색 코딩 자체가 프리셋에 따라 무너진다(pitfalls 2026-07-30). |
| **D. 토스트로 저장 결과 알림** | 사라지는 알림은 실패 사유와 재시도 경로를 함께 잃는다. 사용자는 실패를 화면에서 재발견할 수 없다(user-profile 2026-07-17 "무음 실패는 버그 리포트로 돌아온다"). 실패는 **행/폼에 남는다**. |
| **E. 앱이 자기 카테고리 목록을 강제** | 사용자 시트가 정본이다. 앱 카테고리를 강제하면 시트를 앱 없이 열었을 때 값이 낯설어진다. 분류는 시트에 이미 등장한 값에서 자동완성한다. |
| **F. 월 요약을 차트로** | 범위 밖(시각화 제외). 3개 숫자에 차트를 붙이면 ECharts 를 이 lazy 청크로 끌어온다. |

---

## 1. 화면 상태 기계 (11개 요구 상태의 배치)

`/ledger` 는 **한 라우트 안의 상태 기계**다. 상태마다 다른 페이지를 만들지 않는다(뒤로가기 스택이 지저분해지고 히어로가 라우트마다 lazy 언마운트되면 hue 알약이 깜빡인다).

```
                      ┌────────────────────────────────────────────────┐
                      │  checking (연결 상태 확인 중)                     │  §4.0
                      └───────┬────────────────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  disconnected  (연결 전 빈 상태) │  §4.1  ← denied 가 여기로 복귀(§4.9)
              └──┬─────────────────────────┬──┘
   Picker(기존 시트)│                        │새 시트 만들기
              ┌───▼──────────┐        ┌────▼──────────────┐
              │ mapping (열 매핑)│  §4.2  │ creating → created │  §4.11
              └───┬──────────┘        └────┬──────────────┘
                  └──────────┬─────────────┘
                       ┌─────▼──────────────────────────────────┐
                       │ connected                              │
                       │  ├ rows > 0   → 목록          §4.3      │
                       │  └ rows === 0 → 이 달 기록 없음  §4.4      │
                       └─────┬──────────────────────────────────┘
                             │ (아래는 connected 위에 겹치는 부가 상태 — 목록은 유지된다)
                             ├ expired      §4.7   배너 + 쓰기 비활성 + 1클릭 재연결
                             ├ writeFailed  §4.8   행/폼에 실패 잔류 + 건별 재시도
                             └ conflict     §4.10  배너 + 새로고침
```

**상태 이름은 그대로 `LedgerConnectionState` 유니언으로 쓴다**(§11 참조).

---

## 2. 진입점 2곳 — 배치와 카피

### 2.1 `/dividend/portfolio` 화면 안 카드형 진입

**자리**: "지금 받는 배당"(SummaryCard) **바로 아래**, `PortfolioAssumptions` **위**.
근거: 카드 순서 `보유 종목 → 목표 달성 → 지금 받는 배당` 은 사용자 확정이고 `test/portfolio/portfolioCardOrder.test.tsx` 가 DOM 순서로 잠근다. 세 카드 **뒤에** 붙이면 그 순서를 건드리지 않는다.
✅ **가드는 깨지지 않는다**(확인함): `portfolioCardOrder.test.tsx:17-24` 의 `cardTitlesInOrder()` 는 헤딩 전체에서 **알려진 세 제목만 필터링**하므로 4번째 카드("가계부")가 붙어도 단정이 그대로 통과한다. 세 카드의 상대 순서는 건드리지 마라.

**부품**: 공용 `<Card tone="wash">`. `wash` 는 지금까지 소비처가 0이었고, 정의가 «빈 상태·프로모·CTA 처럼 "여기서 시작하세요"를 말하는 면»이라 **이 카드가 첫 정당한 소비자**다. 위계는 `base`(테두리 1px, 그림자 없음) + 면색만 `gradient-hero-soft` — 화면당 주역 1개(SummaryCard=`raised`) 규칙과 충돌하지 않는다.

```tsx
{isLedgerEnabled ? (
  <Card tone="wash" title={copy.ledgerEntry.title}>
    {/* 🔴 본문을 Card 의 `subtitle` 로 넘기지 마라 — CardSubtitle 은 12px/textMuted 캡션이라
        두 줄짜리 설명문에는 너무 작다(Card.styled.ts:102-108). 본문은 children 에 둔다. */}
    <EntryBody>{copy.ledgerEntry.body}</EntryBody>
    <ActionRow>
      <Button
        type="button"
        variant="secondary"
        startIcon={<ReceiptText size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
        onClick={onOpenLedger}      /* navigate('/ledger') — 컨테이너 소유 */
      >
        {copy.ledgerEntry.cta}
      </Button>
    </ActionRow>
  </Card>
) : null}
```

`EntryBody` = `styled.p` · `font.size.sm` · `color.textSecondary` · `font.leading.normal` · `max-width: 52ch` · `margin: 0 0 ${space[4]}` (`PortfolioPage.styled.ts` 에 추가).
⚠ `CardContainer` 는 grid 가 아니라 일반 블록이다(`gap` 없음, `Card.styled.ts:41-61`) — 자식 간 간격은 마진으로 준다.

확정 카피 (`pages/Portfolio/copy/portfolioCopy.ts` 에 `ledgerEntry` 키 신설):

```ts
ledgerEntry: {
  title: '가계부',
  body: '수입과 지출을 내 구글 시트에 기록합니다. 기록은 사용자의 드라이브에 남고, 앱은 선택한 시트 1개만 읽고 씁니다.',
  cta: '가계부 열기'
}
```

- 🔴 **버튼은 `secondary`** — 이 화면의 `primary` 는 "시뮬레이터로 보내기"가 이미 갖고 있다(화면당 primary 1개).
- 🔴 숫자·통계를 이 카드에 넣지 마라. 가계부 값을 여기서 미리 보여 주려면 시트를 읽어야 하고, 그러면 포트폴리오 화면이 구글 인증에 묶인다.

### 2.2 로그인 프로필 드롭다운

**자리**: `components/community/AuthControl/AuthControl.tsx` 의 메뉴에서 **"내가 쓴 글" 아래, "시뮬레이터로" 위**.
근거: 위 두 항목은 커뮤니티 계정 관리, 아래는 앱 이동이다. 가계부는 "내 데이터"라 계정 묶음 끝에 붙는다.

```tsx
{isLedgerEnabled ? (
  <MenuItem type="button" role="menuitem" onClick={() => { setOpen(false); navigate('/ledger'); }}>
    <ReceiptTextIcon size={16} strokeWidth={1.8} />
    {COMMUNITY_COPY.ledger.menuItem}
  </MenuItem>
) : null}
```

- 카피: `COMMUNITY_COPY.ledger.menuItem = '가계부'`
- 아이콘: lucide `ReceiptText` → `components/community/CommunityIcons` 에 `ReceiptTextIcon` 을 **1개 추가**(그 파일의 named-import 트리셰이킹 관례를 따른다). `Wallet` 은 `/dividend/portfolio` 히어로가 이미 쓰고 있어 재사용하지 않는다.
- ⚠ `AuthControl` 은 로그인 상태에서만 드롭다운을 그린다 — 비로그인 사용자의 진입점은 §2.1 하나뿐이고, 그것이 의도다(가계부는 어차피 구글 동의가 필요하다).

### 2.3 페이지 hue 등록

`shared/hooks/usePageHue/usePageHue.utils.ts` 의 `resolvePageHue` 에 **한 줄**:

```ts
if (pathname.startsWith('/ledger')) return 'accentAlt';
```

⚠ 가드 `shared/hooks/usePageHue/usePageHue.test.tsx` 가 "토큰 이름이 달라도 해석된 hex 가 같은 조합" 목록을 고정하고 있다(pitfalls 2026-07-31). `/ledger` 를 `accentAlt` 로 배정하면 **`/dividend/portfolio` 와 같은 색**이 되는데 이건 의도다(같은 축) — 가드가 "라우트별로 색이 갈린다"를 단정하고 있으면 그 단정을 고치지 말고 **의도된 동색 쌍으로 목록에 추가**하라.

---

## 3. 공통 레이아웃 — 카드 위계와 주역

### 3.1 페이지 뼈대 (모든 상태 공통)

```
<PageStack>                       ← grid, gap space[5], minmax(0,1fr)
  <PageHero … titleAs="h1" />     ← 공용 1벌. 로컬 히어로 금지
  <LiveRegion role="status" aria-live="polite" />   ← 화면당 1개
  {배너 슬롯}                       ← 만료 / 충돌 / 생성 직후 / 권한 거부 (조건부, 위→아래 우선순위)
  {상태별 본문}
  <PageFooter notesTitle notes />
</PageStack>
```

### 3.2 히어로 슬롯 배정

| 슬롯 | 값 |
|---|---|
| `icon` | `<ReceiptText size={20} strokeWidth={1.8} aria-hidden focusable={false} />` |
| `title` | `'가계부'` |
| `titleAs` | `'h1'` — 이 화면의 헤더 워드마크는 `h1` 이 아니다 |
| `lede` | `copy.hero.lede` |
| `notice` | 🔴 `copy.hero.scopeNotice` — **상시**. `role="note"` 로 나간다. 권한 안내를 화면에서 한 번만 말하는 자리 |
| `meta` | 연결 후에만: `copy.hero.meta([시트명, 읽은 시각])` · 연결 전에는 `undefined`(없는 값에 "—" 를 남기지 않는다) |
| `actions` | 상태별(§4). **최대 2개** |
| `titleAction` | 쓰지 않는다 |
| `tone` | 기본 `'gradient'` |

### 3.3 카드 위계 배정 — 🔴 **이 화면의 주역은 "월 요약 카드" 하나다**

| 카드 | tone | 사유 |
|---|---|---|
| **월 요약 카드**(수입·지출·순액) | **`raised`** 🔴 주역 | 사용자가 `/ledger` 를 켠 이유가 "이번 달 얼마 벌고 얼마 썼나"다. 규칙대로 **카드 제목이 없다** — hero 숫자(순액)가 제목 역할을 한다 |
| 거래 내역 카드 | `default` | 본문. 제목 "거래 내역" 필수 |
| 열 매핑 카드 | `default` | 본문 |
| 연결 선택 타일 ×2 | `wash`(=base 위계) | 장식 표면. 두 개가 **동일 마크업·동일 tone** 이라 무게가 같다 |
| 저장하지 못한 기록 카드 | `sunken` | 부속 — 본 목록과 다른 성격(재시도 대기열) |

- **`raised` 는 `connected` 상태에서만 존재한다.** `checking`·`disconnected`·`mapping` 에는 주역 카드가 없고 히어로가 시선을 받는다. "화면당 1개"는 상한이지 하한이 아니다.
- 🔴 `Card` 안에 `Card` 금지. 저장 실패 목록은 요약 카드 밖 형제로 둔다.

### 3.4 🔴 색 규율 (이 화면에서 반드시 지킬 것)

1. **금액 숫자는 전부 `color.text` 중립.** `StatTile` 의 `tone` 을 주지 마라(기본 `neutral`). 순액이 음수여도 색이 없다.
2. **`dataPositive`/`dataNegative`(손익 빨강·파랑)를 이 화면에서 import 하지 마라.**
3. **구분(수입/지출)은 색이 아니라 아이콘 + 텍스트 칩**으로 구별한다(§4.3.3).
4. 숫자에 `accent*` 금지 — accent 축은 배지·아이콘·장식 전용.
5. 하드코딩 hex 0. 아래 §10 의 토큰만 쓴다.
6. 실패·만료 표시는 **텍스트 라벨이 1차 채널**이고 틴트 면은 보조다.

---

## 4. 상태별 상세

### §4.0 `checking` — 연결 상태 확인 중

- **본문**: 거래 목록 자리에 **스켈레톤**(스피너 아님). W6 로딩 결정과 같은 처방 — 형태를 아는 자리는 그 형태의 스켈레톤을 낸다.
  - `LedgerSkeleton`: 요약 타일 3칸 자리(높이 고정) + 목록 행 3줄. 전부 `aria-hidden`.
  - 감싸는 `<section aria-busy="true">`.
- **히어로**: `actions` 없음, `meta` 없음.
- 🔴 스켈레톤에 셔머 애니메이션을 새로 만들지 마라 — `components/MainContentLoader` 의 셔머 규칙(reduced-motion 에서 셔머 없음, 모양이 정적 단서)을 그대로 따른다.
- 소요가 300ms 미만이면 스켈레톤을 그리지 않는다(깜빡임 방지) — 지연 표시 300ms.

---

### §4.1 `disconnected` — 연결 전 빈 상태

#### ① 확정 카피

```ts
connect: {
  heading: '가계부를 시작하는 방법을 고릅니다',
  existing: {
    title: '이미 쓰는 시트 연결하기',
    body: '구글 드라이브에서 가계부로 쓰던 시트를 고릅니다. 다음 단계에서 어느 열이 날짜·구분·금액·분류인지 지정합니다.',
    cta: '시트 고르기',
    loading: '구글 드라이브를 여는 중입니다'
  },
  create: {
    title: '새 가계부 시트 만들기',
    body: '날짜·구분·금액·분류·메모 열이 준비된 시트를 사용자의 드라이브에 새로 만듭니다. 만든 뒤에는 구글 시트에서 직접 열어 볼 수 있습니다.',
    cta: '새 시트 만들기',
    loading: '시트를 만드는 중입니다'
  },
  consentHint: '두 방법 모두 구글 로그인과 시트 접근 동의가 필요합니다. 동의는 구글 계정 설정에서 언제든 취소할 수 있습니다.'
}
```

#### ② 토큰

| 요소 | 토큰 |
|---|---|
| 타일 면 | `Card tone="wash"` → `cardElevation('base')` + `color.gradientHeroSoft` |
| 섹션 제목 | `sectionTitleFontSize`(공용 clamp) · `color.text` · `font.display` |
| 타일 본문 (`ChoiceBody`) | `font.size.sm` · `color.textSecondary` · `font.leading.normal` · `margin: 0 0 ${space[4]}` — 🔴 `Card.subtitle`(12px·textMuted) 로 넘기지 마라. ⚠ `CardContainer` 는 grid 가 아니라 일반 블록이라(gap 없음) 자식 간 간격은 마진으로 준다 |
| 버튼 | `Button variant="secondary" fullWidth` |
| 동의 힌트 | `HintText`(= `font.size.sm` · `color.textMuted`) |
| 그리드 gap | `space[4]` |

#### ③ 컴포넌트 트리 + props

```tsx
<ConnectSection aria-labelledby={connectHeadingId}>        {/* styled.section, 카드 아님 */}
  <ConnectHeading id={connectHeadingId}>{copy.connect.heading}</ConnectHeading>

  <ConnectGrid>                                            {/* grid, repeat(auto-fit, minmax(240px,1fr)) */}
    {/* 🔴 설명문은 `subtitle`(12px·textMuted 캡션)이 아니라 children 에 둔다 — Card.styled.ts:102-108. */}
    <Card tone="wash" title={copy.connect.existing.title}>
      <ChoiceBody>{copy.connect.existing.body}</ChoiceBody>
      <Button variant="secondary" fullWidth loading={phase === 'picking'} onClick={onPickExistingSheet}>
        {copy.connect.existing.cta}
      </Button>
    </Card>

    <Card tone="wash" title={copy.connect.create.title}>
      <ChoiceBody>{copy.connect.create.body}</ChoiceBody>
      <Button variant="secondary" fullWidth loading={phase === 'creating'} onClick={onCreateSheet}>
        {copy.connect.create.cta}
      </Button>
    </Card>
  </ConnectGrid>

  <HintText>{copy.connect.consentHint}</HintText>
</ConnectSection>
```

- 🔴 **두 선택지는 동일 마크업·동일 tone·동일 버튼 variant**다. 어느 쪽도 `primary` 가 아니고, 어느 쪽도 텍스트 링크가 아니다. 이 대칭을 깨는 순간 요구가 깨진다.
- `primary` 버튼이 이 화면에 **0개**인 것은 의도다 — 둘 중 하나를 primary 로 올리면 다른 하나가 종속 선택지로 읽힌다.

#### ④ 로딩·에러

- 진행 중인 쪽 버튼만 `loading`(자동 disabled + 스피너, 레이아웃 불변). 다른 쪽 버튼은 `disabled`(동시에 두 흐름을 시작할 수 없다) — 사유 줄은 필요 없다(진행 중임이 눈에 보인다).
- 팝업 차단으로 Picker 가 열리지 않은 경우: 섹션 상단에 `Banner tone="warning" role="alert"` — `'브라우저가 팝업을 막아 구글 창을 열지 못했습니다. 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.'`
  ⚠ `window.open` 은 차단 시 **예외 대신 `null`** 을 준다(pitfalls 2026-07-29). 반환값을 반드시 보라.
- 권한 거부는 §4.9.

#### ⑤ 반응형

| 폭 | 규칙 |
|---|---|
| ≥641 | 타일 2열(`repeat(auto-fit, minmax(240px, 1fr))`) |
| ≤640 (`media.down('mobileWide')`) | 1열. 버튼은 이미 `fullWidth` 라 추가 분기 없음 |
| 360 / 390 | 타일 본문 `max-width: 44ch`, `overflow-wrap: anywhere` 없음(한글 산문) |

#### ⑥ 접근성

- 섹션은 `aria-labelledby` 로 `<h2>` 와 묶는다.
- 두 타일 제목은 `Card` 가 `<h2>` 로 그린다 → 문서 헤딩 순서 `h1(히어로) → h2(섹션) → h2(타일)` 이 된다. 타일 제목을 `h3` 로 낮추려고 `Card` 를 고치지 마라 — 대신 섹션 제목을 **`<h2>`, 타일을 시각적 형제**로 두는 현행이 스크린리더 목록에서도 자연스럽다.
- 탭 순서: 시트 고르기 → 새 시트 만들기 → (힌트는 비대화).

---

### §4.2 `mapping` — 열 매핑 (Picker 로 고른 **기존 시트 전용**)

#### ① 확정 카피

```ts
mapping: {
  title: '열 지정',
  subtitle: '각 항목이 시트의 어느 열에 있는지 고릅니다. 첫 행을 열 이름으로 읽었습니다.',
  sheetLine: (name: string) => `선택한 시트 ${name}`,
  autoMatched: (n: number) => `머리글을 읽어 ${n}개 항목을 자동으로 맞췄습니다. 다르면 직접 고쳐 주세요.`,
  autoMatchedNone: '머리글에서 맞출 수 있는 항목을 찾지 못했습니다. 항목마다 열을 직접 골라 주세요.',
  fields: {
    date: '날짜',
    kind: '구분',
    amount: '금액',
    category: '분류',
    memo: '메모 (선택)'
  },
  required: '필수',
  unset: '선택 안 함',
  columnOption: (letter: string, header: string) => (header ? `${letter}열 · ${header}` : `${letter}열`),
  missing: (names: string[]) => `아직 지정하지 않은 항목이 있습니다: ${names.join(', ')}`,
  preview: {
    title: '이렇게 읽었습니다',
    body: '고른 열로 시트의 첫 3행을 읽은 결과입니다.',
    caption: '고른 열로 읽은 시트 첫 3행 미리보기',
    unreadable: '형식을 읽을 수 없음',
    empty: '빈 칸',
    allUnreadable: '고른 열에서 값을 하나도 읽지 못했습니다. 열을 다시 확인해 주세요.',
    noRows: '시트에 아직 데이터 행이 없습니다. 연결한 뒤 첫 항목을 추가하면 이 시트에 기록됩니다.'
  },
  submit: '연결하기',
  reselect: '다른 시트 고르기'
}
```

#### ② 토큰

| 요소 | 토큰 |
|---|---|
| 카드 | `Card tone="default"`(= `cardElevation('base')`) |
| 필드 라벨 | `InlineField`(= `font.size.base` · `font.weight.medium` · `color.textSecondary`) |
| 필수 배지 | `Chip variant="neutral"` — 🔴 색이 아니라 **"필수" 텍스트**가 채널이다 |
| 셀렉트 | 공용 `Select size="lg" width="full"` |
| 자동 매칭 안내 | `Banner tone="info" role="status"` (info 는 틴트 면이 없다 = 화면의 틴트 상한 보호) |
| 미지정 사유 줄 | `HintText` + `color.textMuted` |
| 미리보기 표 | 공용 `DataTable` (caption + ≤820 카드 접기 내장) |
| 읽기 실패 셀 | `color.textMuted` + 텍스트 `'형식을 읽을 수 없음'` (🔴 danger 색 아님 — 아직 에러가 아니라 "이 조합으로는 못 읽는다"는 사실 보고) |

#### ③ 컴포넌트 트리 + props

```tsx
<Card tone="default" title={copy.mapping.title} subtitle={copy.mapping.subtitle}>
  <Banner tone="info" role="status">
    {matchedCount > 0 ? copy.mapping.autoMatched(matchedCount) : copy.mapping.autoMatchedNone}
  </Banner>

  <MappingGrid>                                   {/* repeat(auto-fit, minmax(200px, 1fr)) */}
    {MAPPING_FIELDS.map((field) => (
      <InlineField key={field.id} htmlFor={`${idPrefix}-${field.id}`}>
        <InlineFieldHeader>
          {copy.mapping.fields[field.id]}
          {field.required ? <Chip variant="neutral">{copy.mapping.required}</Chip> : null}
        </InlineFieldHeader>
        <Select
          id={`${idPrefix}-${field.id}`}
          size="lg"
          width="full"
          value={mapping[field.id] ?? ''}
          onChange={(e) => onMappingChange(field.id, e.target.value || null)}
        >
          <option value="">{copy.mapping.unset}</option>
          {columns.map((c) => (
            <option key={c.letter} value={c.letter}>{copy.mapping.columnOption(c.letter, c.header)}</option>
          ))}
        </Select>
      </InlineField>
    ))}
  </MappingGrid>

  <PreviewBlock aria-labelledby={previewTitleId}>
    <PreviewTitle id={previewTitleId}>{copy.mapping.preview.title}</PreviewTitle>
    <HintText>{copy.mapping.preview.body}</HintText>
    <DataTable caption={copy.mapping.preview.caption} columns={previewColumns} rows={previewRows} />
  </PreviewBlock>

  {missingNames.length > 0 ? <ActionHint id={missingHintId}>{copy.mapping.missing(missingNames)}</ActionHint> : null}

  <ActionRow>
    <Button variant="primary" disabled={missingNames.length > 0}
            aria-describedby={missingNames.length > 0 ? missingHintId : undefined}
            loading={phase === 'connecting'} onClick={onConfirmMapping}>
      {copy.mapping.submit}
    </Button>
    <Button variant="secondary" onClick={onPickExistingSheet}>{copy.mapping.reselect}</Button>
  </ActionRow>
</Card>
```

- **필수 4 + 선택 1**: `MAPPING_FIELDS = [{id:'date',required:true},{id:'kind',required:true},{id:'amount',required:true},{id:'category',required:true},{id:'memo',required:false}]`.
- **자동 매칭 결과가 선택된 상태로 뜬다** — `mapping` 초기값을 데이터 계층의 헤더 자동 매칭 결과로 채운다(§11).
- 🔴 **미리보기 3행은 필수**다. 행이 0이면 표 대신 `copy.mapping.preview.noRows` 한 줄(빈 표를 그리지 마라).
- 🔴 **무음 비활성 금지**: 제출 버튼이 비활성이면 언제나 `missing` 사유 줄이 함께 있고, 버튼이 `aria-describedby` 로 그것을 가리킨다.
- `aria-invalid` 는 쓰지 않는다 — 아직 "틀린 값"이 아니라 "고르지 않은 값"이다.

#### ④ 로딩·에러

- 헤더 읽기 중: `MappingGrid` 자리에 셀렉트 모양 스켈레톤 5칸, 카드 `aria-busy="true"`.
- 전 행 파싱 실패: 미리보기 위에 `Banner tone="warning" role="status"` = `copy.mapping.preview.allUnreadable`. 제출은 **막지 않는다**(사용자가 헤더 행만 있는 시트를 연결할 수 있다) — 알리되 결정은 사용자가 한다(주기 `배당 없음` 고지와 같은 처방).
- 시트 읽기 실패(권한·네트워크): §4.8 의 사유 문구를 그대로 쓰되 `Banner tone="danger" role="alert"` + `[다시 시도]`.

#### ⑤ 반응형

| 폭 | 규칙 |
|---|---|
| ≥821 | 필드 그리드 auto-fit(최소 200px) → 보통 3~5열. 미리보기 = 진짜 표 |
| ≤820 (`tablet`) | 미리보기 표가 **행 카드**로 접힌다(`DataTable` 내장, 컨테이너 쿼리 + 미디어 쿼리 이중) |
| ≤640 (`mobileWide`) | 필드 그리드 1열. 액션 행 세로 스택 + 버튼 `fullWidth` |
| 360 | 셀렉트 옵션 텍스트가 길다(`A열 · 사용일자`) — 셀렉트에 `min-width: 0` 필수, 부모 그리드 `minmax(0, 1fr)` |

#### ⑥ 접근성

- 라벨-입력 연결: `InlineField` 는 `<label>` 이다. `htmlFor` 와 `Select id` 를 **명시적으로** 짝지어라(암시적 중첩에만 기대지 마라 — "필수" 칩이 라벨 안에 있어 접근명이 `"금액 필수"` 로 읽히는 것은 의도다).
- 미리보기 표: `DataTable` 의 `caption` 이 표의 이름이다. `aria-label` 을 덧붙이지 마라(둘 다 두면 label 이 이겨서 caption 이 죽는다 — pitfalls 2026-07-31).
- 탭 순서: 필드 5개(DOM 순) → 미리보기(비대화) → 연결하기 → 다른 시트 고르기.

---

### §4.3 `connected` — 목록 화면

#### ① 확정 카피

```ts
month: {
  groupLabel: '월 이동',
  label: (year: number, month: number) => `${year}년 ${month}월`,
  prev: (label: string) => `이전 달로 이동, ${label}`,
  next: (label: string) => `다음 달로 이동, ${label}`,
  todayAria: (label: string) => `이번 달로 돌아가기, ${label}`,
  moved: (label: string, count: number) => `${label} 기록 ${count}건입니다.`
},
summary: {
  net: (label: string) => `${label} 순액`,
  netHint: '수입에서 지출을 뺀 금액입니다.',
  income: '수입',
  expense: '지출',
  countHint: (n: number) => `${n}건`
},
list: {
  title: '거래 내역',
  subtitle: '시트에 적힌 순서 그대로 보여 줍니다.',
  caption: (label: string) => `${label} 수입·지출 기록`,
  columnDate: '날짜',
  columnKind: '구분',
  columnCategory: '분류',
  columnAmount: '금액',
  columnMemo: '메모',
  columnActions: '작업',
  kindIncome: '수입',
  kindExpense: '지출',
  noMemo: '',
  editAria: (date: string, category: string, amount: string) => `${date} ${category} ${amount} 기록 수정`,
  removeAria: (date: string, category: string, amount: string) => `${date} ${category} ${amount} 기록 삭제`
},
hero: {
  addEntry: '항목 추가',
  openSheet: '시트에서 열기',
  openSheetAria: '연결된 구글 시트를 새 탭에서 열기'
}
```

#### ② 토큰

| 요소 | 토큰 |
|---|---|
| 월 네비 루트 | `surfaceSunken` 알약 (`radius.pill`) · `role="group"` |
| 월 제목 | `<h2>` · `sectionTitleFontSize` · `color.text` |
| 네비 버튼 | `Button variant="ghost" size="sm" iconOnly` + `hitAreaWithin(space[1])` |
| 요약 카드 | `Card`-급 로컬 `<section>` + `cardElevation('raised')` (제목 없음) |
| hero 값 | `StatTile emphasis="hero"` → `font.heroNumeric` (🔴 **이 페이지의 유일한 hero 숫자**) |
| 보조 타일 | `StatTile`(기본) → `font.dataNumeric` + `tabular-nums` |
| 목록 카드 | `Card tone="default"` |
| 구분 칩 | `Chip variant="neutral"` + lucide 아이콘 |
| 금액 셀 | `color.text` · `font.dataNumeric` · `font.numeric` |
| 메모 셀 | `color.textMuted` · `font.size.sm` |

#### ③ 컴포넌트 트리 + props

```tsx
{/* 히어로 액션 — 최대 2개 */}
actions={
  <>
    <Button variant="primary" disabled={isExpired}
            aria-describedby={isExpired ? expiredHintId : undefined}
            onClick={onOpenCreateForm}>{copy.hero.addEntry}</Button>
    <Button variant="secondary" aria-label={copy.hero.openSheetAria}
            onClick={onOpenSheet}>{copy.hero.openSheet}</Button>
  </>
}
```

> ⚠ 공용 `Button` 은 **`<button>` 전용**이다(`ButtonProps` 가 `ButtonHTMLAttributes<HTMLButtonElement>` 를 확장). `as="a"` 를 추가하려고 공용 부품을 고치지 말고, `<a>` 시각을 로컬에서 재현하지도 마라(두 번째 스타일 시스템). 시트 열기는 `onOpenSheet = () => { const w = window.open(sheetUrl, '_blank', 'noopener'); if (w === null) setPopupBlocked(true); }` 로 처리한다.
> 🔴 **`window.open` 은 팝업 차단 시 예외가 아니라 `null` 을 돌려준다**(pitfalls 2026-07-29) — 반환값을 반드시 보고 §4.1 의 팝업 차단 배너를 낸다.
> ⚠ **주소를 볼 수 있어야 하는 자리는 §4.11 뿐**이고 거기서는 시트 이름 자체가 진짜 `<a href>` 다.

```tsx
<LedgerMonthNav
  monthLabel={monthLabel}         /* '2026년 8월' */
  prevLabel={prevMonthLabel}
  nextLabel={nextMonthLabel}
  todayLabel={thisMonthLabel}
  isCurrentMonth={isCurrentMonth}
  titleId={monthTitleId}
  onPrev={onPrevMonth} onNext={onNextMonth} onToday={onThisMonth}
/>

<SummaryCard aria-labelledby={monthTitleId} aria-busy={isRefetching || undefined}>
  <HeroSlot>
    <StatTile emphasis="hero" label={copy.summary.net(monthLabel)} value={netText} hint={copy.summary.netHint} />
  </HeroSlot>
  <TileGrid>
    <StatTile label={copy.summary.income}  value={incomeText}  hint={copy.summary.countHint(incomeCount)} />
    <StatTile label={copy.summary.expense} value={expenseText} hint={copy.summary.countHint(expenseCount)} />
  </TileGrid>
</SummaryCard>

<Card tone="default" title={copy.list.title} subtitle={copy.list.subtitle}>
  <LedgerTable
    rows={rows}                      /* LedgerRowModel[] */
    monthLabel={monthLabel}
    isWriteBlocked={isExpired}
    writeBlockedHintId={expiredHintId}
    onEdit={onOpenEditForm}          /* (id: string) => void */
    onRemove={onRequestRemove}       /* (id: string) => void */
    onRetry={onRetryRow}             /* (id: string) => void */
  />
</Card>
```

- **`SummaryCard` 는 `aria-labelledby={monthTitleId}`** — 제목 없는 주역 카드가 이름을 갖는 방법이다(월 제목이 그 이름이 된다).
- **정렬**: 🔴 앱이 재정렬하지 않는다. **시트 행 순서 그대로**(`copy.list.subtitle` 이 그 사실을 말한다). 시트가 정본이라는 원칙의 화면 표현이다.

#### ③-2 `LedgerTable` 열 구성 (`pages/Ledger/components/LedgerTable/`)

| 열 | 마크업 | 내용 |
|---|---|---|
| 날짜 | `<th scope="row">` | `2026-08-03` (시트 원문이 파싱 가능하면 `M월 D일 (요일)` 로 표시하고 `<time dateTime>` 로 원값 유지) |
| 구분 | `<td>` | `<Chip variant="neutral"><ArrowDownToLine size={14}/> 수입</Chip>` / `<ArrowUpFromLine size={14}/> 지출` |
| 분류 | `<td>` | 텍스트. 길면 `text-overflow: ellipsis` + `title` |
| 금액 | `<td>` | 🔴 **부호 없는 절대값** `formatKRW(Math.abs(v))`. 방향은 구분 칩이 말한다 |
| 메모 | `<td>` | `color.textMuted`. 비었으면 셀을 비운다(🔴 "—" 를 넣지 마라) |
| 작업 | `<td>` (`width: 1%`) | 수정(`Pencil`) · 삭제(`Trash2`) 아이콘 버튼 2개 |

🔴 **작업 열은 `width: 1%` 를 쓰고, 카드 모드(`container.down('tablet')` **와** `media.down('tablet')`) 두 블록 모두에서 `width: auto` 로 되돌린다.** 이걸 빠뜨리면 768px 에서 부모 폭의 1%(6.5px)가 되어 28px 버튼이 21px 삐져나오고 표 래퍼에 가로 스크롤이 생긴다(실측 사고, `HoldingsTable.styled.ts:221-244` 가 정본 주석).

#### ④ 로딩·빈·에러

| 상황 | 표현 |
|---|---|
| 첫 로드 | 목록 자리 스켈레톤 3행(`aria-hidden`) + `aria-busy="true"`. 요약 타일 값 자리 `SkeletonBar` |
| 월 이동 재조회 | 🔴 **기존 목록을 유지**하고 `aria-busy="true"` 만 켠다. 백지 금지 |
| 0건 | §4.4 |
| 만료 | §4.7 (목록 유지) |
| 충돌 | §4.10 (목록 유지) |
| 행 저장 실패 | §4.8 (그 행 아래 실패 줄 잔류) |

#### ⑤ 반응형

| 폭 | 규칙 |
|---|---|
| ≥981 | 요약: hero 전폭 + 보조 타일 2열. 목록 = 진짜 표 |
| 821–980 | 동일 |
| ≤820 (`tablet`) | 표 → **행 카드**. 각 카드 = 날짜(제목 줄) / 라벨:값 4줄 / 우상단 작업 버튼(absolute) — `HoldingsTable` 과 같은 관용구. 🔴 `width: auto` 복원 |
| ≤640 (`mobileWide`) | 히어로 액션 줄이 제목 아래로 내려가 **전폭**을 쓰고 두 버튼이 폭을 절반씩 나눈다(`PageHero.styled.ts:199-208` 내장 — **세로 스택이 아니다**. 360px 에서 각 ≈166px 로 "항목 추가"·"시트에서 열기"가 들어간다). 월 네비: "이번 달" 버튼 **아이콘 전용**(`CalendarDays`, 접근명만 텍스트 — 캘린더 선례) |
| ≤560 (`mobile`) | 보조 타일 2열 유지(360px 에서 각 ≈160px 로 충분). hero 값 `clamp` 하한까지 축소 |
| 360 / 390 | 🔴 가로 오버플로 0: `PageStack` `grid-template-columns: minmax(0, 1fr)`, 표 래퍼 `min-width: 0` + `overflow-x: auto`, 분류·메모 셀 `min-width: 0`. 의도적 가로 스크롤 **없음** → `overflowprobe` 허용목록 등록 불필요 |

#### ⑥ 접근성

- 헤딩 순서: `h1 가계부` → `h2 2026년 8월`(월 네비) → `h2 거래 내역`(Card).
- 표: `<caption>` 은 sr-only(`VisuallyHidden`) = `copy.list.caption(monthLabel)`. 열 머리 `<th scope="col">`, 작업 열 머리는 `<VisuallyHidden>작업</VisuallyHidden>`.
- 행 액션 접근명에 **행 맥락을 담는다**(`copy.list.editAria`) — 스크린리더의 버튼 목록에서 "수정"이 20개 나오면 아무것도 구분되지 않는다.
- 라이브 리전은 **화면당 1개**. 월 이동 시 `copy.month.moved(monthLabel, count)` 를 여기서만 낭독한다. 🔴 월 제목에 `aria-live` 를 붙이지 마라(같은 말이 두 번 읽힌다 — 캘린더가 세운 규칙).
- 🔴 오류는 라이브 리전이 아니라 `Banner role="alert"` 가 낭독한다. 두 곳에서 같은 실패를 말하지 않는다.
- 키보드 순서: 히어로 액션 → 배너 액션 → 이전/제목/다음/이번달 → (요약 비대화) → 행마다 수정→삭제 → 각주.

---

### §4.4 `connected` + 0건 — 🔴 **연결 전과 다른 화면이다**

#### ① 확정 카피

```ts
emptyMonth: {
  titleCurrent: '이번 달 기록이 없습니다.',
  titleOther: (label: string) => `${label}에 기록이 없습니다.`,
  latestElsewhere: (label: string) => `가장 최근 기록은 ${label}에 있습니다.`,
  goLatest: (label: string) => `${label}로 이동`,
  sheetEmpty: '시트에 아직 기록이 없습니다. 첫 항목을 추가하면 이 시트에 저장됩니다.',
  add: '항목 추가',
  prevMonth: '이전 달 보기'
}
```

#### ② 표현 규칙 (요구의 핵심)

1. **월 네비와 요약 카드는 그대로 남는다.** 수입 `0원` · 지출 `0원` · 순액 `0원`.
   → 이것이 "연결은 정상이다"의 증거다. 🔴 요약을 숨기면 사용자가 연결 실패로 오해한다. (`0원` 은 실제 값이므로 "— 단독 금지" 규칙과 충돌하지 않는다.)
2. **목록 카드의 본문만** 빈 상태로 바뀐다(카드 자체는 그대로, 제목 "거래 내역" 유지).
3. **다른 달에 데이터가 있으면 알린다** — `latestElsewhere` + 그 달로 가는 버튼.
4. 🔴 **이 상태에서는 히어로의 "항목 추가"를 렌더하지 않는다.** 한 화면에 추가 버튼은 항상 정확히 1개다(빈 상태가 그 버튼을 갖는다). 히어로 `actions` 에는 "시트에서 열기"만 남는다 — 요구된 "시트에서 직접 열기" 경로는 이것이 담당한다.

```tsx
<Card tone="default" title={copy.list.title}>
  <EmptyBlock>
    <EmptyTitle>{isCurrentMonth ? copy.emptyMonth.titleCurrent : copy.emptyMonth.titleOther(monthLabel)}</EmptyTitle>
    {latestMonthLabel
      ? <EmptyBody>{copy.emptyMonth.latestElsewhere(latestMonthLabel)}</EmptyBody>
      : <EmptyBody>{copy.emptyMonth.sheetEmpty}</EmptyBody>}
    <ActionRow>
      <Button variant="primary" disabled={isExpired}
              aria-describedby={isExpired ? expiredHintId : undefined}
              onClick={onOpenCreateForm}>{copy.emptyMonth.add}</Button>
      {latestMonthLabel
        ? <Button variant="secondary" onClick={onGoLatestMonth}>{copy.emptyMonth.goLatest(latestMonthLabel)}</Button>
        : <Button variant="secondary" onClick={onPrevMonth}>{copy.emptyMonth.prevMonth}</Button>}
    </ActionRow>
  </EmptyBlock>
</Card>
```

#### ③ 토큰

- `EmptyBlock`: `color.accentSubtle` 면 + `1px dashed color.accentBorder` + `radius.xl` + `padding: clamp(20px, 3vw, 28px)`.
  🔴 **`accentAlt*` 가 아니라 `accent*` 다.** 이유: `contrast.test.ts` 가 `['text-secondary','accent-subtle']` 은 검증하지만 `text-secondary × accent-alt-subtle` 은 검증하지 않는다(검증된 것은 `text`·`accent-alt-text` 뿐). 본문에 `textSecondary` 를 쓰는 면은 검증된 조합만 쓴다. 페이지 hue(`accentAlt`)는 히어로가 `--sb-page-hue` 로 이미 표현한다 — 빈 상태 면까지 hue 로 칠할 이유가 없다.
- `EmptyTitle`: `<p>` 아님, `<h3>` (카드 제목 `h2` 아래). `font.size.lg` · `font.weight.extrabold` · `color.text`.
- `EmptyBody`: `font.size.sm` · `color.textSecondary` · `max-width: 52ch`.

#### ④~⑥

- 로딩: 이 상태에 진입하기 전 단계는 §4.0/§4.3 이 처리. 여기서는 로딩이 없다.
- 반응형: `ActionRow` 는 `flex-wrap: wrap`, ≤640 세로 스택 + 버튼 `fullWidth`.
- 접근성: 빈 상태 블록에 `role` 을 주지 마라(그냥 콘텐츠다). 월 이동으로 이 상태에 들어오면 라이브 리전이 `copy.month.moved(monthLabel, 0)` = `'2026년 7월 기록 0건입니다.'` 를 읽는다.

---

### §4.5 항목 추가 / 수정 폼 (모달)

#### ① 확정 카피

```ts
form: {
  createTitle: '항목 추가',
  editTitle: '항목 수정',
  date: '날짜',
  kindLegend: '구분',
  kindIncome: '수입',
  kindExpense: '지출',
  amount: '금액',
  amountUnit: '원',
  category: '분류',
  categoryPlaceholder: '예: 식비',
  categoryHint: '시트에 있는 분류에서 고르거나 새로 적을 수 있습니다.',
  categoryListLabel: '시트에 있는 분류',
  memo: '메모 (선택)',
  submitCreate: '저장',
  submitEdit: '수정 저장',
  cancel: '취소',
  errors: {
    dateRequired: '날짜를 입력해 주세요.',
    dateFormat: '날짜를 YYYY-MM-DD 형식으로 입력해 주세요.',
    amountRequired: '금액을 입력해 주세요.',
    amountNumber: '금액은 숫자만 입력할 수 있습니다.',
    amountPositive: '금액은 0보다 큰 값이어야 합니다.',
    amountTooLarge: '금액은 1조 원 미만으로 입력해 주세요.',
    categoryRequired: '분류를 입력해 주세요.',
    categoryTooLong: '분류는 40자까지 입력할 수 있습니다.',
    memoTooLong: '메모는 200자까지 입력할 수 있습니다.'
  }
}
```

#### ② 필드 사양

| 순서 | 필드 | 부품 | 기본값 · 속성 |
|---|---|---|---|
| 1 | 날짜 | `InputField type="date" label={copy.form.date}` | **기본 = 오늘**(`YYYY-MM-DD`, 로컬 자정 기준) |
| 2 | 구분 | `<fieldset>` + `<legend>` + radio 2개(세그먼트 스타일) | 기본 **지출** |
| 3 | 금액 | `InputField type="number" suffix={copy.form.amountUnit} min={0} step={1}` + `inputMode="numeric"` | `hint = formatKRW(parsed)` (자릿수 확인용, 값은 안 바꾼다) |
| 4 | 분류 | `<input list={datalistId}>` + `<datalist>` | 옵션 = 시트에 등장한 분류(빈도 내림차순, 상한 50). 아래 `HintText = copy.form.categoryHint` |
| 5 | 메모 | `InputField type="text" maxLength={200}` | 선택 |

- **분류 자동완성을 네이티브 `<datalist>` 로 하는 이유**: 커스텀 콤보박스는 포커스 트랩 안의 팝업이라 오버레이 층이 하나 더 생긴다(이 레포는 중첩 오버레이로 두 번 사고가 났다). 네이티브는 키보드·모바일 IME·스크린리더 처리가 브라우저 몫이고 새 공용 부품이 0이다. `<datalist>` 는 **제안일 뿐 강제가 아니라서** "사용자 시트가 정본" 원칙과도 맞는다.
  - `<input>` 에 `aria-describedby` 로 `categoryHint` 를 연결한다.
  - `<datalist>` 자체에 `aria-label={copy.form.categoryListLabel}` 을 준다.

#### ③ 검증 (zod, 한국어 메시지)

- 스키마는 `pages/Ledger/LedgerPage/LedgerForm.schema.ts`(순수). 메시지는 위 `copy.form.errors` 를 **그대로** 참조한다(리터럴 중복 금지).
- 표시 규칙:
  - **제출 시도 전에는 오류를 그리지 않는다**(입력 중 빨간 줄 금지).
  - 제출 시도 후: 해당 입력에 `aria-invalid="true"` + `aria-describedby={errorId}`, 입력 바로 아래 `<FieldError id={errorId}>` (`color.danger` · `font.size.sm` · 좌측 3px `color.danger` 레일 — `ErrorBox` 어휘의 인라인 축소판).
  - 🔴 **색이 유일한 채널이 아니다** — 오류 문구 텍스트 자체가 1차 채널이다.
  - 제출 시 **첫 오류 필드로 포커스**를 옮긴다.
  - 오류가 하나라도 있으면 액션 줄 위에 `Banner tone="danger" role="alert"` 요약 없이 필드 오류만 남긴다(짧은 폼에서 요약 배너는 소음이다).

#### ④ 컴포넌트 트리

```tsx
<Modal
  title={mode === 'create' ? copy.form.createTitle : copy.form.editTitle}
  phase={phase}                                  /* useOverlayPresence(open, MODAL_EXIT_MS) */
  onBackdropClick={handleBackdropClick}
  actions={
    <>
      <Button variant="primary" type="submit" form={formId}
              loading={isSaving} disabled={isExpired}
              aria-describedby={isExpired ? expiredHintId : undefined}>
        {mode === 'create' ? copy.form.submitCreate : copy.form.submitEdit}
      </Button>
      <Button variant="secondary" onClick={onClose}>{copy.form.cancel}</Button>
    </>
  }
>
  {writeError ? <Banner tone="danger" role="alert" title={writeError.title}>{writeError.body}
                  <Button size="sm" variant="secondary" onClick={onRetrySave}>{copy.error.retry}</Button>
                </Banner> : null}
  <form id={formId} onSubmit={handleSubmit}> … 필드 5개 … </form>
</Modal>
```

- 🔴 **수정 모달 안에 삭제 버튼을 두지 않는다.** 삭제는 목록 행에서만 시작한다 — 모달 위에 모달을 띄우면 두 `Modal` 이 각자 `documentElement` 의 `overflow` 를 저장·복원해 순차 닫힘에서 페이지가 영구 잠긴다(pitfalls 2026-07-27).

#### ⑤ 오버레이 계약 (🔴 어기면 회귀)

```ts
useOverlayEscape(isOpen, onCloseRef.current)   // onClose 는 ref 로 받는다
const { phase, value } = useOverlayPresence(openTarget, MODAL_EXIT_MS)
useEffect(() => { /* 열릴 때 날짜 입력으로 포커스 */ }, [isOpen])   // 🔴 deps 에 onClose 금지
```

- 포커스 트랩·복원은 `pages/Main/components/TickerModal` 의 구현 계약을 그대로 따른다(Tab 순환은 패널 안, 닫을 때 **열기 트리거로 복원**).
- `useOverlayEscape`·`useDrawerBackClose` 에는 **잔류값이 아니라 원래 열림 상태**를 넘긴다.
- 퇴장 중(`phase === 'exit'`)에는 `Modal` 셸이 role/aria-modal/labelledby 를 스스로 떼고 `aria-hidden` 을 건다 — 호출부가 다시 하지 마라.

#### ⑥ 반응형·접근성

- 패널 폭 = `ModalPanel` 기본(`min(520px, 100%)`). 필드 그리드는 ≥481 에서 `날짜 | 구분` 2열, 그 아래 금액·분류·메모 1열; ≤480 전부 1열.
- 360px: 세그먼트 라디오 2칸이 각 ≈150px — 충분. 액션 버튼은 `flex-wrap` 로 접히되 `fullWidth` 로 만들지 않는다(취소가 저장만큼 커 보이면 안 된다).
- 모달 본문은 `overflow-y: auto` + `scrollbar-gutter: auto`(pitfalls 2026-07-27 — `overflow: hidden` 으로 거터를 없애면 좁은 폭에서 하단 버튼에 도달할 수 없다).
- 라벨-입력 연결: `InputField` 는 라벨에서 id 를 파생한다. **밖에서 포커스를 옮길 필드(날짜)에는 `id` 를 명시로 준다**(카피가 바뀌면 파생 id 가 조용히 깨진다).

---

### §4.6 삭제 확인 — 🔴 대상의 날짜·금액·분류를 그대로 보여준다

#### ① 확정 카피

```ts
remove: {
  title: '이 기록을 삭제합니다',
  body: '아래 기록을 시트에서 지웁니다. 되돌릴 수 없습니다.',
  fieldDate: '날짜',
  fieldKind: '구분',
  fieldCategory: '분류',
  fieldAmount: '금액',
  confirm: '삭제',
  cancel: '취소'
}
```

🔴 **"정말 삭제하시겠습니까?" 단독 금지.** 위 `body` 는 항상 아래 정의 목록과 **함께** 나온다.

#### ② 컴포넌트 트리

```tsx
<Modal title={copy.remove.title} phase={phase} onBackdropClick={onClose}
  actions={
    <>
      <Button variant="danger" loading={isRemoving} onClick={onConfirm}>{copy.remove.confirm}</Button>
      <Button variant="secondary" ref={cancelRef} onClick={onClose}>{copy.remove.cancel}</Button>
    </>
  }>
  {removeError ? <Banner tone="danger" role="alert" title={removeError.title}>{removeError.body}
                   <Button size="sm" variant="secondary" onClick={onConfirm}>{copy.error.retry}</Button>
                 </Banner> : null}
  <p>{copy.remove.body}</p>
  <TargetList>                              {/* <dl> */}
    <dt>{copy.remove.fieldDate}</dt>     <dd>{target.dateText}</dd>
    <dt>{copy.remove.fieldKind}</dt>     <dd>{target.kindText}</dd>
    <dt>{copy.remove.fieldCategory}</dt> <dd>{target.category}</dd>
    <dt>{copy.remove.fieldAmount}</dt>   <dd>{target.amountText}</dd>
  </TargetList>
</Modal>
```

#### ③ 토큰

- `TargetList`: `cardElevation('sunken')` 대신 **단순 면** — `background: color.surfaceSunken` · `radius.md` · `padding: space[3]` · `display: grid; grid-template-columns: auto minmax(0,1fr); gap: space[1] space[3]`.
  (`Card` 안의 `Card` 금지이고, 모달 본문은 카드가 아니라 면이다.)
- `<dt>`: `color.textMuted` · `font.size.sm`. `<dd>`: `color.text` · `font.dataNumeric`(금액 행만) · `margin: 0`.
- 🔴 금액에 색 없음. 구분 값은 텍스트 `'수입'`/`'지출'` — 여기서는 칩도 아이콘도 필요 없다(문장 맥락이 이미 명확).

#### ④~⑥

- **초기 포커스는 "취소"** — 파괴적 동작을 기본 포커스로 두지 않는다(`CommunityModal.initialFocusRef` 선례). ⚠ ref 는 **effect 안에서** 읽어라(렌더 시점엔 `null` — pitfalls 2026-07-17).
- 실패 시 모달을 닫지 않는다. 배너 + 재시도. 사유 문구는 §4.8.
- 성공 시: 모달 닫힘 → 포커스는 **삭제한 행의 다음 행 삭제 버튼**(없으면 목록 카드의 제목)으로. `requestAnimationFrame` 한 프레임 뒤에 옮긴다(`PortfolioPageView.handleRemove` 와 같은 처방). 라이브 리전: `'기록을 삭제했습니다.'`
- 반응형: 모달 기본. 360px 에서 `<dl>` 2열이 좁으면 `grid-template-columns: minmax(0,1fr)` 1열로(라벨 위·값 아래) — `media.down('mobile')`.

---

### §4.7 토큰 만료 — 🔴 화면을 백지로 만들지 않는다

#### ① 확정 카피

```ts
expired: {
  bannerTitle: '연결이 만료되었습니다',
  bannerBody: '구글 시트 연결이 만료되어 지금은 읽기만 할 수 있습니다. 아래 내용은 마지막으로 읽은 기록입니다.',
  reconnect: '다시 연결',
  reconnecting: '다시 연결하는 중입니다',
  writeBlockedHint: '연결이 만료되어 지금은 기록을 추가하거나 고칠 수 없습니다. 다시 연결하면 하던 작업을 이어서 진행합니다.',
  inFormBody: '연결이 만료되었습니다. 다시 연결하면 지금 입력한 내용을 그대로 저장합니다.',
  reconnectAndSave: '다시 연결하고 저장',
  reconnectAndRemove: '다시 연결하고 삭제',
  restored: '연결을 복구했습니다.'
}
```

#### ② 표현 규칙

1. 🔴 **목록·요약은 마지막으로 읽은 데이터 그대로 남는다.** 지우지도, 흐리게 하지도 마라(흐림은 AX 트리에 존재하지 않아 접근성 계약이 0이다).
2. 목록 상단 `Banner tone="warning" role="alert" title={copy.expired.bannerTitle}`:
   본문 + 같은 배너 안에 `<Button size="sm" variant="secondary" loading={isReconnecting} onClick={onReconnect}>{copy.expired.reconnect}</Button>`
   → 🔴 **재연결은 1클릭**이다. 중간 확인 화면을 넣지 마라.
3. 🔴 **쓰기 버튼은 비활성 + 사유**:
   - 히어로 "항목 추가", 행 "수정"·"삭제", 폼 "저장" 전부 `disabled`
   - **사유 줄은 화면에 하나**(`<ActionHint id={expiredHintId}>{copy.expired.writeBlockedHint}</ActionHint>`, 배너 바로 아래)이고, 비활성 버튼들이 전부 `aria-describedby={expiredHintId}` 로 그 한 줄을 가리킨다.
     (같은 문장을 버튼 수만큼 그리면 스크린리더가 같은 말을 열 번 읽는다 — Portfolio CTA 가 세운 규칙.)
4. **진행 중이던 입력은 남는다**:
   - 모달이 열려 있었다면 **닫지 않는다**. 입력값 유지.
   - 모달 안 `Banner tone="warning" role="alert"` = `copy.expired.inFormBody`
     + `<Button variant="primary" loading={isReconnecting} onClick={onReconnectAndResume}>` 라벨은 의도별로 `copy.expired.reconnectAndSave` / `copy.expired.reconnectAndRemove`.
   - 재연결 성공 → **그 작업(저장/삭제)이 곧바로 이어서 실행**된다. 실패 → 같은 자리에 §4.8 실패 배너.
5. 재연결 성공 시 라이브 리전 `copy.expired.restored`, 배너 제거, 모든 쓰기 버튼 활성 복귀.

#### ③ 토큰

- `Banner tone="warning"` = 틴트 면(`warningSurface` + `warning` 글리프). 🔴 danger 가 아니다 — 아직 아무것도 잃지 않았고, 복구 경로가 1클릭이다.
- 사유 줄 `ActionHint`: `font.size.sm` · `color.textMuted`.

#### ④~⑥

- 반응형: 배너 안 버튼은 `align="start"` 기본 정렬. ≤640 에서 배너 본문 아래로 내려간다(`flex-wrap`).
- 접근성: `role="alert"` — 사용자가 지금 조치해야 하는 상태다. 🔴 라이브 리전에서 같은 말을 반복하지 마라.
- 🔴 만료 상태에서 **읽기(월 이동)는 계속 되어야 하는가?** — 만료 토큰으로는 재조회도 실패한다. 월 이동 버튼은 **활성으로 두되**, 이동 결과가 실패하면 배너가 그대로 남고 목록은 직전 달 데이터를 유지한다. 즉 "누르면 실패하는 버튼"은 쓰기에만 적용하고, 읽기는 사용자가 시도할 권리가 있다(실패가 파괴적이지 않다).

---

### §4.8 쓰기 실패 / 부분 실패 — 🔴 토스트 금지

#### ① 확정 카피

```ts
error: {
  retry: '다시 시도',
  retryAll: '모두 다시 시도',
  network:      { title: '저장하지 못했습니다', body: '네트워크 문제로 시트에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.' },
  permission:   { title: '저장하지 못했습니다', body: '이 시트에 쓸 권한이 없습니다. 구글 시트에서 편집 권한을 확인해 주세요.' },
  rateLimited:  { title: '요청이 잠시 제한되었습니다', body: '짧은 시간에 요청이 많아 구글이 잠시 제한했습니다. 잠시 뒤에 다시 시도해 주세요.' },
  rateLimitedCountdown: (seconds: number) => `${seconds}초 뒤에 다시 시도할 수 있습니다.`,
  retryIn: (seconds: number) => `다시 시도 (${seconds}초)`,
  unknown:      { title: '저장하지 못했습니다', body: '시트에 저장하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.' },
  rowFailed: '저장 실패',
  partial: {
    title: (ok: number, total: number) => `${total}건 중 ${ok}건을 저장했습니다`,
    body: (failed: number) => `저장하지 못한 ${failed}건은 아래 목록에 그대로 남아 있습니다. 항목마다 사유를 확인하고 다시 시도할 수 있습니다.`,
    listTitle: '저장하지 못한 기록',
    rateLimitedBlocked: '요청 제한이 풀린 뒤에 다시 시도할 수 있습니다.'
  }
}
```

🔴 **"일부 실패했습니다" 는 쓰지 않는다.** 항상 `M건 저장됨 / 전체 N건` 을 숫자로 말하고, 실패 건은 **건별로** 남는다.
🔴 **429는 별도 문구**다(`rateLimited`) — 사용자가 연타하는 패턴이 실측됐다. 다른 실패와 같은 문장을 쓰면 "또 눌러 봐야지"가 된다.

#### ② 세 가지 실패 표면

| 표면 | 어디에 | 잔류 |
|---|---|---|
| **폼 실패** | 모달 안, 액션 줄 위 `Banner tone="danger" role="alert"` + `[다시 시도]` | 모달을 **닫지 않는다**. 입력값 유지 |
| **행 실패** | 그 행 **아래** `RowError` 줄(표 모드: `colspan` 전폭 행 / 카드 모드: 카드 안 마지막 줄) | 목록에 **영구 잔류**. 새로고침·월 이동 전까지 사라지지 않는다 |
| **부분 실패 요약** | 목록 카드 위 `Banner tone="danger" role="alert"` + 아래 `Card tone="sunken" title={copy.error.partial.listTitle}` | 실패 건이 0이 될 때까지 잔류 |

`RowError` 구조(🔴 색이 아니라 텍스트가 1차 채널):

```tsx
<RowError>
  <RowErrorLabel>{copy.error.rowFailed}</RowErrorLabel>   {/* 텍스트 라벨 */}
  <RowErrorReason>{reason.body}</RowErrorReason>
  <Button size="sm" variant="secondary" disabled={retryBlockedSeconds > 0} onClick={() => onRetry(row.id)}>
    {retryBlockedSeconds > 0 ? copy.error.retryIn(retryBlockedSeconds) : copy.error.retry}
  </Button>
</RowError>
```

#### ③ 토큰

| 요소 | 토큰 |
|---|---|
| `RowError` 면 | `color.dangerSurface` + 좌측 `3px solid color.danger` 레일 (`ErrorBox` 어휘 재사용) |
| `RowErrorLabel` | `color.danger` · `font.weight.semibold` · `font.size.xs` |
| `RowErrorReason` | `color.text` · `font.size.sm` (🔴 사유 본문은 중립색 — 읽기 위한 글이다) |
| 부분 실패 목록 카드 | `Card tone="sunken"` |
| 재시도 버튼 | `Button size="sm" variant="secondary"` |

#### ④ 429 카운트다운

- 응답의 `Retry-After`(초)가 있으면 그 값, 없으면 **30초**로 시작해 지수 백오프(30 → 60 → 120, 상한 300).
- 카운트다운 동안 그 행/폼의 재시도 버튼 `disabled` + 라벨 `copy.error.retryIn(n)`.
- "모두 다시 시도" 버튼은 실패 건 중 429가 하나라도 있으면 `disabled` + 사유 `copy.error.partial.rateLimitedBlocked`(무음 비활성 금지).
- 🔴 카운트다운 타이머는 **1초 간격 `setInterval` 1개**로 페이지 전체를 돌린다(행마다 타이머를 만들면 20행에서 20개가 돈다).

#### ⑤ 반응형

- `RowError`: 표 모드 `<tr><td colSpan={6}>`; 카드 모드에서는 카드 내부 마지막 블록. 🔴 카드 모드에서 `colSpan` 는 무의미해지지만 `display: block` 이라 자연히 전폭이 된다 — 별도 분기 불필요.
- ≤640: 라벨/사유/버튼 세로 스택.

#### ⑥ 접근성

- 요약 배너 `role="alert"`(1회 낭독). 개별 `RowError` 에는 role 을 주지 마라 — 10건 실패에서 10번 끼어든다.
- 재시도 버튼 접근명: `aria-label={copy.list.retryAria(date, category, amount)}` 형태로 행 맥락 포함.
  ```ts
  retryAria: (date: string, category: string, amount: string) => `${date} ${category} ${amount} 기록 다시 저장`
  ```
- 실패 상태의 행은 `aria-invalid` 를 쓰지 마라(행은 입력이 아니다). "저장 실패" 텍스트가 상태를 말한다.

---

### §4.9 권한 거부

#### ① 확정 카피

```ts
denied: {
  title: '시트 접근 권한이 없어 연결하지 못했습니다',
  body: '구글 동의 화면에서 접근을 허용해야 가계부를 쓸 수 있습니다. 이 앱은 사용자가 선택한 시트 1개만 읽고 씁니다. 다른 드라이브 파일에는 접근하지 않습니다.',
  unaffected: '포트폴리오·시뮬레이터 등 다른 기능은 그대로 사용할 수 있습니다.',
  retry: '다시 시도'
}
```

#### ② 표현

- 화면은 **§4.1 연결 전 빈 상태로 복귀**하고, 그 위에 배너 하나가 얹힌다.
- `Banner tone="warning" role="status" title={copy.denied.title}` + 본문 + `[다시 시도](secondary)`.
  🔴 `danger` 가 아니다 — 사용자가 의도적으로 거부했을 수 있고, 아무것도 망가지지 않았다.
- 배너 아래 `HintText = copy.denied.unaffected` — "앱의 다른 기능은 영향 없음"을 화면에서 말한다.
- 🔴 권한 안내 문구가 **여기와 히어로 `notice` 두 곳에 나온다**. 이건 의도된 중복이다 — 거부 직후는 사용자가 "무엇에 동의하는 것인지" 다시 읽어야 하는 유일한 순간이다.

#### ③~⑥

- 토큰: `warningSurface` 틴트 면 + `color.warning` 글리프.
- 반응형: 배너 기본.
- 접근성: `role="status"`(끼어들지 않음 — 사용자가 방금 한 행동의 결과라 이미 맥락을 안다). 복귀 후 포커스는 **"시트 고르기" 버튼**으로 옮긴다.

---

### §4.10 동시 편집 충돌

#### ① 확정 카피 (요구 문장 **원문 유지**)

```ts
conflict: {
  title: '시트가 변경되었습니다',
  body: '시트가 다른 곳에서 변경되었습니다. 새로고침 후 다시 시도하세요.',
  refresh: '새로고침',
  refreshing: '시트를 다시 읽는 중입니다'
}
```

#### ② 표현

- 목록 상단 `Banner tone="warning" role="alert" title={copy.conflict.title}` + 본문 + `[새로고침](secondary, loading)`.
- 폼 저장 중 충돌 → **모달 안 같은 배너** + `[새로고침]`(primary). 새로고침 성공 후에도 **모달은 열린 채, 입력값 유지** — 사용자가 최신 상태를 보고 저장을 다시 누른다.
- 새로고침 성공 시 라이브 리전: `'시트를 다시 읽었습니다.'`

#### ③~⑥

- 토큰: `warning` 계열(데이터 손실 아님, 복구 경로 명확).
- 접근성: `role="alert"`. 배너 등장 시 포커스를 뺏지 마라 — 배너의 새로고침 버튼은 탭 순서상 목록보다 앞이다.
- 🔴 충돌 배너와 만료 배너가 동시에 나타나면 **만료가 위**다(만료가 더 근본적인 차단이고, 재연결이 충돌 재조회를 포함한다).

---

### §4.11 시트 생성 직후 — 🔴 링크를 화면에 제시한다

#### ① 확정 카피

```ts
created: {
  title: '가계부 시트를 만들었습니다',
  body: '이 시트는 사용자의 구글 드라이브에 있습니다. 앱 없이도 언제든 직접 열어 볼 수 있습니다.',
  open: '구글 시트에서 열기',
  openAria: '새로 만든 구글 시트를 새 탭에서 열기',
  dismiss: '안내 닫기'
}
```

#### ② 표현

```tsx
<Banner tone="info" role="status" title={copy.created.title}
        onDismiss={onDismissCreatedNotice} dismissAriaLabel={copy.created.dismiss}>
  {copy.created.body}
  <CreatedActions>
    <SheetLink href={sheetUrl} target="_blank" rel="noopener noreferrer" aria-label={copy.created.openAria}>
      {sheetName}
    </SheetLink>
    <Button size="sm" variant="secondary" onClick={onOpenSheet}>{copy.created.open}</Button>
  </CreatedActions>
</Banner>
```

- 🔴 **시트 이름 자체가 링크**다(`<a href>`) — 사용자가 URL 을 복사·북마크할 수 있어야 "내 드라이브에 있다"가 증명된다. 버튼만 두면 주소를 볼 방법이 없다.
- 배너 아래에는 곧바로 §4.4 의 0건 화면이 온다(방금 만든 시트라 기록이 없다). 🔴 **연결 전 화면으로 되돌리지 마라.**
- 이 배너는 **세션 1회**. 닫으면 다시 뜨지 않고, 그 뒤에는 히어로의 "시트에서 열기"가 상시 경로다.

#### ③ 토큰

- `Banner tone="info"` — 🔴 틴트 면이 **없는** 톤이다(중립 배경 + accent 테두리 + 색 아이콘). 한 화면의 틴트 면 상한을 지킨다.
- `SheetLink`: `color.brandText` · `text-decoration: underline` · `overflow-wrap: anywhere`(긴 시트 이름이 390px 를 넘지 않게).

#### ④~⑥

- 생성 중(`creating`)에는 §4.1 의 버튼 `loading` 이 담당한다(별도 화면 없음).
- 생성 실패: §4.1 자리에 `Banner tone="danger" role="alert"` + §4.8 사유 + `[다시 시도]`.
- 접근성: `role="status"`. 배너 등장 후 포커스는 **시트 링크**로 옮긴다(방금 만든 것을 바로 열 수 있게). ⚠ 포커스 이동은 `requestAnimationFrame` 한 프레임 뒤.

---

## 5. 반응형 종합표

| 브레이크포인트 | 토큰 | 접히는 것 | 남는 것 |
|---|---|---|---|
| ≥1024 | `headerStack` 위 | — | 앱 헤더 한 줄(65px) |
| ≤1023 | `media.down('headerStack')` | 앱 헤더 두 줄 | 페이지 레이아웃 무영향 |
| ≤980 | `layout` | (이 페이지엔 2단 그리드 없음 — 분기 없음) | |
| ≤820 | `tablet` | **거래 내역 표 → 행 카드**, 미리보기 표 → 행 카드 | 요약 타일 3칸, 월 네비 한 줄 |
| ≤640 | `mobileWide` | 연결 선택 타일 1열 · 매핑 필드 1열 · 히어로 액션이 제목 아래 전폭(반씩 나눔) · 카드 액션 행 세로 | 월 네비 한 줄("이번 달"은 아이콘 전용) |
| ≤560 | `mobile` | 삭제 확인 `<dl>` 1열 | 요약 보조 타일 2열 유지 |
| 390 / 360 | 기준선 | — | 🔴 가로 오버플로 0 |

### 5.1 가로 오버플로 0 체크리스트 (🔴 계약)

1. `PageStack` · 모든 grid: `grid-template-columns: minmax(0, 1fr)`.
2. 표 래퍼: `min-width: 0` + `overflow-x: auto` + `overscroll-behavior-x: contain`.
3. 🔴 작업 열 `width: 1%` → **카드 모드 두 블록(`container.down('tablet')`, `media.down('tablet')`) 모두에서 `auto`**.
4. 시트 이름·URL·분류·메모: `min-width: 0` + `overflow-wrap: anywhere`(한글 산문 본문에는 쓰지 마라 — `text-wrap: pretty` 만).
5. `width: max-content` + `max-width: 100%` 조합 금지(퍼센트 max-width 는 내재 크기 계산에서 무시돼 문서를 넓힌다).
6. 히어로 액션 슬롯에 `transform` 을 걸지 마라(`fixed` 승격 사고 이력).
7. 검증: `npm run overflowprobe` + 스크롤 **뒤에도** 한 번 더(로드 직후만 재는 검사는 `fixed` 승격 오버플로를 못 잡는다).
8. 🔴 의도적 가로 스크롤 **없음** → 허용목록 등록 없음.

### 5.2 아이콘 정렬

- 히어로 아이콘 배지: `PageHero` 가 이미 `heroIconOpticalAlign` 을 갖는다 — 손대지 마라.
- 본문 한 줄 아이콘(구분 칩, 빈 상태 제목): `iconOpticalAlign(<텍스트 크기>)`.
- 여러 줄 텍스트 옆 아이콘(각주·힌트): `iconFirstLineAlign(<텍스트 크기>, <아이콘 크기>)`.
- 🔴 `margin-top: 2px` 같은 상수를 흩뿌리지 마라 — 어느 글자 크기에서 잰 값인지 아무도 모르게 된다. 정본은 `shared/styles/heroTitleRow.ts`.

---

## 6. 접근성 계약 종합

| 항목 | 계약 |
|---|---|
| 랜드마크 | 페이지 `<main>` 은 라우터 셸이 소유. `PageFooter` 에 `aria-label` 불필요(이 화면엔 `<footer>` 가 하나) |
| 헤딩 | `h1 가계부`(히어로) → `h2`(월 / 섹션 / 카드 제목) → `h3`(빈 상태 제목) |
| 라이브 리전 | **1개**(`role="status" aria-live="polite"`). 월 이동·저장·삭제·재연결 성공만 |
| 오류 낭독 | `Banner role="alert"` 가 담당. 🔴 라이브 리전과 중복 금지 |
| 표 | `<caption>`(sr-only) · `<th scope="col">` · 날짜 `<th scope="row">` · 작업 열 머리 `VisuallyHidden` |
| 라벨-입력 | 전 필드 명시적 `htmlFor`/`id`. 시각 라벨이 없는 컨트롤은 `aria-label` |
| 무음 비활성 금지 | 비활성 버튼은 **언제나** `aria-describedby` 로 사유 줄을 가리킨다 |
| 색 단독 금지 | 구분=아이콘+텍스트 · 실패="저장 실패" 텍스트 · 만료=배너 제목 · 필수="필수" 칩 |
| 모달 | `Modal` 셸이 role/aria-modal/labelledby/exit 처리. 트랩·복원은 호출부. 포커스 effect deps 🔴 `[isOpen]` |
| Escape | `useOverlayEscape(isOpen, onCloseRef)` — 참여 층은 `onClose` 를 **ref 로** |
| 뒤로가기 | `useDrawerBackClose` 는 모달에도 적용 가능. 열린 모달에서 뒤로가기 = 모달만 닫힘 |
| 파괴적 동작 | 삭제 확인의 **초기 포커스는 취소**. ref 는 effect 안에서 읽는다 |
| 포커스 이동 | 삭제 후 다음 행 / 재연결 후 원래 버튼 / 생성 후 시트 링크 — 전부 `requestAnimationFrame` 한 프레임 뒤 |
| 모션 | 🔴 스크롤 진입 애니메이션 **없음** · 페이지 로드 오케스트레이션 **없음**. 모달 진입/퇴장(`motion.ease` / `motion.exit`)만 |
| reduced-motion | 잔류 0, 스켈레톤 셔머 없음(모양이 정적 단서) |

---

## 7. 숫자 포맷 규칙

| 값 | 포맷터 | 예 |
|---|---|---|
| 행 금액 | `formatKRW(Math.abs(v))` | `₩12,000` |
| 요약 수입·지출 | `formatKRW(v)` | `₩1,240,000` |
| 요약 순액 | `formatKRW(v)` — **부호 포함**(`Intl` 이 `-₩…` 로 낸다) | `-₩320,000` |
| 폼 금액 힌트 | `formatKRW(parsed)` | `₩12,000` |
| 날짜 | `YYYY-MM-DD`(시트 원값) → 표시 `M월 D일 (요일)`, `<time dateTime="YYYY-MM-DD">` | `8월 3일 (월)` |
| 월 라벨 | `` `${year}년 ${month}월` `` | `2026년 8월` |

- 🔴 `formatApproxKRW`/`formatSummaryKRW`(억/만 축약)를 **쓰지 마라**. 가계부는 원 단위 정확값이 정보다.
- 🔴 달러 포맷터를 쓰지 마라. 이 화면은 표시 통화 토글의 소비처가 아니다(시트의 통화는 사용자 소유).
- 숫자 서체: hero 1곳만 `font.heroNumeric`, 나머지 전부 `font.dataNumeric` + `font.numeric`(tabular).

---

## 8. 새 공용 부품 — 🔴 **0개**

| 후보 | 판정 |
|---|---|
| `EmptyState` 공용화 | ❌ **지금 만들지 않는다.** Portfolio·Calendar 가 각자 로컬 복제로 살아 있고(의도된 관례), 세 번째 소비처가 생겼다고 지금 추상화하면 세 화면을 동시에 바꿔야 한다 |
| `MonthNavigator` 공용화 | ❌ **지금 만들지 않는다.** `CalendarToolbar` 와 모양이 같지만 페이지 간 styled import 는 두 화면을 서로의 레이아웃 변경에 묶고 lazy 청크를 섞는다(캘린더가 세운 관례). `pages/Ledger/components/LedgerMonthNav` 로 **로컬 복제**하고 주석에 원본 위치를 남긴다 |
| `Combobox`(자동완성) | ❌ 네이티브 `<datalist>` 로 해결. 오버레이 층을 늘리지 않는다 |
| `Toast` | ❌ 요구가 명시적으로 금지 |
| `ConfirmDialog` | ❌ 삭제 확인은 대상 요약을 담아야 해서 일반화 이득이 없다. `Modal` + 로컬 본문 |
| `Card tone="wash"` | ✅ **기존 부품**. 지금까지 소비처 0이었고 이 트랙이 첫 소비자다(신설 아님) |

---

## 9. 계측 (제안 — 확정 아님, `analytics-analyst` 검토 대상)

`shared/lib/analytics.ts` 의 `ANALYTICS_EVENT` 에 추가 **제안**:

| 이벤트 | 파라미터 | 용도 |
|---|---|---|
| `ledger_connect_started` | `method: 'existing' \| 'create'` | 두 선택지의 실제 비율(동등 무게 설계의 검증) |
| `ledger_connected` | `method` | 연결 완료 퍼널 |
| `ledger_entry_saved` | `kind: 'income' \| 'expense'`, `mode: 'create' \| 'edit'` | 사용 빈도 |
| `ledger_write_failed` | `reason: 'expired' \| 'rate_limited' \| 'conflict' \| 'permission' \| 'network' \| 'unknown'` | 🔴 429 비율 실측 — 카운트다운 초기값 튜닝 근거 |

배선은 `frontend-engineer` 가 하지 말고 **이벤트 승인 뒤** 별도로 붙인다.

---

## 10. 토큰 목록 (이 화면이 쓰는 것 전부)

**색** — `color.` 접두:
`text` `textSecondary` `textMuted` · `bg` `surface` `surfaceRaised` `surfaceSunken` `surfaceMuted` `surfaceHover` · `border` `borderStrong` · `brand` `brandText` `onBrand` · `accentSubtle` `accentBorder` `accentText` · `danger` `dangerSurface` `dangerBorder` · `warning` `warningSurface` · `gradientHeroSoft`(Card wash 내부) · `overlay`(Modal 내부)

**기하·타이포·모션**:
`space[1..8]` · `radius.sm|md|lg|xl|pill` · `elevation[2]`(cardElevation 내부) · `font.size.*` `font.weight.*` `font.leading.*` `font.dataNumeric` `font.heroNumeric` `font.numeric` · `motion.fast|base|exit|ease|easeInOut` · `media.down('mobile'|'mobileWide'|'tablet')` · `container.down('tablet')` · `TOUCH_TARGET` / `hitAreaWithin`

**믹스인**:
`cardElevation(tier)` · `surface(outer, pad)` / `nestedRadius(fallback)` · `sectionTitleFontSize` · `iconOpticalAlign` / `iconFirstLineAlign` · `pressable` · `subtleScrollbar` · `pageHue` / `pageHueMix`(장식 전용, 텍스트 금지)

**🔴 금지**:
`dataPositive` `dataNegative` `dataPositiveSurface` `dataNegativeSurface`(손익색) · 숫자에 `accent*` · 하드코딩 hex · `gradientCta`(버튼 채움 전용) 를 장식에 · `gradientAurora` 를 버튼에 · 새 토큰 신설

### 10.1 새 토큰 제안 — **없음**

이 화면에 필요한 모든 면·상태가 기존 토큰으로 표현된다. 유일하게 아쉬운 자리는 **"성공" 배너 톤**(`Banner` 는 info/warning/danger 3종뿐)인데, 저장 성공은 **라이브 리전 문구로만** 알리기로 해서 필요가 사라졌다(성공 배너는 곧 토스트의 다른 이름이고, 요구가 그것을 금지한다).

---

## 11. 데이터 계층에 요구하는 인터페이스 (🔴 `shared/lib/googleSheets/` 는 만지지 않는다)

화면이 소비할 모델만 적는다. **이름과 형태는 데이터 계층 트랙이 최종 결정**하고, 다르면 컨테이너에서 어댑팅한다.

```ts
type LedgerConnectionState =
  | 'checking' | 'disconnected' | 'mapping' | 'creating' | 'connected' | 'denied';

type LedgerColumn = { letter: string; header: string };      // 'A', '사용일자'
type LedgerMapping = { date: string | null; kind: string | null; amount: string | null;
                       category: string | null; memo: string | null };

type LedgerRowModel = {
  id: string;                 // 시트 행 식별자(행 번호 또는 안정 키)
  dateISO: string;            // 'YYYY-MM-DD'
  dateText: string;           // '8월 3일 (월)'
  kind: 'income' | 'expense';
  category: string;
  amount: number;             // 항상 양수(방향은 kind 가 갖는다)
  amountText: string;         // formatKRW(amount)
  memo: string;
  failure: null | { reason: LedgerFailureReason; retryAfterSec: number | null };
};

type LedgerFailureReason = 'network' | 'permission' | 'rateLimited' | 'conflict' | 'unknown';

type LedgerMonthSummary = { incomeText: string; expenseText: string; netText: string;
                            incomeCount: number; expenseCount: number };

type LedgerPendingAction =                       // §4.7 재연결 후 이어서 실행
  | { intent: 'create'; draft: LedgerDraft }
  | { intent: 'update'; id: string; draft: LedgerDraft }
  | { intent: 'remove'; id: string };
```

화면이 필요로 하는 조회 3종:
1. **헤더 자동 매칭 결과**(`LedgerMapping` 초기값) + `LedgerColumn[]` + 미리보기 원본 3행.
2. **월 단위 행 조회** — `(year, month) => LedgerRowModel[]`.
3. **가장 최근 기록이 있는 달**(`latestMonth: {year, month} | null`) — §4.4 의 "최근 기록은 N월에 있습니다"가 이 값 하나에 달려 있다. 🔴 없으면 그 문장을 만들 수 없다.

---

## §구현 지시서 — 파일 단위 작업 목록

### A. 신규 (frontend-engineer)

| 경로 | 내용 |
|---|---|
| `pages/Ledger/index.ts` | 배럴 |
| `pages/Ledger/copy/ledgerCopy.ts` | 🔴 **§4 의 모든 카피 문자열**. 리터럴을 뷰에 두지 않는다 |
| `pages/Ledger/copy/index.ts` | `export { LEDGER_COPY }` |
| `pages/Ledger/LedgerPage/LedgerPage.tsx` | 컨테이너(상태 기계·훅 조립·라우팅) |
| `pages/Ledger/LedgerPage/LedgerPage.view.tsx` | 순수 뷰(상태별 분기) |
| `pages/Ledger/LedgerPage/LedgerPage.types.ts` | `LedgerViewProps` 등 §11 모델 |
| `pages/Ledger/LedgerPage/LedgerPage.styled.ts` | `PageStack` `ConnectSection` `ConnectHeading` `ConnectGrid` `ChoiceBody` `SummaryCard`(raised) `HeroSlot` `TileGrid` `EmptyBlock` `EmptyTitle` `EmptyBody` `ActionRow` `ActionHint` `LiveRegion` `MappingGrid` `PreviewBlock` `PreviewTitle` `TargetList` `SheetLink` `CreatedActions` |
| `pages/Ledger/LedgerPage/LedgerForm.schema.ts` | zod 스키마 + `copy.form.errors` 참조 |
| `pages/Ledger/LedgerPage/index.ts` | `export { default }`(lazy 대상) |
| `pages/Ledger/components/LedgerMonthNav/` | `CalendarToolbar` 로컬 복제(`.tsx`/`.styled.ts`/`.types.ts`/`index.ts`) |
| `pages/Ledger/components/LedgerTable/` | 표 + 행 액션 + `RowError`. 🔴 `width: 1%` → 카드 모드 `auto` |
| `pages/Ledger/components/LedgerFormModal/` | 추가·수정 모달(오버레이 계약 §4.5⑤) |
| `pages/Ledger/components/LedgerRemoveDialog/` | 삭제 확인 모달(§4.6) |
| `pages/Ledger/components/LedgerMappingCard/` | 열 매핑 카드(§4.2) |
| `pages/Ledger/components/LedgerConnectPanel/` | 연결 전 선택 타일 2개(§4.1) |
| `pages/Ledger/components/LedgerFailureList/` | 부분 실패 목록 `Card tone="sunken"`(§4.8) |
| `pages/Ledger/components/index.ts` | 배럴 |
| `pages/Ledger/hooks/` | `useLedgerConnection` `useLedgerMonth` `useLedgerWrite` `useRetryCountdown`(🔴 타이머 1개) |

### B. 수정 (frontend-engineer)

| 경로 | 변경 |
|---|---|
| `router/routes.tsx` | `const LedgerPage = lazy(() => import('@/pages/Ledger/LedgerPage'))` + `isLedgerEnabled ? [{ path: '/ledger', element: <Suspense fallback={null}><LedgerPage /></Suspense> }] : []`. 🔴 `*`(404)·`/privacy`·`/terms` 블록은 건드리지 마라 |
| `shared/hooks/usePageHue/usePageHue.utils.ts` | `if (pathname.startsWith('/ledger')) return 'accentAlt';` |
| `shared/hooks/usePageHue/usePageHue.test.tsx` | 새 라우트 배정 + **의도된 동색 쌍**(`/ledger` ≡ `/dividend/portfolio`) 목록 갱신 |
| `pages/Portfolio/copy/portfolioCopy.ts` | `ledgerEntry` 키 추가(§2.1) |
| `pages/Portfolio/PortfolioPage/PortfolioPage.view.tsx` | `<Card tone="wash">` 진입 카드를 SummaryCard **아래**·`PortfolioAssumptions` **위**에. `isLedgerEnabled` 가드 |
| `pages/Portfolio/PortfolioPage/PortfolioPage.styled.ts` | `EntryBody` 추가(§2.1) |
| `pages/Portfolio/PortfolioPage/PortfolioPage.types.ts` | `onOpenLedger?: () => void` |
| `pages/Portfolio/PortfolioPage/PortfolioPage.tsx` | `navigate('/ledger')` 배선 |
| `components/community/CommunityIcons/*` | `ReceiptTextIcon` 1개 추가(named import) |
| `components/community/AuthControl/AuthControl.tsx` | 메뉴 항목 1개 추가(§2.2) |
| `shared/constants/community/copy.ts` | `ledger.menuItem = '가계부'` |
| `.env.example` | `VITE_GOOGLE_SHEETS_CLIENT_ID=` 항목 + "비우면 가계부가 꺼진다" 주석. ⚠ 이 파일은 병렬 트랙도 만진다 — 커밋 전 `git status` 재확인 |

### C. 다른 담당

| 담당 | 항목 |
|---|---|
| `state-engineer` | 연결 상태·매핑·월 커서·`LedgerPendingAction` 의 소유처. 🔴 **기존 영속 스키마·공유 URL 스키마 무변경**. 시트 토큰은 우리 DB 에 저장하지 않는다 |
| 데이터 계층 트랙 | `shared/lib/googleSheets/` — §11 인터페이스 3종(자동 매칭·월 조회·`latestMonth`) |
| `qa-tester` | 아래 수용 기준 |

### D. 수용 기준 (qa-tester)

1. **카피 정확일치** — `LEDGER_COPY` 의 전 문자열에 대한 계약 테스트(🔴 부분일치 금지, 기대값에 상수 재사용 금지 = 리터럴로 적을 것).
2. **연결 전 ↔ 연결 후 0건이 다른 화면**임을 단정(연결 후 0건에는 월 네비·요약 카드가 존재).
3. **`latestMonth` 가 있으면** "가장 최근 기록은 N월에 있습니다"가 렌더되고 버튼이 그 달로 이동.
4. **만료 상태에서 목록이 유지**되고 쓰기 버튼이 전부 `disabled` + 같은 `aria-describedby` id 를 가리킨다.
5. **재연결 1클릭 → 진행 중이던 저장이 이어서 실행**된다(`LedgerPendingAction` 소비).
6. **쓰기 실패가 행/폼에 잔류**하고 재시도 버튼이 있다. 부분 실패 문구가 `M건/N건` 숫자를 포함한다(🔴 "일부 실패" 문자열이 소스에 없음을 소스 스캔으로 단정 — ⚠ 스캔 전에 주석 제거).
7. **429 문구가 다른 실패와 구분**된다(별도 문자열 + 카운트다운 라벨).
8. **삭제 확인에 날짜·구분·분류·금액이 전부 렌더**된다. 초기 포커스 = 취소.
9. **오버레이 중첩 0** — 폼 모달이 열린 상태에서 삭제 다이얼로그를 열 수 없다.
10. **손익색 미사용** — `pages/Ledger/**` 소스에 `dataPositive|dataNegative` 가 0회(소스 스캔, 주석 제거 후).
11. **`raised` 카드 1개** — `pages/Ledger/**` 에 `cardElevation('raised')` 가 1회(주석 제거 후 스캔).
12. **가로 오버플로 0** — `npm run overflowprobe` @ 360·390·768·1024·1280, 스크롤 뒤 재측정 포함.
13. 🔴 **새로 만든 가드는 뮤턴트로 감도 증명**(일부러 깨서 정확히 빨개지는지 → 원복).

### E. 검증 명령

```sh
npx tsc -b tsconfig.build.json          # ⚠ bare `tsc -b` 아님
npm run test                             # test/shared/copyTone.test.ts 가 pages/ 를 자동 스캔한다
node tools/dev/styled-comment-backticks.mjs
npm run overflowprobe
npm run headerprobe                      # 새 라우트가 헤더 게이트에 들어가면 라우트 목록 갱신
```

**카피 어미 가드** — `test/shared/copyTone.test.ts` 의 `ROOTS` 에 `pages` 가 이미 있어 `pages/Ledger/copy/ledgerCopy.ts` 는 **자동으로** 검사된다(새 폴더를 등록할 필요 없다). 규칙: 문장 끝의 `요`/`죠` 금지, 단 **`~세요`(요청·권유)는 허용**이다. 그래서 §4.10 의 요구 문장 `'…새로고침 후 다시 시도하세요.'` 는 **원문 그대로 통과**한다(`copyTone.test.ts:86-93`). ⚠ 이 가드는 `aria-label`·`title` 문자열도 **같은 규칙**으로 본다.

⚠ `shared/styles`·`shared/constants` 를 스쳤으면 `npm run api:bundle` 후 `api/*.js` 변경을 동반 스테이징.
