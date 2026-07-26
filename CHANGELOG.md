# Changelog

## 1.0.6

### Fixed

- **`put()`** now `await`s `putObject`. Previously the method returned `{ raw: Promise }` immediately, so upload failures became unhandled promise rejections and callers’ `try/catch` never saw S3 errors (`AccessDenied`, etc.).
- **`exists()`** correctly detects 404 / missing objects with AWS SDK v3 error shapes (`$metadata.httpStatusCode`, `name` / `Code`), while still supporting the SDK v2 `statusCode` field.
- **`getStream()`** now maps S3 errors through `handleError` like the other methods.

### Docs

- README note for Backblaze B2: pass `requestChecksumCalculation` / `responseChecksumValidation` via `S3ClientConfig` (not hardcoded for AWS).
