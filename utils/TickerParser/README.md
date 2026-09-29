# Ticker Parser

NASDAQ Trader TXT 파일 2개를 다운로드해서 아래 형태의 Object JSON으로 변환합니다.

```json
{
  "SCHD": {
    "name": "Schwab U.S. Dividend Equity ETF",
    "issuer": "Charles Schwab"
  }
}
```

## Source URLs

- `https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt`
- `https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt`

## Run

```bash
node utils/TickerParser/generate.mjs
```

## Output

- `utils/TickerParser/output/nasdaq-listed.json`
- `utils/TickerParser/output/other-listed.json`
- `utils/TickerParser/output/etf-listed.json` — 원본의 `ETF` 열이 `Y` 인 종목만 `{ "SCHD": "Schwab US Dividend Equity ETF" }` 형태로 모은 목록(ETF 겹침 화면의 검색 원천). 두 원본을 모두 새로 받았을 때만 다시 쓰고, 한쪽이라도 실패하면 지난 파일을 그대로 둔다.

## API

```js
import { generateTickerJsonFiles, pickEtfTickers } from './utils/TickerParser/index.mjs';

await generateTickerJsonFiles();
```
