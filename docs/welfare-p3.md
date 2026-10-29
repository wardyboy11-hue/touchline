# Welfare P3: Respect code and My data

## What it does
- **Parents Respect code.** Once a season each parent reads a plain English summary of the FA code, with a link, types their name and taps I agree. We store the child id, season, name typed and the date. Nothing else. It resets every season.
- **Player code.** Optional, one tap, on the Me tab only. Nobody chases players.
- **Coach Today card and Team, Privacy tab.** Shows who has not signed (shirt numbers only) and the data requests waiting.
- **My data (parents only).** Says what the app keeps, why, who sees it and for how long. Parent can download their child's data as JSON or CSV and ask for it to be deleted.
- **Deletion requests.** Land in a coach queue. Nothing is deleted until a coach taps Erase.
- **Retention.** The monthly job clears Respect rows from earlier seasons and logs the count to RetentionLog. Consent, goals and head injury purges run from the same job.

## What the export holds
Only that child's own entries: name, shirt, answers, photo choice and contacts, goals, Respect sign offs, library items, head injury dates. Coach notes, marks and welfare notes are left out. The file says so and tells the parent to ask Tim for a full copy.

## What Erase removes
Consent, Goals, Respect, Answers, Self, FtMarks, Photos, LibReq and LibGive rows for the child. Head injury rows go only if the plan is complete. A plan in progress stays. Squad registration is untouched. It logs to RetentionLog with the shirt number.

## Apps Script steps
1. Add `mydata.gs` as a new script file.
2. Add the dispatcher lines in `Code.gs` (respect.list, datareq.list, datareq.erase, datareq.close, and the family f.respect.* and f.mydata.* ones).
3. Run `consentInstallTrigger_` once if you have not already.
4. Deploy a new version.

## Test steps against the acceptance boxes
| Box | How to check |
|---|---|
| Stores name and date only, resets each season | `node tests/welfare/p3-mydata-backend.js`, look for "respect sign offs reset next season" |
| Coach list accurate, no nagging players | `node tests/welfare/p3-browser.js`: Privacy tab lists shirt 9 as outstanding; player view has no push and no chase |
| Export has only the linked child | backend test "export only holds that child"; browser test checks both downloads |
| Deletion request reaches coach queue and is actionable | browser test: request sent, then Erase clears the queue |
| Retention job logs what it removed | backend test checks the RetentionLog row |

## Decision for Tim
Erase is a coach tap, not automatic. That keeps a child's head injury record safe mid plan and stops a mistaken tap wiping a season of data.
