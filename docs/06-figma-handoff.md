# Figma Handoff: Seven Core Screens

## Board file

Import `assets/wireframe/pocket-7-screen-board.svg` into Figma (File → Place image, or drag the SVG onto the canvas). The SVG is vector-based and can be ungrouped into editable objects. Use a 390 × 844 px Android frame for each production screen; the board contains scaled previews plus the prototype map.

This is a handoff board, not a claim that a Figma cloud file or a clickable Figma prototype has already been created. In Figma, make each preview its own 390 × 844 frame and connect the hot spots using the route list below. Keep the component and token names from `05-style-guide.md`.

## Seven frames and key contents

| # | Frame | Primary content | Main action |
|---:|---|---|---|
| 1 | Semester setup | Semester dates, total available, calculated weekly amount | Continue to category setup |
| 2 | Category plan | Suggested categories and weekly allocation total | Create plan |
| 3 | Home | Left this week, progress, daily bars, category totals | Add a spend |
| 4 | Add / edit spend | Amount, category, date, optional note | Save spend |
| 5 | Budget alert | Amount over weekly limit, day chart, recovery options | Adjust plan / Got it |
| 6 | Week review | Budget vs spent, category meters, transaction history | Edit a transaction |
| 7 | Insights | Monthly category breakdown and semester projection | Return to Home |

Welcome is an entry state before frame 1. Editing reuses frame 4 with the selected transaction prefilled. Delete is a confirmation overlay from frame 6; it is an interaction state, not another top-level frame.

## Prototype connections to create

| From | Hot spot | To | Behavior |
|---|---|---|---|
| Welcome | Build my budget | 1 Semester setup | Navigate |
| 1 Semester setup | Next | 2 Category plan | Navigate after valid setup |
| 2 Category plan | Create my plan | 3 Home | Navigate after allocation balances |
| 3 Home | Add button | 4 Add spend | Open blank editor |
| 4 Add spend | Save | 3 Home | Save; show frame 5 only if over budget |
| 3 Home | Week | 6 Week review | Navigate |
| 3 Home | Insights | 7 Insights | Navigate |
| 6 Week review | Transaction edit | 4 Edit spend | Open with values prefilled |
| 4 Edit spend | Save | 6 Week review | Save and return |
| 6 Week review | Delete | Confirmation overlay | Confirm removes; cancel returns |
| 3 Home | Overspend status | 5 Budget alert | Show when budget is exceeded |
| 5 Budget alert | Adjust my plan | 2 Category plan | Return to editable plan |
| 5 Budget alert | Got it / close | 3 Home | Dismiss |
| 7 Insights | Home | 3 Home | Navigate |

Use **On tap → Navigate to** with the destination frame. Keep the prototype device preset at Android Small / 390 × 844; use vertical scrolling where content extends below the visible area. Use instant navigation for this early prototype.

## App-to-frame mapping

The working app contains Welcome plus seven core task frames. Setup's first form and category allocation are separate implementation screens. For a focused Figma prototype, Welcome is the entry state and the seven listed frames cover the main student flow. The Week screen is included because it is the only place to review and edit transaction history.
