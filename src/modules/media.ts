import * as rxjs from "rxjs";

export async function requestMediaStream(constraints?: MediaStreamConstraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (e) {
    return null;
  }
}

export async function requestPermissions(constraints?: MediaStreamConstraints) {
  const stream = await requestMediaStream(constraints);
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
  return !!stream;
}

export enum PermissionType {
  "unknow",
  "allowed",
  "rejected",
}

export class MediaPermission {
  private __state!: PermissionType;
  private stateSub: rxjs.Subject<PermissionType>;

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

  constructor(private constraints?: MediaStreamConstraints) {
    this.stateSub = new rxjs.Subject();
    this.state = PermissionType.unknow;
  }

  public async requestMediaStream(constraints = this.constraints) {
    const stream = await requestMediaStream(constraints);
    this.state =
      stream !== null ? PermissionType.allowed : PermissionType.rejected;
    return stream;
  }

  public async requestPermissions() {
    const boo = await requestPermissions(this.constraints);
    this.state = boo ? PermissionType.allowed : PermissionType.rejected;
    return boo;
  }
}

export class SpeechManager {
  private currentNode?: AudioBufferSourceNode;
  private bufferQueue: AudioBuffer[];

  constructor(public audioContext: AudioContext) {
    this.bufferQueue = [];
    this.currentNode = undefined;
  }

  public addBuffer(buffer: AudioBuffer) {
    this.bufferQueue.push(buffer);
  }

  public addBufferByFloat32(float32: Float32Array, numberOfChannels = 1) {
    const length = float32.length;
    const sampleRate = this.audioContext.sampleRate;

    const audioBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      length,
      sampleRate
    );
    for (let channel = 0; channel < numberOfChannels; channel++) {
      audioBuffer.copyToChannel(float32, channel);
    }

    this.addBuffer(audioBuffer);
  }

  public startSpeech() {
    if (this.currentNode === undefined) {
      this.continue();
      return true;
    } else {
      return false;
    }
  }

  public nextSpeech() {
    if (this.bufferQueue.length > 0) {
      this.clearNode();
      this.continue();
      return true;
    } else {
      return false;
    }
  }

  public stopSpeech() {
    this.bufferQueue = [];
    this.clearNode();
    return true;
  }

  private clearNode() {
    if (this.currentNode) {
      this.currentNode.onended = function () {};
      this.currentNode.stop();
      this.currentNode.disconnect();
      this.currentNode = undefined;
    }
  }

  private continue() {
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

export function whitenoise(audioContext: AudioContext) {
  const frameCount = audioContext.sampleRate * 2.0;

  const noiseBuffer = audioContext.createBuffer(
    1,
    frameCount,
    audioContext.sampleRate
  );

  const noiseArray = noiseBuffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    noiseArray[i] = Math.random() * 2 - 1;
  }

  return noiseBuffer;
}

function between(input: number, max: number, min: number) {
  return Math.max(min, Math.min(input, max));
}

export function int16ToFloat32(input: Int16Array) {
  const dataview = new DataView(input.buffer);
  const optput: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const value = dataview.getInt16(i * 2, true) / 32768.0;
    optput.push(value);
  }

  return new Float32Array(optput);
}

export function float32ToInt16(input: Float32Array) {
  const dataview = new DataView(input.buffer);
  const optput: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const value = between(
      dataview.getFloat32(i * 4, true) * 32768,
      32767,
      -32768
    );
    optput.push(value);
  }

  return new Int16Array(optput);
}
