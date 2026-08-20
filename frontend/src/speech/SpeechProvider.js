/**
 * Transport-agnostic speech input contract for the interview room.
 *
 * Providers emit recognition events only. They never call the interview API or
 * decide when an answer is accepted; that remains InterviewRoom's job.
 */
export class SpeechProvider {
  constructor(handlers = {}) {
    this.handlers = handlers;
  }

  emit(name, payload) {
    this.handlers[name]?.(payload);
  }

  // Implemented by concrete providers.
  async start() { throw new Error('SpeechProvider.start() must be implemented.'); }
  stop() {}
  dispose() { this.stop(); }
}
