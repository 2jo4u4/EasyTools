# Feature

This project is simple and it wrap some web api.

1. websocket
1. media permissions

---

# Requirement

1. [RxJS](https://rxjs.dev/) version >= v7.8.2

---

# Installation

```sh
npm install @2jo4u4/easytools
// or
yarn add @2jo4u4/easytools
```

---

# Feature

1. Socket
1. Media

----

## Socket Modules


Socket class defindefinition

|property name|desc|
|--|--|
|obsMessage|websocket event(only onmessage)|
|obsEvents|websocket event and some custom event by project|

|method name|desc|
|--|--|
|onSendMessage|send your message(if connection is not complete, it will queue your message, and send a custom event. finally connection is done and send all messages)|
|onDestory|close connect and destory instance|

> custom event by project:
> 1. "onGetInstance": when your new a instance or auto retry
> 1. "onsend": every time your exec "onSendMessage"(when socket connected)
> 1. "onqueue": like "onsend" but it will trigger when connection isn't done.

----

## Media Modules

|function name|desc|
|--|--|
|requestMediaStream|get device stream|
|requestPermissions|get device permission|
|whitenoise|generate a audio of 2 sec|
|int16ToFloat32|transfer data|
|float32ToInt16|transfer data|

> PCM formation in JavaScript
> We can use Int16Array to store

> If you want to play audio
> We neet to get AudioBuffer
> AudioBuffer can use Float32Array to get

Please see [speech example](./example/speechManager.html)

SpeechManager definition

|property or method|desc|
|--|--|
|audioContext|[AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)|
|addBuffer|add audio|
|addBufferByFloat32|add audio by float32 array|
|startSpeech|play audio, if playing and it won't work|
|nextSpeech|stop current audio and play next|
|stopSpeech|stop current audio and clean audio queue|

MediaPermission definition
|property or method|desc|
|--|--|
|obsState|obsever permission and notify|
|requestMediaStream|get device stream|
|requestPermissions|get device permission|

---

# ES modules Usage

Some example

```js

import { SpeechManager } from "@2jo4u4/easytools";

const audioContext = new AudioContext();
const speech = new SpeechManager(audioContext)

const inputField = document.querySelector("input");
inputField.onchange = function onchange() {
    for (let index = 0; index < this.files.length; index++) {
        const file = this.files[index];

        const reader = new FileReader();

        reader.onload = function (event) {
        const arrayBuffer = event.target.result;
        audioContext.decodeAudioData(arrayBuffer, function (audioBuffer) {
            speech.addBuffer(audioBuffer);
            const isSuccess = speech.startSpeech();
        });
        };
        reader.readAsArrayBuffer(file);
    }
};

```

# More Example

[See example folder](./example/)