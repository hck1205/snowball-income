#!/usr/bin/env python
"""미 하원 의원 주식 거래 공시(STOCK Act PTR) 수집기 — `shared/constants/congressTrades/` 를 만든다.

```sh
npm run congress:trades              # 최근 2개 연도를 받아 스냅샷 갱신
python tools/congressTrades/harvest.py 2026 2025 --limit 40   # 빠른 확인용
```

## 왜 파이썬인가
받는 것이 **PDF** 라서다. 하원 사무국은 색인만 기계 판독형(ZIP 안 TSV)으로 주고, 거래 내역 자체는
의원별 PDF 로만 낸다. 이 레포에는 파이썬 도구 선례가 있고(`tools/brand/`), 노드에 PDF 파서를
의존성으로 들이는 것보다 여기 두는 편이 앱 번들과 무관하다.

## 이 자료의 성질 — 화면이 반드시 말해야 하는 것
1. **보유가 아니라 거래다.** PTR 은 사고판 기록이다. "지금 무엇을 들고 있는지"는 알 수 없다.
2. **금액이 구간이다.** 법이 요구하는 것은 `$1,001 - $15,000` 같은 **범위**다. 합계도 범위여야 한다 —
   가운뎃값으로 접으면 없는 정밀도를 지어내는 것이다.
3. **최대 45일 늦다.** 신고 기한이 거래일로부터 30~45일이다.
4. **상원은 없다.** 상원 EFD 는 동의 폼과 세션을 요구해 같은 방식으로 받을 수 없다(2026-08-04 실측).
5. **종이 제출은 빠진다.** 스캔 PDF 는 글자가 없다(실측 838건 중 99건, 11.8%). 조용히 버리지 않고 센다.
6. **정당이 없다.** 하원 색인은 이름·주(선거구)만 준다. 정당을 붙이려면 별도 명부가 필요해서
   **넣지 않았다** — 짐작해 채우면 그 순간 틀린다.

## 실측으로 알아낸 파싱 함정 둘
1. **작은 대문자가 NUL 로 나온다.** 양식의 "PERIODIC TRANSACTION REPORT" 같은 small-caps 는
   `P\\x00\\x00\\x00…` 로 추출된다. `\\s` 는 NUL 을 공백으로 보지 않아 **먼저 지우지 않으면**
   어떤 공백 정규식도 안 걸린다.
2. **한 거래가 여러 줄에 걸친다.** 자산명도(`GSK plc American Depositary Shares` / `(GSK) [ST] …`)
   금액도(`$15,001 -` / `$50,000`) 줄바꿈된다. 그래서 줄을 **모으다가** 거래 꼬리가 완성되는
   순간 끊는다. 통째 평탄화 후 정규식은 설명문까지 자산명으로 삼킨다.
"""

import argparse
import collections
import datetime as dt
import io
import json
import re
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_PATH = ROOT / "shared/constants/congressTrades/congressTrades.generated.json"

UA = "HungryHippo/1.0 (dividend simulator; contact headtotoe1205@gmail.com)"
INDEX_URL = "https://disclosures-clerk.house.gov/public_disc/financial-pdfs/{year}FD.zip"
PTR_URL = "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/{year}/{doc}.pdf"

# 거래 한 건의 **꼬리** — 자산유형 → 행위 → 거래일 → 통지일 → 금액대.
TX_RE = re.compile(
    r"\[(?P<atype>[A-Z]{2})\]\s*"
    r"(?P<tx>[PSE])\s*(?P<partial>\(partial\))?\s*"
    r"(?P<d1>\d{2}/\d{2}/\d{4})\s*"
    r"(?P<d2>\d{2}/\d{2}/\d{4})\s*"
    r"(?P<amt>\$[\d,]+\s*-\s*\$[\d,]+|Over\s*\$[\d,]+|\$[\d,]+\s*\+)\s*$"
)
TICKER_RE = re.compile(r"\(([A-Z][A-Z0-9.\-]{0,5})\)\s*$")
OWNER_RE = re.compile(r"^(SP|DC|JT)\s+")

# 자산명 축적을 끊어야 하는 줄 — 양식 상수·페이지 머리·서명부라 자산명이 될 수 없다.
NOISE_RE = re.compile(
    r"^(?:"
    r"ID Owner Asset Transaction|Type$|Date Notification|Date$|Amount Cap\.|Gains >|\$200\?$"
    r"|F\s*S\s*:|D\s*:|S\s*O\s*:|Name:|Status:|State/District:|Filing ID|Digitally Signed"
    r"|\*\s*For the complete list|Clerk of the House|I\s+CERTIFY|my knowledge|I\s*P\s*O\s*$"
    r"|C\s*S\s*$|Yes\s+No$|P\s+T\s+R\s*$|F\s+I\s*$|T\s*$|Initial Public Offering"
    r")"
)

# 하원 자산유형 코드 중 **지분성 자산**만 종목 순위에 쓴다. 국공채(GS)·암호자산(CT)·
# 펀드 지분(OI)을 섞으면 "가장 많이 거래된 종목"이 종목이 아니게 된다.
EQUITY_TYPES = {"ST", "EF", "ET", "OP", "RS", "PS"}

# 신고 금액 구간 → (하한, 상한). 상한이 없는 최상단 구간은 `None` 이다.
AMOUNT_BANDS = {
    "$1,000 - $15,000": (1000, 15000),
    "$1,001 - $15,000": (1001, 15000),
    "$15,001 - $50,000": (15001, 50000),
    "$50,001 - $100,000": (50001, 100000),
    "$100,001 - $250,000": (100001, 250000),
    "$250,001 - $500,000": (250001, 500000),
    "$500,001 - $1,000,000": (500001, 1000000),
    "$1,000,001 - $5,000,000": (1000001, 5000000),
    "$5,000,001 - $25,000,000": (5000001, 25000000),
    "$25,000,001 - $50,000,000": (25000001, 50000000),
    "Over $50,000,000": (50000001, None),
}

ACTION_BY_CODE = {"P": "buy", "S": "sell", "E": "exchange"}


def fetch(url: str, tries: int = 3) -> bytes:
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return urllib.request.urlopen(req, timeout=60).read()
        except Exception as exc:  # noqa: BLE001 — 어떤 실패든 재시도 후 상위로 알린다
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"{url}: {last}")


def index_rows(year: int):
    zf = zipfile.ZipFile(io.BytesIO(fetch(INDEX_URL.format(year=year))))
    lines = zf.read(f"{year}FD.txt").decode("utf-8", "replace").splitlines()
    head = lines[0].split("\t")
    return [dict(zip(head, line.split("\t"))) for line in lines[1:] if line.strip()]


def clean_lines(text: str):
    """NUL(작은 대문자 잔해)을 지우고 줄 단위로 정리한다."""
    for raw in text.replace("\x00", "").splitlines():
        line = re.sub(r"[ \t]+", " ", raw).strip()
        if line:
            yield line


def parse_transactions(text: str):
    rows, buf = [], []
    for line in clean_lines(text):
        if NOISE_RE.match(line):
            buf = []
            continue
        buf.append(line)
        joined = " ".join(buf)
        m = TX_RE.search(joined)
        if not m:
            if len(buf) > 6:  # 자산명이 무한히 쌓이는 것을 막는다
                buf = buf[-3:]
            continue

        head = joined[: m.start()].strip()
        ticker = None
        tm = TICKER_RE.search(head)
        if tm:
            ticker = tm.group(1)
            head = head[: tm.start()].strip()
        owner = None
        om = OWNER_RE.match(head)
        if om:
            owner = om.group(1)
            head = head[om.end() :].strip()

        rows.append(
            {
                "assetType": m.group("atype"),
                "ticker": ticker,
                "asset": head[:120],
                "owner": owner,
                "action": ACTION_BY_CODE.get(m.group("tx"), "exchange"),
                "partial": bool(m.group("partial")),
                "transactionDate": m.group("d1"),
                "amount": re.sub(r"\s+", " ", m.group("amt")).strip(),
            }
        )
        buf = []
    return rows


def to_iso(mmddyyyy: str):
    try:
        return dt.datetime.strptime(mmddyyyy, "%m/%d/%Y").date()
    except ValueError:
        return None


def harvest(years, limit=None):
    from pypdf import PdfReader

    filings = []
    stats = collections.Counter()
    for year in years:
        rows = [r for r in index_rows(year) if r["FilingType"] == "P"]
        if limit:
            rows = rows[:limit]
        print(f"[{year}] 정기거래보고서 {len(rows)}건", flush=True)
        for i, r in enumerate(rows):
            doc = r["DocID"]
            stats["filings"] += 1
            try:
                raw = fetch(PTR_URL.format(year=year, doc=doc))
                text = "\n".join(p.extract_text() or "" for p in PdfReader(io.BytesIO(raw)).pages)
            except Exception as exc:  # noqa: BLE001
                stats["errors"] += 1
                print(f"  ! {doc} {exc}", flush=True)
                continue
            if len(text.replace("\x00", "").strip()) < 200:
                stats["scanned"] += 1  # 종이 제출 — 글자가 없다
                continue
            txs = parse_transactions(text)
            stats["transactions"] += len(txs)
            filings.append(
                {
                    "name": re.sub(r"\s+", " ", f"{r['First']} {r['Last']} {r['Suffix']}").strip(),
                    "stateDistrict": r["StateDst"],
                    "filingDate": r["FilingDate"],
                    "transactions": txs,
                }
            )
            if i and i % 100 == 0:
                print(f"  {year} {i}/{len(rows)} · 거래 {stats['transactions']}", flush=True)
            time.sleep(0.25)
    return filings, stats


def band(amount: str):
    return AMOUNT_BANDS.get(amount, (None, None))


# 자산명 자리에 **자산명이 아닌 것**이 들어오는 실측 사례. 어떤 의원은 비고란에 체결 내역을
# 줄글로 적는다("… 8.318 shares sold @ $670.024/share …"). 그 줄이 다음 거래의 자산명 자리로
# 흘러들어 AAPL 의 이름이 남의 매도 내역이 됐다(2026-08-04 실측). 그래서 **모양으로 거른다.**
PROSE_MARKERS = ("@", "shares", "Shares sold", "purchased")


def clean_asset_name(raw: str) -> str:
    name = re.sub(r"\s+", " ", (raw or "")).strip(" .;:-")
    if not name or len(name) > 80:
        return ""
    if any(marker in name for marker in PROSE_MARKERS):
        return ""
    return name


def aggregate(filings, stats, *, months: int, today: dt.date, top_tickers: int, top_members: int, recent: int):
    """스냅샷으로 접는다. 🔴 금액은 **구간 합**이다 — 가운뎃값으로 접지 않는다."""
    window_start = today - dt.timedelta(days=int(months * 30.44))

    flat = []
    for f in filings:
        for t in f["transactions"]:
            when = to_iso(t["transactionDate"])
            # ⚠ 미래 날짜가 실제로 들어온다(신고자 오타 — 실측 2026-12-26). 창밖은 버린다.
            if not when or when > today or when < window_start:
                continue
            lo, hi = band(t["amount"])
            flat.append({**t, "date": when.isoformat(), "member": f["name"], "stateDistrict": f["stateDistrict"], "lo": lo, "hi": hi})

    equity = [t for t in flat if t["ticker"] and t["assetType"] in EQUITY_TYPES]

    by_ticker = collections.defaultdict(
        lambda: {"buys": 0, "sells": 0, "lo": 0, "hi": 0, "open": False, "members": set(), "names": collections.Counter()}
    )
    for t in equity:
        e = by_ticker[t["ticker"]]
        e["buys" if t["action"] == "buy" else "sells"] += 1 if t["action"] in ("buy", "sell") else 0
        e["lo"] += t["lo"] or 0
        if t["hi"] is None:
            e["open"] = True
        else:
            e["hi"] += t["hi"]
        e["members"].add(t["member"])
        name = clean_asset_name(t["asset"])
        if name:
            e["names"][name] += 1

    by_member = collections.defaultdict(lambda: {"buys": 0, "sells": 0, "lo": 0, "hi": 0, "open": False, "state": "", "tickers": collections.Counter()})
    for t in equity:
        m = by_member[t["member"]]
        m["buys" if t["action"] == "buy" else "sells"] += 1 if t["action"] in ("buy", "sell") else 0
        m["lo"] += t["lo"] or 0
        if t["hi"] is None:
            m["open"] = True
        else:
            m["hi"] += t["hi"]
        m["state"] = t["stateDistrict"]
        m["tickers"][t["ticker"]] += 1

    ticker_rows = sorted(
        (
            {
                "ticker": k,
                # 가장 자주 등장한 이름이 이긴다 — 한 건의 오염된 줄이 종목 이름을 차지하지 못하게.
                "name": (v["names"].most_common(1)[0][0] if v["names"] else ""),
                "buys": v["buys"],
                "sells": v["sells"],
                "memberCount": len(v["members"]),
                "minUsd": v["lo"],
                "maxUsd": None if v["open"] else v["hi"],
            }
            for k, v in by_ticker.items()
        ),
        key=lambda r: (-(r["buys"] + r["sells"]), -r["memberCount"], r["ticker"]),
    )

    # 🔴 **두 축의 상위를 합집합으로 남긴다**(2026-08-05). 화면이 "건수 순 / 금액 순"을 전환하는데,
    # 건수 상위 N 만 저장하면 금액 순 화면이 **그 N 안에서만** 줄을 세운다 — 거래는 적지만 금액이
    # 큰 종목(한 번에 수백만 달러)이 통째로 빠진 채 "금액 상위"라고 말하게 된다.
    # 금액 정렬은 하한(minUsd)으로 한다: 상한은 최상단 구간이 섞이면 `None` 이라 축이 될 수 없다.
    by_amount = sorted(ticker_rows, key=lambda r: (-r["minUsd"], r["ticker"]))[:top_tickers]
    keep = {r["ticker"] for r in ticker_rows[:top_tickers]} | {r["ticker"] for r in by_amount}
    ticker_rows = [r for r in ticker_rows if r["ticker"] in keep]

    member_rows = sorted(
        (
            {
                "name": k,
                "stateDistrict": v["state"],
                "buys": v["buys"],
                "sells": v["sells"],
                "minUsd": v["lo"],
                "maxUsd": None if v["open"] else v["hi"],
                "topTickers": [t for t, _ in v["tickers"].most_common(5)],
            }
            for k, v in by_member.items()
        ),
        key=lambda r: (-(r["buys"] + r["sells"]), r["name"]),
    )[:top_members]

    recent_rows = [
        {
            "date": t["date"],
            "member": t["member"],
            "stateDistrict": t["stateDistrict"],
            "ticker": t["ticker"],
            "name": clean_asset_name(t["asset"]),
            "action": t["action"],
            "amount": t["amount"],
            "minUsd": t["lo"],
            "maxUsd": t["hi"],
            "owner": t["owner"],
        }
        for t in sorted(equity, key=lambda t: t["date"], reverse=True)[:recent]
    ]

    dates = sorted(t["date"] for t in flat)
    return {
        "generatedAt": today.isoformat(),
        "source": "U.S. House of Representatives — Clerk, Periodic Transaction Reports (STOCK Act)",
        "sourceUrl": "https://disclosures-clerk.house.gov/PublicDisclosure",
        "window": {"start": dates[0] if dates else window_start.isoformat(), "end": dates[-1] if dates else today.isoformat()},
        "coverage": {
            "filingsRead": len(filings),
            # 초기 수집기는 이 값을 'ptr' 로 셌다 — 둘 다 받아 준다(원자료 재집계 호환).
            "filingsTotal": stats["filings"] or stats["ptr"] or len(filings),
            "filingsScanned": stats["scanned"],
            "filingsFailed": stats["errors"],
            "transactions": len(flat),
            "equityTransactions": len(equity),
            "members": len({t["member"] for t in equity}),
            "tickers": len(by_ticker),
        },
        "topTickers": ticker_rows,
        "topMembers": member_rows,
        "recent": recent_rows,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("years", nargs="*", type=int)
    ap.add_argument("--limit", type=int, default=None, help="연도별 최대 건수(빠른 확인용)")
    ap.add_argument("--months", type=int, default=18, help="집계 창(개월)")
    ap.add_argument("--today", default=None, help="YYYY-MM-DD — 재현 가능한 실행용")
    ap.add_argument("--raw", default=None, help="원자료 JSON 을 여기에 남긴다(재집계용)")
    ap.add_argument("--from-raw", default=None, help="이미 받아 둔 원자료로 집계만 다시 한다")
    args = ap.parse_args()

    today = dt.date.fromisoformat(args.today) if args.today else dt.date.today()
    years = args.years or [today.year, today.year - 1]

    if args.from_raw:
        blob = json.loads(Path(args.from_raw).read_text(encoding="utf-8"))
        filings, stats = blob["filings"], collections.Counter(blob["stats"])
        # 원자료가 이름을 성·이름으로 나눠 들고 있으면 여기서 합친다(수집기 초기 형식과의 호환).
        for f in filings:
            if "name" not in f:
                f["name"] = re.sub(r"\s+", " ", f"{f.get('first','')} {f.get('last','')} {f.get('suffix','')}").strip()
            if "stateDistrict" not in f:
                f["stateDistrict"] = f.get("stateDst", "")
            for t in f["transactions"]:
                t["action"] = ACTION_BY_CODE.get(t["action"], t["action"])
    else:
        filings, stats = harvest(years, args.limit)
        if args.raw:
            Path(args.raw).write_text(json.dumps({"stats": dict(stats), "filings": filings}, ensure_ascii=False), encoding="utf-8")

    snapshot = aggregate(filings, stats, months=args.months, today=today, top_tickers=40, top_members=40, recent=120)

    # 🔴 0건이면 덮어쓰지 않는다 — 파서가 조용히 죽은 것과 진짜 무거래를 구분할 수 없다.
    if not snapshot["topTickers"]:
        print("✗ 집계 결과가 0건이다 — 기존 스냅샷을 유지한다.", file=sys.stderr)
        return 1

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    c = snapshot["coverage"]
    print(
        f"\n✓ {OUT_PATH.relative_to(ROOT)}\n"
        f"  공시 {c['filingsRead']}/{c['filingsTotal']}건 (스캔 제출 {c['filingsScanned']} 제외) · "
        f"거래 {c['transactions']} (지분성 {c['equityTransactions']}) · 의원 {c['members']} · 종목 {c['tickers']}\n"
        f"  창 {snapshot['window']['start']} ~ {snapshot['window']['end']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
