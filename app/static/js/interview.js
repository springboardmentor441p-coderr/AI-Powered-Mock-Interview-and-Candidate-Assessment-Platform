/**
 * SmartHire AI - Live Conversational Interview Session
 * Real-time chat-style interview with speech, webcam, and AI follow-ups
 */

(function () {
  'use strict';

  if (typeof INTERVIEW_ID === 'undefined') return;

  var mediaRecorder = null;
  var audioChunks = [];
  var frameDataList = [];
  var stream = null;
  var recognition = null;
  var isRecording = false;
  var isMuted = false;
  var isProcessing = false;
  var isInterviewComplete = IS_SESSION_COMPLETE;
  var recorderStopPromise = null;
  var speechTranscript = '';
  var typedBeforeSpeech = '';
  var sessionStartTime = Date.now();
  var responseStartTime = Date.now();
  var sessionTimerInterval = null;
  var silenceTimer = null;
  var lastSpeechTime = Date.now();
  var completedTurns = COMPLETED_TURNS;
  var targetTurns = TARGET_TURNS;
  var currentQuestionId = document.getElementById('current-question-id').value;
  var speechSynth = window.speechSynthesis;

  var video = document.getElementById('webcam');
  var canvas = document.getElementById('emotion-canvas');
  var chatMessages = document.getElementById('chat-messages');
  var typingIndicator = document.getElementById('typing-indicator');
  var answerText = document.getElementById('answer-text');
  var btnSubmit = document.getElementById('btn-submit');
  var btnFinish = document.getElementById('btn-finish');
  var btnMute = document.getElementById('btn-mute');
  var analysisPanel = document.getElementById('analysis-panel');
  var recordingStatus = document.getElementById('recording-status');
  var liveStatus = document.getElementById('live-status');
  var sessionTimer = document.getElementById('session-timer');
  var turnCounter = document.getElementById('turn-counter');
  var progressBar = document.getElementById('progress-bar');
  var transcriptLive = document.getElementById('transcript-live');
  var audioWave = document.getElementById('audio-wave');
  var listeningOverlay = document.getElementById('listening-overlay');
  var recIndicator = document.getElementById('rec-indicator');

  /**
   * Update the live session status badge.
   */
  function setLiveStatus(text, badgeClass) {
    if (!liveStatus) return;
    liveStatus.textContent = text;
    liveStatus.className = 'badge ' + (badgeClass || 'bg-success');
  }

  /**
   * Update visible recording status for the user.
   */
  function setRecordingStatus(message, isError) {
    if (!recordingStatus) return;
    recordingStatus.textContent = message;
    recordingStatus.className = 'small mt-2 mb-0 ' + (isError ? 'text-danger' : 'text-muted');
  }

  /**
   * Format seconds as MM:SS.
   */
  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  /**
   * Start elapsed session timer.
   */
  function startSessionTimer() {
    sessionTimerInterval = setInterval(function () {
      var elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      sessionTimer.textContent = formatTime(elapsed);
    }, 1000);
  }

  /**
   * Scroll chat to the latest message.
   */
  function scrollChatToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  /**
   * Append a chat bubble to the conversation.
   */
  function appendChatBubble(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (role === 'interviewer' ? 'interviewer-bubble' : 'candidate-bubble');

    var label = document.createElement('small');
    label.className = 'bubble-label';
    label.textContent = role === 'interviewer' ? INTERVIEWER_NAME : 'You';

    var content = document.createElement('p');
    content.textContent = text;

    bubble.appendChild(label);
    bubble.appendChild(content);

    chatMessages.insertBefore(bubble, typingIndicator);
    scrollChatToBottom();
    return bubble;
  }

  /**
   * Show or hide the interviewer typing indicator.
   */
  function showTypingIndicator(show) {
    if (!typingIndicator) return;
    typingIndicator.classList.toggle('d-none', !show);
    scrollChatToBottom();
  }

  /**
   * Speak interviewer message using browser text-to-speech.
   */
  function speakInterviewerMessage(text) {
    if (!speechSynth || !text) {
      setLiveStatus('Listening', 'bg-success');
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      speechSynth.cancel();
      setLiveStatus('Interviewer Speaking', 'bg-info');

      var utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = 'en-US';

      var voices = speechSynth.getVoices();
      for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang.indexOf('en') === 0 && voices[i].name.indexOf('Female') !== -1) {
          utterance.voice = voices[i];
          break;
        }
      }

      utterance.onend = function () {
        setLiveStatus('Listening', 'bg-success');
        resolve();
      };

      utterance.onerror = function () {
        setLiveStatus('Listening', 'bg-success');
        resolve();
      };

      speechSynth.speak(utterance);
    });
  }

  /**
   * Update progress bar and turn counter.
   */
  function updateProgress() {
    var pct = targetTurns > 0 ? (completedTurns / targetTurns) * 100 : 0;
    progressBar.style.width = Math.min(100, pct) + '%';
    turnCounter.textContent = completedTurns + ' / ' + targetTurns;
  }

  /**
   * Pick a MediaRecorder mime type supported by the browser.
   */
  function getSupportedMimeType() {
    var types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    for (var i = 0; i < types.length; i++) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(types[i])) {
        return types[i];
      }
    }
    return '';
  }

  /**
   * Initialize webcam and microphone stream.
   */
  async function initWebcam() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingStatus('Microphone/camera not supported in this browser.', true);
        return;
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      video.srcObject = stream;
      await video.play();
      startFrameCapture();
      setRecordingStatus('Camera and microphone ready. The interview will begin shortly.');
      startRecording();
      setLiveStatus('Ready', 'bg-primary');
    } catch (err) {
      setRecordingStatus('Please allow camera and microphone access to join the interview.', true);
      setLiveStatus('Permission Required', 'bg-warning');
      console.log('Media access error:', err.message);
    }
  }

  /**
   * Capture frames periodically for emotion analysis.
   */
  function startFrameCapture() {
    setInterval(function () {
      if (!video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var brightness = 0;
      for (var i = 0; i < imageData.data.length; i += 4) {
        brightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      }
      brightness = brightness / (imageData.data.length / 4);

      var eyeContact = Math.min(100, Math.max(30, 85));

      frameDataList.push({
        happy: Math.min(100, 40 + brightness / 5),
        neutral: 50,
        sad: Math.max(0, 30 - brightness / 10),
        nervous: Math.min(100, Math.max(20, 60 - brightness / 8)),
        eye_contact: eyeContact,
        attention: Math.min(100, brightness / 2.5),
        face_presence: brightness > 20 ? 100 : 0
      });

      if (frameDataList.length > 30) frameDataList.shift();
    }, 1000);
  }

  /**
   * Reset silence detection timer for auto-submit.
   */
  function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    if (isProcessing || isInterviewComplete || isMuted) return;

    silenceTimer = setTimeout(function () {
      if (answerText.value.trim().length > 10 && !isProcessing) {
        submitResponse();
      }
    }, SILENCE_AUTO_SUBMIT_MS);
  }

  /**
   * Start browser speech-to-text for live transcription.
   */
  function startSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    typedBeforeSpeech = answerText.value.trim();
    speechTranscript = '';

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = function (event) {
      var finalPart = '';
      var interimPart = '';

      for (var i = 0; i < event.results.length; i++) {
        var result = event.results[i];
        var text = result[0].transcript;
        if (result.isFinal) {
          finalPart += text + ' ';
        } else {
          interimPart += text;
        }
      }

      speechTranscript = (finalPart + interimPart).trim();
      var combined = [typedBeforeSpeech, speechTranscript].filter(Boolean).join(' ').trim();
      answerText.value = combined;
      transcriptLive.textContent = combined || 'Listening...';
      lastSpeechTime = Date.now();
      resetSilenceTimer();

      if (interimPart) {
        audioWave.classList.add('active');
        listeningOverlay.classList.add('visible');
      }
    };

    recognition.onerror = function (event) {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.log('Speech recognition:', event.error);
      }
    };

    recognition.onend = function () {
      audioWave.classList.remove('active');
      if (isRecording && !isMuted) {
        try {
          recognition.start();
        } catch (err) {
          console.log('Speech recognition restart failed:', err.message);
        }
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.log('Speech recognition start failed:', err.message);
    }
  }

  /**
   * Stop browser speech-to-text.
   */
  function stopSpeechRecognition() {
    if (!recognition) return;
    var activeRecognition = recognition;
    recognition = null;
    try {
      activeRecognition.stop();
    } catch (err) {
      console.log('Speech recognition stop failed:', err.message);
    }
    typedBeforeSpeech = '';
    speechTranscript = '';
    audioWave.classList.remove('active');
    listeningOverlay.classList.remove('visible');
  }

  /**
   * Start audio recording from microphone track.
   */
  function startRecording() {
    if (!stream || isRecording) return;

    var audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      setRecordingStatus('No microphone track found. Check browser permissions.', true);
      return;
    }

    audioChunks = [];
    var audioStream = new MediaStream(audioTracks);
    var mimeType = getSupportedMimeType();
    var options = mimeType ? { mimeType: mimeType } : undefined;

    try {
      mediaRecorder = new MediaRecorder(audioStream, options);
    } catch (err) {
      try {
        mediaRecorder = new MediaRecorder(audioStream);
      } catch (fallbackErr) {
        setRecordingStatus('Unable to start recorder: ' + fallbackErr.message, true);
        return;
      }
    }

    mediaRecorder.ondataavailable = function (e) {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onerror = function (e) {
      setRecordingStatus('Recording error occurred.', true);
      console.log('MediaRecorder error:', e);
    };

    mediaRecorder.onstop = function () {
      if (recorderStopPromise) {
        recorderStopPromise.resolve();
        recorderStopPromise = null;
      }
    };

    try {
      mediaRecorder.start(1000);
      isRecording = true;
      recIndicator.classList.remove('d-none');
      setRecordingStatus('Microphone active. Speak naturally and click Done Speaking when finished.');
      startSpeechRecognition();
      setLiveStatus('Listening', 'bg-success');
      listeningOverlay.classList.add('visible');
    } catch (err) {
      setRecordingStatus('Failed to start recording: ' + err.message, true);
      isRecording = false;
    }
  }

  /**
   * Stop audio recording and wait until blob data is ready.
   */
  function stopRecording() {
    stopSpeechRecognition();
    clearTimeout(silenceTimer);

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      isRecording = false;
      recIndicator.classList.add('d-none');
      listeningOverlay.classList.remove('visible');
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      recorderStopPromise = { resolve: resolve };
      try {
        mediaRecorder.stop();
      } catch (err) {
        recorderStopPromise = null;
        resolve();
      }
      setTimeout(resolve, 1500);
    }).then(function () {
      isRecording = false;
      recIndicator.classList.add('d-none');
      listeningOverlay.classList.remove('visible');
    });
  }

  /**
   * Restart recording for the next conversational turn.
   */
  function restartRecording() {
    responseStartTime = Date.now();
    typedBeforeSpeech = '';
    speechTranscript = '';
    answerText.value = '';
    transcriptLive.textContent = 'Waiting for you to speak...';
    frameDataList = [];
    audioChunks = [];
    startRecording();
  }

  /**
   * Submit candidate response and receive next interviewer message.
   */
  async function submitResponse() {
    if (isProcessing || isInterviewComplete) return;

    var responseText = answerText.value.trim();
    if (!responseText) {
      setRecordingStatus('Please speak or type a response before continuing.', true);
      return;
    }

    if (!currentQuestionId) {
      setRecordingStatus('No active question. Please refresh the page.', true);
      return;
    }

    isProcessing = true;
    btnSubmit.disabled = true;
    setLiveStatus('Processing', 'bg-warning');
    setRecordingStatus('Processing your response...');
    showTypingIndicator(true);

    appendChatBubble('candidate', responseText);

    var durationSeconds = Math.floor((Date.now() - responseStartTime) / 1000);

    try {
      await stopRecording();

      var formData = new FormData();
      formData.append('question_id', currentQuestionId);
      formData.append('answer_text', responseText);
      formData.append('duration_seconds', durationSeconds);
      formData.append('frame_data', JSON.stringify(frameDataList));
      formData.append('csrf_token', CSRF_TOKEN);

      if (audioChunks.length > 0) {
        var mimeType = (mediaRecorder && mediaRecorder.mimeType) ? mediaRecorder.mimeType : 'audio/webm';
        var extension = mimeType.indexOf('ogg') !== -1 ? 'ogg' : 'webm';
        var audioBlob = new Blob(audioChunks, { type: mimeType });
        formData.append('audio_file', audioBlob, 'response.' + extension);
      }

      var response = await fetch('/interview/api/submit-response', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Submit failed with status ' + response.status);
      }

      var data = await response.json();

      if (data.is_cancelled) {
        showCancellationModal(data.cancellation_reason);
        return;
      }

      analysisPanel.classList.remove('d-none');
      document.getElementById('emotion-display').textContent = data.dominant_emotion || 'Neutral';
      document.getElementById('comm-display').textContent = (data.communication_score || 0) + '/100';
      document.getElementById('confidence-display').textContent = (data.confidence_score || 0) + '/100';

      completedTurns = data.completed_turns || completedTurns + 1;
      updateProgress();

      showTypingIndicator(false);

      if (data.is_complete) {
        isInterviewComplete = true;
        if (data.interviewer_message) {
          appendChatBubble('interviewer', data.interviewer_message);
          await speakInterviewerMessage(data.interviewer_message);
        }
        btnSubmit.classList.add('d-none');
        btnFinish.classList.remove('d-none');
        setLiveStatus('Complete', 'bg-secondary');
        setRecordingStatus('Interview conversation complete. Click End Interview to see your results.');
        return;
      }

      if (data.interviewer_message) {
        appendChatBubble('interviewer', data.interviewer_message);
        await speakInterviewerMessage(data.interviewer_message);
      }

      currentQuestionId = data.next_question_id;
      document.getElementById('current-question-id').value = currentQuestionId;

      restartRecording();
      setRecordingStatus('Your turn — speak naturally and click Done Speaking when ready.');
    } catch (e) {
      showTypingIndicator(false);
      setRecordingStatus('Could not submit response. Please try again.', true);
      console.log('Submit error:', e);
      restartRecording();
    } finally {
      isProcessing = false;
      btnSubmit.disabled = false;
    }
  }

  /**
   * Show interview cancellation modal and stop session.
   */
  function showCancellationModal(reason) {
    isInterviewComplete = true;
    isProcessing = true;

    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
    }
    if (speechSynth) {
      speechSynth.cancel();
    }
    clearInterval(sessionTimerInterval);
    clearTimeout(silenceTimer);
    stopSpeechRecognition();

    var modal = document.getElementById('cancellation-modal');
    var reasonEl = document.getElementById('cancellation-reason');
    if (reasonEl) {
      reasonEl.textContent = reason || 'Interview cancelled due to policy violation.';
    }
    if (modal) {
      modal.classList.remove('d-none');
    }

    btnSubmit.disabled = true;
    btnFinish.classList.add('d-none');
    setLiveStatus('Cancelled', 'bg-danger');
    setRecordingStatus('Interview cancelled. Redirecting to history...');

    setTimeout(function () {
      window.location.href = '/interview/history';
    }, 5000);
  }

  /**
   * Complete interview and redirect to results.
   */
  async function finishInterview() {
    btnFinish.disabled = true;
    setLiveStatus('Finishing', 'bg-warning');
    setRecordingStatus('Generating your interview report...');

    try {
      await stopRecording();
    } catch (e) {
      console.log('Stop recording error:', e);
    }

    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
    }

    if (speechSynth) {
      speechSynth.cancel();
    }

    clearInterval(sessionTimerInterval);

    var formData = new FormData();
    formData.append('csrf_token', CSRF_TOKEN);

    var response = await fetch('/interview/api/complete/' + INTERVIEW_ID, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    var data = await response.json();
    if (data.redirect_url) {
      window.location.href = data.redirect_url;
    }
  }

  /**
   * Toggle microphone mute state.
   */
  function toggleMute() {
    if (!stream) return;
    isMuted = !isMuted;
    stream.getAudioTracks().forEach(function (track) {
      track.enabled = !isMuted;
    });

    if (isMuted) {
      stopSpeechRecognition();
      btnMute.innerHTML = '<i class="bi bi-mic-mute-fill"></i>';
      btnMute.classList.add('btn-danger');
      btnMute.classList.remove('btn-outline-secondary');
      listeningOverlay.classList.remove('visible');
      setLiveStatus('Muted', 'bg-secondary');
    } else {
      btnMute.innerHTML = '<i class="bi bi-mic-fill"></i>';
      btnMute.classList.remove('btn-danger');
      btnMute.classList.add('btn-outline-secondary');
      if (isRecording) {
        startSpeechRecognition();
        listeningOverlay.classList.add('visible');
        setLiveStatus('Listening', 'bg-success');
      }
    }
  }

  /**
   * Speak the opening interviewer message on session load.
   */
  async function playOpeningMessage() {
    var lastInterviewerBubble = chatMessages.querySelector('.interviewer-bubble:last-of-type p');
    if (!lastInterviewerBubble) return;

    setLiveStatus('Interviewer Speaking', 'bg-info');
    setRecordingStatus('The interviewer is speaking. Listen, then respond when ready.');
    await speakInterviewerMessage(lastInterviewerBubble.textContent);
    responseStartTime = Date.now();
    setRecordingStatus('Your turn — speak naturally and click Done Speaking when ready.');
  }

  btnSubmit.addEventListener('click', submitResponse);
  btnFinish.addEventListener('click', finishInterview);
  btnMute.addEventListener('click', toggleMute);

  answerText.addEventListener('input', function () {
    typedBeforeSpeech = answerText.value.trim();
    transcriptLive.textContent = answerText.value || 'Waiting for you to speak...';
    resetSilenceTimer();
  });

  answerText.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitResponse();
    }
  });

  if (isInterviewComplete) {
    btnSubmit.classList.add('d-none');
    btnFinish.classList.remove('d-none');
    setLiveStatus('Complete', 'bg-secondary');
  }

  if (speechSynth) {
    speechSynth.onvoiceschanged = function () {};
  }

  startSessionTimer();
  scrollChatToBottom();
  updateProgress();
  initWebcam().then(function () {
    setTimeout(playOpeningMessage, 1500);
  });
})();
