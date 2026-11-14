# Design Decisions

## Product direction

**pocket** is a calm, student-first weekly spending companion. It helps someone make one semester plan, log a purchase quickly, and check their pace without connecting a bank account.

## Decisions and reasons

| Decision | Rationale | How it appears in the interface |
|---|---|---|
| Lead with the weekly balance | A student needs a useful answer at a glance, not a finance dashboard full of unfamiliar measures. | Home puts “left to spend this week” first, then spending pace and category totals. |
| Turn a semester total into a weekly amount | A large semester number is hard to act on day to day. | Setup previews an average weekly budget before the plan is created. |
| Make expense entry short | Manual tracking only works if it feels manageable. | Amount is the first field; common amounts, a category suggestion, and a quick date choice reduce typing. |
| Keep the user in control of categorisation | Automatic guesses can be wrong, and students use personal categories. | The category suggestion is editable; the weekly category plan can be renamed and adjusted. |
| Make overspending direct but supportive | A warning should prompt a next step without shaming the user. | A distinct alert state explains the amount over budget and offers plan adjustment or dismissal. |
| Show history and trends separately | Transaction details and longer-term patterns answer different questions. | Week holds transactions and category comparisons; Insights holds monthly totals and semester projection. |
| Work without an account or network | The project should be useful with a simple local setup and no banking access. | Budget data stays on-device; backup import and export are visible from Home. |
| Use color with text and shape cues | Color alone is not enough to communicate a budget state. | Status labels and explanatory copy accompany blue, gold, and red states. |

## Trade-offs and follow-up

- A fixed average weekly budget is easy to understand, but does not account for uneven semester costs. Keep category allocation editable and validate the weekly amount with students.
- Local-only storage avoids account setup but does not sync across devices. Explain the backup action clearly and test whether people can find it.
- Manual entry is simple, but entry speed must be checked in usability sessions before claiming it takes three taps.
- The interface supports small phone widths and safe-area insets. Confirm readability and keyboard behavior on the team's actual Android devices.

## Evidence status

These are current design hypotheses based on the project brief and the Aarav student persona in `02-research-and-personas.md`. They are not presented as validated research findings. Record participant observations and changes in `07-usability-test.md` after sessions.
