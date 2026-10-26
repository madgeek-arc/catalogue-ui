# catalogue-ui

Angular library of the EOSC Observatory frontend for **model-driven forms**: it renders a form from a JSON model,
edits such models (form builder), supports live co-editing and field-level comments, exports a form to PDF, and
provides the shared rich text editor.

```
Component:     catalogue-ui
Type:          Frontend library (Angular source module, consumed as a Git submodule)
Status:        Production (embedded in observatory-ui through survey-tool)
Technology:    Angular 22 / TypeScript / RxJS, UIkit, ng-select, TipTap, pdfmake, lodash
API:           Consumes the Observatory forms and comments API; exposes none
Swagger:       n/a (library)
Deployment:    Not independently deployable; compiled into the host application (see observatory-ui/docs/deployment.md)
Documentation: /docs
```

## Role in the platform

catalogue-ui is the lowest layer of the frontend stack:
[observatory-ui](https://github.com/madgeek-arc/observatory-ui) (host application) →
[survey-tool](https://github.com/madgeek-arc/survey-tool) (nests this repository at `catalogue-ui/`) → catalogue-ui.
It has no routes, no authentication and no knowledge of surveys or stakeholders: the host supplies the environment
(`APP_ENV`), the form model, the answer payload and, optionally, the list of users that can be @-mentioned.

## Dependencies

- Backend (via the host's `API_ENDPOINT` and `WS_ENDPOINT`): `/forms/models`, `/survey-answer-comments`, STOMP topics
  for presence, live edits and comments.
- Peer packages: Angular (core, common, forms, router, material), RxJS, UIkit, `@ng-select/ng-select`, `lodash`,
  `bitset`, `pdfmake`, TipTap (see below).

## Documentation

| Document | Contents |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Modules, components, services, extension points |
| [docs/configuration.md](docs/configuration.md) | What the host must provide: `APP_ENV`, assets, styles, packages |
| [docs/integration.md](docs/integration.md) | Backend REST and STOMP contracts, host extension points, failure behaviour |
| [docs/security.md](docs/security.md) | Rich text, HTML rendering, XSRF, trust assumptions |
| [CHANGELOG.md](CHANGELOG.md) | Release history |

Licence: Apache License 2.0, see [LICENSE](LICENSE). The npm packages used by the host application keep their own
licences; the host's production build lists them in `3rdpartylicenses.txt`.

## Host app setup (summary)

Full details are in [docs/configuration.md](docs/configuration.md). Add the following in `app.module.ts`:

```ts
providers: [
  { provide: APP_ENV, useValue: environment },
]
```

### packages

- "@angular/material"
- "@tiptap/core": "3.32.0" (rich text editor, MIT)
- "@tiptap/pm": "3.32.0"
- "@tiptap/starter-kit": "3.32.0"
- "@tiptap/extension-table": "3.32.0"
- "@tiptap/extension-image": "3.32.0"
- "@tiptap/extension-italic": "3.32.0"
- "lodash"

The TipTap packages must be installed at exactly the same version: each of them peer-requires one exact version of
`@tiptap/core` and `@tiptap/pm`.

> **Breaking change (next major version):** the rich text editor is no longer CKEditor 5. Remove
> `@ckeditor/ckeditor5-angular` and `@ckeditor/ckeditor5-build-classic` from your app and install the TipTap packages
> above. See [Rich text editor](#rich-text-editor) for usage and migration notes.

## Rich text editor

`<app-rich-text-editor>` (`RichTextEditorComponent`) is a standalone component built on [TipTap](https://tiptap.dev)
(MIT). It replaced CKEditor 5: no licence key and no "Powered by" logo. It works with `formControlName`, `formControl`
and `ngModel`, and stores the same HTML shape CKEditor did, so existing content keeps working (see the differences
below). Tested with Angular 22.

```html
<app-rich-text-editor formControlName="body" placeholder="Write something"></app-rich-text-editor>
<app-rich-text-editor #editor [(ngModel)]="text" [readonly]="true"></app-rich-text-editor>
```

| Input         | Default              | Description                                                          |
|---------------|----------------------|----------------------------------------------------------------------|
| `placeholder` | `''`                 | Shown while empty; can change at runtime                             |
| `minHeight`   | `150`                | Height of the editing area in px                                     |
| `readonly`    | `false`              | No toolbar, not editable (also applied when the control is disabled) |
| `ariaLabel`   | `'Rich text editor'` |                                                                      |

`editor.focus()` focuses it; `editor.tiptap` is the underlying TipTap `Editor`.

**Value:** an HTML string, `''` when empty (so `Validators.required` works). It changes only on user edits, never when
the value is written programmatically. Output uses the markup CKEditor produced: `<i>` for italics,
`<figure class="table">` with `<thead>`, and no lone `<p>` inside list items or table cells.

**The host app must provide:** the Material Icons font (the toolbar icons use `class="material-icons"`) and UIkit styles
(`uk-select`, `uk-input`, `uk-form-small`).

**Styling:** add `uk-form-danger` to the element to show the error border. CSS variables: `--rte-min-height` (set by
`minHeight`), `--rte-border` and `--rte-danger`.

**Differences from CKEditor 5:** no image upload or media embed and no typographic auto-replacements; links open in the
same tab and only http(s), mailto, tel and relative URLs are accepted. Markup the editor cannot represent (inline
styles, classes, iframes) is dropped when a field is edited; fields that are never edited are never rewritten. The
editor limits what users can create but is not a sanitizer: keep rendering stored HTML through Angular's sanitizer.

**Migrating from CKEditor:** replace `<ckeditor [editor]="editor" [config]="{placeholder: x}">` with
`<app-rich-text-editor placeholder="x">`; `ngModel` and `formControlName` bindings are unchanged. `.ck-*` CSS no longer
applies and `editorInstance` is replaced by `tiptap`.

**Maintenance:** bump all `@tiptap/*` packages together (each peer-requires one exact version) and run the specs in
`shared/reusable-components/rich-text-editor/`. The fixtures in `testing/ckeditor-fixtures.ts` are a one-time snapshot
of CKEditor 5 37.1.0 output; to add cases, install that version temporarily.
