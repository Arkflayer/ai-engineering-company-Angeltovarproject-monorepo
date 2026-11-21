### Reviewer checklist — error handling and resilience

- [ ] Review every changed frontend API/fetch/async flow for visible loading, success, and actionable error states; ensure user-facing errors are readable and have a recovery path.
- [ ] Confirm async UI state is cleaned up on success, failure, and cancellation where relevant; use safe fallbacks for optional data.
- [ ] Review changed backend handlers and external calls for narrowly scoped exception handling, structured HTTP errors, and no sensitive details in client responses.
- [ ] Review changed scripts for defensive input validation, scoped I/O/parse error handling, useful stderr messages, and non-zero exit on critical failure.
- [ ] Check changed logging/error output for secrets, personal data, raw stack traces, internal paths, or credentials.
- [ ] Confirm automated tests cover relevant failure paths, not only successful flows.

Automation is a heuristic; passing checks does not replace reviewer judgment or a full audit when a change warrants one.
