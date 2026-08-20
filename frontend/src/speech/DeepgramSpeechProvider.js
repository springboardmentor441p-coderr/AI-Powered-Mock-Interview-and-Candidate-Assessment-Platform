import {SpeechProvider} from './SpeechProvider';

const RECONNECT_DELAYS = [500, 1000, 2000];

function socketUrl(apiUrl, interviewId, token) {
  const base = new URL(apiUrl);
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  base.pathname = `/voice/deepgram/${interviewId}`;
  base.search = new URLSearchParams({token}).toString();
  return base.toString();
}

function preferredMimeType() {
  if (!window.MediaRecorder) return '';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return '';
}

/**
 * Streams microphone audio to SmartHire's authenticated backend WebSocket.
 * The backend, not the browser, holds the Deepgram API key.
 */
export class DeepgramSpeechProvider extends SpeechProvider {
  constructor({apiUrl, interviewId, token, ...handlers}) {
    super(handlers);
    this.apiUrl = apiUrl;
    this.interviewId = interviewId;
    this.token = token;
    this.socket = null;
    this.mediaStream = null;
    this.recorder = null;
    this.running = false;
    this.intentionalStop = false;
    this.reconnectAttempt = 0;
    this.reconnectTimer = null;
    this.keepAliveTimer = null;
    this.ready = false;
    this.shouldRecord = false;
  }

  async start() {
    if (this.running) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error('This browser does not support streaming microphone audio.');
    }
    this.running = true;
    this.intentionalStop = false;
    this.emit('onStatus', 'connecting');
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true},
      video: false,
    });
    this.startKeepAlive();
    this.connect();
  }

  connect() {
    if (!this.running) return;
    this.socket = new WebSocket(socketUrl(this.apiUrl, this.interviewId, this.token));
    this.socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.emit('onStatus', 'connected');
    };
    this.socket.onmessage = event => this.handleMessage(event.data);
    this.socket.onerror = () => this.emit('onError', new Error('Voice streaming connection failed.'));
    this.socket.onclose = () => {
      this.ready = false;
      this.stopRecorder();
      if (this.running && !this.intentionalStop) this.reconnect();
    };
  }

  startRecorder() {
    if (!this.mediaStream) return;
    if (this.recorder?.state === 'recording') return;
    if (this.recorder?.state === 'paused') {
      this.recorder.resume();
      return;
    }
    const mimeType = preferredMimeType();
    this.recorder = mimeType ? new MediaRecorder(this.mediaStream, {mimeType}) : new MediaRecorder(this.mediaStream);
    this.recorder.ondataavailable = event => {
      if (event.data.size && this.socket?.readyState === WebSocket.OPEN) this.socket.send(event.data);
    };
    this.recorder.onerror = () => this.emit('onError', new Error('Microphone recording failed.'));
    this.recorder.start(250);
  }

  stopRecorder() {
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    this.recorder = null;
  }

  handleMessage(rawMessage) {
    let message;
    try { message = JSON.parse(rawMessage); } catch { return; }
    if (message.type === 'ready') {
      this.ready = true;
      if (this.shouldRecord) this.resume();
      this.emit('onConnected');
      return;
    }
    if (message.type === 'speech_started') {
      this.emit('onSpeechStart');
      return;
    }
    if (message.type === 'transcript') {
      this.emit('onTranscript', message);
      if (message.speech_final) this.emit('onUtteranceEnd');
      return;
    }
    if (message.type === 'utterance_end') {
      this.emit('onUtteranceEnd');
      return;
    }
    if (message.type === 'error') this.emit('onError', new Error(message.message || 'Voice transcription failed.'));
  }

  reconnect() {
    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt += 1;
    this.emit('onStatus', 'reconnecting');
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }

  finalize() {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({type: 'finalize'}));
  }

  /** Pause capture between Nova and the candidate without closing Deepgram. */
  pause() {
    this.shouldRecord = false;
    if (this.recorder?.state === 'recording') this.recorder.pause();
  }

  /** Resume the existing microphone stream and existing WebSocket. */
  resume() {
    this.shouldRecord = true;
    if (!this.ready || this.socket?.readyState !== WebSocket.OPEN) return;
    this.startRecorder();
    this.emit('onReady');
  }

  startKeepAlive() {
    window.clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({type: 'keepalive'}));
    }, 8000);
  }

  stop() {
    this.intentionalStop = true;
    this.running = false;
    window.clearTimeout(this.reconnectTimer);
    window.clearInterval(this.keepAliveTimer);
    this.stopRecorder();
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({type: 'close'}));
    this.socket?.close();
    this.socket = null;
  }
}
