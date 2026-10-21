# Configuration

catalogue-ui has no configuration files of its own and is not deployed on its own. It is compiled into the host
application, so "configuration" means **what the host must provide**. The reference host is
[observatory-ui](https://github.com/madgeek-arc/observatory-ui) (see its `docs/configuration.md` for the actual values).

## 1. The `APP_ENV` provider (required)

```ts
// app.module.ts of the host
import { APP_ENV } from './catalogue-ui/config/app-env.token';
providers: [{ provide: APP_ENV, useValue: environment }]
```

`AppEnvironment` (`config/app-env.token.ts`):

| Key | Required | Default | Used for |
|---|---|---|---|
| `API_ENDPOINT` | Yes | none | Base URL of the REST API (`/forms/models`, `/survey-answer-comments`). Relative or absolute, no trailing slash |
| `WS_ENDPOINT` | Yes | none | SockJS endpoint for presence, live edits and comments |
| `WS_TOPICS` | No | see below | Overrides for the STOMP destinations |
| `production` | Yes (type only) | none | Part of the interface; not read by the library |
| `beta` | Yes (type only) | none | Part of the interface; not read by the library |

`WS_TOPICS` entries replace the default templates one by one; unspecified entries keep their defaults. Placeholders
`{type}`, `{id}`, `{field}`, `{threadId}` and `{messageId}` are substituted at runtime (`formatTopic`). For presence
`{type}` is the resource type the host passes in; for comments it is `survey_answer`.

| Key | Default |
|---|---|
| `activeUsers` | `/topic/active-users/{type}/{id}` |
| `edit` | `/topic/edit/{type}/{id}` |
| `editDenied` | `/user/topic/edit/{type}/{id}` |
| `join` | `/app/join/{type}/{id}` |
| `leave` | `/app/leave/{type}/{id}` |
| `focus` | `/app/focus/{type}/{id}/{field}` |
| `editSend` | `/app/edit/{type}/{id}` |
| `comments` | `/topic/comments/{type}/{id}` |
| `commentsDelete` | `/topic/comments/{type}/{id}/delete` |
| `commentsSend` | `/app/comments/{type}/{id}` |
| `commentsSendDelete` | `/app/comments/{type}/{id}/{threadId}/delete` |
| `commentsSendMessages` | `/app/comments/{type}/{id}/{threadId}/messages` |
| `commentsSendMessageUpdate` | `/app/comments/{type}/{id}/{threadId}/messages/{messageId}` |
| `commentsSendMessageDelete` | `/app/comments/{type}/{id}/{threadId}/messages/{messageId}/delete` |

## 2. Application setup

| Requirement | Detail |
|---|---|
| HTTP client with XSRF | `provideHttpClient(withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }))`. The STOMP services read the token through `HttpXsrfTokenExtractor` |
| Same-origin API and WebSocket | The services use the browser session cookie; cross-origin use needs CORS with credentials configured on the backend |
| Less support | Component styles are `.less` files (for example `assets/theme/form-builder.component.less`): the host's Angular build must handle Less and set `inlineStyleLanguage` accordingly |
| Global styles | UIkit styles and the project's theme; the form pages rely on UIkit classes (`uk-*`) and `assets/theme/*.less`. In observatory-ui, `src/survey-tool/styles/styles.less` imports the ng-select default theme and `catalogue-ui/assets/theme/theme` |
| Icon font | Material Icons (`class="material-icons"`) for the editor toolbar and form UI |
| UIkit JS | `uikit` (and `uikit/dist/js/uikit-icons`) imported by components for notifications and modals |
| Optional host providers | `MentionableUsersProvider` (see [architecture.md](architecture.md)) |

## 3. Assets served by the host

| Asset | Why |
|---|---|
| `assets/js/sockjs.min.js`, `assets/js/stomp.min.js` | Loaded lazily by `loadWebsocketScripts()` when presence or comments connect, unless `window.SockJS` and `window.Stomp` already exist. In observatory-ui these files live in `src/survey-tool/assets/js` and are added both as global scripts and as assets in `angular.json` |
| `assets/images/loaders/*` | Loader images used by the form pages (`catalogue-ui/assets`) |
| `assets/theme/*.less` | Form and form-builder theme, referenced by component `styleUrls` |

## 4. Peer packages

The library imports these packages and does not bundle them. Versions are those used by observatory-ui at the time of
writing; check the host's `package.json`.

| Package | Used for |
|---|---|
| `@angular/core`, `common`, `forms`, `router`, `platform-browser` | Framework (Angular 20; the README states it is tested with Angular 20) |
| `@angular/material` (datepicker, core) | Date fields |
| `rxjs` | Reactive state |
| `uikit` | Styling, notifications, modals |
| `@ng-select/ng-select` | Select and vocabulary fields |
| `lodash` | Deep copy and comparison |
| `bitset` | Tracking of completed required tabs and field-loading state in `ChapterComponent` |
| `pdfmake` | PDF export |
| `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-image`, `@tiptap/extension-italic` | Rich text editor |

**TipTap versions must be identical** across all `@tiptap/*` packages (the host currently pins `3.32.0`), because each
package peer-requires one exact version of `@tiptap/core` and `@tiptap/pm`. Bump them together and run the editor
specs in `shared/reusable-components/rich-text-editor/`. The former CKEditor 5 packages
(`@ckeditor/ckeditor5-angular`, `@ckeditor/ckeditor5-build-classic`) must be removed from the host.

## 5. Behaviour switches (component inputs)

| Input | Default | Effect |
|---|---|---|
| `enableWebsocket` | `false` | Connects presence and live co-editing |
| `enableCommenting` | `false` | Loads comment threads and connects the comments socket |
| `downloadPDF` | `false` | Shows the PDF export |
| `freeView` | `false` | Shows the form without an answer, read-only. Also switched on automatically when the router URL contains `/freeView` |
| `FormBuilderComponent.customActions`, `backDestination` | `false`, `null` | Replace the default save actions and back navigation |

## Secrets

The library holds no secrets and reads no credentials. Do not add API keys or tokens to the objects passed as `APP_ENV`.
