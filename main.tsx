// Pretendard 셀프호스팅. CDN이 아니라 npm 패키지에서 직접 번들한다(성능·프라이버시).
// 동적 서브셋(unicode-range 92분할)이라 브라우저는 실제로 그리는 글자에 해당하는 조각만 내려받는다.
// 통짜 가변 폰트(PretendardVariable.woff2)는 2.05MB라 초기 로딩에 쓰기엔 너무 크다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import ReactDOM from "react-dom/client";
import AppRouter from "@/router";
import { applySeoRuntimeMetadata, initGoogleAnalytics } from "@/shared/lib/analytics";

applySeoRuntimeMetadata();
initGoogleAnalytics();

ReactDOM.createRoot(document.getElementById("root")!).render(<AppRouter />);
