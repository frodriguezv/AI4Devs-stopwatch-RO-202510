**Persona**  
Take on the role of an **experienced front-end web developer and UI/UX designer** skilled in semantic HTML, modern CSS, and modular JavaScript.

---

**Context**  
You will be provided two seed files to extend (do not replace from scratch):  
- `index.html`  
- `script.js`  

Visual references you must follow:  
- Site for behavior/feel: https://www.online-stopwatch.com/  
- Image: `res/stopwatch.png` (design guidance)  
- Three attached UI images:  
  1) Mode selector: *Stopwatch* vs *Countdown*  
  2) Shared timer UI (used by both) with **Start** and **Clear**  
  3) Countdown keypad UI: digits **0–9**, **Set**, **Clear**

---

**Desired Outcome**  
Deliver a **responsive Stopwatch + Countdown web app** that:  
- Shares a common timer display/layout between modes  
- Allows seamless switching between modes without losing unrelated state  
- Uses accurate, drift-resistant timing

---

**Tone + Style**  
- Modern, minimalist, and accessible (WCAG-friendly)  
- Clear separation of concerns; readable, well-commented, and modular code  
- No external frameworks required

---

**# Of Options**  
Implement two modes:  
1) **Stopwatch** — start, pause/resume, clear, millisecond precision display; lap support optional  
2) **Countdown** — time entry via keypad (0–9), **Set**, **Start**, **Clear**; when reaching zero: stop, play a short beep (if possible) and visually highlight completion

---

## Reasoning Phase (INTERNAL—DO NOT REVEAL OR PRINT)
Before writing any code, silently do the following and use it to guide your implementation. **Do not include this section in the final output.**
1) **Architecture plan**:  
   - Define a small state machine for `{mode, running, startTimestamp, elapsed, targetMs}`.  
   - Use **`performance.now()` + `requestAnimationFrame`** for rendering and drift correction; persist deltas, not wall-clock.  
   - Organize JS into sections/modules: `state`, `timeUtils`, `render`, `controls`, `audio` (optional beep), and `init`.  
2) **UI mapping**:  
   - Map references to elements: mode switch, shared display, keypad (countdown only), start/pause, resume, clear, set.  
   - Keyboard accessibility: Enter = start/pause, Space = pause/resume, Backspace = delete last digit in keypad mode.  
3) **Edge cases**:  
   - Rapid start/stop; switching modes while running; zero countdown; long runs; background tab; window blur/focus.  
4) **Testing checklist** (self-verify):  
   - Stopwatch accuracy within ~10ms over 1 minute; countdown finishes exactly at 0; switching modes preserves unrelated state; correct enable/disable states; ARIA labels; logical focus order.  
5) **Performance & quality**:  
   - No `setInterval` drift; avoid memory leaks; clean up listeners on re-init; re-render only on state changes.

---

## Output Style
Output **only the final file contents** as raw code blocks for:  
1) `index.html`  
2) `script.js`  
3) (Optional) `style.css` if you add minimal styling  

**Do not include any explanations, headings, or commentary outside the code blocks.**  
If you add `style.css`, ensure `index.html` links it. Keep CSS minimal and aligned with references.

---

## Functional Requirements & Acceptance Criteria
- **Accurate timing**  
  - Use `performance.now()` and a monotonic delta loop.  
  - Render via `requestAnimationFrame`; compute elapsed from anchors to avoid drift.
- **Stopwatch**  
  - Start → begins counting; Pause/Resume toggles; Clear → resets to 00:00:00.000.
- **Countdown**  
  - Keypad builds an HH:MM:SS input; **Set** converts to ms and arms target; **Start** begins countdown; **Clear** resets.  
  - At zero: stop, optional short beep (Web Audio), and display flash.
- **Shared display**  
  - Format as `HH:MM:SS.mmm` with leading zeros.
- **Mode switching**  
  - Switching modes stops the active timer and preserves that mode’s state for when it’s re-entered.
- **Accessibility**  
  - Proper button roles, `aria-live="polite"` on the timer, focus-visible outlines, keyboard shortcuts.
- **Responsiveness**  
  - Layout adapts from mobile to desktop; touch targets ≥44px.

---

## Deliverables
Provide the **final code only** for:
- `index.html`  
- `script.js`  
- (Optional) `style.css`  

No prose, no extra markdown beyond the three code blocks.
