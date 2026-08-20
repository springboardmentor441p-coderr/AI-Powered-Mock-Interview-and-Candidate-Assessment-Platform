import {useEffect, useRef, useState} from 'react';
import {api} from '../api/client';
import {useAuth} from '../context/AuthContext';
import {createSpeechProvider} from '../speech';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const labelFor = {
  READY: 'Ready to begin',
  AI_SPEAKING: 'Nova is speaking…',
  WAIT_FOR_AI_TO_FINISH: 'Waiting for Nova to finish…',
  MICROPHONE_STARTING: 'Preparing microphone…',
  LISTENING: '🎤 Listening…',
  CANDIDATE_SPEAKING: 'Listening to your answer…',
  SILENCE_DETECTION: 'Waiting for you to finish…',
  ANALYZING: 'Analyzing your answer…',
  FOLLOW_UP_REQUIRED: 'Nova needs more detail…',
  ANSWER_ACCEPTED: 'Answer accepted',
  AI_ACKNOWLEDGEMENT: 'Nova is responding…',
  NEXT_QUESTION: 'Preparing the next question…',
  COMPLETE: 'Interview complete',
  INCOMPLETE: 'Interview incomplete',
};
const visualState = state => ({AI_SPEAKING:'speaking', WAIT_FOR_AI_TO_FINISH:'speaking', MICROPHONE_STARTING:'thinking', LISTENING:'listening', CANDIDATE_SPEAKING:'listening', SILENCE_DETECTION:'listening', ANALYZING:'processing', FOLLOW_UP_REQUIRED:'thinking', AI_ACKNOWLEDGEMENT:'speaking', NEXT_QUESTION:'thinking'}[state] || '');

export default function InterviewRoom({onExit, settings}) {
  const {auth} = useAuth();
  const videoRef = useRef(null), streamRef = useRef(null), speechProviderRef = useRef(null), interviewRef = useRef(null), activeRef = useRef(false), phaseRef = useRef('READY'), turnInFlightRef = useRef(false), silenceTimerRef = useRef(null), countdownTimerRef = useRef(null), countdownDeadlineRef = useRef(null), timeExpiredRef = useRef(false), timeLimitEndingRef = useRef(false), transcriptRef = useRef(''), finalTranscriptRef = useRef(''), interimTranscriptRef = useRef(''), transcriptSegmentIdsRef = useRef(new Set()), microphoneReadyRef = useRef(false);
  const [interview, setInterview] = useState(null), [report, setReport] = useState(null);
  const [cameraState, setCameraState] = useState('off'), [phase, setPhase] = useState('READY');
  const [transcript, setTranscript] = useState(''), [timeLeft, setTimeLeft] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(false), [confirmExit, setConfirmExit] = useState(false), [incomplete, setIncomplete] = useState(false);
  const current = interview?.questions?.[interview.current_question];
  const label = labelFor[phase] || labelFor.READY;

  const setConversationState = next => { phaseRef.current = next; setPhase(next); };
  const updateInterview = next => { interviewRef.current = next; setInterview(next); };
  const clearSilenceTimer = () => { if (silenceTimerRef.current) { window.clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; } };
  const stopCountdown = () => { if (countdownTimerRef.current) { window.clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; } };
  const formattedTime = timeLeft === null ? '' : `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`;
  useEffect(() => () => { activeRef.current = false; clearSilenceTimer(); stopCountdown(); speechProviderRef.current?.dispose(); streamRef.current?.getTracks().forEach(track => track.stop()); window.speechSynthesis?.cancel(); }, []);
  useEffect(() => { interviewRef.current = interview; }, [interview]);
  useEffect(() => { if (current && activeRef.current && !report && phaseRef.current === 'NEXT_QUESTION') speakCurrentQuestion(); }, [current?.id]);

  function speak(text, next, speakingPhase = 'AI_SPEAKING', pauseAfterSpeech = 150) {
    clearSilenceTimer();
    speechProviderRef.current?.pause();
    setConversationState(speakingPhase);
    if (!window.speechSynthesis) { window.setTimeout(() => next?.(), pauseAfterSpeech); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.rate = .94;
    const continueAfterSpeech = () => { if (activeRef.current) { setConversationState('WAIT_FOR_AI_TO_FINISH'); window.setTimeout(() => { if (activeRef.current) next?.(); }, pauseAfterSpeech); } };
    utterance.onend = continueAfterSpeech;
    utterance.onerror = continueAfterSpeech;
    window.speechSynthesis.speak(utterance);
  }

  function speakCurrentQuestion() {
    if (current) speak(current.question, startListening, 'AI_SPEAKING', 0);
  }

  async function finishAfterTimeLimit() {
    const activeInterview = interviewRef.current;
    if (!activeInterview || timeLimitEndingRef.current) return;
    timeLimitEndingRef.current = true;
    stopCountdown(); clearSilenceTimer(); activeRef.current = false;
    speechProviderRef.current?.stop(); window.speechSynthesis?.cancel();
    setLoading(true); setConversationState('ANALYZING');
    try {
      const ended = await api(`/interviews/${activeInterview.id}/timeout`, {method:'POST'}, auth.access_token);
      setInterview(ended);
      if (ended.status === 'completed') {
        setReport(await api(`/interviews/${activeInterview.id}/report`, {}, auth.access_token));
        setConversationState('COMPLETE');
      } else {
        setIncomplete(true);
        setConversationState('INCOMPLETE');
      }
    } catch (err) {
      timeLimitEndingRef.current = false;
      setError(err.message);
    } finally { setLoading(false); }
  }

  function finishIfTimeExpired() {
    if (!timeExpiredRef.current || !activeRef.current || timeLimitEndingRef.current) return;
    const waitForCandidate = turnInFlightRef.current || transcriptRef.current.trim() || ['AI_SPEAKING', 'WAIT_FOR_AI_TO_FINISH', 'CANDIDATE_SPEAKING', 'SILENCE_DETECTION', 'ANALYZING', 'FOLLOW_UP_REQUIRED', 'AI_ACKNOWLEDGEMENT'].includes(phaseRef.current);
    if (!waitForCandidate) finishAfterTimeLimit();
  }

  function startCountdown(minutes) {
    const totalSeconds = minutes * 60;
    stopCountdown();
    timeExpiredRef.current = false; timeLimitEndingRef.current = false;
    countdownDeadlineRef.current = Date.now() + totalSeconds * 1000;
    setTimeLeft(totalSeconds);
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((countdownDeadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        stopCountdown();
        timeExpiredRef.current = true;
        finishIfTimeExpired();
      }
    };
    countdownTimerRef.current = window.setInterval(tick, 1000);
  }

  function submitAfterSustainedSilence() {
    clearSilenceTimer();
    if (!activeRef.current || !microphoneReadyRef.current || turnInFlightRef.current || !transcriptRef.current.trim()) return;
    turnInFlightRef.current = true;
    speechProviderRef.current?.pause();
    submitTurn(transcriptRef.current.trim());
  }

  function scheduleSilenceCheck() {
    clearSilenceTimer();
    if (!activeRef.current || !microphoneReadyRef.current || turnInFlightRef.current || !transcriptRef.current.trim()) return;
    setConversationState('SILENCE_DETECTION');
    silenceTimerRef.current = window.setTimeout(submitAfterSustainedSilence, 2200);
  }

  function initializeSpeechProvider(interviewId) {
    if (speechProviderRef.current) return;
    const provider = createSpeechProvider({
      apiUrl: API_URL,
      interviewId,
      token: auth.access_token,
      onReady: () => {
        if (!activeRef.current || turnInFlightRef.current || speechProviderRef.current !== provider) return;
        microphoneReadyRef.current = true;
        setConversationState('LISTENING');
      },
      onSpeechStart: () => {
        if (activeRef.current && !turnInFlightRef.current && microphoneReadyRef.current) setConversationState('CANDIDATE_SPEAKING');
      },
      onTranscript: result => {
        if (!activeRef.current || !microphoneReadyRef.current || turnInFlightRef.current || speechProviderRef.current !== provider) return;
        if (result.is_final) {
          if (!transcriptSegmentIdsRef.current.has(result.segment_id)) {
            transcriptSegmentIdsRef.current.add(result.segment_id);
            finalTranscriptRef.current = `${finalTranscriptRef.current} ${result.text}`.trim();
          }
          interimTranscriptRef.current = '';
        } else interimTranscriptRef.current = result.text;
        const words = `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.trim();
        transcriptRef.current = words;
        setTranscript(words);
        if (words) { setConversationState('CANDIDATE_SPEAKING'); scheduleSilenceCheck(); }
      },
      onUtteranceEnd: () => {
        if (activeRef.current && microphoneReadyRef.current && !turnInFlightRef.current) scheduleSilenceCheck();
      },
      onError: voiceError => {
        microphoneReadyRef.current = false;
        if (activeRef.current && !turnInFlightRef.current) setError(voiceError.message || 'Microphone could not hear a response. Please allow microphone access and try again.');
      },
    });
    speechProviderRef.current = provider;
    provider.start().catch(voiceError => {
      microphoneReadyRef.current = false;
      if (speechProviderRef.current === provider) setError(voiceError.message || 'Microphone is unavailable. Please allow microphone access and try again.');
    });
  }

  function startListening() {
    const activeInterview = interviewRef.current;
    if (!activeRef.current || turnInFlightRef.current || !activeInterview) return;
    if (timeExpiredRef.current) { finishAfterTimeLimit(); return; }
    clearSilenceTimer();
    transcriptRef.current = ''; finalTranscriptRef.current = ''; interimTranscriptRef.current = '';
    transcriptSegmentIdsRef.current = new Set(); microphoneReadyRef.current = false;
    setTranscript(''); setConversationState('MICROPHONE_STARTING');
    const provider = speechProviderRef.current;
    if (!provider) { initializeSpeechProvider(activeInterview.id); return; }
    provider.resume();
  }

  async function enableCamera() {
    try { const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false}); streamRef.current = stream; videoRef.current.srcObject = stream; setCameraState('on'); }
    catch { setCameraState('blocked'); }
  }

  async function startInterview() {
    setLoading(true); setError(''); activeRef.current = true; turnInFlightRef.current = false; transcriptRef.current = ''; setConversationState('NEXT_QUESTION');
    try {
      const data = await api('/interviews', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(settings || {role_title:'your target role', duration_minutes:10})}, auth.access_token);
      const selectedDuration = 10;
      updateInterview(data); initializeSpeechProvider(data.id); startCountdown(selectedDuration); await enableCamera();
    } catch (err) { activeRef.current = false; setError(err.message); } finally { setLoading(false); }
  }

  async function advanceAfterAcknowledgement() {
    const activeInterview = interviewRef.current;
    if (!activeInterview || !activeRef.current) return;
    setConversationState('NEXT_QUESTION');
    try {
      const result = await api(`/interviews/${activeInterview.id}/advance`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({remaining_seconds: timeLeft ?? null})}, auth.access_token);
      if (result.completed) { activeRef.current = false; stopCountdown(); speechProviderRef.current?.stop(); updateInterview(result.interview); setReport(await api(`/interviews/${activeInterview.id}/report`, {}, auth.access_token)); setConversationState('COMPLETE'); }
      else { turnInFlightRef.current = false; transcriptRef.current = ''; setTranscript(''); updateInterview(result.interview); }
    } catch (err) { turnInFlightRef.current = false; setError(err.message); setConversationState('FOLLOW_UP_REQUIRED'); }
  }

  async function submitTurn(words) {
    const activeInterview = interviewRef.current;
    if (!activeInterview || !activeRef.current) { turnInFlightRef.current = false; return; }
    setLoading(true); setConversationState('ANALYZING'); setError('');
    try {
      const result = await api(`/interviews/${activeInterview.id}/turn`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({transcript: words})}, auth.access_token);
      updateInterview(result.interview);
      if (!result.accepted) {
        transcriptRef.current = '';
        setTranscript('');
        if (timeExpiredRef.current) finishAfterTimeLimit();
        else speak(result.status_message, () => { turnInFlightRef.current = false; startListening(); }, 'FOLLOW_UP_REQUIRED', 150);
      } else {
        const continueInterview = () => {
          if (timeExpiredRef.current) finishAfterTimeLimit();
          else advanceAfterAcknowledgement();
        };
        if (result.acknowledgement) speak(result.acknowledgement, continueInterview, 'AI_ACKNOWLEDGEMENT', 1000);
        else continueInterview();
      }
    } catch (err) { turnInFlightRef.current = false; setConversationState('LISTENING'); setError(err.message); startListening(); } finally { setLoading(false); }
  }

  async function stopInterview() {
    activeRef.current = false; stopCountdown(); clearSilenceTimer(); speechProviderRef.current?.stop(); window.speechSynthesis?.cancel();
    if (!interview || report) return onExit();
    const answered = interview.questions.filter(question => question.answer_text?.trim()).length;
    if (!answered) { setConfirmExit(true); return; }
    setLoading(true);
    try { const ended = await api(`/interviews/${interview.id}/end`, {method:'POST'}, auth.access_token); if (ended.status === 'completed') { setReport(await api(`/interviews/${interview.id}/report`, {}, auth.access_token)); setConversationState('COMPLETE'); } else { setIncomplete(true); setConversationState('INCOMPLETE'); } }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function discardUnanswered() { if (!interview) return onExit(); setLoading(true); try { await api(`/interviews/${interview.id}`, {method:'DELETE'}, auth.access_token); onExit(); } catch (err) { setError(err.message); } finally { setLoading(false); } }

  return <main className="interview-page conversational-room">
    <header className="interview-header"><div><span className="eyebrow">SMART HIRE AI / LIVE INTERVIEW</span><h1>{report ? 'Your practice assessment' : 'Interview with Nova'}</h1></div><button className="exit-button" onClick={stopInterview}>{report ? 'Back to dashboard' : 'Stop interview'}</button></header>
    {!report && !incomplete && <><div className="interview-progress"><span>{interview ? `Conversation turn ${interview.current_question + 1}` : 'Your session is ready'}</span><div><i style={{width: interview ? `${Math.min(95, (interview.current_question + 1) * 10)}%` : '0%'}} /></div>{interview && <span className={`interview-timer ${timeLeft === 0 ? 'expired' : ''}`}>Time left: {formattedTime}</span>}<span>{label}</span></div>
      <section className="conversation-stage"><article className="candidate-frame"><div className="video-label"><span className="live-dot" />You</div><video ref={videoRef} autoPlay muted playsInline className={cameraState === 'on' ? '' : 'hidden-video'} />{cameraState !== 'on' && <div className="video-placeholder"><div className="candidate-icon">{auth.user.full_name.charAt(0).toUpperCase()}</div><p>Camera preview is optional</p></div>}<div className="candidate-status">Camera is private and never used for scoring</div></article><article className={`nova-stage ${visualState(phase)}`}><div className="nova-presence"><div className="nova-orbital"><div className="nova-core">✦</div></div></div><span className="eyebrow">NOVA / AI INTERVIEWER</span><h2>{label}</h2><p>{phase === 'READY' ? 'Nova will welcome you, ask each question, and listen automatically.' : 'Keep your answer natural. Nova will continue when you finish speaking.'}</p></article></section>
      {!interview ? <section className="start-panel question-panel"><h2>Ready for a natural practice conversation?</h2><p>Press start once. Nova handles the questions and listening from there.</p><button className="primary-button" onClick={startInterview} disabled={loading}>{loading ? 'Preparing Nova…' : 'Start interview →'}</button></section> : <section className="question-panel focus-question"><div className="question-top"><span className="question-number">Current question</span><span className={`status-badge ${visualState(phase)}`}>{label}</span></div><h2>{current?.question}</h2>{transcript && <div className="live-answer"><span>Your response</span><p>{transcript}</p></div>}<p className="listening-hint">Your response is saved automatically when you finish speaking.</p></section>}</>}
    {incomplete && <section className="feedback-panel incomplete-panel"><span className="eyebrow">INTERVIEW INCOMPLETE</span><h2>Not enough responses for an assessment.</h2><p>Complete every question to unlock your score, feedback, and performance analytics.</p><button className="primary-button" onClick={onExit}>Back to dashboard</button></section>}
    {report && <section className="feedback-panel"><div className="score-circle"><strong>{report.score}</strong><span>/100</span></div><span className="eyebrow">SESSION COMPLETE</span><h2>Interview completed</h2><p>You answered {report.answered_questions} of {report.total_questions} questions.</p><div className="feedback-grid"><article><h3>What worked well</h3>{report.strengths.map(item => <p key={item}>{item}</p>)}</article><article><h3>Focus next time</h3>{report.improvements.map(item => <p key={item}>{item}</p>)}</article></div><p className="feedback-note">{report.note}</p></section>}
    {confirmExit && <div className="confirm-layer" role="dialog" aria-modal="true"><section><span className="eyebrow">NO RESPONSES RECORDED</span><h2>Exit without saving?</h2><p>You haven’t answered any questions. This interview will be discarded and won’t appear in history or analytics.</p><div><button className="secondary-button" onClick={() => { setConfirmExit(false); activeRef.current = true; startListening(); }}>Continue interview</button><button className="exit-button" onClick={discardUnanswered} disabled={loading}>Exit without saving</button></div></section></div>}
    {error && <p className="error-message">{error}</p>}
  </main>;
}
