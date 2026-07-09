---
agent: agent
model: claude-sonnet
description: 'Record the current chat iteration history'
name: 'history'
---

# /history - Conversation History Tracking

## Command Usage

Use `/history` to document significant interactions in a structured conversation history file.

**Syntax:**

- `/history` - Infer mode from context clues
- `/history --help` or `/history -h` - Display help information. Display the available parameters and their usage. On top, start with a simple list of all available parameters, parameters only. E.g. --help, --mode <mode>
- `/history --mode Ask` or `/history -m Ask` - Explicitly specify Ask mode
- `/history --mode Agent` or `/history -m Agent` - Explicitly specify Agent mode
- `/history --mode Edit` or `/history -m Edit` - Explicitly specify Edit mode
- `/history --mode Plan` or `/history -m Plan` - Explicitly specify Plan mode
- `/history --comment Your comment here` or `/history -c Your comment here` - Add a user comment to the iteration
- `/history --mode Agent --comment Your comment here` or `/history -m Agent -c Your comment here` - Combine mode and comment parameters

## Purpose

Maintain a comprehensive, structured conversation history file that documents the evolution of design decisions, iterations, and architectural changes throughout the development process.

## When to Use /history

Invoke this command after each significant interaction:

- Chat sessions with design decisions or requirements clarifications
- Planning sessions that establish architecture or approach
- Edits that implement major changes or new features
- Agent tasks that complete significant work or analysis

## File Location and Naming

- **Directory**: `.history/conversations/`
- **Filename**: `conversation_YYYY-MM-DD.md` (use current date)
- **Example**: `.history/conversationsconversation_2025-11-18.md`

### Raw Chat Archive

- **Directory**: `.history/conversations/raw/`
- **Filename**: `iteration_N_YYYY-MM-DD.md` (where N is the iteration number)
- **Example**: `.history/conversations/raw/iteration_21_2025-11-19.md`
- **Content**: Complete raw chat history for the specific iteration in markdown format
- **Privacy**: All references to the user's username are replaced with "user" before archiving

## Command Execution Summary

**MANDATORY FIRST STEP: Always create raw chat archive BEFORE doing anything else.**

When the user types `/history`, you must follow the detailed workflow below. The most critical requirement is:

**Step 1 of the workflow (Archive Raw Chat History) is MANDATORY and MUST be completed FIRST, before any analysis, file updates, or other operations.**

The detailed step-by-step workflow is provided in the "Workflow When /history is Invoked" section below. Follow it precisely, starting with Step 1 (Archive Raw Chat History).

## File Structure

### Header

```markdown
# Conversation History - [Project Name]

<a id="top"></a>
**Date:** [Full Date]

## Iteration Summary

| Iteration   | Mode   | Model   | Chats   | Summary                                          | Link                              |
| :---------- | :----- | :------ | :------ | :----------------------------------------------- | :-------------------------------- |
| Iteration 1 | [Mode] | [Model] | [Count] | [One concise sentence summarizing the iteration] | [Go to Iteration 1](#iteration-1) |
| Iteration 2 | [Mode] | [Model] | [Count] | [One concise sentence summarizing the iteration] | [Go to Iteration 2](#iteration-2) |

...

**Note:** Mode can be explicitly specified via `/history mode=Ask|Agent|Edit|Plan`, inferred from context clues (Agent: autonomous research/analysis with parallel operations; Ask: conversational without file modifications; Edit: direct targeted file changes; Plan: strategic planning and architecture design), or marked as "Unknown" when uncertain. Manual correction may be needed.

## Initial Request

[Document the original user request with key requirements as bullet points]
```

### Iteration Template

```markdown
<a id="iteration-N"></a>

### Iteration N: [Descriptive Title]

**Mode:** [Ask/Agent/Edit/Plan] (user-specified|inferred|unknown) | **Model:** [Model Name] | **Chats:** [Count]

**User Comment:** [User's verbatim comment if provided via comment parameter. Remove starting and ending quotes.]

**User Feedback:** [What the user requested or commented on]

**Changes Made:**

1. **[Change Category]**: [Description of change]
   - [Detail 1]
   - [Detail 2]
   - [Code/structure examples if relevant]

2. **[Another Change Category]**: [Description]
   ...

**[Optional] Architecture/Implementation Notes:**

- Key technical decisions
- Trade-offs considered
- Rationale for approach

[Back to Top](#top)

---
```

### Summary Sections (Between Iterations)

When appropriate, add summary sections that consolidate learnings:

```markdown
## [Section Name] Summary

### [Subsection]

- Key points
- Design decisions
- Examples

[Back to Top](#top)

---
```

## Content Guidelines

### What to Include

1. **User Requests**: Exact feedback or requirements stated by the user
2. **Changes Made**: Specific modifications with technical details
3. **Code/Schema Examples**: Show before/after for significant changes
4. **Rationale**: Why decisions were made, especially for architectural choices
5. **Deliverables**: Track what was completed in each iteration

### What to Emphasize

- **Design Evolution**: How the solution changed over time
- **Key Decisions**: Important architectural or implementation choices
- **Trade-offs**: What was considered and why one approach was chosen
- **Lessons Learned**: Insights gained from iterations

### Writing Style

- **Concise**: One sentence summaries in the iteration table
- **Technical**: Use proper terminology and technical language
- **Structured**: Use consistent formatting with headings and bullets
- **Linked**: All iterations linked via anchor tags with "Back to Top" navigation

## Iteration Summary Table Rules

The iteration summary table must:

1. **Be placed immediately after the header** (before "Initial Request")
2. **Include all iterations** with sequential numbering
3. **Have six columns**: Iteration, Mode, Model, Chats, Summary, Link
4. **Contain concise summaries**: Single sentence (max 15 words) describing the core change
5. **Use anchor links**: Format as `[Go to Iteration N](#iteration-n)`
6. **Be updated** every time a new iteration is added

### Summary Sentence Guidelines

- Start with a verb (e.g., "Introduced", "Switched", "Rewrote", "Added")
- Focus on the primary change or outcome
- Avoid implementation details in the summary
- Keep under 15 words

**Examples:**

- ✅ "Switched from text files to single JSON files for each customization category."
- ✅ "Integrated a database for user/group management, creating a hybrid architecture."
- ❌ "Changed the file structure and updated all the diagrams to show database queries instead of file lookups and also modified the examples" (too long, too detailed)

## Anchor Link Standards

### Creating Anchors

```markdown
<a id="iteration-1"></a>

### Iteration 1: [Title]
```

### Linking to Anchors

```markdown
[Go to Iteration 1](#iteration-1)
[Back to Top](#top)
```

### Anchor Naming Convention

- **Top of document**: `<a id="top"></a>`
- **Iterations**: `<a id="iteration-N"></a>` where N is the iteration number
- **Use lowercase with hyphens** for all custom anchors
- **Place anchor immediately before** the section heading

## Workflow When /history is Invoked

**CRITICAL: Step 1 is MANDATORY and must be completed FIRST before any other operations.**

### Step 1: Archive Raw Chat History (MANDATORY - DO THIS FIRST)

- **THIS STEP CANNOT BE SKIPPED OR DELAYED**
- **Output message**: "Archiving raw chat..."
- Extract complete chat history from the current conversation
- Sanitize by replacing all instances of the user's username with "user". Everything else should be copied verbatim.
- Ensure `.history/conversations/raw/` directory exists (create if needed)
- Format as markdown file containing the raw chat data
- Save as `iteration_N_YYYY-MM-DD.md` to `.history/conversations/raw/` directory
- **Completion message**: "Raw chat archived."
- Do not add any additional text after completion message

### Step 2: Analyze the Interaction

- **Output message**: "Analyzing interaction..."
- Determine if changes warrant a new iteration
- Assign sequential iteration number
- Identify mode using priority order:
  1.  Use user-specified mode if provided via `mode=` parameter (label as "user-specified")
  2.  Infer from context clues (label as "inferred"):
      - **Agent**: Autonomous decision-making, research/analysis, multiple parallel searches/reads, complex problem-solving
      - **Ask**: Conversational exchanges, Q&A, explanations, no file modifications (e.g. to files in the project folder)
      - **Edit**: Direct execution of specific user instructions, targeted file changes, minimal research
      - **Plan**: Strategic planning, architecture design, task breakdown, roadmap creation without immediate implementation
  3.  Default to "Unknown" if uncertain (label as "unknown")
- Identify model and chat count
  - **Model**: Examine the conversation history to find the model that generated the content _before_ the `/history` command. Do not use the model currently running the history command.
- Create concise one-sentence summary
- **Completion message**: "Analysis complete."

### Step 3: Update or Create Conversation History File

- **Output message**: "Updating conversation history..."
- Check if conversation history file exists for today's date
- If new file, create with full header structure and iteration summary table
- If existing, use `replace_string_in_file` to update the table, then append the new iteration section using `replace_string_in_file` with sufficient context to uniquely identify the end of the file
- **Completion message**: "Conversation history updated."

### Step 4: Document the Iteration

- **Output message**: "Documenting iteration..."
- Add new row to iteration summary table using `replace_string_in_file`
- Append complete iteration section to the end of the file using `replace_string_in_file`
- Create anchor with correct ID
- Write heading with descriptive title
- Add metadata line with mode detection method: Mode (user-specified|inferred|unknown), Model, and Chats
- Add User Comment section if comment parameter was provided (use verbatim text, no modifications)
- Document user feedback verbatim or summarized
- List all changes with categories
- Include code/examples where relevant
- Add "Back to Top" link at the end
- **Completion message**: "Iteration documented."

### Step 5: Auto-save Model Usage

- **Output message**: "Updating model usage..."
- Read current `.history/model_usage.md` file
- Use `replace_string_in_file` to append new entry to the table
- Include all required columns: Timestamp, Model, Input/Reasoning/Output/Total Tokens, Files Read/Created/Modified, Summary
- **IMPORTANT**: Use only file editing tools (replace_string_in_file, multi_replace_string_in_file), never use terminal commands
- **Completion message**: "Model usage updated."

### Step 6: File Handling

- All file edits made with `replace_string_in_file` or `multi_replace_string_in_file` are automatically saved
- Do NOT open edited files in the editor
- Files are modified in place without user interaction
- **CRITICAL**: Edits must be auto-accepted - no "Keep" and "Undo" prompts should appear
- This ensures a clean, non-intrusive workflow

### Step 7: Auto-Accept Changes

- After completing all file operations, send Ctrl+Enter keystroke to automatically keep all changes

### Step 8: Review for Completeness

- **Output message**: "Verifying completeness..."
- Verify all links work
- Check formatting consistency
- Ensure technical accuracy
- Confirm chronological order
- Confirm raw chat archive was created in Step 1
- **Completion message**: "Verification complete."

### Step 9: Confirm Completion

- **Output message**: "> History entry captured."
- If raw chat archive was not created in Step 1, output: "> Error: Raw chat archive not created."
- Do not add any additional text after completion message

## Common Iteration Categories

Use these categories to organize changes within iterations:

- **File Structure Updated**
- **Database Schema Defined**
- **Updated Diagrams**
- **Updated Examples**
- **New Section Added**
- **Updated Required Components**
- **Enhanced Optional Features**
- **Document Restructure**
- **Concise Overview**
- **Style Changes**

## Example Entry

````markdown
<a id="iteration-7"></a>

### Iteration 7: Database Integration

**Mode:** Ask (inferred) | **Model:** claude-sonnet | **Chats:** 1

**User Feedback:** In the proposal, the data for users.json and groups.json would come from a database. Update the file and diagrams.

**Changes Made:**

1. **File Structure Updated**
   - Removed users.json and groups.json from file system
   - Added database tables: `user_groups` and `groups`
   - Note added explaining hybrid approach

2. **Database Schema Defined**
   ```sql
   CREATE TABLE groups (
       group_id VARCHAR(50) PRIMARY KEY,
       preset_id VARCHAR(50) NOT NULL
   );
   ```
````

3. **Updated Diagrams**
   - Resolution Flow: Changed "Look up in users.json" to "Query user_groups table"
   - Added database styling (red/pink) to distinguish from file operations

**Final Architecture:**

- **Database**: Users and groups (dynamic, frequently accessed)
- **Files**: Customizations and presets (version controlled)
- **Hybrid Benefits**: Scalability + Simplicity

[Back to Top](#top)

---

```

## Raw Chat Archive Details

### What Gets Archived
- Complete conversation history for the iteration
- All user messages and assistant responses
- Tool calls and their results
- Context information and workspace state
- Timestamps and metadata

### Privacy Sanitization
Before archiving, automatically replace:
- User's actual username (e.g., "ChesneFr") → "user"
- Any file paths containing the username
- Any other identifiable information in paths

### Archive Format
- **Format**: Markdown file
- **Contents**: Complete chat history formatted as markdown
- **Naming**: `iteration_N_YYYY-MM-DD.md`
- **Location**: `.history/raw/`

### Use Cases
- Debugging and troubleshooting past iterations
- Recovering exact context of conversations
- Training data preparation
- Audit trail for complex changes
- Reference for similar future work

## Maintenance Tips

- **Keep it current**: Update after each significant change
- **Be consistent**: Use the same formatting throughout
- **Stay organized**: Group related changes together
- **Link everything**: Ensure all navigation works
- **Review periodically**: Check that the document tells a coherent story
- **Archive old files**: When starting a new day, create a new dated file
- **Raw archives**: Automatically created with each `/history` invocation

## Benefits

This structured approach provides:
- **Traceability**: Clear record of why decisions were made
- **Onboarding**: New team members can understand the evolution
- **Documentation**: Captures rationale that might otherwise be lost
- **Reference**: Easy to find when specific changes were made
- **Learning**: Patterns and lessons become visible over time
```
