// Merge every open pull request that is ready (Michael's A on the pipeline, 19 Oct 2026; .github/workflows/automerge.yml runs it).
// Ready: `check`'s gate is green on the commit, GitHub can merge it cleanly, and
//   - every file it changes is under docs/ or tests/ (not tests/lib/ or tests/run.mjs, the harness): it needs no approval; or
//   - Michael approved it: a comment on the PR from the repository's owner side, "Approved by Michael: <sha>", which the producer
//     posts when he taps Approve on the control room. Later commits that change only docs/ or tests/, or that merge main in, ride
//     along. If a later commit changes anything else, the approved commit is merged by itself and the PR waits for a new tap.
// After a merge it starts `check` (every suite) and `stamp` (the build number) on main by name, because a merge made with the
// workflow's own token starts no workflow. DRY_RUN=1 says what it would do and changes nothing.
const TOKEN = process.env.GH_TOKEN, REPO = process.env.REPO || 'mbuckley616/The-Old-Gates', DRY = !!process.env.DRY_RUN;
const API = `https://api.github.com/repos/${REPO}`;
const TRUSTED = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const APPROVAL = /^Approved by Michael\b[^\n]*?\b([0-9a-f]{7,40})\b/m;

async function gh(path, method = 'GET', body) {
  const r = await fetch(path.startsWith('http') ? path : API + path, { method, body: body && JSON.stringify(body),
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
  const text = await r.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!r.ok) { const e = new Error(`${method} ${path}: ${r.status} ${typeof data === 'object' && data ? data.message : text}`); e.status = r.status; throw e; }
  return data;
}
async function all(path) { const out = []; for (let p = 1; ; p++) { const page = await gh(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${p}`); out.push(...page); if (page.length < 100) return out; } }

const lowRisk = f => f.startsWith('docs/') || (f.startsWith('tests/') && !f.startsWith('tests/lib/') && f !== 'tests/run.mjs');

// green: the gate passed; before the gate existed (an older head), every check that ran passed
async function green(sha) {
  const runs = (await gh(`/commits/${sha}/check-runs?per_page=100`)).check_runs;
  const gate = runs.filter(r => r.name === 'gate').sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))[0];
  if (gate) return gate.status === 'completed' && gate.conclusion === 'success';
  const done = runs.filter(r => r.name.startsWith('headless') || r.name === 'parse');
  return done.length > 1 && done.every(r => r.status === 'completed' && ['success', 'skipped'].includes(r.conclusion));
}

async function onMain(sha) { try { const c = await gh(`/compare/main...${sha}`); return c.status === 'behind' || c.status === 'identical'; } catch (e) { return false; } }

// do the commits after the approved one change only low-risk files (merges of main count as nothing)?
async function onlyLowRiskSince(approved, head) {
  const cmp = await gh(`/compare/${approved}...${head}`);
  for (const c of cmp.commits) {
    if (c.parents.length > 1) { if (await onMain(c.parents[1].sha)) continue; return { ok: false, why: `${c.sha.slice(0, 7)} merges another branch` }; }
    const files = (await gh(`/commits/${c.sha}`)).files.map(f => f.filename);
    const bad = files.find(f => !lowRisk(f));
    if (bad) return { ok: false, why: `${c.sha.slice(0, 7)} changes ${bad}` };
  }
  return { ok: true };
}

async function say(n, body, comments) {
  if (comments.some(c => c.body.trim() === body.trim())) return;
  console.log(`  #${n}: ${body}`);
  if (!DRY) await gh(`/issues/${n}/comments`, 'POST', { body });
}

let merged = 0;
for (const pr of await all('/pulls?state=open&base=main')) {
  const n = pr.number, head = pr.head.sha;
  try {
    if (pr.draft) continue;
    if (!(await green(head))) { console.log(`#${n} ${pr.head.ref}: not green on ${head.slice(0, 7)}`); continue; }
    const full = await gh(`/pulls/${n}`);
    if (full.mergeable === false || full.mergeable_state === 'dirty') { console.log(`#${n}: conflicts with main`); continue; }
    const files = (await all(`/pulls/${n}/files`)).map(f => f.filename);
    const comments = await all(`/issues/${n}/comments`);
    let target = null, why = '';
    if (files.every(lowRisk)) { target = head; why = 'docs and tests only'; }
    else {
      const approvals = comments.filter(c => TRUSTED.has(c.author_association) && APPROVAL.test(c.body));
      const last = approvals[approvals.length - 1];
      if (!last) { console.log(`#${n}: waiting for Michael's approval`); continue; }
      const approved = APPROVAL.exec(last.body)[1];
      if (head.startsWith(approved)) { target = head; why = `approved at ${approved.slice(0, 7)}`; }
      else {
        const since = await onlyLowRiskSince(approved, head);
        if (since.ok) { target = head; why = `approved at ${approved.slice(0, 7)}; later commits are docs, tests or main`; }
        else if (await onMain(approved)) { console.log(`#${n}: the approved ${approved.slice(0, 7)} is on main; later commits wait for a new approval (${since.why})`); continue; }
        else if (await green(approved)) {
          console.log(`#${n}: merging the approved ${approved.slice(0, 7)} alone (${since.why})`);
          if (!DRY) await gh('/merges', 'POST', { base: 'main', head: approved, commit_message: `Merge ${pr.head.ref} at ${approved.slice(0, 7)} (PR #${n}), approved by Michael\n\nLater commits wait for a new approval: ${since.why}.` });
          await say(n, `automerge: merged the approved ${approved.slice(0, 7)} into main. Later commits wait for a new approval on the control room (${since.why}).`, comments);
          merged++; continue;
        } else { await say(n, `automerge: ${since.why} after the approved ${approved.slice(0, 7)}, and ${approved.slice(0, 7)} is not green, so this waits for a new approval.`, comments); continue; }
      }
    }
    console.log(`#${n} ${pr.head.ref}: merging ${target.slice(0, 7)} (${why})`);
    if (!DRY) await gh(`/pulls/${n}/merge`, 'PUT', { sha: target, merge_method: 'merge', commit_title: `Merge ${pr.head.ref} (PR #${n}): ${pr.title}`.slice(0, 250), commit_message: `automerge: gate green on ${target.slice(0, 7)}; ${why}.` });
    merged++;
  } catch (e) { console.log(`#${n}: ${e.message}`); }
}

if (merged && !DRY) for (const wf of ['check.yml', 'stamp.yml'])
  try { await gh(`/actions/workflows/${wf}/dispatches`, 'POST', { ref: 'main' }); } catch (e) { console.log(`dispatch ${wf}: ${e.message}`); }
console.log(`${merged} merged${DRY ? ' (dry run)' : ''}`);
