(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('rxjs')) :
    typeof define === 'function' && define.amd ? define(['exports', 'rxjs'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.easytools = {}, global.rxjs));
})(this, (function (exports, rxjs) { 'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var rxjs__namespace = /*#__PURE__*/_interopNamespaceDefault(rxjs);

    exports.SocketCode = void 0;
    (function (SocketCode) {
      SocketCode[SocketCode["safe_close"] = 4000] = "safe_close";
      SocketCode[SocketCode["error_happen"] = 4001] = "error_happen";
    })(exports.SocketCode || (exports.SocketCode = {}));
    class Socket {
      url;
      socket;
      destory;
      reconnect;
      message;
      retryTimes_left;
      events;
      get obsMessage() {
        return this.message.asObservable();
      }
      get obsEvents() {
        return this.events.asObservable();
      }
      messageQueue = [];
      isConnected = false;
      constructor(url, option) {
        this.url = url;
        const {
          retry
        } = option ?? {};
        const {
          times = Infinity,
          intervalSec = 3
        } = retry ?? {};
        this.retryTimes_left = Math.abs(times);
        const retryInterval = Math.abs(isNaN(intervalSec) || isFinite(intervalSec) ? 3 : intervalSec) * 1000;
        this.destory = new rxjs__namespace.Subject();
        this.reconnect = new rxjs__namespace.Subject();
        this.message = new rxjs__namespace.Subject();
        this.events = new rxjs__namespace.Subject();
        this.socket = this.getSocketInstance();
        this.reconnect.pipe(rxjs__namespace.delay(retryInterval), rxjs__namespace.takeUntil(this.destory)).subscribe(() => {
          this.socket = this.getSocketInstance();
        });
      }
      getSocketInstance() {
        this.events.next(new CustomEvent("onGetInstance"));
        const socket = new WebSocket(this.url);
        socket.onopen = evt => {
          this.isConnected = true;
          this.events.next(evt);
          this.flushMessageQueue();
        };
        socket.onmessage = evt => {
          this.events.next(evt);
          this.message.next(evt.data);
        };
        socket.onerror = evt => {
          this.events.next(evt);
          this.socket.close(exports.SocketCode.error_happen);
        };
        socket.onclose = evt => {
          this.isConnected = false;
          this.events.next(evt);
          switch (evt.code) {
            case exports.SocketCode.safe_close:
              break;
            case exports.SocketCode.error_happen:
              if (this.retryTimes_left > 0) {
                this.reconnect.next();
                this.retryTimes_left -= 1;
              }
              break;
          }
        };
        return socket;
      }
      flushMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
          const message = this.messageQueue.shift();
          if (message) {
            this.socket.send(message);
          }
        }
      }
      onSendMessage(data) {
        if (this.isConnected) {
          this.events.next(new CustomEvent("onsend"));
          this.socket.send(data);
        } else {
          this.events.next(new CustomEvent("onqueue"));
          this.messageQueue.push(data);
        }
      }
      onDestory() {
        this.socket.close(exports.SocketCode.safe_close);
        this.destory.next();
        this.destory.complete();
        this.message.complete();
        this.events.complete();
      }
    }

    async function requestMediaStream(constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
      } catch (e) {
        return null;
      }
    }
    async function requestPermissions(constraints) {
      const stream = await requestMediaStream(constraints);
      stream?.getTracks().forEach(track => {
        track.stop();
      });
      return !!stream;
    }
    exports.PermissionType = void 0;
    (function (PermissionType) {
      PermissionType[PermissionType["unknow"] = 0] = "unknow";
      PermissionType[PermissionType["allowed"] = 1] = "allowed";
      PermissionType[PermissionType["rejected"] = 2] = "rejected";
    })(exports.PermissionType || (exports.PermissionType = {}));
    class MediaPermission {
      constraints;
      __state;
      stateSub;
      get obsState() {
        return this.stateSub.asObservable();
      }
      get state() {
        return this.__state;
      }
      set state(v) {
        if (v !== this.__state) {
          this.__state = v;
          this.stateSub.next(v);
        }
      }
      constructor(constraints) {
        this.constraints = constraints;
        this.stateSub = new rxjs__namespace.Subject();
        this.state = exports.PermissionType.unknow;
      }
      async requestMediaStream(constraints = this.constraints) {
        const stream = await requestMediaStream(constraints);
        this.state = stream !== null ? exports.PermissionType.allowed : exports.PermissionType.rejected;
        return stream;
      }
      async requestPermissions() {
        const boo = await requestPermissions(this.constraints);
        this.state = boo ? exports.PermissionType.allowed : exports.PermissionType.rejected;
        return boo;
      }
    }
    class SpeechManager {
      audioContext;
      currentNode;
      bufferQueue;
      constructor(audioContext) {
        this.audioContext = audioContext;
        this.bufferQueue = [];
        this.currentNode = undefined;
      }
      addBuffer(buffer) {
        this.bufferQueue.push(buffer);
      }
      addBufferByFloat32(float32, numberOfChannels = 1) {
        const length = float32.length;
        const sampleRate = this.audioContext.sampleRate;
        const audioBuffer = this.audioContext.createBuffer(numberOfChannels, length, sampleRate);
        for (let channel = 0; channel < numberOfChannels; channel++) {
          audioBuffer.copyToChannel(float32, channel);
        }
        this.addBuffer(audioBuffer);
      }
      startSpeech() {
        if (this.currentNode === undefined) {
          this.continue();
          return true;
        } else {
          return false;
        }
      }
      nextSpeech() {
        if (this.bufferQueue.length > 0) {
          this.clearNode();
          this.continue();
          return true;
        } else {
          return false;
        }
      }
      stopSpeech() {
        this.bufferQueue = [];
        this.clearNode();
        return true;
      }
      clearNode() {
        if (this.currentNode) {
          this.currentNode.onended = function () {};
          this.currentNode.stop();
          this.currentNode.disconnect();
          this.currentNode = undefined;
        }
      }
      continue() {
        const buffer = this.bufferQueue.shift();
        if (buffer) {
          this.currentNode = this.audioContext.createBufferSource();
          this.currentNode.buffer = buffer;
          this.currentNode.connect(this.audioContext.destination);
          const onended = this.continue.bind(this);
          this.currentNode.onended = onended;
          this.currentNode.start();
        } else {
          this.clearNode();
        }
      }
    }
    function whitenoise(audioContext) {
      const frameCount = audioContext.sampleRate * 2.0;
      const noiseBuffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
      const noiseArray = noiseBuffer.getChannelData(0);
      for (let i = 0; i < frameCount; i++) {
        noiseArray[i] = Math.random() * 2 - 1;
      }
      return noiseBuffer;
    }
    function between(input, max, min) {
      return Math.max(min, Math.min(input, max));
    }
    function int16ToFloat32(input) {
      const dataview = new DataView(input.buffer);
      const optput = [];
      for (let i = 0; i < input.length; i++) {
        const value = dataview.getInt16(i * 2, true) / 32768.0;
        optput.push(value);
      }
      return new Float32Array(optput);
    }
    function float32ToInt16(input) {
      const dataview = new DataView(input.buffer);
      const optput = [];
      for (let i = 0; i < input.length; i++) {
        const value = between(dataview.getFloat32(i * 4, true) * 32768, 32767, -32768);
        optput.push(value);
      }
      return new Int16Array(optput);
    }

    exports.MediaPermission = MediaPermission;
    exports.Socket = Socket;
    exports.SpeechManager = SpeechManager;
    exports.float32ToInt16 = float32ToInt16;
    exports.int16ToFloat32 = int16ToFloat32;
    exports.requestMediaStream = requestMediaStream;
    exports.requestPermissions = requestPermissions;
    exports.whitenoise = whitenoise;

}));
