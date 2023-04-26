const WebAssembly = WXWebAssembly;
WebAssembly.RuntimeError = Error;

const Buffer = {
  alloc: function (bufsize) {
      return new ArrayBuffer(bufsize);
  },
  from: function (buffer) {
      return buffer;
  }
};

const crypto = {
  getRandomValues: function(arr) {
      for (var i = 0; i < arr.length; i++) {
          arr[i] = (Math.random() * 256) | 0;
      }
  }
}

const __dirname = "";

// 微信中仅支持代码包绝对路径
var WASM_FILE_PATH = "/assets/lg2.wasm.br";

/** 用来替换 Emscripten的`getBinaryPromise`方法来适配微信小程序的Wasm模块的本地文件加载模式 */
function getWasmFilePath() {
  return Promise.resolve(WASM_FILE_PATH);
}

Module.getWasmFilePath = getWasmFilePath;

Module.printErr = function(...args) {
  if (Reflect.has(Module, "onWasmError")) {
      Module.onWasmError(...args);
  } else {
      console.warn(...args);
  }
}

