import { init } from "./init";
import { initFromScriptTag } from "./initFromScriptTag";
import type { InitOpts } from "./init";

declare global {
  interface Window {
    SmartServeWidget?: {
      init: (opts: InitOpts) => void;
    };
  }
}

// Auto-init when loaded via <script>
initFromScriptTag();

// Optional manual API (keeps flexibility)
window.SmartServeWidget = {
  init(opts: InitOpts) {
    init(opts);
  },
};
