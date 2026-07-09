---
description: 'Quick access to information about available skills'
name: 'skills'
---

# /skills - Skills Information Access

## Command Usage

Use `/skills` to access information about available skills from the SKILLS-DIGEST.md file. Executing the `/skills` without parameters lists all skill names as described in the `/skills --all` section below.

**Syntax:**

- `/skills --help` or `/skills -h` - Display help information. Display the available parameters and their usage. On top, start with a simple list of all available parameters, parameters only. E.g. --help, --all, --categories
- `/skills`, `/skills --all` or `/skills -a` - Display a simple list of all skill names
- `/skills --categories` or `/skills -c` - List all skill categories only
- `/skills --categories [category-name]` or `/skills -c [category-name]` - Display content for a specific category
- `/skills --skill [skill-name]` or `/skills -s [skill-name]` - Display detailed information about a specific skill

## Purpose

Provide quick, structured access to skill documentation stored in `.github/skills/SKILLS-DIGEST.md` and individual `SKILL.md` files, enabling efficient skill discovery and usage.

## When to Use /skills

Invoke this command to:

- Browse available skills by category or name
- Get detailed information about a specific skill
- Understand what skills are available for the current task
- Find skills matching specific development needs

## Command Execution Requirements

**CRITICAL: The following applies to ALL modes (Ask, Agent, Edit, Plan):**

1. **Simple execution message**: Start with a brief message like `Executing /skills command...` without explaining the process
2. **Always read the file first**: Use the `read_file` tool to read `.github/skills/SKILLS-DIGEST.md` before providing any response
3. **Process the data**: Parse and extract the requested information from the file contents
4. **Present the output**: Format and display the results according to the command specifications below
5. **No placeholders**: Never show example data or placeholders - always show actual skill data from the file

## Command Details

### `/skills --all` or `/skills -a`

Display a simple list of all skill names from the SKILLS-DIGEST.md file. Order them by category and within each category order them alphabetically. Add an empty line between categories.

**Execution steps:**

1. Read `.github/skills/SKILLS-DIGEST.md` using `read_file` tool
2. Parse the markdown table to extract all skill names and categories
3. Group skills by category
4. Sort skills alphabetically within each category
5. Display the formatted list

**Output format:**

- One skill name per line
- No descriptions, categories, or additional information
- Alphabetically sorted within categories
- End with a concise hint about next actions (e.g., "Use `/skills -s [name]` to learn more about a skill")

**Example output:**

```
Creating ARC42 architecture documentation
Preserving Productive Tensions
Brainstorming Ideas Into Designs
Dispatching Parallel Agents
...
```

### `/skills --categories` or `/skills -c`

List all skill categories only (no skills).

**Execution steps:**

1. Read `.github/skills/SKILLS-DIGEST.md` using `read_file` tool
2. Parse the markdown table to extract all categories
3. Count skills per category
4. Display the formatted list

**Output format:**

- One category name per line
- No skill names or descriptions
- Format: Category name followed by skill count

**Example output:**

```
Architecture (2 skills)
Collaboration (10 skills)
Debugging (4 skills)
Meta (6 skills)
Problem-Solving (6 skills)
Research (1 skill)
Testing (3 skills)
```

### `/skills --categories [category-name]` or `/skills -c [category-name]`

Display the SKILLS-DIGEST.md content for a specific category only.

**Execution steps:**

1. Read `.github/skills/SKILLS-DIGEST.md` using `read_file` tool
2. Parse the markdown table to find rows matching the specified category
3. Extract Name, Description, When to Use, and Version for matching skills
4. Display the formatted table

**Output format:**

- Category header
- Table with columns: Name, Description, When to Use, Version
- Only skills from the specified category

**Example:**

```
/skills --categories Testing
/skills -c Debugging
```

### `/skills --skill [skill-name]` or `/skills -s [skill-name]`

Display detailed information about a specific skill.

**Execution steps:**

1. Read `.github/skills/SKILLS-DIGEST.md` using `read_file` tool
2. Find the skill by name (support partial/fuzzy matching)
3. Extract the skill's file path from the digest
4. Read the specific SKILL.md file using `read_file` tool
5. Parse the frontmatter (YAML between --- delimiters)
6. Extract the first section after frontmatter (Primary Goal or Overview)
7. Display the formatted information

**Output format:**

1. **Name:** [Skill name from frontmatter]
2. **Description:** [Description from frontmatter]
3. **Primary Goal/Overview:** [First section after frontmatter - either "Primary goal" or "Overview"]
4. **Model (if specified):** [Model information if present in SKILL.md]
5. **Link:** [Relative path to SKILL.md file]

**Example:**

```
/skills --skill Test-Driven Development
/skills -s Systematic Debugging
```

## Examples

### Listing All Skills

**User input:**

```
/skills --all
```

**Action:** Read `.github/skills/SKILLS-DIGEST.md` and extract all skill names grouped by category

**Response:**

```
Architecture
Creating ARC42 architecture documentation
Preserving Productive Tensions

Collaboration
Brainstorming Ideas Into Designs
Dispatching Parallel Agents
...
```

### Getting Skill Details

**User input:**

```
/skills --skill Test-Driven Development
```

**Action:** Read the specific SKILL.md file and extract frontmatter and overview

**Response:**

```
**Name:** Test-Driven Development
**Description:** Write tests before implementation code
**Primary Goal:** NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
**Link:** .github/skills/testing/test-driven-development/SKILL.md
```

## Implementation Notes

- All information is sourced from `.github/skills/SKILLS-DIGEST.md` and individual `SKILL.md` files
- Category names are case-insensitive for matching
- Skill names support partial matching (e.g., "TDD" matches "Test-Driven Development")
- If multiple skills match a partial name, list all matches and ask for clarification
- If no match is found, suggest similar skill names based on fuzzy matching
