# catalogue

## App Module Configuration

Add the following in `app.module.ts`:

```ts
providers: [
  { provide: APP_ENV, useValue: environment },
]
```

### packages

- "@angular/material"
- "@ckeditor/ckeditor5-angular": "^6.0.1",
- "@ckeditor/ckeditor5-build-classic": "^37.1.0",
- "lodash"
