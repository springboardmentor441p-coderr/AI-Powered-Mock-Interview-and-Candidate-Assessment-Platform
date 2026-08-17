import crypto from 'node:crypto';

export type InterviewSessionStatus = 'created' | 'active' | 'completed' | 'failed';

export interface InterviewQuestionInput {
  id: string;
  text: string;
  topic: string;
  expectedKeyPoints?: string[];
}

export interface InterviewSessionInput {
  candidate: { id: string; name: string; email: string };
  config: {
    id: string;
    title: string;
    track: string;
    difficulty: string;
    durationMinutes: number;
    preferredLanguage: string;
    persona: { name: string; role: string; tone: string };
  };
  questions: InterviewQuestionInput[];
  resumeSummary?: string;
}

export interface InterviewSession extends InterviewSessionInput {
  id: string;
  status: InterviewSessionStatus;
  assistantId: string;
  vapiCallId?: string;
  startedAt: string;
  endedAt?: string;
  transcript: Array<{ role: 'assistant' | 'user'; content: string; timestamp?: string }>;
  endReason?: string;
}

const sessions = new Map<string, InterviewSession>();
const processedWebhookIds = new Set<string>();

export function createInterviewSession(input: InterviewSessionInput, assistantId: string): InterviewSession {
  const session: InterviewSession = {
    ...input,
    id: `ivs_${crypto.randomUUID()}`,
    status: 'created',
    assistantId,
    startedAt: new Date().toISOString(),
    transcript: []
  };
  sessions.set(session.id, session);
  return session;
}

export function getInterviewSession(id: string): InterviewSession | undefined {
  return sessions.get(id);
}

export function recordVapiEvent(sessionId: string, event: Record<string, unknown>): InterviewSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const eventId = typeof event.id === 'string' ? event.id : undefined;
  if (eventId && processedWebhookIds.has(eventId)) return session;
  if (eventId) {
    processedWebhookIds.add(eventId);
    // Bounded idempotency cache: enough for webhook retries without retaining
    // identifiers indefinitely in the development in-memory store.
    if (processedWebhookIds.size > 10_000) processedWebhookIds.delete(processedWebhookIds.values().next().value as string);
  }

  const message = asRecord(event.message) ?? event;
  const type = typeof message.type === 'string' ? message.type : '';
  const call = asRecord(message.call) ?? asRecord(event.call);
  const callId = typeof call?.id === 'string' ? call.id : undefined;
  if (callId) session.vapiCallId = callId;

  if (type === 'status-update' || type === 'assistant.started') session.status = 'active';

  const messages = extractMessages(message);
  if (messages.length) session.transcript = mergeTranscript(session.transcript, messages);

  if (type === 'end-of-call-report' || type === 'hang') {
    session.status = 'completed';
    session.endedAt = new Date().toISOString();
    const endedReason = typeof message.endedReason === 'string' ? message.endedReason : undefined;
    session.endReason = endedReason;
  }

  sessions.set(session.id, session);
  return session;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function extractMessages(payload: Record<string, unknown>): InterviewSession['transcript'] {
  const candidates = [payload.messages, payload.transcript, asRecord(payload.artifact)?.messages];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    return candidate.flatMap((item) => {
      const record = asRecord(item);
      if (!record) return [];
      const role = record.role === 'assistant' ? 'assistant' : record.role === 'user' ? 'user' : undefined;
      const content = typeof record.content === 'string' ? record.content.trim() : '';
      if (!role || !content) return [];
      return [{ role, content, timestamp: typeof record.timestamp === 'string' ? record.timestamp : undefined }];
    });
  }
  return [];
}

function mergeTranscript(current: InterviewSession['transcript'], incoming: InterviewSession['transcript']) {
  const seen = new Set(current.map((entry) => `${entry.role}:${entry.content}`));
  return [...current, ...incoming.filter((entry) => !seen.has(`${entry.role}:${entry.content}`))];
}
