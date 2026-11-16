'use strict';

const $ = id => document.getElementById(id);
const editor = $('editor');
const STORE = 'ghostkeys-v1';

const starter = [
  {
    name: 'Print',
    trigger: ';pr',
    language: 'Python',
    body: 'print(|)'
  },
  {
    name: 'Function',
    trigger: ';def',
    language: 'Python',
    body: 'def function_name():\n    |\n'
  },
  {
    name: 'For loop',
    trigger: ';for',
    language: 'Python',
    body: 'for item in items:\n    |\n'
  },
  {
    name: 'Main guard',
    trigger: ';main',
    language: 'Python',
    body: 'if __name__ == "__main__":\n    |\n'
  },
  {
    name: 'Console log',
    trigger: ';log',
    language: 'JavaScript',
    body: 'console.log(|);'
  },
  {
    name: 'Arrow function',
    trigger: ';fn',
    language: 'JavaScript',
    body: 'const name = () => {\n  |\n};'
  },
  {
    name: 'Fetch JSON',
    trigger: ';fetch',
    language: 'JavaScript',
    body:
      'const response = await fetch("|");\n' +
      'if (!response.ok) throw new Error(`HTTP ${response.status}`);\n' +
      'const data = await response.json();'
  },
  {
    name: 'Typed function',
    trigger: ';ts',
    language: 'TypeScript',
    body: 'function name(value: string): string {\n  return |;\n}'
  }
];

const defaults = {
  theme: 'matrix',
  size: 'medium',
  pairs: true,
  haptics: false,
  saver: false,
  paused: false
};

let settings = { ...defaults };
let snippets = structuredClone(starter);
let history = [];
let future = [];
let shift = false;
let ctrl = false;
let opt = false;
let native = false;
let editing = -1;

const say = text => $('status').textContent = text;

function validate(list) {
  if (!Array.isArray(list) || list.length > 200) {
    throw Error('Use a list of at most 200 snippets.');
  }

  if (new Blob([JSON.stringify(list)]).size > 900000) {
    throw Error('Keep the snippet collection under 900 KB.');
  }

  const seen = new Set();

  return list.map(s => {
    if (
      !s ||
      typeof s.name !== 'string' ||
      !s.name.trim() ||
      s.name.length > 80 ||
      typeof s.trigger !== 'string' ||
      !s.trigger ||
      /\s/.test(s.trigger) ||
      s.trigger.length > 40 ||
      typeof s.body !== 'string' ||
      !s.body ||
      s.body.length > 100000 ||
      !['Python', 'JavaScript', 'TypeScript', 'Other']
        .includes(s.language)
    ) {
      throw Error(
        'Invalid snippet: check its name, trigger, language and code.'
      );
    }

    if (seen.has(s.trigger)) {
      throw Error('Triggers must be unique.');
    }

    seen.add(s.trigger);

    return {
      name: s.name.trim(),
      trigger: s.trigger,
      language: s.language,
      body: s.body
    };
  });
}

try {
  const saved = JSON.parse(localStorage.getItem(STORE) || 'null');

  if (saved) {
    snippets = validate(saved.snippets);
    const s = saved.settings || {};

    for (const key of ['pairs', 'haptics', 'saver', 'paused']) {
      if (typeof s[key] === 'boolean') settings[key] = s[key];
    }

    if (['matrix', 'cyber', 'amber'].includes(s.theme)) {
      settings.theme = s.theme;
    }

    if (['small', 'medium', 'large'].includes(s.size)) {
      settings.size = s.size;
    }

    editor.value = typeof saved.text === 'string' ? saved.text : '';
  }
} catch {
  say('Saved data could not be read. Export backups regularly.');
}

function save() {
  try {
    localStorage.setItem(
      STORE,
      JSON.stringify({ settings, snippets, text: editor.value })
    );
  } catch {
    say(
      'Storage is unavailable or full. ' +
      'Copy code and export snippets to keep them.'
    );
  }
}

function buzz() {
  if (settings.haptics && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

function snapshot() {
  return {
    text: editor.value,
    start: editor.selectionStart,
    end: editor.selectionEnd
  };
}

function remember() {
  history.push(snapshot());
  if (history.length > 100) history.shift();
  future = [];
}

function restore(state) {
  editor.value = state.text;
  editor.setSelectionRange(state.start, state.end);
  save();
}

function undo() {
  if (history.length) {
    future.push(snapshot());
    restore(history.pop());
  }
}

function redo() {
  if (future.length) {
    history.push(snapshot());
    restore(future.pop());
  }
}

function replace(start, end, text, caret = text.length) {
  editor.setRangeText(text, start, end, 'end');
  editor.setSelectionRange(start + caret, start + caret);
  save();
}

function unpack(body) {
  const cursor = body.indexOf('|');

  return {
    text: cursor < 0
      ? body
      : body.slice(0, cursor) + body.slice(cursor + 1),
    cursor: cursor < 0 ? body.length : cursor
  };
}

function insertSnippet(
  snippet,
  record = true,
  start = editor.selectionStart,
  end = editor.selectionEnd
) {
  if (record) remember();

  const value = unpack(snippet.body);
  replace(start, end, value.text, value.cursor);
  say('Inserted ' + snippet.name + '. Cursor placed at its marker.');
}

function expand() {
  const position = editor.selectionStart;
  if (position !== editor.selectionEnd) return;

  const snippet = [...snippets]
    .sort((a, b) => b.trigger.length - a.trigger.length)
    .find(s => editor.value.slice(0, position).endsWith(s.trigger));

  if (snippet) {
    insertSnippet(
      snippet,
      false,
      position - snippet.trigger.length,
      position
    );
  }
}

function type(text) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;

  const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'"
  };

  if (
    settings.pairs &&
    text.length === 1 &&
    start === end &&
    ')]}\"\''.includes(text) &&
    editor.value[start] === text
  ) {
    editor.setSelectionRange(start + 1, start + 1);
    return;
  }

  remember();

  if (settings.pairs && pairs[text]) {
    const selected = editor.value.slice(start, end);
    replace(
      start,
      end,
      text + selected + pairs[text],
      selected ? selected.length + 2 : 1
    );
  } else {
    replace(start, end, text);
    expand();
  }
}

function backspace() {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  if (!start && !end) return;

  remember();

  const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'"
  };

  if (start !== end) {
    replace(start, end, '');
  } else if (
    settings.pairs &&
    pairs[editor.value[start - 1]] === editor.value[start]
  ) {
    replace(start - 1, start + 1, '');
  } else {
    const previous = Array.from(editor.value.slice(0, start)).at(-1);
    replace(start - previous.length, start, '');
  }
}

const startOfLine = position => position <= 0
  ? 0
  : editor.value.lastIndexOf('\n', position - 1) + 1;

const endOfLine = position => {
  const end = editor.value.indexOf('\n', position);
  return end < 0 ? editor.value.length : end;
};

function move(key) {
  let position = editor.selectionStart;
  const end = editor.selectionEnd;
  const text = editor.value;

  if (key === 'Left') {
    position = position !== end
      ? position
      : opt
        ? position - (
          text.slice(0, position).match(/\S+\s*$/)?.[0].length
          || position
        )
        : position - (
          Array.from(text.slice(0, position)).at(-1)?.length || 0
        );
  }

  if (key === 'Right') {
    position = position !== end
      ? end
      : opt
        ? position + (
          text.slice(position).match(/^\s*\S+\s*/)?.[0].length
          || text.length - position
        )
        : position + (
          Array.from(text.slice(position))[0]?.length || 0
        );
  }

  if (key === 'Up') {
    const start = startOfLine(position);
    position = start
      ? Math.min(startOfLine(start - 1) + position - start, start - 1)
      : 0;
  }

  if (key === 'Down') {
    const finish = endOfLine(position);
    position = finish < text.length
      ? Math.min(
        finish + 1 + position - startOfLine(position),
        endOfLine(finish + 1)
      )
      : text.length;
  }

  editor.setSelectionRange(position, position);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    say('Copied. Switch to Codespaces, then long-press Paste.');
  } catch {
    $('copyFallback').value = text;
    $('clipboardDialog').showModal();
    $('copyFallback').focus();
    $('copyFallback').select();
    say('Automatic copy blocked. Use the manual-copy dialog.');
  }
}

function refreshMods() {
  document.querySelectorAll('[data-mod]').forEach(button => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.mod === 'Ctrl' ? ctrl : opt)
    );
  });
}

function combo(key) {
  ctrl = false;
  refreshMods();

  const start = editor.selectionStart;
  const end = editor.selectionEnd;

  if (key === 'C') {
    copy(start === end
      ? editor.value
      : editor.value.slice(start, end));
    return;
  }

  if (key === 'Z') {
    undo();
    return;
  }

  if (key === 'R') {
    const query = prompt('Find text in this scratchpad:');

    if (query) {
      let position = editor.value.indexOf(query, end);
      if (position < 0) position = editor.value.indexOf(query);

      if (position >= 0) {
        editor.setSelectionRange(position, position + query.length);
      } else {
        say('Text not found.');
      }
    }
    return;
  }

  if (key === 'A' || key === 'E') {
    const position = key === 'A'
      ? startOfLine(start)
      : endOfLine(end);
    editor.setSelectionRange(position, position);
    return;
  }

  remember();

  if (key === 'D') {
    replace(
      start,
      start !== end
        ? end
        : start + (
          Array.from(editor.value.slice(start))[0]?.length || 0
        ),
      ''
    );
  }

  if (key === 'L') {
    replace(0, editor.value.length, '');
    say('Scratchpad cleared. Undo can restore it.');
  }

  if (key === 'U') {
    replace(startOfLine(start), end, '');
  }

  if (key === 'W') {
    const length =
      textBefore(start).match(/\S+\s*$/)?.[0].length || start;
    replace(start - length, end, '');
  }
}

const textBefore = position => editor.value.slice(0, position);

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;

  buzz();
  button.classList.remove('pressed');
  void button.offsetWidth;
  button.classList.add('pressed');
});

function makeButton(
  parent,
  label,
  action,
  keepCursor = false,
  title = label
) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', title);
  button.title = title;

  if (keepCursor) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
    });
  }

  button.addEventListener('click', action);
  parent.append(button);
  return button;
}

for (const name of [
  'Esc', 'Tab', 'Up', 'Down', 'Left', 'Right', 'Ctrl', 'Opt'
]) {
  const button = makeButton($('navigation'), name, () => {
    if (name === 'Esc') {
      ctrl = opt = false;
      editor.blur();
      say('Modifiers cleared.');
    } else if (name === 'Tab') {
      type('    ');
    } else if (name === 'Ctrl') {
      ctrl = !ctrl;
    } else if (name === 'Opt') {
      opt = !opt;
    } else {
      move(name);
    }

    refreshMods();
  }, true);

  if (name === 'Ctrl' || name === 'Opt') {
    button.dataset.mod = name;
    button.setAttribute('aria-pressed', 'false');
  }
}

for (const symbol of [
  '(', ')', '[', ']', '{', '}', '<', '>', ':', ';',
  '"', "'", '_', '#', '=', '+', '-', '*', '/', '\\',
  '|', '~', '`', '@', '$', '%'
]) {
  makeButton($('symbols'), symbol, () => type(symbol), true);
}

for (const key of ['C', 'D', 'L', 'R', 'A', 'E', 'U', 'W', 'Z']) {
  makeButton(
    $('combos'),
    'Ctrl+' + key,
    () => combo(key),
    true,
    'Local Ctrl+' + key
  );
}

function drawLetters() {
  $('letters').replaceChildren();

  for (const row of [
    '1234567890',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ]) {
    const container = document.createElement('div');
    container.className = 'letter-row';

    for (const character of row) {
      makeButton(
        container,
        shift ? character.toUpperCase() : character,
        () => ctrl && 'cdlraeuwz'.includes(character)
          ? combo(character.toUpperCase())
          : type(shift ? character.toUpperCase() : character),
        true
      );
    }

    $('letters').append(container);
  }
}

for (const id of ['shift', 'space', 'backspace', 'enter']) {
  $(id).addEventListener('pointerdown', event => {
    event.preventDefault();
  });
}

$('shift').onclick = () => {
  shift = !shift;
  $('shift').setAttribute('aria-pressed', String(shift));
  drawLetters();
};

$('space').onclick = () => type(' ');
$('enter').onclick = () => type('\n');
$('backspace').onclick = backspace;
$('undo').onclick = undo;
$('redo').onclick = redo;
$('selectAll').onclick = () => editor.select();
$('copyAll').onclick = () => copy(editor.value);
$('closeClipboard').onclick = () => $('clipboardDialog').close();

$('paste').onclick = async () => {
  try {
    const text = await navigator.clipboard.readText();
    remember();
    replace(editor.selectionStart, editor.selectionEnd, text);
  } catch {
    native = true;
    editor.inputMode = 'text';
    editor.focus();
    say('Touch and hold in the scratchpad, then choose Paste.');
  }
};

$('native').onclick = () => {
  native = !native;
  editor.inputMode = native ? 'text' : 'none';
  editor.blur();
  editor.focus();

  say(native
    ? 'iPhone keys enabled. Its globe switches languages.'
    : 'Coding panel enabled.');
};

editor.addEventListener('beforeinput', event => {
  if (
    event.inputType === 'historyUndo' ||
    event.inputType === 'historyRedo'
  ) {
    event.preventDefault();
    event.inputType === 'historyUndo' ? undo() : redo();
  } else {
    remember();
  }
});

editor.addEventListener('input', event => {
  if (!event.isComposing) expand();
  save();
});

editor.addEventListener('compositionend', () => {
  expand();
  save();
});

editor.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    event.preventDefault();
    type('    ');
  }

  if (event.key === 'Escape') {
    ctrl = opt = false;
    refreshMods();
    editor.blur();
  }
});

function renderSnippets() {
  $('snippetCount').textContent =
    String(snippets.length).padStart(2, '0');

  const list = $('snippetList');
  const query = $('search').value.toLowerCase().trim();
  list.replaceChildren();

  snippets.forEach((snippet, index) => {
    if (
      ![
        snippet.name,
        snippet.trigger,
        snippet.language,
        snippet.body
      ].join(' ').toLowerCase().includes(query)
    ) return;

    const card = document.createElement('article');
    card.className = 'snippet';

    const title = document.createElement('h3');
    title.textContent = snippet.name;

    const trigger = document.createElement('code');
    trigger.textContent =
      snippet.trigger + ' / ' + snippet.language;

    const code = document.createElement('pre');
    code.textContent = snippet.body;

    const actions = document.createElement('div');
    actions.className = 'toolbar';

    makeButton(actions, 'Insert', () => insertSnippet(snippet));
    makeButton(actions, 'Copy', () => copy(unpack(snippet.body).text));
    makeButton(actions, 'Edit', () => editSnippet(index));

    const up = makeButton(
      actions,
      '↑',
      () => reorder(index, -1),
      false,
      'Move ' + snippet.name + ' up'
    );
    up.disabled = index === 0;

    const down = makeButton(
      actions,
      '↓',
      () => reorder(index, 1),
      false,
      'Move ' + snippet.name + ' down'
    );
    down.disabled = index === snippets.length - 1;

    makeButton(actions, 'Delete', () => {
      if (confirm('Delete ' + snippet.name + '?')) {
        snippets.splice(index, 1);
        save();
        renderSnippets();
      }
    });

    card.append(title, trigger, code, actions);
    list.append(card);
  });

  if (!list.children.length) {
    const message = document.createElement('p');
    message.textContent =
      'No snippets found. Add one or change your search.';
    list.append(message);
  }
}

function reorder(index, direction) {
  const next = index + direction;

  [snippets[index], snippets[next]] =
    [snippets[next], snippets[index]];

  save();
  renderSnippets();
}

function editSnippet(index) {
  editing = index;

  const snippet = index < 0
    ? { name: '', trigger: '', language: 'Python', body: '' }
    : snippets[index];

  $('dialogTitle').textContent =
    index < 0 ? 'NEW SNIPPET' : 'EDIT SNIPPET';

  $('snippetName').value = snippet.name;
  $('snippetTrigger').value = snippet.trigger;
  $('snippetLanguage').value = snippet.language;
  $('snippetBody').value = snippet.body;
  $('formError').textContent = '';

  $('snippetDialog').showModal();
  $('snippetName').focus();
}

$('search').oninput = renderSnippets;
$('addSnippet').onclick = () => editSnippet(-1);
$('cancelSnippet').onclick = () => $('snippetDialog').close();

$('snippetForm').onsubmit = event => {
  event.preventDefault();

  const snippet = {
    name: $('snippetName').value,
    trigger: $('snippetTrigger').value.trim(),
    language: $('snippetLanguage').value,
    body: $('snippetBody').value
  };

  const next = [...snippets];

  if (editing < 0) next.push(snippet);
  else next[editing] = snippet;

  try {
    snippets = validate(next);
    save();
    renderSnippets();
    $('snippetDialog').close();
    say('Snippet saved. Triggers expand as soon as you type them.');
  } catch (error) {
    $('formError').textContent = error.message;
  }
};

$('export').onclick = () => {
  const blob = new Blob(
    [JSON.stringify(
      { app: 'GhostKeys', version: 1, snippets },
      null,
      2
    )],
    { type: 'text/plain;charset=utf-8' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'GhostKeys-snippets.txt';

  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);
  say('Export started. Save GhostKeys-snippets.txt in Files.');
};

$('import').onclick = () => $('importFile').click();

$('importFile').onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (file.size > 1000000) {
      throw Error('Import must be under 1 MB.');
    }

    const data = JSON.parse(await file.text());

    if (data.app !== 'GhostKeys' || data.version !== 1) {
      throw Error('Choose a version 1 GhostKeys export.');
    }

    const next = validate(data.snippets);

    if (confirm(
      'Replace your snippet list with these ' +
      next.length +
      ' snippets? Export a backup first.'
    )) {
      snippets = next;
      save();
      renderSnippets();
      say('Snippets imported. Scratchpad unchanged.');
    }
  } catch (error) {
    say('Import failed: ' + error.message);
  }

  event.target.value = '';
};

for (const button of document.querySelectorAll('[data-page]')) {
  button.onclick = () => {
    document.querySelectorAll('.page').forEach(page => {
      page.hidden = page.id !== button.dataset.page;
    });

    document.querySelectorAll('[data-page]').forEach(tab => {
      tab.removeAttribute('aria-current');
    });

    button.setAttribute('aria-current', 'page');
  };
}

/* Motion controls and typewriter */
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

let typingTimer = 0;
let phrase = 0;
let position = 0;
let deleting = false;

const phrases = [
  'Python.',
  'JavaScript.',
  'developer tools.',
  'your next idea.'
];

function motionActive() {
  return !settings.paused && !reduced.matches && !document.hidden;
}

function typeTagline() {
  if (!motionActive()) return;

  const word = phrases[phrase];
  position += deleting ? -1 : 1;

  $('typed').textContent = word.slice(0, position);

  const css = getComputedStyle(document.body);
  let delay = parseFloat(css.getPropertyValue('--type-delay')) || 75;

  if (!deleting && position === word.length) {
    deleting = true;
    delay = parseFloat(css.getPropertyValue('--type-hold')) || 1700;
  } else if (deleting && position === 0) {
    deleting = false;
    phrase = (phrase + 1) % phrases.length;
  }

  typingTimer = setTimeout(typeTagline, delay);
}

function syncMotion() {
  clearTimeout(typingTimer);

  document.body.dataset.motion = motionActive() ? 'on' : 'off';
  document.body.dataset.saver = String(settings.saver);

  $('motion').disabled = reduced.matches;

  $('motion').setAttribute(
    'aria-pressed',
    String(settings.paused || reduced.matches)
  );

  $('motion').setAttribute(
    'aria-label',
    reduced.matches
      ? 'Animation disabled by Reduce Motion'
      : settings.paused
        ? 'Resume animations'
        : 'Pause animations'
  );

  $('motionGlyph').textContent =
    settings.paused || reduced.matches ? '▶' : 'Ⅱ';

  $('motionNote').textContent = reduced.matches
    ? 'Motion is off because Reduce Motion is enabled on your device.'
    : 'Pause button stops all animation. ' +
      'Battery Saver lowers rain density and frame rate.';

  window.GhostRain?.configure({
    paused: settings.paused,
    batterySaver: settings.saver
  });

  if (motionActive()) {
    position = 0;
    deleting = false;
    typeTagline();
  } else {
    $('typed').textContent = 'your next idea.';
  }
}

function applySettings() {
  document.body.dataset.theme = settings.theme;

  document.documentElement.style.setProperty(
    '--key-height',
    ({ small: 40, medium: 48, large: 58 })[settings.size] + 'px'
  );

  $('theme').value = settings.theme;
  $('keySize').value = settings.size;
  $('autoPairs').checked = settings.pairs;
  $('haptics').checked = settings.haptics;
  $('batterySaver').checked = settings.saver;

  syncMotion();
}

for (const [id, key] of [
  ['theme', 'theme'],
  ['keySize', 'size'],
  ['autoPairs', 'pairs'],
  ['haptics', 'haptics'],
  ['batterySaver', 'saver']
]) {
  $(id).onchange = event => {
    settings[key] = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;

    applySettings();
    save();
  };
}

$('motion').onclick = () => {
  settings.paused = !settings.paused;
  syncMotion();
  save();
};

reduced.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);

applySettings();
drawLetters();
renderSnippets();

/* Offline installation */
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(async registration => {
      await navigator.serviceWorker.ready;

      const response = await fetch(
        './index.html',
        { cache: 'no-store' }
      );

      if (!response.ok || !registration.active) {
        throw Error('Cache not ready');
      }

      $('offline').textContent = 'OFFLINE: READY';
    })
    .catch(() => {
      $('offline').textContent = 'OFFLINE: NOT READY';
    });
} else {
  $('offline').textContent = 'OFFLINE: HTTPS NEEDED';
}
