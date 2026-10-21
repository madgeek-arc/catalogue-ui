# Security

catalogue-ui is a client-side library. It authenticates nobody and enforces no access control; the backend and the
host application own both. This page lists the security-relevant behaviour of the library itself.

## Authentication and authorisation

- No login, roles or tokens in the library. Requests rely on the host's session cookie.
- Whether a user may edit a model, answer, or comment is decided by the backend. A refused live edit arrives on the
  `editDenied` topic and is surfaced to the form.

## CSRF and transport

- REST: the host must enable Angular's XSRF support (`withXsrfConfiguration`), so state-changing calls
  (`POST`/`PUT` to `/forms/models`, ...) carry `X-XSRF-TOKEN`.
- STOMP: each connection sends `X-XSRF-TOKEN` (from `HttpXsrfTokenExtractor`) in the CONNECT headers. Presence uses SockJS
  with `withCredentials: true`.
- Use HTTPS in production; the library has no transport settings.

## Rich text editor

- The TipTap editor limits what users can produce: links are restricted to `http`, `https`, `mailto`, `tel` and
  scheme-less relative URLs (`isAllowedHref`); image sources to `http(s)`, relative URLs and base64 raster images
  (`isAllowedImageSrc`); inline styles, classes, iframes and other markup the editor cannot represent are dropped when a
  field is edited. Image upload and media embedding are not available.
- **The editor is not a sanitizer.** Fields that are never edited are never rewritten, so stored HTML can contain
  anything. Always render stored HTML through Angular's sanitizer (`[innerHTML]` without a bypass).
- `shared/reusable-components/rich-text-editor/security.spec.ts` tests hostile inputs and the allow-lists. Run
  it when changing the editor or upgrading TipTap.
- TipTap (MIT) replaced CKEditor 5 (GPL): no licence key and no vendor branding to carry.

## HTML rendering and trust assumptions

| Where | How it is rendered | Trust assumption |
|---|---|---|
| Section, group and chapter descriptions, notices, read-more text | `[innerHTML]` with Angular's default sanitizer | None needed |
| Field description text (`pages/dynamic-form/fields/utils/base-field-html.component.html`, `pages/form-builder/field-templates/field-templates.component.html`) | `[innerHTML]` with `safeUrl: 'html'`, which **bypasses** the sanitizer | The form model, including descriptions, is written only by trusted model authors |
| Comment bodies | `[innerHTML]` through the `mentionHighlight` pipe, which HTML-escapes `&`, `<`, `>` and `"`, wraps mention tokens (`@{Name}(email)`) in `<span>`s and then marks the result trusted | The escaping step must stay first; user comment text is untrusted |

Because of the second row, whoever can save a form model (`POST`/`PUT /forms/models`) can run script for every user who
opens a form that uses it. Keep model-editing rights restricted in the backend, and prefer removing the bypass for
descriptions (the default sanitizer already keeps the formatting the editor produces) when the descriptions no longer
need raw HTML.

The `safeUrl` pipe (`shared/pipes/safeUrlPipe.ts`) can bypass sanitisation for HTML, style, script, URL and resource URL.
Do not use it for values that originate from end users.

## Other inputs

- Vocabulary fields fetch the URL declared in the form model, with `urlParams` placeholders replaced from other field
  values. Treat the model as trusted configuration, and make sure the vocabulary host allows CORS.
- `generic.validator.ts` validates URLs as `http(s)://...`; e-mail and phone validators are format checks only.
- The library stores nothing in cookies, `localStorage` or `sessionStorage`; `cookie-management.ts` only offers helpers
  to the host.

## Secrets and logging

- No secrets, keys or credentials in this repository or in `APP_ENV`.
- The websocket services log connection state and edit events to the browser console (for example
  `console.log('edit event, with body: ...')`); do not extend them to log tokens or personal data.
