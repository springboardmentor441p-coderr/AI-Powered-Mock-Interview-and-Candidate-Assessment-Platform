import {DeepgramSpeechProvider} from './DeepgramSpeechProvider';

/** The interview room depends on this factory, not a vendor implementation. */
export function createSpeechProvider(options) {
  return new DeepgramSpeechProvider(options);
}
