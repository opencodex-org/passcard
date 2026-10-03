const PRODUCTION_FRONTEND_ORIGIN =
  "https://passcard.esamif1234567890.workers.dev";

export function isCorsOriginAllowed(
  origin: string | undefined,
  nodeEnv = process.env.NODE_ENV,
  configuredOrigins = process.env.FRONTEND_ORIGINS,
) {
  if (!origin) return true;

  if (nodeEnv === "production") {
    return origin === PRODUCTION_FRONTEND_ORIGIN;
  }

  const configured = configuredOrigins
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];
  const origins = [
    PRODUCTION_FRONTEND_ORIGIN,
    ...configured,
    ...(nodeEnv === "production" ? [] : ["http://localhost:3000"]),
  ];

  return origins.includes(origin);
}