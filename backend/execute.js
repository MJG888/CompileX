import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';

// Language configuration map — Judge0-compatible IDs
const langMap = {
    71: { ext: 'py',   compile: null,   runner: os.platform() === 'win32' ? 'python' : 'python3', args: (f) => ['-u', f] },
    63: { ext: 'js',   compile: null,   runner: 'node',   args: (f) => [f] },
    62: { ext: 'java', compile: 'javac', runner: 'java',  args: () => [] },
    54: { ext: 'cpp',  compile: os.platform() === 'win32' ? 'g++' : 'g++', runner: null, args: () => [] },
    50: { ext: 'c',    compile: os.platform() === 'win32' ? 'gcc' : 'gcc', runner: null, args: () => [] },
};

/**
 * Safely decode base64 content to UTF-8 string.
 * Falls back to raw string if decoding fails (content might not be base64).
 */
function decodeBase64(content) {
    if (!content) return '';
    try {
        const decoded = Buffer.from(content, 'base64').toString('utf-8');
        // Sanity check: if decoded is mostly printable, it was valid base64
        if (decoded && !decoded.includes('\ufffd')) return decoded;
        return content;
    } catch {
        return content;
    }
}

/**
 * Calculate execution stats from hrtime start.
 */
function calculateStats(result, startTime) {
    const diff = process.hrtime(startTime);
    result.time = (diff[0] + diff[1] / 1e9).toFixed(3);
    result.memory = Math.floor(process.memoryUsage().heapUsed / 1024); // Actual heap in KB
    return result;
}

/**
 * Extract Java public class name from source code.
 * Skips comments (single-line and multi-line) and handles annotations.
 */
function extractJavaClassName(source) {
    // Strip comments to avoid false matches
    const stripped = source
        .replace(/\/\/.*$/gm, '')           // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove multi-line comments

    // Match: optional annotations, optional 'public', 'class', then the name
    const match = stripped.match(/(?:^|\n)\s*(?:@\w+\s*(?:\([^)]*\)\s*)*)*(?:public\s+)?class\s+([A-Za-z_]\w*)/);
    return match ? match[1] : 'Main';
}

/**
 * Interactive execution via WebSocket with real-time streaming.
 * Supports: Python, JavaScript, Java, C, C++
 */
export const executeInteractive = async (data, socket) => {
    const { files, main_file, language_id } = data;
    const lang = langMap[language_id];
    if (!lang) throw new Error(`Unsupported language ID: ${language_id}`);

    // Create isolated temp directory
    const tmpPath = path.join(os.tmpdir(), `compilex_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(tmpPath, { recursive: true });

    const startTime = process.hrtime();
    let className = 'Main';
    let runFile = '';

    // Write all files to temp directory
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fName = file.name;
        const sourceStr = decodeBase64(file.content);

        // Normalize file extension
        if (fName === 'main' && lang.ext !== 'java') {
            fName = 'main.' + lang.ext;
        }

        // Java: extract class name, rename file accordingly
        if (lang.ext === 'java') {
            const detectedName = extractJavaClassName(sourceStr);
            if (file.name === main_file || files.length === 1 || fName === 'main') {
                className = detectedName;
            }
            if (!fName.endsWith('.java')) {
                fName = detectedName + '.java';
            }
        }

        if (file.name === main_file || (!runFile && i === 0)) runFile = fName;
        await fs.writeFile(path.join(tmpPath, fName), sourceStr);
    }

    // ─── Compilation Phase (Java, C, C++) ───
    if (lang.compile) {
        socket.emit('compilation_start');

        try {
            await new Promise((resolve, reject) => {
                let compileCmd, compileArgs;

                if (lang.ext === 'java') {
                    const cp = os.platform() === 'win32' ? '.' : '.';
                    compileCmd = 'javac';
                    compileArgs = ['-cp', cp, '-d', '.', '*.java'];
                    // javac doesn't support glob on all platforms, list files instead
                } else if (lang.ext === 'cpp') {
                    compileCmd = lang.compile;
                    compileArgs = ['-o', 'output', runFile, '-std=c++17', '-lm'];
                } else if (lang.ext === 'c') {
                    compileCmd = lang.compile;
                    compileArgs = ['-o', 'output', runFile, '-std=c11', '-lm'];
                }

                // For Java, we need to list actual files instead of glob
                if (lang.ext === 'java') {
                    // Read directory and find all .java files
                    fs.readdir(tmpPath).then(dirFiles => {
                        const javaFiles = dirFiles.filter(f => f.endsWith('.java'));
                        const cp = os.platform() === 'win32' ? '.' : '.';
                        const compileProcess = spawn('javac', ['-cp', cp, ...javaFiles], {
                            cwd: tmpPath,
                            shell: false,
                        });

                        // Expose compile process so Stop button can kill it
                        socket._compileProcess = compileProcess;

                        let stderrBuf = '';
                        compileProcess.stderr.on('data', (d) => { stderrBuf += d.toString(); });

                        compileProcess.on('error', (err) => {
                            if (err.code === 'ENOENT') {
                                reject(new Error(`${compileCmd} not found. Ensure the compiler is installed on the server.`));
                            } else {
                                reject(err);
                            }
                        });

                        compileProcess.on('close', (code) => {
                            socket._compileProcess = null;
                            if (code === 0) resolve();
                            else reject(new Error(stderrBuf || `Compilation failed with exit code ${code}`));
                        });
                    }).catch(reject);
                } else {
                    const compileProcess = spawn(compileCmd, compileArgs, {
                        cwd: tmpPath,
                        shell: false,
                    });

                    socket._compileProcess = compileProcess;

                    let stderrBuf = '';
                    compileProcess.stderr.on('data', (d) => { stderrBuf += d.toString(); });

                    compileProcess.on('error', (err) => {
                        if (err.code === 'ENOENT') {
                            reject(new Error(`${compileCmd} not found. Ensure the compiler is installed on the server.`));
                        } else {
                            reject(err);
                        }
                    });

                    compileProcess.on('close', (code) => {
                        socket._compileProcess = null;
                        if (code === 0) resolve();
                        else reject(new Error(stderrBuf || `Compilation failed with exit code ${code}`));
                    });
                }
            });
        } catch (err) {
            socket.emit('terminal_error', err.message + '\n');
            socket.emit('execution_complete', calculateStats({
                status: { id: 6, description: 'Compilation Error' }
            }, startTime));
            // Cleanup
            fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {});
            return null;
        }

        socket.emit('compilation_complete');
    }

    // ─── Runtime Phase ───
    let runnerCmd, runnerArgs;

    if (lang.ext === 'java') {
        runnerCmd = 'java';
        runnerArgs = ['-cp', '.', className];
    } else if (lang.ext === 'cpp' || lang.ext === 'c') {
        runnerCmd = os.platform() === 'win32' ? path.join(tmpPath, 'output.exe') : './output';
        runnerArgs = [];
    } else {
        runnerCmd = lang.runner;
        runnerArgs = lang.args(runFile);
    }

    const child = spawn(runnerCmd, runnerArgs, {
        cwd: tmpPath,
        shell: false,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    // 30-second execution timeout
    const timeout = setTimeout(() => {
        if (!child.killed) {
            child.kill('SIGKILL');
            socket.emit('terminal_error', '\n[Execution timed out — 30s limit]\n');
            socket.emit('execution_complete', calculateStats({
                status: { id: 5, description: 'Time Limit Exceeded' }
            }, startTime));
        }
    }, 30000);

    child.stdout.on('data', (d) => socket.emit('terminal_output', d.toString()));
    child.stderr.on('data', (d) => socket.emit('terminal_error', d.toString()));

    child.on('error', (err) => {
        clearTimeout(timeout);
        if (err.code === 'ENOENT') {
            socket.emit('terminal_error', `Error: ${runnerCmd} not found. Ensure the runtime is installed on the server.\n`);
        } else {
            socket.emit('terminal_error', err.message + '\n');
        }
        socket.emit('execution_complete', calculateStats({
            status: { id: 13, description: 'Internal Error' }
        }, startTime));
    });

    child.on('close', (code) => {
        clearTimeout(timeout);
        socket.emit('execution_complete', calculateStats({
            status: {
                id: code === 0 ? 3 : 11,
                description: code === 0 ? 'Accepted' : 'Runtime Error'
            }
        }, startTime));
        // Cleanup temp directory
        fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {});
    });

    return child;
};

/**
 * Batch execution endpoint (non-interactive, for REST fallback).
 * Runs locally — no Judge0 dependency.
 */
export const executeCodeLocally = async ({ files, main_file, language_id, stdin }) => {
    const lang = langMap[language_id];
    if (!lang) throw new Error(`Unsupported language ID: ${language_id}`);

    const tmpPath = path.join(os.tmpdir(), `compilex_batch_${Date.now()}`);
    await fs.mkdir(tmpPath, { recursive: true });

    const startTime = process.hrtime();
    let className = 'Main';
    let runFile = '';

    // Write files
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fName = file.name;
        const sourceStr = decodeBase64(file.content);

        if (fName === 'main' && lang.ext !== 'java') fName = 'main.' + lang.ext;

        if (lang.ext === 'java') {
            const detectedName = extractJavaClassName(sourceStr);
            if (file.name === main_file || files.length === 1 || fName === 'main') className = detectedName;
            if (!fName.endsWith('.java')) fName = detectedName + '.java';
        }

        if (file.name === main_file || (!runFile && i === 0)) runFile = fName;
        await fs.writeFile(path.join(tmpPath, fName), sourceStr);
    }

    // Compile if needed
    if (lang.compile) {
        try {
            await new Promise((resolve, reject) => {
                let compileCmd, compileArgs;

                if (lang.ext === 'java') {
                    compileCmd = 'javac';
                    compileArgs = [];
                } else if (lang.ext === 'cpp') {
                    compileCmd = lang.compile;
                    compileArgs = ['-o', 'output', runFile, '-std=c++17', '-lm'];
                } else {
                    compileCmd = lang.compile;
                    compileArgs = ['-o', 'output', runFile, '-std=c11', '-lm'];
                }

                // List java files for javac
                if (lang.ext === 'java') {
                    fs.readdir(tmpPath).then(dirFiles => {
                        const javaFiles = dirFiles.filter(f => f.endsWith('.java'));
                        const proc = spawn('javac', ['-cp', '.', ...javaFiles], { cwd: tmpPath });
                        let stderr = '';
                        proc.stderr.on('data', d => { stderr += d.toString(); });
                        proc.on('error', reject);
                        proc.on('close', code => code === 0 ? resolve() : reject(new Error(stderr)));
                    }).catch(reject);
                } else {
                    const proc = spawn(compileCmd, compileArgs, { cwd: tmpPath });
                    let stderr = '';
                    proc.stderr.on('data', d => { stderr += d.toString(); });
                    proc.on('error', reject);
                    proc.on('close', code => code === 0 ? resolve() : reject(new Error(stderr)));
                }
            });
        } catch (err) {
            const result = calculateStats({
                stdout: '', stderr: '', compile_output: err.message,
                status: { id: 6, description: 'Compilation Error' }
            }, startTime);
            fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {});
            return result;
        }
    }

    // Run
    let runnerCmd, runnerArgs;
    if (lang.ext === 'java') {
        runnerCmd = 'java';
        runnerArgs = ['-cp', '.', className];
    } else if (lang.ext === 'cpp' || lang.ext === 'c') {
        runnerCmd = os.platform() === 'win32' ? path.join(tmpPath, 'output.exe') : './output';
        runnerArgs = [];
    } else {
        runnerCmd = lang.runner;
        runnerArgs = lang.args(runFile);
    }

    // Decode stdin
    const stdinStr = decodeBase64(stdin || '');

    return new Promise((resolve) => {
        const child = spawn(runnerCmd, runnerArgs, {
            cwd: tmpPath,
            shell: false,
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
        });

        let stdout = '', stderr = '';

        const timeout = setTimeout(() => {
            if (!child.killed) child.kill('SIGKILL');
        }, 30000);

        child.stdout.on('data', d => { stdout += d.toString(); });
        child.stderr.on('data', d => { stderr += d.toString(); });

        if (stdinStr) {
            child.stdin.write(stdinStr);
            child.stdin.end();
        } else {
            child.stdin.end();
        }

        child.on('error', (err) => {
            clearTimeout(timeout);
            resolve(calculateStats({
                stdout: '', stderr: err.message, compile_output: '',
                status: { id: 13, description: 'Internal Error' }
            }, startTime));
        });

        child.on('close', (code) => {
            clearTimeout(timeout);
            resolve(calculateStats({
                stdout, stderr, compile_output: '',
                status: { id: code === 0 ? 3 : 11, description: code === 0 ? 'Accepted' : 'Runtime Error' }
            }, startTime));
            fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {});
        });
    });
};
