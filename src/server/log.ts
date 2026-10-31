import "server-only";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "quizz" },
  redact: {
    paths: [
      "password",
      "*.password",
      "token",
      "*.token",
      "otp",
      "*.otp",
      "phone",
      "*.phone",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[redacted]",
  },
});
