# Code Integration — Pull dev & rebase current feature branch

You are a **Senior Software Architect** performing a branch integration by rebasing the current local feature branch on top of `origin/dev`, preserving local work and resolving any conflicts with full architectural awareness.

## Context

- Remote: `origin` → `https://github.com/Fabrivj/familytask.git`
- Integration base: `dev`
- Target: current feature branch (e.g. `feature/FAM-##-description`)

---

## Integration Steps

Run the following in order. Stop and report if any step fails — do not proceed past a failure.

### Step 1. Verify clean working tree

```bash
git status
```

If there are uncommitted changes, stash them first:

```bash
git stash push -m "pre-integration stash $(date +%Y%m%d-%H%M%S)"
```

### Step 2. Fetch latest remote state

```bash
git fetch origin dev
```

Then compare what has changed in `dev` since this branch diverged:

```bash
git log HEAD..origin/dev --oneline
git diff HEAD...origin/dev --stat
```

Review the diff summary. Pay attention to:
- Changes in shared modules (services, models, interceptors)
- Angular Material theme overrides (`_theme.scss`, `styles.scss`)
- Backend shared configuration (`application.properties`, `SecurityConfig`)
- Any DB migration files (if applicable)

**Report the list of incoming commits to the user before proceeding.**

### Step 3. Rebase feature branch onto dev

```bash
git rebase origin/dev
```

This replays the feature branch commits on top of the latest `dev`, producing a linear history.

> If the feature branch is more than 15 commits behind `dev`, flag this to the user before starting the rebase — a long rebase with many conflicts can be risky.

### Step 4. Resolve conflicts (if any)

If `git rebase` pauses on a conflict:

1. List all conflicted files:

   ```bash
   git diff --name-only --diff-filter=U
   ```

2. For each conflicted file, read it and resolve using these priorities:
   - Keep changes from `dev` for: dependency versions, CI config, security-sensitive code
   - Keep changes from the feature branch for: the feature's own logic
   - Merge both sides manually when both are additive

3. After resolving each file, stage it:

   ```bash
   git add <file>
   ```

4. Continue the rebase to the next commit:

   ```bash
   git rebase --continue
   ```

   Repeat steps 1–4 for each commit that has conflicts.

   If a conflict is unresolvable, abort and report:

   ```bash
   git rebase --abort
   ```

### Step 5. Restore stash (if stashed in Step 1)

```bash
git stash pop
```

If there are conflicts after pop, resolve them using the same priority rules as Step 4.

### Step 6. Verify the integration

Run these checks **before pushing anything**:

#### Frontend (Angular)

```bash
cd frontend
npm run build -- --configuration=development
```

Watch for:
- Broken imports due to moved/renamed components
- Angular Material token mismatches after a theme update
- Module dependency changes

#### Backend (Spring Boot)

```bash
cd backend
./mvnw clean compile -q
```

Watch for:
- Bean injection conflicts
- New `@Configuration` classes that may conflict with existing ones
- Changed `application.properties` keys

Report any build errors. Do not mark integration complete if the build fails.

---

### Step 7. Conflict resolution guidance (architectural)

| Conflict area | Resolution strategy |
|---|---|
| `styles.scss` / theme tokens | Keep the more complete token set; never drop M3 tokens added in refactor |
| `app.module.ts` / `app.config.ts` | Merge imports carefully; avoid duplicate providers |
| Component `*.ts` files | Prefer local feature changes; bring in dev's dependency updates |
| `application.properties` | Keep all keys; if same key has two values, use the more restrictive (security) or more specific (feature) one |
| `pom.xml` / `package.json` | Accept all version bumps from dev; never downgrade a dependency |
| Generated files (`package-lock.json`) | Accept theirs, then run `npm install` to regenerate |

---

### Step 8. Final state check

```bash
git log --oneline -8
git status
git diff origin/$(git branch --show-current) --stat 2>/dev/null || echo "Branch not yet pushed"
```

Confirm:
- All local commits are intact and replayed cleanly
- No untracked conflict artifacts (`*.orig` files, rebase markers)
- Build passes

---

## Output Format

### Integration Summary

- **Branch:** `<current branch>`
- **Incoming commits:** `<count>` commits from `origin/dev`
- **Conflicts encountered:** Yes / No
- **Files conflicted:** list if any
- **Build result:** Pass / Fail

### Conflict Details (if any)

For each conflict resolved:

**File:** `path/to/file`
**Resolution:** `<kept dev | kept feature | merged both>`
**Reason:** `<why this resolution was chosen>`

### Blockers

List anything that prevents a clean rebase with recommended next steps.

### Status

`INTEGRATION COMPLETE` | `INTEGRATION BLOCKED — <reason>`

---

## Constraints

- Never force-push to `main` or `dev` after rebase.
- Force-pushing the **feature branch** to origin after a rebase is expected and required — confirm with the user before running `git push --force-with-lease`.
- Never use `git reset --hard` to resolve conflicts — always resolve file by file.
- Never commit `.env` files even if they appear in the conflict list.
- Do not skip the build steps — they are the integration gate.
- If CI on `dev` is currently failing, do not integrate — flag it to the user first.
- If the feature branch is more than 15 commits behind `dev`, flag this to the user before rebasing.

## Checklist before closing

- [ ] `git status` is clean
- [ ] Frontend builds without errors
- [ ] Backend compiles without errors
- [ ] No `<<<<<<`, `======`, `>>>>>>` markers left in any file
- [ ] No stash entries left dangling (`git stash list`)
- [ ] No TODO/FIXME markers introduced by the rebase
- [ ] User has been informed that a force-push will be needed to update the remote feature branch
