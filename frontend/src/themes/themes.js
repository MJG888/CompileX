/* ═══════════════════════════════════════════════════
   CompileX Theme Registry
   Scalable theme system — add new themes here
═══════════════════════════════════════════════════ */

export const THEMES = {
  'warm-dark': {
    id: 'warm-dark',
    label: '⚡ Neo Brutalist',
    monacoTheme: 'compilex-neo-brutalist',

    // ─── CSS Custom Properties ───
    vars: {
      '--primary':       '#ffe17c',
      '--bg':            '#171e19',
      '--surface':       '#272727',
      '--surface-2':     '#2a2a2a',
      '--surface-3':     '#333333',
      '--surface-glass': 'rgba(23, 30, 25, 0.88)',
      '--glass-blur':    'blur(0px)', /* no blur in brutalism */

      '--text-primary':   '#ffffff',
      '--text-secondary': '#b7c6c2',
      '--text-muted':     '#8c9e99',

      '--accent':       '#ffe17c',
      '--accent-light':  '#fff0b3',
      '--accent-dim':    'rgba(255, 225, 124, 0.15)',
      '--teal':          '#b7c6c2',
      '--teal-dim':      'rgba(183, 198, 194, 0.15)',

      '--border':       '#000000',
      '--border-hover':  '#ffe17c',

      '--status-bar-bg': '#171e19',
      '--status-bar-text': '#ffe17c',

      '--run-btn-bg':    '#ffe17c',
      '--run-btn-shadow': 'none',
      '--run-btn-hover-shadow': 'none',
      '--run-btn-active-bg': '#e6cb70',
    },

    // ─── Monaco Editor Theme ───
    monaco: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',    foreground: 'b7c6c2', fontStyle: 'italic' },
        { token: 'keyword',    foreground: 'ffe17c', fontStyle: 'bold' },
        { token: 'string',     foreground: 'b7c6c2' },
        { token: 'number',     foreground: 'ffe17c' },
        { token: 'type',       foreground: 'ffffff' },
        { token: 'function',   foreground: 'ffffff' },
        { token: 'variable',   foreground: 'ffffff' },
        { token: 'operator',   foreground: 'b7c6c2' },
        { token: 'delimiter',  foreground: 'b7c6c2' },
        { token: 'identifier', foreground: 'ffffff' },
        { token: 'tag',        foreground: 'ffe17c' },
        { token: 'attribute.name', foreground: 'ffffff' },
        { token: 'attribute.value', foreground: 'b7c6c2' },
      ],
      colors: {
        'editor.background':                '#171e19',
        'editor.foreground':                '#ffffff',
        'editor.lineHighlightBackground':   '#272727',
        'editor.selectionBackground':       '#ffe17c44',
        'editor.inactiveSelectionBackground': '#ffe17c22',
        'editorLineNumber.foreground':      '#b7c6c2',
        'editorLineNumber.activeForeground': '#ffe17c',
        'editorCursor.foreground':          '#ffe17c',
        'editorGutter.background':          '#171e19',
        'editorWidget.background':          '#272727',
        'editorWidget.border':              '#000000',
        'editorSuggestWidget.background':   '#272727',
        'editorSuggestWidget.border':       '#000000',
        'editorSuggestWidget.selectedBackground': '#ffe17c33',
        'input.background':                '#171e19',
        'focusBorder':                      '#ffe17c',
        'scrollbarSlider.background':       '#b7c6c233',
        'scrollbarSlider.hoverBackground':  '#ffe17c44',
        'scrollbarSlider.activeBackground': '#ffe17c66',
        'editorBracketMatch.background':    '#ffe17c22',
        'editorBracketMatch.border':        '#ffe17c55',
      },
    },
  },

  'cool-light': {
    id: 'cool-light',
    label: '❄️ Cool Light',
    monacoTheme: 'compilex-cool-light',

    // ─── CSS Custom Properties ───
    vars: {
      '--primary':       '#363b6c',
      '--bg':            '#eaedfe',
      '--surface':       '#ffffff',
      '--surface-2':     '#f0f1fa',
      '--surface-3':     '#dfe2f5',
      '--surface-glass': 'rgba(234, 237, 254, 0.92)',
      '--glass-blur':    'blur(14px)',

      '--text-primary':   '#363b6c',
      '--text-secondary': '#5d6199',
      '--text-muted':     '#9a9cc8',

      '--accent':       '#363b6c',
      '--accent-light':  '#a6a3e3',
      '--accent-dim':    'rgba(54, 59, 108, 0.1)',
      '--teal':          '#a6a3e3',
      '--teal-dim':      'rgba(166, 163, 227, 0.15)',

      '--border':       'rgba(54, 59, 108, 0.12)',
      '--border-hover':  'rgba(54, 59, 108, 0.25)',

      '--status-bar-bg': '#ffffff',
      '--status-bar-text': '#363b6c',

      '--run-btn-bg':    'linear-gradient(135deg, #4a4f8c, #363b6c)',
      '--run-btn-shadow': 'rgba(54, 59, 108, 0.25)',
      '--run-btn-hover-shadow': 'rgba(54, 59, 108, 0.4)',
      '--run-btn-active-bg': 'linear-gradient(135deg, #2d3158, #4a4f8c)',
    },

    // ─── Monaco Editor Theme ───
    monaco: {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment',    foreground: '9a9cc8', fontStyle: 'italic' },
        { token: 'keyword',    foreground: '363b6c', fontStyle: 'bold' },
        { token: 'string',     foreground: '2d8d6e' },
        { token: 'number',     foreground: 'c04e69' },
        { token: 'type',       foreground: '5d5daa' },
        { token: 'function',   foreground: '5d5daa' },
        { token: 'variable',   foreground: '363b6c' },
        { token: 'operator',   foreground: '5d6199' },
        { token: 'delimiter',  foreground: '5d6199' },
        { token: 'identifier', foreground: '363b6c' },
        { token: 'tag',        foreground: '363b6c' },
        { token: 'attribute.name', foreground: '5d5daa' },
        { token: 'attribute.value', foreground: '2d8d6e' },
      ],
      colors: {
        'editor.background':                '#ffffff',
        'editor.foreground':                '#363b6c',
        'editor.lineHighlightBackground':   '#f0f1fa',
        'editor.selectionBackground':       '#a6a3e333',
        'editor.inactiveSelectionBackground': '#a6a3e31a',
        'editorLineNumber.foreground':      '#9a9cc8',
        'editorLineNumber.activeForeground': '#363b6c',
        'editorCursor.foreground':          '#363b6c',
        'editorGutter.background':          '#ffffff',
        'editorWidget.background':          '#f0f1fa',
        'editorWidget.border':              '#dfe2f5',
        'editorSuggestWidget.background':   '#f0f1fa',
        'editorSuggestWidget.border':       '#dfe2f5',
        'editorSuggestWidget.selectedBackground': '#a6a3e322',
        'input.background':                '#f5f6fc',
        'focusBorder':                      '#363b6c',
        'scrollbarSlider.background':       '#c6c9e766',
        'scrollbarSlider.hoverBackground':  '#a6a3e344',
        'scrollbarSlider.activeBackground': '#a6a3e366',
        'editorBracketMatch.background':    '#a6a3e322',
        'editorBracketMatch.border':        '#a6a3e355',
      },
    },
  },
};

export const DEFAULT_THEME = 'warm-dark';
export const THEME_STORAGE_KEY = 'compilex-theme';

/** Get theme object by id */
export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME];
}

/** Get list of all theme entries for UI rendering */
export function getThemeList() {
  return Object.values(THEMES);
}
