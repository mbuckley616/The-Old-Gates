// The top-level statements of js/ files, for tests/lib/select.mjs: run as
//   node --expose-internals --no-warnings tests/lib/toplevel.cjs js/a.js js/b.js …
// and it prints {file: [{name, line, endLine, ids}]}: one row per declared name (a function, each declarator of a const/let/var,
// a class) or, for any other statement (`BOOKS.push(…)`, `X.y = …`), the name at its root. `ids` is every identifier the
// statement uses. Node's own acorn is used, as scripts/split.py does, so nothing needs installing.
const fs = require('fs');
let acorn; try { acorn = require('internal/deps/acorn/acorn/dist/acorn'); } catch (e) { acorn = require('acorn'); }

function rootName(n) {
  while (n) {
    if (n.type === 'Identifier') return n.name;
    if (n.type === 'ExpressionStatement') n = n.expression;
    else if (n.type === 'CallExpression') n = n.callee;
    else if (n.type === 'MemberExpression') n = n.object;
    else if (n.type === 'AssignmentExpression') n = n.left;
    else if (n.type === 'SequenceExpression') n = n.expressions[0];
    else if (n.type === 'UnaryExpression' || n.type === 'AwaitExpression') n = n.argument;
    else return null;
  }
  return null;
}

function ids(src, node) {
  const out = new Set(), text = src.slice(node.start, node.end);
  for (const m of text.matchAll(/[A-Za-z_$][\w$]*/g)) out.add(m[0]);
  return [...out];
}

const result = {};
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowHashBang: true });
  const rows = [];
  for (const st of ast.body) {
    const at = { line: st.loc.start.line, endLine: st.loc.end.line };
    if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') rows.push({ name: st.id.name, ...at, ids: ids(src, st) });
    else if (st.type === 'VariableDeclaration') for (const d of st.declarations) {
      const names = d.id.type === 'Identifier' ? [d.id.name] : ids(src, d.id);
      for (const name of names) rows.push({ name, line: d.loc.start.line, endLine: d.loc.end.line, ids: ids(src, d) });
    }
    else rows.push({ name: rootName(st), ...at, ids: ids(src, st) });
  }
  result[file] = rows;
}
process.stdout.write(JSON.stringify(result));
