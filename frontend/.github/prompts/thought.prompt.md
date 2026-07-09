---
description: 'Record a thought related to the current project'
name: 'thought'
---

# /thought - Quick Thought Capture

## Command Usage
Use `/thought` to capture quick thoughts, ideas, and notes with timestamps in a centralized thoughts file.

**Syntax:**
- `/thought --help` or `/thought -h` - Display help information. Display the available parameters and their usage. On top, start with a simple list of all available parameters, parameters only. E.g. --help, --recent
- `/thought <your note or idea>` - Add a thought
- `/thought --recent` or `/thought -r` - View recent thoughts

## Purpose
Document fleeting ideas, reminders, and observations during development work without interrupting flow. All thoughts are collected in a single chronological file with timestamps.

## When to Use /thought
Invoke this command to:
- Capture quick ideas or observations during development
- Document reminders for future work
- Record insights without breaking focus
- Review recent thoughts and notes

## Command Execution Summary

When the user types `/thought <note>` or `/thought --recent`, follow the detailed workflow below.

## File Location and Naming
- **Directory**: `.history/thoughts/`
- **Filename**: `thoughts.md`
- **Path**: `.history/thoughts/thoughts.md`
- **Format**: Single chronological file with timestamped entries

## Command Details

### Adding a Thought

When the user types `/thought` followed by their note:

1. **Extract the note content**: Everything after `/thought` is the note text
2. **Generate timestamp**: Use the current date/time from context in the format `[YYYY.MM.DD HH:MM:SS]`. Do NOT use tools to get the timestamp.
3. **Locate or create the thoughts file**: 
   - File path: `.history/thoughts/thoughts.md`
   - Create the directory structure if it doesn't exist
4. **Append the timestamped note**: Add a new line with the format using `replace_string_in_file`:
   ```
   [YYYY.MM.DD HH:MM:SS] <note content>
   ```
5. **Auto-save Model Usage**:
   - Read current `.history/model_usage.md` file
   - Use `replace_string_in_file` to append new entry to the table
   - Include all required columns: Timestamp, Model, Input/Reasoning/Output/Total Tokens, Files Read/Created/Modified, Summary
   - **IMPORTANT**: Use only file editing tools (replace_string_in_file, multi_replace_string_in_file), never use terminal commands
6. **File Handling**: 
   - All file edits made with `replace_string_in_file` are automatically saved
   - Do NOT open edited files in the editor
   - Files are modified in place without user interaction
   - **CRITICAL**: Edits must be auto-accepted - no "Keep" and "Undo" prompts should appear
7. **Auto-Accept Changes**: After completing file operations, send Ctrl+Enter keystroke to automatically keep all changes
8. **Confirm**: Briefly confirm the thought was captured. Rotate confirmation messages to avoid repetition. Create a concise whimsical confirmation message.

### Viewing Recent Thoughts
Be very stringent about the command syntax. Do not allow variations like "recent" or "recents" or "rt".
When the user types `/thought rct`:

1. **Read the thoughts file**: Read `.history/thoughts/thoughts.md`
2. **Extract last 5 entries**: Get the last 5 lines from the file
3. **Display in chat**: Show the recent thoughts in the chat window with a simple header
4. **Handle edge cases**: 
   - If the file doesn't exist, inform the user no thoughts have been captured yet
   - If there are fewer than 5 thoughts, show all available thoughts

## Example

### Adding a Thought

**User input:**
```
/thought Add the juicer functionality.
```

**Action:** Append to `.history/thoughts/thoughts.md`:
```
[2025.11.19 15:03:34] Add the juicer functionality.
```

**Response:**
```
Thought captured.
```

### Viewing Recent Thoughts

**User input:**
```
/thought recent
```

**Action:** Read and display last 5 entries from `.history/thoughts/thoughts.md`

**Response:**
```
Recent thoughts:

[2025.11.19 14:32:15] Review the authentication flow
[2025.11.19 14:45:22] Consider adding rate limiting
[2025.11.19 15:03:34] Add the juicer functionality
[2025.11.19 15:12:08] Update documentation for API endpoints
[2025.11.19 15:20:41] Test edge cases in validation logic
```

## Notes

- Each thought is a single line entry
- Thoughts are appended chronologically (newest at the bottom)
- The file path is relative to the workspace root
- When adding thoughts, no need to read the existing file
- When viewing recent thoughts, read from the end of the file
- Keep confirmation messages brief for additions
- For viewing recent thoughts, display them clearly without extra commentary