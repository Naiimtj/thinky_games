---
agent: agent
model: claude-sonnet
description: Display model usage statistics, details, or interactive chart from model_usage.md
name: modelUsage
---

# /modelUsage - Model Usage Analysis

## Command Usage

Use `/modelUsage` to analyze and visualize token usage data from `.history/model_usage.md`.

**Syntax:**

- `/modelUsage` - Display usage statistics (default)
- `/modelUsage --details` or `/modelUsage -d` - Display complete table
- `/modelUsage --chart` or `/modelUsage -c` - Generate interactive chart
- `/modelUsage --help` or `/modelUsage -h` - Display help information

## Purpose

Analyze and visualize token usage data from `.history/model_usage.md` with three modes of operation:

- **Default mode**: Display usage statistics and top 3 models
- **Details mode**: Display the complete table from model_usage.md
- **Chart mode**: Generate interactive HTML visualization

## When to Use /modelUsage

Invoke this command to:

- Review overall token usage statistics and identify most-used models
- View detailed breakdown of all iterations
- Generate visual reports for sharing or analysis

## File Location and Naming

- **Source File**: `.history/model_usage.md`
- **Chart Output**: `.history/model_usage_chart.html` (Chart Mode only)

## Command Execution Summary

When the user types `/modelUsage` with optional parameters, follow the detailed workflow below based on the mode.

**Mode Detection:**

1. Read `.history/model_usage.md` and parse the markdown table
2. Determine mode: `--chart/-c` → Chart Mode | `--details/-d` → Details Mode | No params → Statistics Mode
3. Execute the appropriate mode workflow

## Command Details

### Statistics Mode (Default)

**When to use:** No parameters provided to `/modelUsage`

**Execution steps:**

1. Calculate total statistics from all iterations:
   - Total input tokens
   - Total output tokens
   - Total tokens (input + output + reasoning)
   - Total iterations
   - Average tokens per iteration
   - Total files read/created/modified

2. Identify top 3 most used models:
   - Count usage frequency for each model
   - Sort by frequency (descending)
   - Show top 3 models with their usage count and percentage

3. Display formatted output:

```
📊 Model Usage Statistics

Total Iterations: [count]
Total Input Tokens: [count with commas]
Total Output Tokens: [count with commas]
Total Reasoning Tokens: [count with commas]
Total All Tokens: [count with commas]
Average Tokens/Iteration: [count with commas]

📁 File Operations:
- Files Read: [count]
- Files Created: [count]
- Files Modified: [count]

🤖 Top 3 Models:
1. [Model Name] - [count] uses ([percentage]%)
2. [Model Name] - [count] uses ([percentage]%)
3. [Model Name] - [count] uses ([percentage]%)
```

### Details Mode (--details or -d)

**When to use:** `--details` or `-d` parameter provided

**Execution steps:**

1. Read the complete markdown table from `.history/model_usage.md`
2. Display the entire table with proper markdown formatting
3. Include brief summary line

**Output format:**

```
📋 Model Usage Details

[Complete markdown table from model_usage.md]

Total: [X] iterations
```

### Chart Mode (--chart or -c)

**When to use:** `--chart` or `-c` parameter provided

**Execution steps:**

1. **Generate HTML chart file**
   - Create (or overwrite) `.history/model_usage_chart.html`
   - Use the EXACT template provided in the "HTML Template" section below
   - Replace ONLY the data in the `iterations` array with parsed data from model_usage.md
   - Keep ALL styling, structure, and JavaScript logic identical to the template
   - NO external libraries - pure HTML/CSS/JavaScript
   - BASF brand colors throughout

2. **Open in browser**
   - Use `run_in_terminal` with PowerShell command
   - Command: `Start-Process "c:\Users\ChesneFr\OneDrive - BASF\02_LabDataSolutions\Workshops\2025.12_Team_Hackathon\hackathon_agentic_coding_20251205\.history\model_usage_chart.html"`

## Output Messages

**Statistics Mode:**

```
📊 Analyzing model usage...
```

**Details Mode:**

```
📋 Retrieving model usage details...
```

**Chart Mode:**

```
📊 Generating token usage chart...
```

**Progress updates (Chart Mode only):**

- "Reading model usage data..."
- "Creating interactive chart..."
- "Opening in browser..."

**Completion message (Chart Mode):**

```
Model usage chart created and opened in browser.
```

### Chart Requirements

#### BASF Brand Colors

- **Background**: BASF Light Blue (#21A0D2) to Dark Blue (#004A96) gradient
- **Input bars**: BASF Dark Green (#00793A) to Light Green (#65AC1E)
- **Output bars**: BASF Dark Blue (#004A96) to Light Blue (#21A0D2)
- **Ratio line & dots**: BASF Orange (#F39500)
- **Stat card borders**: Green (#00793A), Dark Blue (#004A96), Orange (#F39500), Red (#C50022), Light Blue (#21A0D2)

#### Visual Design

- Modern, clean interface with professional BASF styling
- Responsive layout (works on different screen sizes)
- Grouped bar chart (not stacked) for easy comparison
- NO Y-axis labels or grid lines
- Ratio line with interactive dots overlaying the chart
- Proper spacing and padding
- White container with rounded corners and shadow

#### Data Presentation

- X-axis: Iteration names (Iteration 1, Iteration 2, etc.)
- Two bar datasets: Input Tokens (green gradient bars) and Output Tokens (blue gradient bars)
- Orange line connecting ratio dots across iterations
- Legend at top showing Input Tokens, Output Tokens, and Output/Input Ratio (%)
- Chart title: "Input vs Output Tokens per Iteration"
- Subtitle: "Hackathon Agentic Coding - [Current Date]"

#### Interactive Features

- Hover tooltips on bars AND ratio dots showing:
  - Model name
  - Input Tokens (formatted with thousands separators)
  - Output Tokens (formatted with thousands separators)
  - Output/Input Ratio (%)
  - Files Read
  - Files Created
  - Files Modified
  - Summary text
- Bar hover effects: opacity change and translateY transform
- Ratio dot hover effects: scale 1.5x transform
- Smooth CSS transitions (NO animations that hide bars)

#### Statistics Cards

Display below chart in responsive grid layout with BASF color accents:

1. Total Input Tokens (green left border #00793A)
2. Total Output Tokens (dark blue left border #004A96)
3. Total All Tokens (orange left border #F39500)
4. Total Iterations (red left border #C50022)
5. Average Tokens/Iteration (light blue left border #21A0D2)

Each card has:

- Gradient background (#f5f7fa to #c3cfe2)
- Hover effect (translateY -5px with shadow)
- Uppercase label
- Large bold value with thousands separators

#### HTML Template

**Use this EXACT template - only replace the `iterations` array data:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Token Usage - Hackathon Agentic Coding</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
          Cantarell, sans-serif;
        padding: 20px;
        background: linear-gradient(135deg, #21a0d2 0%, #004a96 100%);
        min-height: 100vh;
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      h1 {
        color: #2c3e50;
        margin-bottom: 10px;
        font-size: 32px;
      }

      .subtitle {
        color: #7f8c8d;
        margin-bottom: 40px;
        font-size: 16px;
      }

      .chart-wrapper {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 30px;
        margin-bottom: 40px;
      }

      .chart-title {
        font-size: 18px;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 30px;
        text-align: center;
      }

      .chart-container {
        position: relative;
        height: 500px;
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        padding: 20px 20px 40px 20px;
        border-bottom: 2px solid #ddd;
      }

      .secondary-y-axis {
        display: none;
      }

      .ratio-line-container {
        position: absolute;
        left: 20px;
        right: 80px;
        top: 20px;
        bottom: 40px;
        pointer-events: none;
      }

      .ratio-line {
        position: absolute;
        width: 100%;
        height: 100%;
      }

      .ratio-dot {
        position: absolute;
        width: 12px;
        height: 12px;
        background: #f39500;
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        pointer-events: all;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .ratio-dot:hover {
        transform: scale(1.5);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }

      .iteration-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        flex: 1;
        max-width: 150px;
      }

      .bars-container {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        height: 440px;
      }

      .bar {
        width: 40px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 6px 6px 0 0;
      }

      .bar:hover {
        opacity: 0.8;
        transform: translateY(-5px);
      }

      .bar.input {
        background: linear-gradient(to top, #00793a, #65ac1e);
        border: 2px solid #00793a;
      }

      .bar.output {
        background: linear-gradient(to top, #004a96, #21a0d2);
        border: 2px solid #004a96;
      }

      .x-label {
        font-size: 12px;
        color: #555;
        text-align: center;
        margin-top: 10px;
        font-weight: 500;
      }

      .tooltip {
        position: fixed;
        background: rgba(0, 0, 0, 0.95);
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.8;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      }

      .tooltip.visible {
        opacity: 1;
      }

      .tooltip-title {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        padding-bottom: 8px;
      }

      .tooltip-line {
        margin: 4px 0;
      }

      .tooltip-section {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      .legend {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-bottom: 20px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #555;
      }

      .legend-color {
        width: 24px;
        height: 16px;
        border-radius: 3px;
        border: 2px solid;
      }

      .legend-color.input {
        background: linear-gradient(to right, #00793a, #65ac1e);
        border-color: #00793a;
      }

      .legend-color.output {
        background: linear-gradient(to right, #004a96, #21a0d2);
        border-color: #004a96;
      }

      .legend-line {
        width: 30px;
        height: 3px;
        background: #f39500;
        position: relative;
      }

      .legend-line::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        background: #f39500;
        border: 2px solid white;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
        margin-top: 40px;
      }

      .stat-card {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 24px;
        border-radius: 8px;
        border-left: 5px solid #00793a;
        transition: transform 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      }

      .stat-label {
        font-size: 14px;
        color: #555;
        margin-bottom: 8px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #2c3e50;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>📊 Token Usage Analysis</h1>
      <p class="subtitle">Hackathon Agentic Coding - November 24, 2025</p>

      <div class="chart-wrapper">
        <div class="chart-title">Input vs Output Tokens per Iteration</div>
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color input"></div>
            <span>Input Tokens</span>
          </div>
          <div class="legend-item">
            <div class="legend-color output"></div>
            <span>Output Tokens</span>
          </div>
          <div class="legend-item">
            <div class="legend-line"></div>
            <span>Output/Input Ratio (%)</span>
          </div>
        </div>
        <div class="chart-container" id="chartContainer">
          <div class="secondary-y-axis" id="secondaryYAxis">
            <div class="secondary-y-title">Ratio (%)</div>
          </div>
          <div class="ratio-line-container" id="ratioLineContainer">
            <svg class="ratio-line" id="ratioLine">
              <polyline
                id="ratioPolyline"
                fill="none"
                stroke="#F39500"
                stroke-width="3"
              />
            </svg>
          </div>
        </div>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">Total Input Tokens</div>
          <div class="stat-value" id="totalInput">0</div>
        </div>
        <div class="stat-card" style="border-left-color: #004A96;">
          <div class="stat-label">Total Output Tokens</div>
          <div class="stat-value" id="totalOutput">0</div>
        </div>
        <div class="stat-card" style="border-left-color: #F39500;">
          <div class="stat-label">Total All Tokens</div>
          <div class="stat-value" id="totalAll">0</div>
        </div>
        <div class="stat-card" style="border-left-color: #C50022;">
          <div class="stat-label">Total Iterations</div>
          <div class="stat-value" id="totalIterations">5</div>
        </div>
        <div class="stat-card" style="border-left-color: #21A0D2;">
          <div class="stat-label">Avg Tokens/Iteration</div>
          <div class="stat-value" id="avgTokens">0</div>
        </div>
      </div>
    </div>

    <div class="tooltip" id="tooltip"></div>

    <script>
      // Data from model_usage.md - REPLACE THIS ARRAY WITH PARSED DATA
      const iterations = [
        {
          name: 'Iteration 1',
          model: 'claude-sonnet',
          input: 56697,
          output: 900,
          filesRead: 3,
          filesCreated: 2,
          filesModified: 1,
          summary:
            'Created skills.prompt.md for quick skill information access',
        },
        {
          name: 'Iteration 2',
          model: 'claude-sonnet',
          input: 78886,
          output: 800,
          filesRead: 5,
          filesCreated: 1,
          filesModified: 2,
          summary:
            'Fixed history.prompt.md to enforce mandatory raw chat archiving',
        },
        {
          name: 'Iteration 3',
          model: 'claude-sonnet',
          input: 78073,
          output: 1200,
          filesRead: 4,
          filesCreated: 0,
          filesModified: 2,
          summary:
            'Enhanced skills command to work across all modes with simpler output',
        },
        {
          name: 'Iteration 4',
          model: 'claude-sonnet',
          input: 85477,
          output: 1100,
          filesRead: 3,
          filesCreated: 1,
          filesModified: 2,
          summary:
            'Successfully implemented raw chat archive creation workflow',
        },
        {
          name: 'Iteration 5',
          model: 'claude-sonnet',
          input: 107969,
          output: 1300,
          filesRead: 2,
          filesCreated: 1,
          filesModified: 2,
          summary:
            'Simplified workflow messages removing step numbers and adding completions',
        },
      ];

      // Calculate totals and max values
      const totalInput = iterations.reduce((sum, it) => sum + it.input, 0);
      const totalOutput = iterations.reduce((sum, it) => sum + it.output, 0);
      const totalAll = totalInput + totalOutput;
      const avgTokens = Math.round(totalAll / iterations.length);
      const maxValue = Math.max(...iterations.map((it) => it.input));
      const yAxisMax = Math.ceil(maxValue / 10000) * 10000; // Round up to nearest 10k

      // Calculate ratios for each iteration
      const ratios = iterations.map((it) => (it.output / it.input) * 100);
      const maxRatio = Math.max(...ratios);
      const minRatio = Math.min(...ratios);
      const ratioRange = maxRatio - minRatio;
      const ratioAxisMax = Math.ceil(maxRatio * 1.2 * 10) / 10; // Add 20% padding, round to 1 decimal
      const ratioAxisMin = Math.max(0, Math.floor(minRatio * 0.8 * 10) / 10); // Subtract 20%, but not below 0

      // Update stats
      document.getElementById('totalInput').textContent =
        totalInput.toLocaleString();
      document.getElementById('totalOutput').textContent =
        totalOutput.toLocaleString();
      document.getElementById('totalAll').textContent =
        totalAll.toLocaleString();
      document.getElementById('avgTokens').textContent =
        avgTokens.toLocaleString();

      // Create secondary Y-axis labels
      const secondaryYAxis = document.getElementById('secondaryYAxis');
      const numSecondaryLabels = 6;
      const ratioStep =
        (ratioAxisMax - ratioAxisMin) / (numSecondaryLabels - 1);

      for (let i = 0; i < numSecondaryLabels; i++) {
        const value = ratioAxisMin + ratioStep * i;
        const label = document.createElement('div');
        label.className = 'secondary-y-label';
        label.textContent = value.toFixed(2) + '%';
        secondaryYAxis.appendChild(label);
      }

      // Create bars
      const chartContainer = document.getElementById('chartContainer');
      iterations.forEach((iteration, index) => {
        const group = document.createElement('div');
        group.className = 'iteration-group';

        const barsContainer = document.createElement('div');
        barsContainer.className = 'bars-container';

        // Input bar
        const inputBar = document.createElement('div');
        inputBar.className = 'bar input';
        const inputHeight = (iteration.input / yAxisMax) * 440; // Use yAxisMax for proper scaling
        inputBar.style.height = `${inputHeight}px`;
        inputBar.dataset.type = 'input';
        inputBar.dataset.index = index;

        // Output bar (scaled relative to max, but visible)
        const outputBar = document.createElement('div');
        outputBar.className = 'bar output';
        const outputHeight = (iteration.output / yAxisMax) * 440; // Use yAxisMax for proper scaling
        outputBar.style.height = `${Math.max(outputHeight, 5)}px`; // Minimum 5px visibility
        outputBar.dataset.type = 'output';
        outputBar.dataset.index = index;

        barsContainer.appendChild(inputBar);
        barsContainer.appendChild(outputBar);

        const label = document.createElement('div');
        label.className = 'x-label';
        label.textContent = iteration.name;

        group.appendChild(barsContainer);
        group.appendChild(label);
        chartContainer.appendChild(group);

        // Add hover events
        [inputBar, outputBar].forEach((bar) => {
          bar.addEventListener('mouseenter', showTooltip);
          bar.addEventListener('mousemove', moveTooltip);
          bar.addEventListener('mouseleave', hideTooltip);
        });
      });

      // Draw ratio line and dots
      const ratioLineContainer = document.getElementById('ratioLineContainer');
      const svgLine = document.getElementById('ratioLine');
      const polyline = document.getElementById('ratioPolyline');
      const containerWidth = ratioLineContainer.offsetWidth;
      const containerHeight = 440; // Match bars container height

      // Calculate positions for ratio dots
      const barGroups = document.querySelectorAll('.iteration-group');
      const points = [];

      barGroups.forEach((group, index) => {
        const groupRect = group.getBoundingClientRect();
        const containerRect = ratioLineContainer.getBoundingClientRect();
        const ratio = ratios[index];

        // X position: center of the iteration group
        const xPos = groupRect.left + groupRect.width / 2 - containerRect.left;

        // Y position: scaled based on ratio axis
        const yPercent = (ratio - ratioAxisMin) / (ratioAxisMax - ratioAxisMin);
        const yPos = containerHeight - yPercent * containerHeight;

        points.push(`${xPos},${yPos}`);

        // Create dot
        const dot = document.createElement('div');
        dot.className = 'ratio-dot';
        dot.style.left = `${xPos - 6}px`; // Center the dot (12px width / 2)
        dot.style.bottom = `${yPercent * containerHeight - 6}px`; // Center the dot (12px height / 2)
        dot.dataset.index = index;
        dot.addEventListener('mouseenter', showTooltip);
        dot.addEventListener('mousemove', moveTooltip);
        dot.addEventListener('mouseleave', hideTooltip);
        ratioLineContainer.appendChild(dot);
      });

      // Draw the line connecting dots
      polyline.setAttribute('points', points.join(' '));

      // Tooltip functions
      const tooltip = document.getElementById('tooltip');

      function showTooltip(e) {
        const index = parseInt(e.target.dataset.index);
        const type = e.target.dataset.type;
        const iteration = iterations[index];
        const ratio = ((iteration.output / iteration.input) * 100).toFixed(2);

        tooltip.innerHTML = `
                <div class="tooltip-title">${iteration.name}</div>
                <div class="tooltip-line">🤖 Model: ${iteration.model}</div>
                <div class="tooltip-line">📥 Input Tokens: ${iteration.input.toLocaleString()}</div>
                <div class="tooltip-line">📤 Output Tokens: ${iteration.output.toLocaleString()}</div>
                <div class="tooltip-line">📊 Output/Input Ratio: ${ratio}%</div>
                <div class="tooltip-section">
                    <div class="tooltip-line">📁 Files Read: ${iteration.filesRead}</div>
                    <div class="tooltip-line">➕ Files Created: ${iteration.filesCreated}</div>
                    <div class="tooltip-line">✏️ Files Modified: ${iteration.filesModified}</div>
                </div>
                <div class="tooltip-section">
                    <div class="tooltip-line">📝 ${iteration.summary}</div>
                </div>
            `;

        tooltip.classList.add('visible');
        moveTooltip(e);
      }

      function moveTooltip(e) {
        const x = e.clientX + 15;
        const y = e.clientY + 15;

        // Keep tooltip on screen
        const rect = tooltip.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 10;
        const maxY = window.innerHeight - rect.height - 10;

        tooltip.style.left = Math.min(x, maxX) + 'px';
        tooltip.style.top = Math.min(y, maxY) + 'px';
      }

      function hideTooltip() {
        tooltip.classList.remove('visible');
      }

      // Animate bars on load - removed because it was preventing bars from showing
      // Bars will use CSS transitions for hover effects instead

      // No animation keyframes needed
    </script>
  </body>
</html>
```

**CRITICAL:** Only modify the `iterations` array with data from model_usage.md. Keep everything else identical.

## Error Handling

- If `.history/model_usage.md` doesn't exist: Stop all processing immediately and respond with the following message (do NOT mention searches performed or paths checked — just show this block):

```
⚠️ Model usage data not found

`.history/model_usage.md` is missing in this workspace — `/modelUsage` cannot run without it.

This file is generated by the `/history` command, which logs each iteration's token usage, model, and file operations into a structured markdown table.

👉 Run `/history` first to create the file, then rerun `/modelUsage`.

**Why run `/history`?**
`/history` reads the current session's debug log and appends a new row to `.history/model_usage.md` with fields like input/output tokens, model used, reasoning tokens, and file operations. Without at least one logged iteration, there is no data to analyse.
```

- If file is empty or malformed: Report "No valid data found in model_usage.md"
- If browser fails to open: Report the file path for manual opening

## Example Usage

User types: `/modelUsage`

Agent executes:

1. Reads `.history/model_usage.md`
2. Extracts 5 iterations with all data fields
3. Creates `.history/model_usage_chart.html` with:
   - Grouped bar chart showing input vs output tokens
   - Rich tooltips with all metadata
   - Statistics cards with totals and averages
4. Opens file in browser
5. Reports: "Model usage chart created and opened in browser."

## Notes

- File is always overwritten (no confirmation needed)
- Chart updates automatically when model_usage.md changes (just re-run command)
- Uses Chart.js v4 from CDN (no local installation needed)
- Works offline once loaded (CDN cached by browser)
- File path must be properly URL-encoded for `open_simple_browser`
