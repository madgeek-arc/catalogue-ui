# Changelog

All notable changes to catalogue-ui are documented here, newest first. Entries were compiled from the Git history
between release tags (`feat`, `fix`, `refactor`/`perf`/`build` commits); chores, style and submodule bumps are omitted.

## Unreleased

### Breaking changes

- **rich-text-editor:** Replace CKEditor 5 with a TipTap-based editor

### Added

- **form-builder:** Improve model loading for create and edit flows
- **form-builder:** Support custom save actions and configurable back navigation
- **form-builder:** Auto-scroll to selected fields and adopt signal inputs
- **config:** Add configurable WS_TOPICS and lazy websocket script loading
- **websocket:** Make presence service opt-in and fully gated
- **comments:** Gate all commenting side effects behind hasCommenting
- Revamp form builder UI

### Changed

- **styles:** Move form builder utility classes to global theme
- Explicitly define standalone metadata for Angular compatibility
- Explicitly define standalone metadata for Angular compatibility (missing files)
- **websocket:** Provide service at the root injector
- **form-builder:** Move theme styles to assets/theme, default to UIkit colors

### Fixed

- Show paused questions in survey pdf
- **websocket:** Gate WsEdit calls and wire up presence connection lifecycle
- **websocket:** Gate debounced WsEdit send behind enableWebsocket
- **comments:** Send email in mention token to prevent same-name collisions
- Rename 'Survey Id' to 'Model Id'
- **websocket:** Handle access-denied on live-edit writes
- **websocket:** Remove connect-latency and reconnect bugs in comments/active-users sockets
- **websocket:** Fix stale-socket reconnect hang and extend fast-retry window
- **websocket:** Resend active-users join on reconnect, guard errorCallback, disambiguate logs

## 8.1.0 - 2026-06-10

### Added

- Survey commenting feature implementation.
- Survey question paused functionality.
- Allow field labels and comment icons to be clickable when form is in readonly mode.
- Dynamic initialization of vocabularies and urlParams feature
- Get and display all available models with pagination. Save model functionality.
- Form builder supports radio buttons and select drop down.
- Radio and select options configuration display
- Add clear selection for radio button input.
- Enhance form builder UI (highlight selection), move composite field creation to field type selection side menu, migrate styles from SCSS to LESS.
- Model json preview and download functionality.
- Survey preview modal functionality and proper modal cleanup.
- **date-field:** Add clear button to date fields(Start/End Date)
- **model:** Add submission fields
- **comments:** Add mention functionality with @ detection
- **comments:** Populate mentions[] on comment and thread submit
- **form-builder:** Add date/number field support and fix calendar dropdown visibility
- **form-builder:** Support checkbox fields with option management
- **form-builder:** Add field dependency support in settings
- **comments-panel:** Replace reply input with textarea
- **dynamic-form:** Enhance field dependencies with multi-value support and "any value" option
- **form-builder:** Add border toggle for composite fields and improve field duplication
- **mentionable-users:** Add default provider implementation with DI factory
- Form builder (#20)
- **mentions:** Add pipe to visually highlight mentions in comment panel

### Changed

- Angular upgrade to v20.
- Rename boolean input type to bool.
- Input type rename from boolean to bool.
- Add TypeProperties and use filterField instead of 'parentId'
- Remove filterField
- Form model changes
- Minor changes, remove logs
- Removes csrf custom implementation
- Replace inputs and outputs with signals. Other minor fixes.
- **comments:** Replace StakeholderService with MentionableUsersProvider
- **websocket:** Move UserActivity to websocket service and clean up DI

### Fixed

- **dynamic-form:** Render either formArrayName or formControlName to prevent registerOnChange error.
- Replace injection of custom implementation with abstract class
- Commenting threads alignment improvement.
- Set vocabulary
- Remove add comment icon from field label when commenting is disabled.
- Handle paused and external questions only in one place.
- Adds provided in commenting-websocket-service
- Improve radio mapping and handle multi-value arrays in findVal
- **pdf-generate:** Skip paused questions when generating PDF
- **form-builder:** Prevent preview content from disappearing on tab switch
- **comments-panel:** Improve mention dropdown UI and display names
- **comments-panel:** Improve UI display names and mention dropdown
- **styles:** Ensure ng-select clear button is clickable above dropdown arrow
- **pdf-export:** Fix empty answer box layout breaking subsequent content
- **comments:** Fix mention UX and dropdown visibility
- **pdf-export:** Always render answer rows for unanswered fields
- **pdf-generate:** Read checkbox label from field model properties
- **pdf-export:** Skip hidden fields and guard checkbox label pop
- **comments:** Fix anchor positioning, mention context and extraction

## 8.0.1 - 2025-12-02

### Fixed

- Date input field can now handle timestamps, partial dates with no timezone shift.
- Strip time from ISO strings to handle partial date values

## 8.0.0 - 2025-11-26

### Breaking changes

- Date picker now uses the Material calendar; Angular Material is now required

### Added

- Exporting form builder side menu
- New boolean input field
- Allow multiple values for dependsOn field

### Changed

- Theming restructuring.
- Changes for new http client module
- Stand alone migration for angular v19
- Removed unnecessary styles, restructure for proper theming of the project
- Remove unused ng2-date-picker package

### Fixed

- Uikit import
- Prevent application break when provided payload has arrays that are missing from the model
- Display date input border and highlight on focus
- Replace functions in ngFor witch dedicated getters, stop mixing interpolation class="{{...}}" with [ngClass]
- Bitset import error

## 7.0.0 - 2025-05-09

### Added

- Form builder main info page
- Form builder aside sections
- Form builder field settings side menu
- More available field setting, settings are displayed as accordion
- User can see formated field component at form builder
- Delete and duplicate functionality for form builder fields
- Placeholder functionality and code refactor
- User can move fields inside section, add json path max id functionality
- User now can change input type after initial selection, also can set json field name
- Tooltip for json field name input, testing focused question highlight
- Id generation service, add border to focused field

### Changed

- Removing unused code catalogue-ui
- Moved form top section and action bar outside of dynamic catalogue (fixes infinite user loading)
- Safe url pipe input types change

### Fixed

- Better check if values exists for large-text field
- Use optional chaining operator
- Correct path for display property
- Correctly display asterisk for mandatory fields

## 6.1.0 - 2024-11-08

Release history is not itemised: the commits between `6.0.0` and `6.1.0` do not follow the conventional-commit format. See `git log 6.0.0..6.1.0`.

## 1.0.0 / 6.0.0 - 2023-01-11

First tagged release. Earlier history is not itemised.
