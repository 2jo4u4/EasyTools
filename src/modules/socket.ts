import * as rxjs from "rxjs";

export enum SocketCode {
  "safe_close" = 4000,
  "error_happen",
}

export class Socket<T = any> {
  private socket: WebSocket;
  private destory: rxjs.Subject<void>;
  private reconnect: rxjs.Subject<void>;
  private message: rxjs.Subject<T>;
  private retryTimes_left: number;
  private events: rxjs.Subject<Event>;

  get obsMessage() {
    return this.message.asObservable();
  }

  get obsEvents() {
    return this.events.asObservable();
  }

  private messageQueue: (string | ArrayBufferLike | Blob | ArrayBufferView)[] =
    [];
  private isConnected: boolean = false;

  constructor(
    public url: string,
    option?: { retry?: { times?: number; intervalSec?: number } }
  ) {
    const { retry } = option ?? {};
    const { times = Infinity, intervalSec = 3 } = retry ?? {};
    this.retryTimes_left = Math.abs(times);
    const retryInterval =
      Math.abs(isNaN(intervalSec) || isFinite(intervalSec) ? 3 : intervalSec) *
      1000;

    this.destory = new rxjs.Subject();
    this.reconnect = new rxjs.Subject();
    this.message = new rxjs.Subject();
    this.events = new rxjs.Subject();

    this.socket = this.getSocketInstance();

    this.reconnect
      .pipe(rxjs.delay(retryInterval), rxjs.takeUntil(this.destory))
      .subscribe(() => {
        this.socket = this.getSocketInstance();
      });
  }

  private getSocketInstance() {
    this.events.next(new CustomEvent("onGetInstance"));
    const socket = new WebSocket(this.url);

    socket.onopen = (evt) => {
      this.isConnected = true;
      this.events.next(evt);
      this.flushMessageQueue();
    };
    socket.onmessage = (evt) => {
      this.events.next(evt);
      this.message.next(evt.data);
    };
    socket.onerror = (evt) => {
      this.events.next(evt);
      this.socket.close(SocketCode.error_happen);
    };
    socket.onclose = (evt) => {
      this.isConnected = false;
      this.events.next(evt);
      switch (evt.code) {
        case SocketCode.safe_close:
          break;

        case SocketCode.error_happen:
          if (this.retryTimes_left > 0) {
            this.reconnect.next();
            this.retryTimes_left -= 1;
          }
          break;
        default:
          break;
      }
    };

    return socket;
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.send(message);
      }
    }
  }

  public onSendMessage(
    data: string | ArrayBufferLike | Blob | ArrayBufferView
  ) {
    if (this.isConnected) {
      this.events.next(new CustomEvent("onsend"));
      this.socket.send(data);
    } else {
      this.events.next(new CustomEvent("onqueue"));
      this.messageQueue.push(data);
    }
  }

  public onDestory() {
    this.socket.close(SocketCode.safe_close);
    this.destory.next();
    this.destory.complete();
    this.message.complete();
    this.events.complete();
  }
}
