export type Result<T, E = Error> = { error: E; ok: false } | { ok: true; value: T };
