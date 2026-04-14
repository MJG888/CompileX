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
    // Local interactive spawning disabled to ensure environment independence
    // and to follow the rule: "Do NOT use local system commands"
    socket.emit('terminal_error', '[CompileX Engine]: Interactive terminal is currently routed through the batch API for security and stability.\nPlease use the "Input" tab for stdin and click "Run".');
    socket.emit('execution_complete', { 
        status: { id: 13, description: 'Internal Error' },
        time: '0.000',
        memory: 0
    });
    return null;
};
