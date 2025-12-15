import { init, type InitOpts } from "./init";

declare global {
  interface Window {
    SmartServeWidget?: {
      init: (opts: InitOpts) => void;
    };
  }
}

// no-op placeholder until initFromScriptTag runs
window.SmartServeWidget = {
  init(opts: InitOpts) {
    init(opts);
  },
};
