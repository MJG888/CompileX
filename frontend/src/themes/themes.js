/* ═══════════════════════════════════════════════════
   CompileX Theme Registry
   Scalable theme system — add new themes here
═══════════════════════════════════════════════════ */

export const THEMES = {
  'soft-focus': {
    id: 'soft-focus',
    label: 'Soft Focus',
    monacoTheme: 'compilex-soft-focus',

    vars: {
      '--primary':       '#ffb7b2',
      '--bg':            '#fdfcf8',
      '--surface':       '#ffffff',
      '--surface-2':     '#f6f3ee',
      '--surface-3':     '#e8efe8',
      '--surface-glass': 'rgba(255, 255, 255, 0.72)',
      '--glass-blur':    'blur(20px)',

      '--text-primary':   '#292524',
      '--text-secondary': '#57534e',
      '--text-muted':     '#78716c',

      '--accent':       '#ff9f98',
      '--accent-light':  '#d97974',
      '--accent-dim':    'rgba(255, 183, 178, 0.28)',
      '--teal':          '#66806a',
      '--teal-dim':      'rgba(232, 239, 232, 0.88)',

      '--border':       'rgba(120, 113, 108, 0.14)',
      '--border-hover':  'rgba(255, 183, 178, 0.72)',

      '--status-bar-bg': 'rgba(255, 255, 255, 0.74)',
      '--status-bar-text': '#78716c',

      '--run-btn-bg':    '#292524',
      '--run-btn-shadow': 'rgba(41, 37, 36, 0.12)',
      '--run-btn-hover-shadow': 'rgba(41, 37, 36, 0.2)',
      '--run-btn-active-bg': '#1c1917',
    },

    monaco: {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment',    foreground: '9a8f88', fontStyle: 'italic' },
        { token: 'keyword',    foreground: 'b55f5a', fontStyle: 'bold' },
        { token: 'string',     foreground: '66806a' },
        { token: 'number',     foreground: '7f78a7' },
        { token: 'type',       foreground: '8a6f4d' },
        { token: 'function',   foreground: '7f78a7' },
        { token: 'variable',   foreground: '292524' },
        { token: 'operator',   foreground: '78716c' },
        { token: 'delimiter',  foreground: '78716c' },
        { token: 'identifier', foreground: '292524' },
        { token: 'tag',        foreground: 'b55f5a' },
        { token: 'attribute.name', foreground: '7f78a7' },
        { token: 'attribute.value', foreground: '66806a' },
      ],
      colors: {
        'editor.background':                '#ffffff',
        'editor.foreground':                '#292524',
        'editor.lineHighlightBackground':   '#f6f3ee',
        'editor.selectionBackground':       '#ffb7b244',
        'editor.inactiveSelectionBackground': '#efedf455',
        'editorLineNumber.foreground':      '#b9b1aa',
        'editorLineNumber.activeForeground': '#d97974',
        'editorCursor.foreground':          '#d97974',
        'editorGutter.background':          '#ffffff',
        'editorWidget.background':          '#ffffff',
        'editorWidget.border':              '#e7e5e4',
        'editorSuggestWidget.background':   '#ffffff',
        'editorSuggestWidget.border':       '#e7e5e4',
        'editorSuggestWidget.selectedBackground': '#e8efe8',
        'input.background':                '#f6f3ee',
        'focusBorder':                      '#ffb7b2',
        'scrollbarSlider.background':       '#d6d3d166',
        'scrollbarSlider.hoverBackground':  '#ffb7b266',
        'scrollbarSlider.activeBackground': '#ffb7b299',
        'editorBracketMatch.background':    '#e8efe8',
        'editorBracketMatch.border':        '#ffb7b2',
      },
    },
  },

  'warm-dark': {
    id: 'warm-dark',
    label: '🔥 Warm Dark',
    monacoTheme: 'compilex-warm-dark',

    // ─── CSS Custom Properties ───
    vars: {
      '--primary':       '#ff771c',
      '--bg':            '#161311',
      '--surface':       '#1e1a17',
      '--surface-2':     '#262018',
      '--surface-3':     '#332b22',
      '--surface-glass': 'rgba(22, 19, 17, 0.88)',
      '--glass-blur':    'blur(14px)',

      '--text-primary':   '#f5ede0',
      '--text-secondary': '#b8a994',
      '--text-muted':     '#6d5f50',

      '--accent':       '#ff771c',
      '--accent-light':  '#ff9a52',
      '--accent-dim':    'rgba(255, 119, 28, 0.15)',
      '--teal':          '#546877',
      '--teal-dim':      'rgba(84, 104, 119, 0.15)',

      '--border':       'rgba(255, 255, 255, 0.08)',
      '--border-hover':  'rgba(255, 119, 28, 0.3)',

      '--status-bar-bg': '#1e1a17',
      '--status-bar-text': '#ff771c',

      '--run-btn-bg':    'linear-gradient(135deg, #d4622a, #ff771c)',
      '--run-btn-shadow': 'rgba(255, 119, 28, 0.3)',
      '--run-btn-hover-shadow': 'rgba(255, 119, 28, 0.45)',
      '--run-btn-active-bg': 'linear-gradient(135deg, #b8531e, #d4622a)',
    },

    // ─── Monaco Editor Theme ───
    monaco: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',    foreground: '6d5f50', fontStyle: 'italic' },
        { token: 'keyword',    foreground: 'ff9a52', fontStyle: 'bold' },
        { token: 'string',     foreground: '8fbc6e' },
        { token: 'number',     foreground: 'd4956a' },
        { token: 'type',       foreground: '6d8fa6' },
        { token: 'function',   foreground: '6d8fa6' },
        { token: 'variable',   foreground: 'f5ede0' },
        { token: 'operator',   foreground: 'b8a994' },
        { token: 'delimiter',  foreground: 'b8a994' },
        { token: 'identifier', foreground: 'f5ede0' },
        { token: 'tag',        foreground: 'ff771c' },
        { token: 'attribute.name', foreground: '6d8fa6' },
        { token: 'attribute.value', foreground: '8fbc6e' },
      ],
      colors: {
        'editor.background':                '#161311',
        'editor.foreground':                '#f5ede0',
        'editor.lineHighlightBackground':   '#1e1a17',
        'editor.selectionBackground':       '#ff771c33',
        'editor.inactiveSelectionBackground': '#ff771c1a',
        'editorLineNumber.foreground':      '#6d5f50',
        'editorLineNumber.activeForeground': '#ff771c',
        'editorCursor.foreground':          '#ff771c',
        'editorGutter.background':          '#161311',
        'editorWidget.background':          '#1e1a17',
        'editorWidget.border':              '#332b22',
        'editorSuggestWidget.background':   '#1e1a17',
        'editorSuggestWidget.border':       '#332b22',
        'editorSuggestWidget.selectedBackground': '#ff771c22',
        'input.background':                '#1a1612',
        'focusBorder':                      '#ff771c',
        'scrollbarSlider.background':       '#332b2266',
        'scrollbarSlider.hoverBackground':  '#ff771c44',
        'scrollbarSlider.activeBackground': '#ff771c66',
        'editorBracketMatch.background':    '#ff771c22',
        'editorBracketMatch.border':        '#ff771c55',
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

export const DEFAULT_THEME = 'soft-focus';
export const THEME_STORAGE_KEY = 'compilex-theme';

/** Get theme object by id */
export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME];
}

/** Get list of all theme entries for UI rendering */
export function getThemeList() {
  return Object.values(THEMES);
}
