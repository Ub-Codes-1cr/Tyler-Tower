# 🎨 Architectural Directive & Implementation Masterplan: Tyler Tower Version 5 ("Complete Target UI/UX Harmonization")

## 1. System Vision & Visual Alignment Analysis

You are tasked with executing **Version 5** of the **Tyler Tower / Tyler Tower** platform. The primary mission of Version 5 is **Total UI/UX Harmonization**: aligning every single view, overlay, color palette, spatial margin, font hierarchy, and interaction flow to match the exact visual benchmark depicted in the target application captures.

---

### 🔍 Comparative View Audit: Existing Code vs. Target Reference State

```
[ VIEW 1: 3D ISOMETRIC CAMPUS OVERVIEW ]
+----------------------------------------------------+----------------------------------------------------+
| CURRENT STATE (v3/v4 Code)                         | TARGET SPECIFICATION (Reference Screenshot 5)      |
+----------------------------------------------------+----------------------------------------------------+
| • Central Hub: Glowing 3D Ultron-Blue Orb          | • Central Hub: Subtle, clean cream central pod     |
| • Corridors: Radiant blue vector dashed lines      | • Corridors: Smooth, physical arched skybridges    |
| • Background: Flat neutral cream (#FDFFF8)         | • Background: Studio gradient (#B6B3A8 -> #8F8C83) |
| • Navigation: Fixed left command rail (#rail-nav)  | • Navigation: Integrated left rail + bottom mark   |
+----------------------------------------------------+----------------------------------------------------+

[ VIEW 2: THE NEURAL BRAIN GRAPH OVERVIEW ]
+----------------------------------------------------+----------------------------------------------------+
| CURRENT STATE (v3/v4 Code)                         | TARGET SPECIFICATION (Reference Screenshot 1)      |
+----------------------------------------------------+----------------------------------------------------+
| • Background: Light/semi-dark transparent overlay  | • Background: Deep obsidian midnight (#0B0E14)     |
| • Header: Centered top controls                    | • Header: Fixed left category chips + right search |
| • Side Inspector: Basic 340px text pane            | • Side Inspector: Styled right drawer with serif   |
| • Nodes: Standard single-color circles             | • Nodes: Multi-colored department-coded nodes      |
+----------------------------------------------------+----------------------------------------------------+

[ VIEW 3: COMPANY BOARD KANBAN VIEW ]
+----------------------------------------------------+----------------------------------------------------+
| CURRENT STATE (v3/v4 Code)                         | TARGET SPECIFICATION (Reference Screenshot 4)      |
+----------------------------------------------------+----------------------------------------------------+
| • Layout: Standard 4-column layout                 | • Layout: 6 Department rows x 5 Status columns     |
| • Header: Basic text title                         | • Header: "Tyler Tower Today's board" + counter   |
| • Card Design: Dense compact cards                 | • Card Design: Rounded white cards with progress   |
+----------------------------------------------------+----------------------------------------------------+

[ VIEW 4: MONTH & WEEK CALENDAR MATRIX ]
+----------------------------------------------------+----------------------------------------------------+
| CURRENT STATE (v3/v4 Code)                         | TARGET SPECIFICATION (Reference Screenshot 3)      |
+----------------------------------------------------+----------------------------------------------------+
| • Layout: Standard full-screen grid                | • Layout: Left routine sidebar + right grid        |
| • Styling: Basic borders                           | • Styling: Soft rounded day cells with dark font   |
| • Filter Bar: Top dropdowns                        | • Filter Bar: Department chip pills (EMAILS, etc.) |
+----------------------------------------------------+----------------------------------------------------+

[ VIEW 5: AGENT FOCUS RAIL & CHAT INTERACTION ]
+----------------------------------------------------+----------------------------------------------------+
| CURRENT STATE (v3/v4 Code)                         | TARGET SPECIFICATION (Reference Screenshot 2)      |
+----------------------------------------------------+----------------------------------------------------+
| • Docking: Right-side task panel overlay           | • Docking: Left-docked chat drawer                 |
| • Typography: Standard UI font                     | • Typography: Instrument Serif header + sub-stats   |
| • Approval Flow: Simple button row                 | • Approval Flow: Rich preview mockups (.mk-doc)    |
+----------------------------------------------------+----------------------------------------------------+
```

---

## 2. Core Visual Specifications & Color Palette Rules

### 2.1 The Unified "Nominal Studio" Color Matrix
To achieve the exact aesthetic across dark and light modes, enforce these `:root` CSS design tokens in [`src/shell.html`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/shell.html):

```css
:root {
  /* Surface & Base Tints */
  --cream: #FDFFF8;
  --cream-dark: #F2F3EA;
  --obsidian-bg: #0B0E14;
  --obsidian-card: #141822;
  --studio-gradient-start: #B6B3A8;
  --studio-gradient-end: #8F8C83;
  
  /* Text & Line Tokens */
  --ink: #151414;
  --grey: #5A5A5A;
  --hairline: rgba(21, 20, 20, 0.12);
  --hairline-dark: rgba(255, 255, 255, 0.10);
  
  /* Department Palette Chips */
  --chip-emails: #5ADEB7;
  --chip-delivery: #8FD3F4;
  --chip-sales: #EADC8F;
  --chip-marketing: #E69393;
  --chip-finance: #98A5EF;
  --chip-ops: #BFA2E3;
  --chip-brain: #D1DECD;

  /* Typography Fonts */
  --font-serif: "Instrument Serif", Georgia, "Times New Roman", serif;
  --font-ui: Inter, -apple-system, "Helvetica Neue", sans-serif;
  --font-mono: Menlo, Monaco, "Courier New", monospace;
}
```

---

## 3. Detailed Step-by-Step Refactoring Blueprint

### Step 1: 3D Campus Overview & Arched Walkway Restructure ([`src/builders.js`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/builders.js) & [`src/main.js`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/main.js))
1. **Arched Walkway Corridors**:
   - Re-enable physical arched walkway meshes (`makeWalkway(from, to)`) connecting the central Brain plinth rim to each of the 26 satellite platforms.
   - Maintain the standard distance radial tiers ($R_1 = 60.0, R_2 = 115.0, R_3 = 175.0$) verified by `campus-probe.mjs`.
2. **Camera Projection & Viewport Framing**:
   - Apply `fitOverviewZoom()` math in `src/main.js` with camera origin offset $(-9, 0, -9)$:
   
   $$\text{Occupied Width} = W_{\text{sidebar}} (72\text{px}) + W_{\text{taskpanel}} (400\text{px})$$
   
   $$\text{Panel Fraction} = \min\left(0.45, \frac{\text{Occupied Width}}{\text{Viewport Width}}\right)$$

3. **Background & Studio Lighting Mode**:
   - Set default canvas background to `#B6B3A8` to `#8F8C83` radial gradient when studio mode is active.

---

### Step 2: The Neural Brain Graph Dark Mode Overhaul ([`src/brain.js`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/brain.js) & [`src/shell.html`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/shell.html))
As shown in **Reference Screenshot 1**:
1. **Deep Obsidian Backdrop**:
   - Set `#brainOv` background to `#0B0E14` with a subtle radial glow around the central node cluster.
2. **Category Chip Header Bar**:
   - Shift header controls `.bv-top` to `left: 88px` (clearing the 72px left rail).
   - Render pill chips: `BUSINESS`, `BRAND`, `CUSTOMERS`, `MARKETING`, `EMAILS`, `SALES`, `DELIVERY`, `FINANCE`, `OPERATIONS`.
3. **Right Inspector Drawer**:
   - Render `.bv-pane` (`width: 340px`, `background: #141822`, `border-left: 1px solid rgba(255,255,255,0.08)`).
   - Display header `"THE BRAIN"` in Instrument Serif with node counts (`350 NOTES · 76 LINKS`).
   - Default helper text: *"Click a note to read it. Hover to see its neighbours."*

---

### Step 3: Company Board 6x5 Grid Alignment ([`src/tasks.js`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/tasks.js) & [`src/shell.html`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/shell.html))
As shown in **Reference Screenshot 4**:
1. **Header Layout & Counter Metrics**:
   - Display `"Tyler Tower Today's board"` on the top left.
   - Display status counts on top right: `SCHEDULED 0`, `IN PROGRESS 35`, `BACKLOG 25`, `WAITING 0`, `DONE 79`.
2. **6-Department Lane Rows**:
   - Render 6 horizontal department lanes: `EMAILS` (5 agents), `SALES` (6 agents), `MARKETING` (7 agents), `OPERATIONS` (6 agents), `FINANCE` (4 agents), `DELIVERY` (7 agents).
3. **5 Status Columns**:
   - Columns: `SCHEDULED`, `BACKLOG`, `IN PROGRESS`, `WAITING ON APPROVAL`, `DONE`.
   - Cards in `DONE` column render with strikethrough typography (`text-decoration-thickness: 1.5px; text-decoration-color: #1E9070;`).

---

### Step 4: Month & Week Calendar Matrix Refactoring ([`src/calendar.js`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/calendar.js) & [`src/shell.html`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/shell.html))
As shown in **Reference Screenshot 3**:
1. **Header Controls & Navigation**:
   - Title `"CALENDAR Tyler Tower V3 (BETA)"`.
   - Toggle buttons: `WEEK`, `MONTH`, navigation arrows (`<`, `>`), and `TODAY` button.
2. **Filter Chips**:
   - Render department filter chips (`EMAILS`, `SALES`, `MARKETING`, `OPERATIONS`, `FINANCE`, `DELIVERY`, `ROUTINES`, `DONE`).
3. **Left Routines Sidebar & Date Grid**:
   - Left sidebar displaying routine counts and setup helper text.
   - Date cells rendered with crisp Instrument Serif numbers (`28`, `29`, `30`, `OCT 01`, etc.) and task cards stacked inside completed days.

---

### Step 5: Agent Focus Rail & Chat Interface ([`src/citizen-card.js`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/citizen-card.js) & [`src/shell.html`](file:///c:/Users/syedu/OneDrive/Desktop/Tyler-Tower/tyler-core/src/shell.html))
As shown in **Reference Screenshot 2**:
1. **Left-Docked Chat Rail**:
   - When an agent or department is selected, slide out `#railAgent` docked on the left (`width: 360px`).
2. **Header Metrics**:
   - Department name (`DELIVERY`), agent total (`7 AGENTS`), sent stats (`9 SENT`), and status bars (`11 / 12`).
3. **Lead Profile Card & Workstream Messages**:
   - Agent title (`DELIVERY LEAD`), role description, and chat message bubble with live workstream notes.
   - Interactive action chips: `Anything at risk?`, `What shipped this month?`, `Do we have capacity?`.

---

## 4. Automation & Verification Protocol

Execute the standard verification pipeline to ensure zero regressions:

```bash
# 1. Verify Spatial & Corridor Probes
node scripts/campus-probe.mjs
node scripts/campus-curves.mjs

# 2. Compile Production Bundle
npm run build

# 3. Test Local Server Execution
node serve.mjs
```

---

> [!NOTE]
> This master directive captures all 35 features, UI visual specs, font contracts, CSS color codes, and spatial math formulas needed to transform the application into Version 5.
