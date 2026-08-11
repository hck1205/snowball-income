#!/usr/bin/env python
"""대한민국 국회의원 주식 보유 공개(정기재산변동신고) 수집기 — `shared/constants/koreaAssemblyStocks/` 를 만든다.

```sh
npm run korea:assembly                  # 올해 공보에서 재산공개 호를 찾아 스냅샷 갱신
npm run korea:assembly -- --check       # 새 공개가 떴는지만 본다(목록 1콜, 파일 안 쓴다)
python tools/koreaAssembly/harvest.py --year 2026 --pdf ./local.pdf   # 받아 둔 PDF 로 재파싱
```

## 🔴 왜 미국 화면과 **다른 페이지**인가 — 자료의 성질이 다르다

미 하원 PTR 은 *거래가 있을 때마다* 내는 신고라 "언제 사고팔았나"를 안다. 한국 공직자윤리법의
정기재산변동신고는 *1년에 한 번* 내는 **보유 현황**이다. 둘을 한 표에 담으면 어느 쪽도 참이 아닌
숫자가 나온다. 그래서 수집기도 화면도 나눠 두었다.

## 🔴 이 자료가 **말할 수 없는 것** (화면이 반드시 말해야 하는 것)

1. **연 1회 스냅샷이고, 기준일은 전년 12월 31일이다.** 공개는 이듬해 3월 말이라 볼 때는 이미 낡았다.
2. **지금 보유 중이라는 뜻이 아니다.** 국회의원은 직무 관련 주식에 매각·백지신탁 의무가 있고,
   기준일 이후 처분됐을 수 있다.
3. **종목별 평가액이 없다.** 공보는 증권을 **소계 금액**으로만 적고 명세는 "종목 N주"로 준다 —
   그래서 이 스냅샷에 종목별 금액 필드가 아예 없다. 주식 수를 금액으로 바꿔 적지 마라.
4. **본인 것이 아닐 수 있다.** 배우자·직계존비속 보유가 함께 공개된다 — 관계를 그대로 남긴다.
5. **국회 사무처 고위공직자가 섞여 있다.** 같은 공보에 수석전문위원·처장 등이 함께 실린다.
   이 수집기는 **직위가 의장·부의장·국회의원인 사람만** 집계한다(`MEMBER_POSITIONS`).
6. **0주는 보유가 아니다.** `0주(300주 감소)` 는 전량 매도다 — 보유에서 빼고 따로 센다.

## 실측으로 알아낸 함정 넷 (2026-08-05, 제2026-54호 893쪽)

1. **국회 홈페이지는 User-Agent 가 없으면 400 을 준다.** 브라우저 UA 를 반드시 보낸다.
2. **증권 종류 토큰을 좁게 잡으면 채권이 주식으로 샌다.** `국채`·`회사채`·`기타(채권)` 를 목록에
   넣지 않으면 상장주식 구간이 다음 종류까지 삼켜 `T4.62505/15/54`(미 국채) 같은 것이 종목이 된다.
3. **주식 수에 소수점이 있다.** 소수점 매수 서비스 때문에 `0.031652주 감소`·`137,065.395498주` 가
   실제로 나온다. `[\\d,]+` 로 받으면 조용히 잘린다.
4. **표기가 제각각이다.** 같은 회사를 `엔비디아`·`NVIDIACORP`, `삼성전자`·`삼성전자보통주` 로 쓴다.
   규칙(보통주 접미 제거)과 **명시적 별칭**으로만 합치고, **클래스가 불분명하면 합치지 않는다** —
   `ALPHABETINC` 은 A 주인지 C 주인지 공보가 말해 주지 않아 짐작하면 그 순간 틀린다.
   ⚠ 우선주(`삼성전자우`)는 보통주와 **다른 종목**이라 절대 합치지 않는다.
"""

import argparse
import collections
import datetime as dt
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_PATH = ROOT / "shared/constants/koreaAssemblyStocks/koreaAssemblyStocks.generated.json"

# 🔴 UA 가 없으면 국회 홈페이지가 400 을 준다(2026-08-05 실측).
UA = "Mozilla/5.0 (compatible; HungryHippo/1.0; +https://hungry-hippo.xyz)"
BASE = "https://www.assembly.go.kr"
LIST_URL = BASE + "/portal/cnts/cntsNamgzn/gongbo.do?cntsDivCd=NAMGZN&pdfClsCd=CPR&menuNo=601019"
FILE_URL = BASE + "/portal/cmmn/file/fileDown.do?atchFileId={file_id}&fileSn=1"

# 집계 대상 직위. 같은 공보에 실리는 국회 사무처 고위공직자는 의원이 아니라서 뺀다.
MEMBER_POSITIONS = ("국회의장", "국회부의장", "국회의원")

# 새 스냅샷의 의원 수가 직전의 이 비율 밑으로 떨어지면 덮어쓰지 않는다.
# 300석 정원에서 사퇴·보궐로 오가는 폭은 한 자릿수다 — 0.7 은 그 열 배 여유이면서
# "절반만 읽힌 파싱"(가장 흔한 고장 모습)은 확실히 잡는 선이다.
SHRINK_FLOOR = 0.7

# 사람 한 명의 시작 — `소속 국회 직위 국회의원 성명 홍길동 (단위 : 천원)`.
HEAD_RE = re.compile(r"소속\s*국회\s*직위\s*([^\s]{1,20}?)\s*성명\s*([가-힣]{2,5})\s*\(단위")

# 증권 소계 블록. 다음 `▶` 또는 `총 계` 에서 끊는다.
SECURITIES_RE = re.compile(r"▶\s*증권\s*\(소계\)(.*?)(?=▶|총\s*계|$)", re.S)

RELATIONS = ("본인", "배우자", "장남", "차남", "삼남", "장녀", "차녀", "삼녀",
             "조부", "조모", "며느리", "사위", "부", "모")
# 🔴 채권류를 빠짐없이 적는 것이 요점이다 — 빠지면 그 종류가 상장주식 구간에 섞여 들어온다.
KINDS = ("비상장주식", "상장주식", "기타(주식)", "기타(채권)", "기타(증권)", "수익증권",
         "출자지분", "국공채", "국채", "지방채", "금융채", "회사채", "채권", "펀드",
         "투자신탁", "예탁금")

SEGMENT_RE = re.compile(
    "(" + "|".join(RELATIONS) + ")(" + "|".join(re.escape(k) for k in sorted(KINDS, key=len, reverse=True)) + ")"
)
NUMBER = r"\d[\d,]*(?:\.\d+)?"
HOLDING_RE = re.compile(rf"([^,\n]+?)\s*({NUMBER})\s*주(?:\s*\(\s*({NUMBER})\s*주\s*(증가|감소)\s*\))?")

# 페이지 머리말·쪽번호·추출 마커. 남겨 두면 종목명에 달라붙는다.
NOISE_RE = re.compile(r"통\s*권\s*제\d{4}-\d+(?:\(\d\))?호[^\n]*|^\s*-\s*\d+\s*-\s*$", re.M)

# 같은 회사의 다른 표기를 합친다. 값은 (대표 표기, 티커 또는 None).
# 🔴 여기 없는 이름은 **합치지 않는다.** 짐작 병합은 순위를 조용히 틀리게 만든다.
ALIASES = {
    "NVIDIACORP": ("엔비디아", "NVDA"),
    "엔비디아": ("엔비디아", "NVDA"),
    "TESLAINC": ("테슬라", "TSLA"),
    "테슬라": ("테슬라", "TSLA"),
    "APPLEINC": ("애플", "AAPL"),
    "애플": ("애플", "AAPL"),
    "MICROSOFTCORP": ("마이크로소프트", "MSFT"),
    "MICROSOFTORD": ("마이크로소프트", "MSFT"),
    "마이크로소프트": ("마이크로소프트", "MSFT"),
    "PALANTIRTECHINC": ("팔란티어테크", "PLTR"),
    "팔란티어테크": ("팔란티어테크", "PLTR"),
    "METAPLATFORMSINC": ("메타플랫폼스", "META"),
    "ORACLECORP": ("오라클", "ORCL"),
    "오라클": ("오라클", "ORCL"),
    "브로드컴": ("브로드컴", "AVGO"),
    "아마존닷컴": ("아마존닷컴", "AMZN"),
    "알파벳ClassA": ("알파벳 A", "GOOGL"),
    "ALPHABETCLAORD": ("알파벳 A", "GOOGL"),
    "알파벳A": ("알파벳 A", "GOOGL"),
    "알파벳ClassC": ("알파벳 C", "GOOG"),
    "알파벳C": ("알파벳 C", "GOOG"),
    "TSMCADR": ("TSMC(ADR)", "TSM"),
    "TSMC(ADR": ("TSMC(ADR)", "TSM"),
    "TSMC(ADR)": ("TSMC(ADR)", "TSM"),
    "NIKEINC": ("나이키", "NKE"),
    "NIKECLBORD": ("나이키 B", None),
    "COCA-COLACO": ("코카콜라", "KO"),
    "JPMORGANCHASEORD": ("JP모간체이스", "JPM"),
    "REALTYINCOMEREITORD": ("리얼티인컴", "O"),
    "리얼티인컴": ("리얼티인컴", "O"),
    "SCHWABUSDIVIDENDEQUITYETF": ("SCHD", "SCHD"),
    "SchwabUSDividendEquityETF": ("SCHD", "SCHD"),
    "SPDRS&P500ETFTrust": ("SPY", "SPY"),
    "MODERNAINC": ("모더나", "MRNA"),
    "UBERTECHNOLOGIESINC": ("우버", "UBER"),
    "ADVANCEDMICRODEVICESINC": ("AMD", "AMD"),
    "에스케이하이닉스": ("SK하이닉스", None),
    "삼성전자보통주": ("삼성전자", None),
    "POSCO홀딩스": ("포스코홀딩스", None),
    "포스코홀딩스": ("포스코홀딩스", None),
}


# 릴레이 주소(`--relay`). 비어 있으면 국회 홈페이지를 **직접** 부른다(로컬 기본값).
RELAY_BASE = ""


def relay_url(url: str) -> str:
    """직접 부를 주소 → 릴레이 경유 주소. 릴레이가 설정돼 있지 않으면 그대로 돌려준다.

    ## 🔴 왜 릴레이가 필요한가
    이 수집기는 로컬(한국)에서는 정상인데 **GitHub Actions(미국 러너)에서 `Connection timed out`**
    으로 죽는다(2026-08-07 부터 매일 실패). 국가 차단이 아니라 그 경로에서만 막힌다 —
    우리 함수가 도는 싱가포르에서는 200/1.6초로 열린다(2026-08-12 실측).
    그래서 워크플로에서만 `--relay https://hungry-hippo.xyz/api/unfurl` 로 한 홉을 우회한다.

    ⚠ 로컬 동작은 바뀌지 않는다 — 기본값이 직접 접속이다. 릴레이가 죽어도 사람이 손으로 돌릴 수 있다.
    ⚠ 릴레이가 허용하는 경로는 **둘**뿐이다(공보 목록 / 첨부 다운로드). 여기서 부르는 경로를 바꾸면
      `server/handlers/Unfurl/Unfurl.ts` 의 화이트리스트도 함께 열어야 한다.
    """
    if not RELAY_BASE:
        return url

    parts = urllib.parse.urlsplit(url)
    head = urllib.parse.urlencode({"relay": "assembly", "path": parts.path})
    tail = f"&{parts.query}" if parts.query else ""
    return f"{RELAY_BASE}?{head}{tail}"


def fetch(url: str, tries: int = 3) -> bytes:
    """국회 홈페이지에서 받는다. UA 를 반드시 실어야 한다."""
    last = None
    target = relay_url(url)
    for attempt in range(tries):
        try:
            request = urllib.request.Request(target, headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=180) as response:
                return response.read()
        except Exception as error:  # noqa: BLE001 — 네트워크 실패는 종류를 가리지 않고 재시도한다.
            last = error
    raise RuntimeError(f"받지 못했다: {url} ({last})")


def find_disclosure_issue(year: int):
    """그 해 공보 목록에서 **제목에 '재산공개' 가 들어간 호**를 전부 찾는다.

    🔴 이 함수가 자동화의 핵심이다. 공개일은 해마다 바뀌지만(2026-03-26 · 2025-03-27 · 2024-03-28)
    제목 규칙은 `국회공보 제2026-54호(정기재산공개)` 로 일정하다. 날짜를 못 박으면 매년 어긋난다.

    ## 🔴 공개가 연 1회가 아닌 해가 있다 (2026-08-05 실측)
    총선 다음 8월에 **신규·퇴직 의원만의 별도 공개**가 붙는다:
    `제2020-98호(21신규20퇴직의원재산공개)` · `제2024-107호(22신규 21퇴직 의원 재산공개)`.
    그래서 조회 창을 **연중**으로 열어 둔다(요청 수는 1건 그대로다).

    ⚠ 그런데 이 호를 "가장 최근 재산공개"라고 집어 쓰면 **300명 스냅샷이 20여 명으로 덮인다.**
    그래서 `kind` 로 갈라 돌려주고, 고르는 것은 호출부의 몫이다 — 여기서 섞지 않는다.
    """
    # ⚠ 목록은 기본 10건씩 끊어 준다(`pageUnit`). 연중이면 150~220건이라 한 번에 받는 편이
    # 페이지를 돌며 여러 번 부르는 것보다 싸고 덜 깨진다. 400 은 그 두 배 여유다.
    query = f"&beginNotiDt={year}-01-01&endNotiDt={year}-12-31&pageUnit=400&pageIndex=1"
    html = fetch(LIST_URL + query).decode("utf-8", errors="replace")
    rows = []
    for match in re.finditer(r"goView\('(\d+)'\);\">\s*([^<]+?)\s*</a>(.*?)</tr>", html, re.S):
        _uid, title, rest = match.groups()
        if "재산공개" not in title.replace(" ", ""):
            continue
        # 🔴 `atchFileId` 를 16진수로 좁히지 마라(2026-08-05 실측). 2024년 이후 호는
        # `0b500c66…`(hex)지만 2020년 호는 `s0dj2q0sl24eo8i90ke4uadobftmufw5` 로 hex 가 아니다.
        # 좁게 잡으면 옛 공보를 **조용히 건너뛰고** "공개가 아직 없다"고 보고한다 —
        # 크론이 정상으로 취급하는 가장 위험한 실패 모습이다.
        file_match = re.search(r"atchFileId=([0-9a-zA-Z]+)&amp;fileSn=\d+", rest)
        date_match = re.search(r'<td title="(\d{4}-\d{2}-\d{2})">', rest)
        if not file_match or not date_match:
            # 제목은 재산공개인데 받을 길이 없다 — 목록 서식이 바뀐 것이다. 삼키지 않고 알린다.
            print(f"[korea] ⚠ 재산공개 호를 찾았지만 다운로드 링크를 못 읽었다: {title}", file=sys.stderr)
            continue
        issue = re.search(r"제(\d{4}-\d+)호", title)
        rows.append({
            "title": title,
            "issueNo": issue.group(1) if issue else "",
            "publishedAt": date_match.group(1),
            "fileId": file_match.group(1),
            # 전원이 실리는 정기공개인가, 몇 명짜리 보충 공개인가.
            "kind": "regular" if "정기재산공개" in title.replace(" ", "") else "supplementary",
        })
    rows.sort(key=lambda row: row["publishedAt"])
    return rows


def extract_text(pdf_bytes: bytes) -> str:
    from pypdf import PdfReader
    import io

    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return NOISE_RE.sub(" ", "\n".join(pages))


def normalize_issuer(raw: str):
    """표기를 다듬어 (대표 표기, 티커) 로 만든다."""
    name = re.sub(r"^[\d,.\s]+", "", raw).strip(" ,·")
    name = re.sub(r"\s+", "", name)
    if name in ALIASES:
        return ALIASES[name]
    # 규칙 하나만 자동 적용한다 — `보통주` 접미. 🔴 `우`(우선주)는 다른 종목이라 건드리지 않는다.
    if name.endswith("보통주") and len(name) > 3:
        stripped = name[:-3]
        if stripped in ALIASES:
            return ALIASES[stripped]
        return (stripped, None)
    return (name, None)


def parse(text: str):
    """공보 전문 → 의원별 상장주식 보유 행."""
    marks = list(HEAD_RE.finditer(text))
    people, holdings, fully_sold = [], [], 0

    for index, mark in enumerate(marks):
        end = marks[index + 1].start() if index + 1 < len(marks) else len(text)
        position, name, body = mark.group(1), mark.group(2), text[mark.end():end]
        people.append(position)
        if position not in MEMBER_POSITIONS:
            continue

        for section in SECURITIES_RE.finditer(body):
            chunk = section.group(1)
            segments = list(SEGMENT_RE.finditer(chunk))
            for seg_index, segment in enumerate(segments):
                if segment.group(2) != "상장주식":
                    continue
                seg_end = segments[seg_index + 1].start() if seg_index + 1 < len(segments) else len(chunk)
                for item in HOLDING_RE.finditer(chunk[segment.end():seg_end]):
                    issuer, ticker = normalize_issuer(item.group(1))
                    if not issuer or len(issuer) > 30:
                        continue
                    shares = float(item.group(2).replace(",", ""))
                    if shares == 0:  # 🔴 전량 매도. 보유가 아니다.
                        fully_sold += 1
                        continue
                    holdings.append({
                        "member": name,
                        "position": position,
                        "relation": segment.group(1),
                        "issuer": issuer,
                        "ticker": ticker,
                        "shares": shares,
                    })
    return people, holdings, fully_sold


def aggregate(people, holdings, fully_sold, *, issue, top_issuers: int, top_members: int):
    members_total = sum(1 for position in people if position in MEMBER_POSITIONS)

    by_issuer = collections.defaultdict(lambda: {"members": set(), "shares": 0.0, "ticker": None})
    for row in holdings:
        bucket = by_issuer[row["issuer"]]
        bucket["members"].add(row["member"])
        bucket["shares"] += row["shares"]
        bucket["ticker"] = bucket["ticker"] or row["ticker"]

    issuer_rows = sorted(
        (
            {
                "issuer": issuer,
                "ticker": data["ticker"],
                "memberCount": len(data["members"]),
                "shares": round(data["shares"], 6),
                "members": sorted(data["members"])[:6],
            }
            for issuer, data in by_issuer.items()
        ),
        key=lambda row: (-row["memberCount"], -row["shares"], row["issuer"]),
    )

    by_member = collections.defaultdict(lambda: {"position": "", "issuers": {}, "relations": set()})
    for row in holdings:
        bucket = by_member[row["member"]]
        bucket["position"] = row["position"]
        bucket["relations"].add(row["relation"])
        bucket["issuers"][row["issuer"]] = bucket["issuers"].get(row["issuer"], 0.0) + row["shares"]

    member_rows = sorted(
        (
            {
                "name": name,
                "position": data["position"],
                "issuerCount": len(data["issuers"]),
                "relations": sorted(data["relations"]),
                "topIssuers": [
                    issuer for issuer, _ in sorted(data["issuers"].items(), key=lambda kv: -kv[1])[:5]
                ],
            }
            for name, data in by_member.items()
        ),
        key=lambda row: (-row["issuerCount"], row["name"]),
    )

    published_year = int(issue["publishedAt"][:4])
    return {
        "generatedAt": dt.date.today().isoformat(),
        "source": f"{issue['title']} — 국회사무처 · 국회공직자윤리위원회",
        "sourceUrl": LIST_URL,
        "issueNo": issue["issueNo"],
        "issueTitle": issue["title"],
        "publishedAt": issue["publishedAt"],
        # 공직자윤리법의 정기재산변동신고 기준일은 **전년 12월 31일**이다(공개는 이듬해 3월).
        "asOfDate": f"{published_year - 1}-12-31",
        "coverage": {
            "peopleTotal": len(people),
            "membersTotal": members_total,
            "membersWithStocks": len({row["member"] for row in holdings}),
            "holdings": len(holdings),
            "issuers": len(by_issuer),
            "fullySold": fully_sold,
        },
        "topIssuers": issuer_rows[:top_issuers],
        "topMembers": member_rows[:top_members],
    }


def read_snapshot():
    try:
        return json.loads(OUT_PATH.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001 — 없거나 깨졌으면 "기준본 없음"으로 진행한다.
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=None, help="공보를 찾을 연도(기본: 올해)")
    parser.add_argument("--check", action="store_true", help="새 공개가 있는지만 보고 끝낸다")
    parser.add_argument("--pdf", default=None, help="이미 받아 둔 PDF 로 파싱만 다시 한다")
    parser.add_argument("--top-issuers", type=int, default=60)
    parser.add_argument("--top-members", type=int, default=60)
    parser.add_argument("--force", action="store_true", help="급감 가드를 넘겨 덮어쓴다(사람이 확인한 뒤에만)")
    parser.add_argument(
        "--relay",
        default="",
        help="국회 홈페이지를 직접 부르지 않고 이 엔드포인트를 경유한다(예: https://hungry-hippo.xyz/api/unfurl). "
        "GitHub 러너에서 국회 사이트가 열리지 않아 필요하다 — 근거는 relay_url() 주석.",
    )
    args = parser.parse_args()

    global RELAY_BASE
    RELAY_BASE = args.relay.strip()
    if RELAY_BASE:
        print(f"[korea] 릴레이 경유: {RELAY_BASE}")

    year = args.year or dt.date.today().year
    stored = read_snapshot()

    issues = find_disclosure_issue(year)

    # 🔴 **정기공개만 스냅샷의 재료다.** 신규·퇴직 보충 공개(총선 다음 8월)는 몇 명짜리라,
    # 그걸로 덮어쓰면 300명 표가 20여 명으로 쪼그라든다. 놓치지는 않되 조용히 쓰지도 않는다 —
    # 발견하면 사람에게 알린다(워크플로 로그에 남고, 병합이 필요해지면 그때 만든다).
    for extra in (row for row in issues if row["kind"] == "supplementary"):
        print(f"[korea] ⚠ 보충 공개가 있다(자동 반영하지 않는다): {extra['title']} ({extra['publishedAt']})")

    regular = [row for row in issues if row["kind"] == "regular"]
    if not regular:
        # 🔴 3월 전에 도는 크론에서는 정상 상황이다 — 실패로 만들지 않는다.
        print(f"[korea] {year}년 정기재산공개 호가 아직 없다. 기존 스냅샷을 유지한다.")
        return 0

    issue = regular[-1]
    if stored and stored.get("issueNo") == issue["issueNo"] and not args.pdf:
        print(f"[korea] 새 공개 없음 ({issue['title']}).")
        return 0

    if args.check:
        print(f"[korea] 새 공개가 있다: {stored.get('issueNo') if stored else '(없음)'} → {issue['issueNo']}")
        return 0

    if args.pdf:
        pdf_bytes = Path(args.pdf).read_bytes()
    else:
        print(f"[korea] {issue['title']} ({issue['publishedAt']}) 를 받는다…")
        pdf_bytes = fetch(FILE_URL.format(file_id=issue["fileId"]))

    people, holdings, fully_sold = parse(extract_text(pdf_bytes))
    snapshot = aggregate(people, holdings, fully_sold, issue=issue,
                         top_issuers=args.top_issuers, top_members=args.top_members)

    # 🔴 0건이면 덮어쓰지 않는다 — 파서가 조용히 죽은 것과 진짜 무보유를 구분할 수 없다.
    if not snapshot["topIssuers"] or snapshot["coverage"]["membersTotal"] == 0:
        print("✗ 집계 결과가 0건이다 — 기존 스냅샷을 유지한다.", file=sys.stderr)
        return 1

    # 🔴 **확 줄어들면 덮어쓰지 않는다.** 의원 수는 300명 언저리에서 거의 안 움직인다(임기 중
    # 사퇴·보궐로 몇 명 오갈 뿐이다). 크게 준다는 것은 둘 중 하나다 — 공보 서식이 바뀌어 파서가
    # 절반만 읽었거나, 전원이 아닌 보충 공개를 잘못 집어 들었거나. 어느 쪽이든 사람이 봐야 한다.
    if stored and stored.get("coverage", {}).get("membersTotal", 0) > 0:
        before = stored["coverage"]["membersTotal"]
        after = snapshot["coverage"]["membersTotal"]
        if after < before * SHRINK_FLOOR and not args.force:
            print(
                f"✗ 의원 수가 {before} → {after} 로 급감했다({SHRINK_FLOOR:.0%} 미만) — 기존 스냅샷을 유지한다.\n"
                f"  공보 서식이 바뀌었거나 엉뚱한 호를 집었을 수 있다. 확인 후 정말 맞으면 --force 로 다시 돌려라.",
                file=sys.stderr,
            )
            return 1

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    coverage = snapshot["coverage"]
    print(
        f"\n✓ {OUT_PATH.relative_to(ROOT)}\n"
        f"  {issue['title']} · 기준일 {snapshot['asOfDate']}\n"
        f"  의원 {coverage['membersTotal']}명(공보 전체 {coverage['peopleTotal']}명) · "
        f"주식 보유 {coverage['membersWithStocks']}명 · 보유 {coverage['holdings']}건 · "
        f"종목 {coverage['issuers']}종 · 전량매도 {coverage['fullySold']}건"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
