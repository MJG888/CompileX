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
    const lang = langMap[language_id];
    if (!lang) {
        throw new Error('Unsupported language ID.');
    }

    const tmpPath = path.join(os.tmpdir(), `compilex_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(tmpPath, { recursive: true });

    let className = 'Main';
    let runFile = '';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fName = file.name;
        const sourceStr = Buffer.from(file.content, 'base64').toString('utf-8');
        
        // Retrofit legacy defaults
        if (fName === 'main' && lang.ext !== 'java') fName = 'main.' + lang.ext;
        
        if (lang.ext === 'java') {
            const match = sourceStr.match(/(?:public\s+)?class\s+([a-zA-Z0-9_]+)/);
            if (match) {
                const detectedName = match[1];
                // if this is the main file or only file, set as primary class
                if (file.name === main_file || files.length === 1 || fName === 'main') {
                    className = detectedName;
                }
                if (!fName.endsWith('.java')) fName = detectedName + '.java';
            } else if (!fName.endsWith('.java')) {
                fName += '.java';
            }
        }

        if (file.name === main_file || (!runFile && i === 0)) {
            runFile = fName;
        }
        
        await fs.writeFile(path.join(tmpPath, fName), sourceStr);
    }
    
    // Always write input.txt so blocking read functions (like Scanner) hit EOF instantly and crash
    // instead of waiting 10 seconds for user terminal input
    const stdinStr = stdin ? Buffer.from(stdin, 'base64').toString('utf-8') : '';
    await fs.writeFile(path.join(tmpPath, 'input.txt'), stdinStr);

    const startTime = process.hrtime();
    let result = { stdout: '', stderr: '', compile_output: '' };

    try {
        let command = '';
        const inputRedirect = ` < input.txt`;

        // Java needs compilation first
        if (lang.ext === 'java') {
            // Compile
            try {
                // Ensure a lib directory exists for external JARs (though empty initially)
                await fs.mkdir(path.join(tmpPath, 'lib'), { recursive: true });
                const compileCmd = os.platform() === 'win32' 
                    ? `javac -cp ".;lib/*" *.java` 
                    : `javac -cp ".:lib/*" *.java`;
                await execPromise(compileCmd, { cwd: tmpPath, timeout: 5000 });
            } catch (err) {
                result.compile_output = err.stderr || err.message;
                return calculateStats(result, startTime);
            }
            // Run
            const javaCp = os.platform() === 'win32' ? `".;lib/*"` : `".:lib/*"`;
            command = `java -cp ${javaCp} ${className}${inputRedirect}`;
        }
        else {
            command = `${lang.runner} ${runFile}${inputRedirect}`;
        }

        // Execute code
        const { stdout, stderr } = await execPromise(command, { 
            cwd: tmpPath, 
            timeout: 10000, 
            maxBuffer: 1024 * 1024 * 5 // 5MB buffer
        });

        result.stdout = stdout;
        result.stderr = stderr;
        
        if (lang.ext === 'java' && stderr.includes('NoSuchElementException')) {
            result.stderr += '\n\n[CompileX Hint]: Java triggered a Scanner error. Please provide your input in the Console "Input" tab before clicking Run.';
        }

    } catch (err) {
        if (err.killed) {
            result.stderr = 'Execution Time Limit Exceeded (10s)';
        } else {
            result.stderr = err.stderr || err.message;
        }
    } finally {
        // Cleanup temp files
        try {
            await fs.rm(tmpPath, { recursive: true, force: true });
        } catch (e) {
            console.error('Failed to cleanup temp dir:', e);
        }
    }

    return calculateStats(result, startTime);
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
        // Support base64 or unencoded payload seamlessly
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
        // Python caching disable -> interactive stdout instantly
        runnerArgs = ['-u', runFile];
    } else {
        runnerArgs = [runFile];
    }

    const child = spawn(runnerCmd, runnerArgs, { cwd: tmpPath });

    child.stdout.on('data', (d) => socket.emit('terminal_output', d.toString()));
    child.stderr.on('data', (d) => socket.emit('terminal_error', d.toString()));
    child.on('error', (err) => socket.emit('terminal_error', err.message));

    child.on('close', (code) => {
        socket.emit('execution_complete', calculateStats({ 
            status: { id: code === 0 ? 3 : 11, description: code === 0 ? 'Accepted' : 'Runtime Error' } 
        }, startTime));
        // Cleanup
        fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {});
    });

    return child;
};
