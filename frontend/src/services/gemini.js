// Free AI Service using Groq (Llama-3)
// Get a fully free API key without a credit card from: https://console.groq.com/keys

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MOCK_MODE = !GROQ_API_KEY;

// ─── Mock AI Responses ────────────────────────────────────────────────────────
// Note: We use string concatenation to avoid nested template literal issues
const F = '```'; // fence shorthand

const MOCK_RESPONSES = {
  generate: (prompt, language) => ({
    text: [
      '// Generated implementation for: ' + prompt,
      '',
      F + language,
      '// Demo mode - Add VITE_GROQ_API_KEY to .env for real AI responses',
      '',
      'def binary_search(arr, target):',
      '    # Implementation placeholder',
      '    return -1',
      F
    ].join('\n'),
    type: 'code',
  }),
  debug: (code, error) => ({
    text: '## Bug Analysis\n**Demo Mode** — Add VITE_GROQ_API_KEY to .env.',
    type: 'text',
  }),
  explain: (code) => ({
    text: '## Code Explanation\n**Demo Mode** — Add VITE_GROQ_API_KEY to .env.',
    type: 'text',
  }),
  optimize: () => ({
    text: '## Performance Optimization\n**Demo Mode** — Add VITE_GROQ_API_KEY to .env.',
    type: 'text',
  }),
  convert: (fromLang, toLang) => ({
    text: '## Language Conversion\n**Demo Mode** — Add VITE_GROQ_API_KEY.',
    type: 'code',
  }),
};

// Simulate delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── Real Groq (Llama) API Call ───────────────────────────────────────────────
const callAI = async (prompt) => {
  const response = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'AI API error: ' + response.statusText);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response from AI.';
};

// ─── Formatting Helpers ─────────────────────────────────────────────────────────
const stringifyContext = (contextBundle, language) => {
  if (typeof contextBundle === 'string') {
    return `${F}${language}\n${contextBundle}\n${F}`;
  }
  if (!Array.isArray(contextBundle)) return '';
  return contextBundle.map(f => `**File: ${f.name}**\n${F}${language}\n${f.content || ''}\n${F}`).join('\n\n');
};

// ─── Public AI Feature APIs ───────────────────────────────────────────────────
export const generateCode = async (prompt, language) => {
  if (MOCK_MODE) {
    await delay(1200);
    return MOCK_RESPONSES.generate(prompt, language);
  }
  const fullPrompt =
    'You are an expert ' + language + ' programmer. Generate clean, well-commented ' + language +
    ' code for the following request. Include a brief explanation after the code block.\n\nRequest: ' +
    prompt + '\n\nProvide the code in a markdown code block with proper syntax highlighting.';
  const text = await callAI(fullPrompt);
  return { text, type: 'code' };
};

export const debugCode = async (contextBundle, error, language) => {
  if (MOCK_MODE) {
    await delay(1000);
    return MOCK_RESPONSES.debug(contextBundle, error);
  }
  const formattedCode = stringifyContext(contextBundle, language);
  const fullPrompt =
    'You are a strict ' + language + ' debugging expert system. Your task is to act exclusively as a debugger.\n' +
    'Carefully analyze the complete multi-file project and the crash runtime error output to detect the exact fault.\n\n' +
    '**Project Context:**\n' + formattedCode + '\n\n' +
    '**Error Output:**\n' + F + '\n' + (error || 'No explicitly reported runtime error. Check for hidden logical bugs.') + '\n' + F + '\n\n' +
    'You MUST structure your response strictly as:\n' +
    '1) **Error Type & Root Cause** (Explain exactly why it crashed)\n' +
    '2) **Fixed Code** (Output the specific rewritten code blocks for the files that required modifications)\n' +
    '3) **Explanation of the fix**\n';
  const text = await callAI(fullPrompt);
  return { text, type: 'code' };
};

export const explainCode = async (contextBundle, language) => {
  if (MOCK_MODE) {
    await delay(1000);
    return MOCK_RESPONSES.explain(contextBundle);
  }
  const formattedCode = stringifyContext(contextBundle, language);
  const fullPrompt =
    'You are a technical programming expert. Explain this ' + language +
    ' project clearly and professionally. Discuss the architecture across files if applicable, then break it down line by line or section by section. Use technical, precise language.\n\n' +
    formattedCode;
  const text = await callAI(fullPrompt);
  return { text, type: 'text' };
};

export const optimizeCode = async (contextBundle, language) => {
  if (MOCK_MODE) {
    await delay(1000);
    return MOCK_RESPONSES.optimize();
  }
  const formattedCode = stringifyContext(contextBundle, language);
  const fullPrompt =
    'You are a ' + language + ' performance expert. Analyze this project code for inefficiencies and provide ' +
    'optimized versions of the necessary files with explanation. Focus on: time complexity, space complexity, and architectural best practices.\n\n' +
    formattedCode;
  const text = await callAI(fullPrompt);
  return { text, type: 'code' };
};

export const convertCode = async (contextBundle, fromLang, toLang) => {
  if (MOCK_MODE) {
    await delay(1200);
    return MOCK_RESPONSES.convert(fromLang, toLang);
  }
  const formattedCode = stringifyContext(contextBundle, fromLang);
  const fullPrompt =
    'Convert this ' + fromLang + ' project to ' + toLang +
    '. Maintain the exact same logic and functionality. Use idiomatic ' + toLang +
    ' modular patterns. Include comments explaining significant translations.\n\n' +
    '**' + fromLang + ' Project Context:**\n' + formattedCode +
    '\n\nProvide the complete ' + toLang + ' equivalents cleanly separated in code blocks.';
  const text = await callAI(fullPrompt);
  return { text, type: 'code' };
};

export const isAIMockMode = () => MOCK_MODE;
