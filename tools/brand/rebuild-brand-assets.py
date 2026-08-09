#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
브랜드 자산 재생성 — `assets/brand/*.png`(원본) → `public/` 파생물 **전종**을 한 번에 만든다.

    npm run brand:assets            # = python tools/brand/rebuild-brand-assets.py
    npm run brand:check             # 산출물 알파 회귀 가드(순수 Node, 파이썬 불필요)

의존성 (수동 실행 전용 — 앱 빌드도 `npm run verify` 도 이 스크립트를 부르지 않는다)
    Python 3.10+ · Pillow · numpy · scipy
        python -m pip install --user pillow numpy scipy
    폰트는 레포가 이미 갖고 있는 것을 쓴다(`node_modules/wanted-sans` — `npm install` 필요).
⚠ `tools/indexer` · `tools/dev` 의 "순수 Node, 외부 의존성 0" 규율은 **매 커밋 도는 도구**의
  것이다. 이건 자산이 바뀔 때만 사람이 돌리는 1회성 도구이고, 연결성 라벨링·거리변환·폰트
  래스터라이즈를 의존성 0으로 다시 짜는 비용이 이득보다 크다. 대신 **검증**(brand:check)은
  순수 Node 로 따로 두었다 — 누구나 언제든 돌릴 수 있어야 하는 쪽은 그쪽이기 때문이다.

────────────────────────────────────────────────────────────────────────────────
🔴 원본 `app_icon.png` 은 "투명 원본"이 아니라 **체커보드가 구워진 스크린샷**이다
────────────────────────────────────────────────────────────────────────────────
이 사실을 모르면 다음 사람이 또 색상 키(밝은 색을 지운다)를 쓴다. 실측 근거:
  · 파일 모드가 RGB 다 — 알파 채널 자체가 없다.
  · 네 모서리 색이 서로 다르다: [253,253,253] / [246,247,245] / [253,252,253] / [245,245,245]
  · 한 행의 값 전이가 x=1,31,61,90,120,149,… 로 **29.5px 주기**다(1024px 원본의 24px 체커를
    1.2246배 업스케일한 형태). 배경은 순백 단색이 아니라 **밝기 245~255 대역의 두 회색**이다.

그래서 "흰색을 지운다"가 곧 "체커보드의 밝은 타일을 지운다"였고, **같은 밝기 대역에 있는
이빨·눈 흰자·물 하이라이트가 함께 뚫렸다.** 이 결함은 앱 15개 화면에 배포된 채 살아 있었다
(다크 헤더 44px 로고에서 눈이 검은 구멍, 이빨이 소실).

────────────────────────────────────────────────────────────────────────────────
그래서 색상 키가 아니라 **연결성(flood-fill)** 이다 — 실측 수치
────────────────────────────────────────────────────────────────────────────────
술어 `sat<=8 & lum>=238` 로 "근백색"을 잡으면 성분이 31개 나온다. 그중 **이미지 테두리에
닿는 성분은 정확히 1개**(화면의 67.07%)뿐이고, 그것만 배경으로 채택한다.
안쪽에 갇혀 남는 근백색 1,148px(30 블롭)은 전부 **살아야 할 그림**이다:

    blob  609px (y=462,x=504) · 262px (y=467,x=536) · 24px (y=509,x=501)  → 눈 흰자/하이라이트
    blob   73px (y=684,x=801) ·  15px (y=644,x=894)                        → 이빨
    blob   29px (y=1062,x=859) · 22px (y=1098,x=676) · 20px (y=1039,x=851) → 물 하이라이트

색상 키는 이 1,148px 을 전부 배경으로 오인한다. 실제 그렇게 만들어졌던 구자산의 상태:
"2px 침식한 안쪽에서 lum>230 인 픽셀 중 알파가 255 인 비율"이 hippo-mark **16.7%** ·
hippo **41.1%** 였다. 비율보다 **개수**가 사태를 말한다 — 그 밝은 픽셀 자체가 6px(mark) ·
209px(hippo) 뿐이었다. 지금 산출물은 133px 100.0% · 1740px 99.9% 로, 흰 그림 대부분은 흐려진
것이 아니라 아예 지워져 세어지지도 않았던 것이다.

부수 실측 두 가지 — 알고리즘 단순화의 근거다:
  · **그림자·후광이 없다.** 실루엣 바깥 8px 띠의 휘도 249.99 vs 40px 밖 250.12 (차이 0.13).
    → 배경을 전부 알파 0 으로 잘라도 잃는 그림 정보가 없다.
  · **안티에일리어싱은 1px 뿐이다.** 전경 침식 링 휘도 229.1 → 191.2 → 188.6 → 188.0.
    → 미지(unknown) 띠를 경계 양쪽 2px 로 잡으면 충분하고, 언매팅해도 밝은 테두리가 생기지
      않는다(언매팅 후 바깥 solid ring 186.2 / ring2 189.1 / ring3 185.2 — 몸통 색과 일치).

⚠ 술어 `sat<=8 & lum>=238` 은 **이 자산에 맞춘 창**이다. 다른 마스코트에 그대로 쓰지 마라 —
  배경이 밝은 회색이거나 대상에 큰 무채 흰 면이 있으면 위 다섯 지표를 다시 찍어야 한다.
⚠ 진짜 알파를 가진 원본이 어딘가에 있다면 그걸 받아 오는 것이 이 추출보다 낫다.
  `coin_icon.png` 이 그 예다(RGBA, a==0 이 87.58%) — 그래서 코인은 추출을 **건너뛴다.**

────────────────────────────────────────────────────────────────────────────────
🔴 프레이밍 보존 — 이걸 놓치면 로고가 조용히 18% 작아진다
────────────────────────────────────────────────────────────────────────────────
마스터를 그냥 축소하면 알파 bbox 가 (18,39)-(227,226) 이 되어 BrandGlyph 15개 호출부와
헤더 로고의 **겉보기 크기가 전부 줄어든다**(파일은 여전히 256×256 이라 테스트가 못 잡는다).
그래서 항상 **타이트 bbox 를 목표 상자에 맞춰** 배치한다. hippo-mark 기준 결과 bbox 는
(0,13)-(255,241) 로 기존 자산 (0,13)-(255,242) 과 1px 차 — 드롭인 교체가 성립한다.
이 회귀는 `npm run brand:check` 의 "bbox 폭" 항목이 잡는다(폭의 98% 미만이면 실패).

────────────────────────────────────────────────────────────────────────────────
산출물
────────────────────────────────────────────────────────────────────────────────
    public/hippo-mark.png      256×256  RGBA  BrandGlyph(16~96px, 15개 호출부)
    public/hippo.png           808×720  RGBA  HippoCoinScene 의 하마(헤더 44px · CTA 88px)
    public/coin.png            512×512  RGBA  HippoCoinScene 의 금화(coin_icon.png 에서)
    public/favicon-16.png       16×16   RGB   흰 면 · 폭 꽉 · 아래 정렬
    public/favicon-32.png       32×32   RGB
    public/favicon.ico         16/32/48 ICO
    public/apple-touch-icon.png 180×180 RGB   흰 면 · 폭의 91.4% · 가운데 정렬
    public/icon-192.png        192×192  RGB   (PWA)
    public/icon-512.png        512×512  RGB   (PWA)
    public/og-hungry-hippo.png 1200×630  RGB   브랜드 패널 카드(공유 미리보기)

og 카드의 색 3종은 **하드코딩하지 않는다** — `shared/styles/presets/sharedTokens.ts` 의
`BRAND_PANEL` 을 그대로 읽어 쓴다. 화면과 공유 카드가 갈라지지 않게 하는 유일한 방법이다.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
    from scipy import ndimage
except ImportError as exc:  # pragma: no cover - 사람이 읽는 안내
    sys.exit(
        f'필요한 패키지가 없다({exc.name}).\n'
        '  python -m pip install --user pillow numpy scipy'
    )

# Windows 콘솔 기본 코드페이지(cp949)로는 이 파일의 한글·em-dash 로그가 그대로 죽는다.
for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, 'reconfigure'):
        stream.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / 'assets' / 'brand'
OUT_DIR = ROOT / 'public'
FONT_DIR = ROOT / 'node_modules' / 'wanted-sans' / 'fonts' / 'otf'

# 근백색 술어 — 위 머리말의 "이 자산에 맞춘 창" 경고를 반드시 함께 읽어라.
SAT_MAX = 8
LUM_MIN = 238
# 미지 띠 반경. AA 가 1px 이라 2px 이면 충분하고, 키우면 정상 전경까지 재추정 대상이 된다.
UNKNOWN_RADIUS = 2
# 국소 배경색 추정 창. 체커 진폭이 ±4(1.6%)라 평탄화해도 알파 오차가 그 미만이다.
BG_WINDOW = 9


# ────────────────────────────────────────────────────────────────────────────
# 1. 알파 추출
# ────────────────────────────────────────────────────────────────────────────

def _disk(radius: int) -> np.ndarray:
    span = np.arange(-radius, radius + 1)
    yy, xx = np.meshgrid(span, span, indexing='ij')
    return (yy * yy + xx * xx) <= radius * radius


def extract_alpha(rgb: np.ndarray, *, verbose: bool = True) -> np.ndarray:
    """체커보드가 구워진 RGB 에서 RGBA 를 복원한다. 반환값은 uint8 HxWx4."""
    src = rgb.astype(np.float64)
    lum = src.mean(2)
    sat = src.max(2) - src.min(2)

    # (1) 근백색 → (2) 8-이웃 라벨링 → 테두리에 닿는 성분만 배경.
    #     🔴 이 두 줄이 색상 키와 갈리는 지점이다. 색상 키는 안쪽 근백색(눈·이빨·물)도 지운다.
    bright = (sat <= SAT_MAX) & (lum >= LUM_MIN)
    labels, count = ndimage.label(bright, structure=np.ones((3, 3)))
    edge_ids = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])))
    edge_ids.discard(0)
    background = np.isin(labels, sorted(edge_ids))
    if verbose:
        inside = int((bright & ~background).sum())
        print(f'  근백색 성분 {count}개 중 테두리 접촉 {len(edge_ids)}개 = 배경 {background.mean():.4%}')
        print(f'  안쪽에 남긴 근백색 {inside}px (눈 흰자·이빨·물 하이라이트 — 색상 키면 전부 소실)')

    # (3) 미지 띠 = 경계 양쪽 UNKNOWN_RADIUS. 나머지는 확정 배경/확정 전경.
    disk = _disk(UNKNOWN_RADIUS)
    unknown = ndimage.binary_dilation(background, disk) & ndimage.binary_dilation(~background, disk)
    sure_bg = background & ~unknown
    sure_fg = ~background & ~unknown

    # (4) 국소 배경색 B — 확정 배경만으로 가중 이동평균.
    weight = ndimage.uniform_filter(sure_bg.astype(np.float64), BG_WINDOW)
    b_local = np.empty_like(src)
    fallback = src[sure_bg].mean(0)
    for ch in range(3):
        acc = ndimage.uniform_filter(np.where(sure_bg, src[:, :, ch], 0.0), BG_WINDOW)
        b_local[:, :, ch] = np.where(weight > 1e-6, acc / np.maximum(weight, 1e-6), fallback[ch])

    # (5) 국소 전경색 F — 확정 전경의 **최근접** 색(거리변환 인덱스).
    _, idx = ndimage.distance_transform_edt(~sure_fg, return_indices=True)
    f_local = src[idx[0], idx[1]]

    # (6) α = (B-O)/(B-F). 분모가 0 으로 무너지지 않게 **채널별로 풀고 |B-F| 최대 채널을 채택**한다.
    denom = b_local - f_local
    numer = b_local - src
    with np.errstate(divide='ignore', invalid='ignore'):
        per_channel = np.where(np.abs(denom) > 1e-6, numer / denom, 0.0)
    pick = np.argmax(np.abs(denom), axis=2)
    alpha = np.take_along_axis(per_channel, pick[:, :, None], axis=2)[:, :, 0]
    alpha = np.clip(alpha, 0.0, 1.0)
    alpha = np.where(sure_fg, 1.0, np.where(sure_bg, 0.0, alpha))

    # (7) 색 언매팅 — 띠 안에서만. 배경색이 섞인 1px 가장자리를 원래 색으로 되돌린다.
    band = unknown & (alpha > 0.02) & (alpha < 0.98)
    a3 = alpha[:, :, None]
    with np.errstate(divide='ignore', invalid='ignore'):
        unmatted = np.where(a3 > 1e-6, (src - (1.0 - a3) * b_local) / np.maximum(a3, 1e-6), src)
    out_rgb = np.where(band[:, :, None], np.clip(unmatted, 0, 255), src)

    # (8) 알파 0 영역의 RGB 를 최근접 전경색으로 채운다.
    #     🔴 이 줄을 빼면 축소할 때 회색이 실루엣으로 배어든다 — 라이트에서는 거의 안 보이고
    #     다크에서만 드러나서, 라이트만 보고 통과시키기 쉬운 함정이다.
    out_rgb = np.where((alpha <= 0.02)[:, :, None], f_local, out_rgb)

    rgba = np.empty(src.shape[:2] + (4,), np.uint8)
    rgba[:, :, :3] = np.clip(np.rint(out_rgb), 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(np.rint(alpha * 255.0), 0, 255).astype(np.uint8)
    return rgba


# ────────────────────────────────────────────────────────────────────────────
# 2. 기하 — 타이트 크롭 · 프리멀티플라이드 축소
# ────────────────────────────────────────────────────────────────────────────

def tight_crop(img: Image.Image, threshold: int = 8) -> Image.Image:
    """알파가 있는 최소 사각으로 자른다. 프레이밍 보존의 출발점이다."""
    alpha = np.asarray(img)[:, :, 3]
    ys, xs = np.nonzero(alpha > threshold)
    return img.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def resize_rgba(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """🔴 축소는 **프리멀티플라이드 공간**에서 한다(PIL 의 RGBa 모드).

    직선 RGBA 를 그냥 줄이면 알파 0 픽셀의 색이 이웃에 섞여 실루엣에 테두리가 배어난다.
    (8)에서 알파 0 의 색을 최근접 전경으로 채워 두었지만, 그것만으로는 부족하다 —
    반투명 AA 픽셀의 가중이 틀어지기 때문이다.
    """
    return img.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')


def snap_opaque(img: Image.Image, floor: int = 250) -> Image.Image:
    """알파 250~254 를 255 로 올린다. **250 미만은 손대지 않는다 — 진짜 반투명 구간이다.**

    두 군데서 생긴다: ① 원본 코인 렌더는 안쪽 알파가 249~254 다(중앙값 254 — 렌더러가 남긴
    미세한 비불투명) ② Lanczos 축소 뒤 un-premultiply 반올림. 둘 다 화면에서는 0.4~2% 투과라
    보이지 않지만, "안쪽 밝은 픽셀이 불투명한가"를 보는 회귀 가드의 신호를 흐린다.
    """
    arr = np.asarray(img.convert('RGBA')).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] >= floor, 255, arr[:, :, 3])
    return Image.fromarray(arr, 'RGBA')


def fit_box(img: Image.Image, box: tuple[int, int], *, scale: float = 1.0) -> tuple[Image.Image, tuple[int, int]]:
    """타이트 이미지를 상자에 비율 유지로 맞춘다. 반환: (축소본, 붙일 좌표)."""
    bw, bh = box
    ratio = min(bw * scale / img.width, bh * scale / img.height)
    size = (max(1, round(img.width * ratio)), max(1, round(img.height * ratio)))
    return resize_rgba(img, size), ((bw - size[0]) // 2, (bh - size[1]) // 2)


def on_white(tight: Image.Image, box: int, *, scale: float, bottom: bool = False) -> Image.Image:
    """파비콘·PWA 아이콘 — 흰 면에 합성한 불투명 RGB.

    두 규칙이 기존 자산에서 실측된다(구자산 icon-512 콘텐츠 bbox 22..489 / 48..464):
      · 아이콘(180·192·512): 폭의 91.4% 로 넣고 **가운데** 정렬 (좌우 여백 4.3%)
      · 파비콘(16·32·48): 폭을 꽉 채우고 **아래** 정렬 — 16px 에서 여백은 사치다
    """
    fitted, (ox, oy) = fit_box(tight, (box, box), scale=scale)
    canvas = Image.new('RGBA', (box, box), (255, 255, 255, 255))
    canvas.alpha_composite(fitted, (ox, box - fitted.height if bottom else oy))
    return canvas.convert('RGB')


# ────────────────────────────────────────────────────────────────────────────
# 3. og 카드
# ────────────────────────────────────────────────────────────────────────────

OG_SIZE = (1200, 630)
# 아래 좌표는 전부 **기존 카드에서 실측**한 값이다(글리프 잉크 bbox 기준).
OG_WORDMARK = ('Hungry Hippo', 'ExtraBold', 106, (85, 199))
OG_RULE = (78, 312, 133, 9)                     # x, y, w, h — 반지름은 h/2 인 알약
OG_LINES = (
    ('배당을 먹고 자라는 포트폴리오', 'SemiBold', 38, (81, 355)),
    ('배당 재투자 시뮬레이터 · 배당 캘린더 · 종목 비교', 'Medium', 30, (81, 406))
)
# 하마: 기존 카드와 실루엣 IoU 를 최대화하는 배치(폭 470 · 좌 690 · 상 150 → 우 1160 · 하 560).
OG_HIPPO = (470, 690, 150)


def read_brand_panel() -> dict[str, str]:
    """🔴 색을 하드코딩하지 않는다 — 화면이 쓰는 토큰 원본을 그대로 읽는다."""
    path = ROOT / 'shared' / 'styles' / 'presets' / 'sharedTokens.ts'
    block = re.search(r'const BRAND_PANEL: ThemeTokens = \{(.*?)\n\};', path.read_text(encoding='utf-8'), re.S)
    if not block:
        sys.exit(f'BRAND_PANEL 블록을 찾지 못했다: {path}')
    found = dict(re.findall(r"'?([\w-]+)'?:\s*'(#[0-9a-fA-F]{6})'", block.group(1)))
    missing = {'panel', 'on-panel', 'on-panel-muted', 'on-panel-gold'} - found.keys()
    if missing:
        sys.exit(f'BRAND_PANEL 에서 {sorted(missing)} 를 읽지 못했다')
    return found


def _hex(value: str) -> tuple[int, int, int]:
    return tuple(int(value[i:i + 2], 16) for i in (1, 3, 5))  # type: ignore[return-value]


def _font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_DIR / f'WantedSans-{weight}.otf'
    if not path.exists():
        sys.exit(f'폰트가 없다: {path}\n  npm install 을 먼저 돌려라(og 카드는 화면과 같은 서체를 쓴다).')
    return ImageFont.truetype(str(path), size)


def _draw_ink(draw: ImageDraw.ImageDraw, text: str, font, ink: tuple[int, int, int], at: tuple[int, int]) -> None:
    """글리프의 **잉크 좌상단**이 at 에 오도록 그린다(폰트 메트릭이 아니라 실제 획 기준)."""
    left, top, _, _ = draw.textbbox((0, 0), text, font=font)
    draw.text((at[0] - left, at[1] - top), text, font=font, fill=ink)


def build_og(tight_hippo: Image.Image) -> Image.Image:
    token = read_brand_panel()
    card = Image.new('RGBA', OG_SIZE, _hex(token['panel']) + (255,))

    width, x0, y0 = OG_HIPPO
    height = round(width * tight_hippo.height / tight_hippo.width)
    card.alpha_composite(resize_rgba(tight_hippo, (width, height)), (x0, y0))

    draw = ImageDraw.Draw(card)
    text, weight, size, at = OG_WORDMARK
    _draw_ink(draw, text, _font(weight, size), _hex(token['on-panel']), at)
    rx, ry, rw, rh = OG_RULE
    draw.rounded_rectangle((rx, ry, rx + rw, ry + rh), radius=rh / 2, fill=_hex(token['on-panel-gold']))
    for text, weight, size, at in OG_LINES:
        _draw_ink(draw, text, _font(weight, size), _hex(token['on-panel-muted']), at)
    return card.convert('RGB')


# ────────────────────────────────────────────────────────────────────────────
# 4. 검증 — "아주 밝은 픽셀이 실제로 불투명한가"
# ────────────────────────────────────────────────────────────────────────────

def bright_opaque_ratio(img: Image.Image) -> tuple[float, int]:
    """2px 침식한 안쪽에서 lum>230 인 픽셀 중 알파 255 의 비율.

    이 한 지표가 이번 결함의 유일한 자동 신호다. 구자산: hippo-mark 16.7% · hippo 41.1%.
    """
    arr = np.asarray(img.convert('RGBA'))
    inner = ndimage.binary_erosion(arr[:, :, 3] > 8, _disk(2))
    bright = inner & (arr[:, :, :3].mean(2) > 230)
    total = int(bright.sum())
    if total == 0:
        return 1.0, 0
    return float((arr[:, :, 3][bright] == 255).mean()), total


# ────────────────────────────────────────────────────────────────────────────
# 5. 실행
# ────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print(f'원본: {SRC_DIR}')
    hippo_src = Image.open(SRC_DIR / 'app_icon.png')
    print(f'  app_icon.png {hippo_src.size} {hippo_src.mode}  ← 체커보드 합성물(머리말 참고)')
    rgba = extract_alpha(np.asarray(hippo_src.convert('RGB')))
    master = Image.fromarray(rgba, 'RGBA')
    tight = tight_crop(master)
    print(f'  타이트 bbox {tight.size} (aspect {tight.width / tight.height:.4f})')

    # 금화는 원본이 **진짜 알파**를 갖고 있다 — 추출을 돌리지 않는다(돌리면 금색 하이라이트를 잃는다).
    coin_src = Image.open(SRC_DIR / 'coin_icon.png').convert('RGBA')
    coin_tight = tight_crop(coin_src)
    print(f'  coin_icon.png {coin_src.size} RGBA → 타이트 {coin_tight.size} (알파 추출 생략)')

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written: list[tuple[str, Image.Image]] = []

    def write(name: str, img: Image.Image, **params) -> None:
        if img.mode == 'RGBA':
            img = snap_opaque(img)
        img.save(OUT_DIR / name, **params)
        written.append((name, img))

    # ── RGBA 파생물 ────────────────────────────────────────────────────────
    # 🔴 크기는 기존 자산과 **같게** 유지한다 — 호출부 15곳의 겉보기 크기가 변하지 않도록.
    mark, (mx, my) = fit_box(tight, (256, 256))
    mark_canvas = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    mark_canvas.alpha_composite(mark, (mx, my))
    write('hippo-mark.png', mark_canvas)

    hippo, (hx, hy) = fit_box(tight, (808, 720))
    hippo_canvas = Image.new('RGBA', (808, 720), (0, 0, 0, 0))
    hippo_canvas.alpha_composite(hippo, (hx, hy))
    write('hippo.png', hippo_canvas)

    coin, (cx, cy) = fit_box(coin_tight, (512, 512), scale=0.932)
    coin_canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    coin_canvas.alpha_composite(coin, (cx, cy))
    write('coin.png', coin_canvas)

    # ── 흰 면 아이콘 ──────────────────────────────────────────────────────
    write('favicon-16.png', on_white(tight, 16, scale=1.0, bottom=True))
    write('favicon-32.png', on_white(tight, 32, scale=1.0, bottom=True))
    for name, box in (('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512)):
        write(name, on_white(tight, box, scale=0.914))

    ico = [on_white(tight, box, scale=1.0, bottom=True) for box in (16, 32, 48)]
    ico[-1].save(OUT_DIR / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:-1])
    written.append(('favicon.ico', ico[-1]))

    # ── og 카드 ───────────────────────────────────────────────────────────
    # 🔴 파일 이름에 브랜드가 들어 있는 것은 **의도**다. 카카오·페이스북 같은 수집기는
    # 이미지를 **주소 기준**으로 캐시한다 — 같은 이름에 덮어쓰면 그림을 바꿔도 옥 그림이
    # 계속 나간다(2026-08-09, 실제로 몇 주간 옥 브랜드 그림이 공유 카드에 남았다).
    # ⚠ 디자인을 바꾸면 **이 이름도 함께 바꾸고**, index.html · Og.tsx 의 STATIC_OG_IMAGE 를
    #   같이 고친다(둘이 같은지는 test/api/ogImageAsset.test.ts 가 잠그고 있다).
    write('og-hungry-hippo.png', build_og(tight))

    print('\n산출물')
    for name, img in written:
        size = (OUT_DIR / name).stat().st_size
        line = f'  {name:<22} {img.size[0]}×{img.size[1]}  {size / 1024:6.1f} KB'
        if img.mode == 'RGBA':
            ratio, total = bright_opaque_ratio(img)
            line += f'   밝은 픽셀 {total:5d}px 중 알파 255 = {ratio:6.1%}'
        print(line)
    print('\n검증: npm run brand:check  ·  눈으로: 흰/네이비/다크 면에 합성해 직접 봐라.')


if __name__ == '__main__':
    main()
