import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import util from 'util';
import os from 'os';

const execPromise = util.promisify(exec);

// Map Judge0 Language IDs to Extensions and Executors
const langMap = {
    71: { cmd: 'python', ext: 'py', runner: 'python' }, // Python
    63: { cmd: 'node', ext: 'js', runner: 'node' },     // Node.js
    62: { cmd: 'java', ext: 'java', runner: 'java' }    // Java
};

export const executeCodeLocally = async ({ files, main_file, language_id, stdin }) => {
    // Independent of local machine - using Judge0 API
    const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true';
    const RAPIDAPI_KEY = process.env.VITE_JUDGE0_API_KEY || '88961d0ab4mshca879b86b99bbc7p1e23bajsn66f53c63fbc2';
    
    // Find the main file content
    const mainFile = files.find(f => f.name === main_file) || files[0];
    const sourceCode = mainFile.content; // Already base64 from frontend

    try {
        const response = await fetch(JUDGE0_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                'X-RapidAPI-Key': RAPIDAPI_KEY
            },
            body: JSON.stringify({
                source_code: sourceCode,
                language_id: language_id,
                stdin: stdin
            })
        });

        if (!response.ok) {
            throw new Error(`Execution Service Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            stdout: Buffer.from(data.stdout || '', 'base64').toString('utf-8'),
            stderr: Buffer.from(data.stderr || '', 'base64').toString('utf-8'),
            compile_output: Buffer.from(data.compile_output || '', 'base64').toString('utf-8'),
            time: data.time || '0.00',
            memory: data.memory || 0,
            status: data.status
        };

    } catch (err) {
        return {
            stdout: '',
            stderr: err.message,
            compile_output: '',
            time: '0.00',
            memory: 0,
            status: { id: 13, description: 'Internal Error' }
        };
    }
};

function calculateStats(result, startTime) {
    const diff = process.hrtime(startTime);
    result.time = (diff[0] + diff[1] / 1e9).toFixed(3);
    result.memory = 32000; // Simulated memory limit
    return result;
}

export const executeInteractive = async (data, socket) => {
    const { files, main_file, language_id } = data;
    const lang = langMap[language_id];
    if (!lang) throw new Error('Unsupported language ID.');

    const tmpPath = path.join(os.tmpdir(), `compilex_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(tmpPath, { recursive: true });

    let className = 'Main';
    let runFile = '';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fName = file.name;
        // Handle potential base64 if sent from some variants, or raw string
        let sourceStr = file.content;
        try { sourceStr = Buffer.from(file.content, 'base64').toString('utf-8'); } catch(e){}
        
        if (fName === 'main' && lang.ext !== 'java') fName = 'main.' + lang.ext;
        
        if (lang.ext === 'java') {
            const match = sourceStr.match(/(?:public\s+)?class\s+([a-zA-Z0-9_]+)/);
            if (match) {
                const detectedName = match[1];
                if (file.name === main_file || files.length === 1 || fName === 'main') className = detectedName;
                if (!fName.endsWith('.java')) fName = detectedName + '.java';
            } else if (!fName.endsWith('.java')) {
                fName += '.java';
            }
        }
        if (file.name === main_file || (!runFile && i === 0)) runFile = fName;
        await fs.writeFile(path.join(tmpPath, fName), sourceStr);
    }

    const startTime = process.hrtime();
    let runnerCmd = lang.runner;
    let runnerArgs = [];

    if (lang.ext === 'java') {
        try {
            await fs.mkdir(path.join(tmpPath, 'lib'), { recursive: true });
            const compileCmd = os.platform() === 'win32' ? `javac -cp ".;lib/*" *.java` : `javac -cp ".:lib/*" *.java`;
            await execPromise(compileCmd, { cwd: tmpPath });
        } catch (err) {
            socket.emit('terminal_error', err.stderr || err.message);
            socket.emit('execution_complete', calculateStats({ status: { id: 11 } }, startTime));
            return null;
        }
        const javaCp = os.platform() === 'win32' ? `.;lib/*` : `.:lib/*`;
        runnerCmd = 'java';
        runnerArgs = ['-cp', javaCp, className];
    } else if (lang.ext === 'py') {
        // Try to handle "python not found" by checking 'python' then 'py'
        runnerCmd = os.platform() === 'win32' ? 'python' : 'python3';
        runnerArgs = ['-u', runFile]; // Unbuffered for streaming
    } else {
        runnerArgs = [runFile];
    }

    const child = spawn(runnerCmd, runnerArgs, { cwd: tmpPath });

    // Self-destruction timer (30 seconds max execution)
    const timeout = setTimeout(() => {
        if (!child.killed) {
            child.kill('SIGKILL');
            socket.emit('terminal_error', '\n[Execution timed out (30s limit)]\n');
        }
    }, 30000);

    child.stdout.on('data', (d) => socket.emit('terminal_output', d.toString()));
    child.stderr.on('data', (d) => socket.emit('terminal_error', d.toString()));
    
    child.on('error', (err) => {
        clearTimeout(timeout);
        if (err.code === 'ENOENT') {
            socket.emit('terminal_error', `Error: ${runnerCmd} command not found. Please ensure the compiler is installed on the server.`);
        } else {
            socket.emit('terminal_error', err.message);
        }
    });

    child.on('close', (code) => {
        clearTimeout(timeout);
        socket.emit('execution_complete', calculateStats({ 
            status: { id: code === 0 ? 3 : 11, description: code === 0 ? 'Accepted' : 'Runtime Error' } 
        }, startTime));
        // Cleanup temp directory
        fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {});
    });

    return child;
};
