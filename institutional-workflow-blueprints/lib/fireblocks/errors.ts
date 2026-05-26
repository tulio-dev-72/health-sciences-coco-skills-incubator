/** Extract the most specific Fireblocks SDK / API error text available. */
export function extractFireblocksApiErrorDetails(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    const nested = extractFromObject(error as unknown as Record<string, unknown>);
    if (nested && nested !== error.message) {
      return nested;
    }
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const extracted = extractFromObject(error as Record<string, unknown>);
    if (extracted) {
      return extracted;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Fireblocks transaction submission failed.";
  }
}

function extractFromObject(error: Record<string, unknown>): string | null {
  const response = error.response;
  if (response && typeof response === "object") {
    const data = (response as { data?: unknown }).data;
    const fromData = formatErrorPayload(data);
    if (fromData) {
      return fromData;
    }

    const status = (response as { status?: unknown }).status;
    const statusText = (response as { statusText?: unknown }).statusText;
    if (status != null) {
      return `HTTP ${String(status)}${statusText ? ` ${String(statusText)}` : ""}`;
    }
  }

  const body = error.body ?? error.data;
  const fromBody = formatErrorPayload(body);
  if (fromBody) {
    return fromBody;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return null;
}

function formatErrorPayload(payload: unknown): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (typeof payload !== "object") {
    return String(payload);
  }

  const record = payload as Record<string, unknown>;
  const message = [record.message, record.error, record.errorMessage, record.code]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" · ");

  if (message) {
    return message;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

export function formatFireblocksSubmitErrorMessage(body: Record<string, unknown>): string {
  const base = String(
    body.error ?? body.message ?? "Fireblocks transaction submission failed.",
  ).trim();
  const details = body.details ?? body.fireblocksError;

  if (typeof details === "string" && details.trim() && !base.includes(details.trim())) {
    return `${base} — ${details.trim()}`;
  }

  if (details && typeof details === "object") {
    const serialized = JSON.stringify(details);
    if (!base.includes(serialized)) {
      return `${base} — ${serialized}`;
    }
  }

  return base;
}
