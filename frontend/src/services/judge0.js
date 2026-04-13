// Custom Local Execution Service
// Replaces Judge0 CE to run natively on localhost:5000

const LOCAL_BACKEND_URL = 'http://localhost:5000';

export const executeCode = async (files, mainFile, languageId, stdin = '') => {
  // We use base64 encoding just like Judge0 to avoid special character escaping issues in JSON
  const encode = (str) => btoa(unescape(encodeURIComponent(str)));
  const decode = (str) => {
    try { return str ? decodeURIComponent(escape(atob(str))) : ''; }
    catch { return str || ''; }
  };

  const encodedFiles = files.map(f => ({
      name: f.name,
      content: encode(f.content)
  }));

  const response = await fetch(`${LOCAL_BACKEND_URL}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: encodedFiles,
      main_file: mainFile,
      language_id: languageId,
      stdin: encode(stdin || '')
    }),
  });

  if (!response.ok) {
      throw new Error(`Execution failed to connect to backend: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export const isMockMode = () => false;
