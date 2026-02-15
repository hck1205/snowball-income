import ReactDOM from "react-dom/client";
import AppRouter from "@/router";
import { applySeoRuntimeMetadata, initGoogleAnalytics } from "@/shared/lib/analytics";

applySeoRuntimeMetadata();
initGoogleAnalytics();

ReactDOM.createRoot(document.getElementById("root")!).render(<AppRouter />);
