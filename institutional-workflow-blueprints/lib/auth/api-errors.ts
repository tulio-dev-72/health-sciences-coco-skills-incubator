import {
  isAccessRestrictedPayload,
  type AccessRestrictedPayload,
} from "@/lib/auth/access-restriction";

export class AccessRestrictedError extends Error {
  readonly status = 403;
  readonly code = "ACCESS_RESTRICTED" as const;
  readonly payload: AccessRestrictedPayload;

  constructor(payload: AccessRestrictedPayload) {
    super(payload.error);
    this.name = "AccessRestrictedError";
    this.payload = payload;
  }
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    code?: string;
  };

  if (response.status === 403 && isAccessRestrictedPayload(payload)) {
    throw new AccessRestrictedError(payload);
  }

  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload && "error" in payload && payload.error
        ? String(payload.error)
        : "Request failed.",
    );
  }

  return payload;
}

export function getAccessRestrictedMessage(error: unknown): string | null {
  if (error instanceof AccessRestrictedError) {
    return error.message;
  }
  return null;
}
