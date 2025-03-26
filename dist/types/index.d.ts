import * as rxjs from 'rxjs';

declare enum SocketCode {
    "safe_close" = 4000,
    "error_happen" = 4001
}
declare class Socket<T = any> {
    url: string;
    private socket;
    private destory;
    private reconnect;
    private message;
    private retryTimes_left;
    private events;
    get obsMessage(): rxjs.Observable<T>;
    get obsEvents(): rxjs.Observable<Event>;
    private messageQueue;
    private isConnected;
    constructor(url: string, option?: {
        retry?: {
            times?: number;
            intervalSec?: number;
        };
    });
    private getSocketInstance;
    private flushMessageQueue;
    onSendMessage(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
    onDestory(): void;
}

declare function requestMediaStream(constraints?: MediaStreamConstraints): Promise<MediaStream | null>;
declare function requestPermissions(constraints?: MediaStreamConstraints): Promise<boolean>;
declare enum PermissionType {
    "unknow" = 0,
    "allowed" = 1,
    "rejected" = 2
}
declare class MediaPermission {
    private constraints?;
    private __state;
    private stateSub;
    get obsState(): rxjs.Observable<PermissionType>;
    get state(): PermissionType;
    set state(v: PermissionType);
    constructor(constraints?: MediaStreamConstraints | undefined);
    requestMediaStream(constraints?: MediaStreamConstraints | undefined): Promise<MediaStream | null>;
    requestPermissions(): Promise<boolean>;
}
declare class SpeechManager {
    audioContext: AudioContext;
    private currentNode?;
    private bufferQueue;
    constructor(audioContext: AudioContext);
    addBuffer(buffer: AudioBuffer): void;
    addBufferByFloat32(float32: Float32Array, numberOfChannels?: number): void;
    startSpeech(): boolean;
    nextSpeech(): boolean;
    stopSpeech(): boolean;
    private clearNode;
    private continue;
}
declare function whitenoise(audioContext: AudioContext): AudioBuffer;
declare function int16ToFloat32(input: Int16Array): Float32Array<ArrayBuffer>;
declare function float32ToInt16(input: Float32Array): Int16Array<ArrayBuffer>;

export { MediaPermission, PermissionType, Socket, SocketCode, SpeechManager, float32ToInt16, int16ToFloat32, requestMediaStream, requestPermissions, whitenoise };
