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

## API

```js
import { generateTickerJsonFiles } from './utils/TickerParser/index.mjs';

await generateTickerJsonFiles();
```
