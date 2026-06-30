# Implementation screenshots

---

## Onboarding flow

### Login page (`/login`)

**Figure 1. Login and sign-up page**

The login page lets users sign in with Google OAuth or with an email and password. A toggle at the top switches the form between login and sign-up mode, so new users can create an account on the same screen. 

---

### Step 1. Define roles and goals (`/onboarding/roles`)

**Figure 2. Onboarding step 1 - Define roles and goals**

Users create life roles (e.g. Professional, Parent) by picking a name, icon, and colour, then add long-term goals under each one. Each goal has a star button to mark it as a weekly priority. A warning appears when the total goal count exceeds ten, quoting Covey's advice to keep the main thing the main thing.

---

### Step 2. Sharpen the saw (`/onboarding/sharpen-the-saw`)

**Figure 3. Onboarding step 2 - Sharpen the saw**

The page shows four renewal dimension cards (Physical, Spiritual, Mental, Social/Emotional), each with an input field for adding activities inline. The Next button stays disabled until every dimension has at least one activity, so all four areas are covered before the user moves on.

---

### Step 3. Fixed appointments (`/onboarding/fixed-appointments`)

**Figure 4. Onboarding step 3 - Fixed appointments**

A weekly grid from Monday to Sunday, 6 AM to 10 PM, lets users click any time slot to add a fixed commitment such as a work block or class. Existing appointments can be dragged to reschedule them. A warning dialog appears when two events overlap, and a third overlap is blocked entirely.

---

### Step 4. Schedule tasks (`/onboarding/schedule-tasks`)

**Figure 5. Onboarding step 4 - Schedule tasks**

Tasks are added through a modal that requires linking each one to a role goal or a Sharpen the Saw activity. Fixed appointments from the previous step appear in blue with a lock icon and cannot be moved or edited. Tasks inherit the colour of their linked role or dimension, and toggling the Daily Priority flag adds a star badge to the task's calendar card.

---

### Step 5. Onboarding complete (`/onboarding/complete`)

**Figure 6. Onboarding step 5 - You're set!**

A confirmation screen tells the user their weekly plan is ready and introduces the Evening Reflection and daily check-in habits before directing them to the dashboard. The progress stepper at the top of the page shows all five steps as completed.

---

## Main app (post-onboarding)

### Dashboard (`/dashboard`)

**Figure 7. Dashboard - weekly schedule overview**

The home screen shows a read-only weekly timetable with fixed appointments and goal-linked tasks displayed together. Today's column is highlighted, a live line marks the current time within the day, and a legend at the top separates fixed, priority, and ongoing events.

---

### Roles and goals (`/roles`)

**Figure 8. Roles and goals management**

Users can add, edit, or remove life roles at any point, with long-term goals stored under each one. Hovering a goal row reveals a star button and a delete button. Clicking the star marks the goal as a weekly priority and adds a "Priority" badge next to the goal text.

---

### Evening reflections (`/evening-reflections`)

**Figure 9. Evening reflections**

A sidebar lists the past eight weeks. Selecting a week shows an AI-generated summary (with a short loading delay to simulate generation) and a row of seven day cards where the user can write daily notes. Weeks with at least one entry show a small purple dot next to their label in the sidebar.

---

### History (`/history`)

**Figure 10. History**

Past weeks are listed in a sidebar, and selecting one shows the role goals, Sharpen the Saw activities, and scheduled events from that period. Stat badges at the top show the total number of goals, tasks, and fixed appointments recorded for that week.

---

### Analytics (`/analytics`)

**Figure 11. Analytics**

The page has four charts in a two-column grid: a Sharpen the Saw dimension breakdown, a role-task distribution table, a daily priority completion chart, and a weekly completion rate table. All four charts run on mock data during this prototype phase.

---

### Google Calendar settings (`/settings`)

**Figure 12. Google Calendar settings**

When disconnected, a card prompts the user to link their Google account through OAuth. Once connected, a sync toggle and an export category tree let users control what gets sent to Google Calendar. Fixed Appointments, each Sharpen the Saw sub-dimension, and each role's tasks can be toggled individually, with parent checkboxes going indeterminate when only some of their children are selected. A Save button appears in a sticky footer only when something has changed.

---

## Weekly planning flow (re-plan)

### This week's goals (`/weekly-plan/goals`)

**Figure 13. Weekly plan - select goals**

Users select which long-term role goals to bring into the current week and can also add one-off goals that apply only to this week. After selecting a goal, a star button appears on its row so users can further mark it as a top priority for the week.

---

### This week's sharpen the saw (`/weekly-plan/sharpen-the-saw`)

**Figure 14. Weekly plan - select renewal activities**

The page follows the same layout as the onboarding Sharpen the Saw step. Users pick which existing renewal activities to include this week or add new ones under any of the four dimensions.

---

### Weekly schedule (`/weekly-plan/schedule`)

**Figure 15. Weekly plan - schedule**

The schedule page uses the same Google Calendar-style weekly grid as the onboarding flow, split across two tabs for Fixed Appointments and Tasks. Users can adjust or rebuild their week here without going through the full onboarding sequence. At least one task must be added before the Next button becomes active.
