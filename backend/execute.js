import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';

const windowsToolchainDirs = [
    'C:\\msys64\\ucrt64\\bin',
    'C:\\msys64\\mingw64\\bin',
    'C:\\msys64\\clang64\\bin',
    'C:\\msys64\\clangarm64\\bin',
    'C:\\MinGW\\bin',
    'C:\\mingw64\\bin',
].filter(dir => {
    try {
        return fsSync.existsSync(dir);
    } catch {
        return false;
    }
});

function resolveCommand(command) {
    if (os.platform() !== 'win32' || path.isAbsolute(command)) return command;

    const candidates = windowsToolchainDirs.map(dir => path.join(dir, `${command}.exe`));
    const found = candidates.find(candidate => {
        try {
            return fsSync.existsSync(candidate);
        } catch {
            return false;
        }
    });

    return found || command;
}

const runtimeCommands = {
    python: resolveCommand(process.env.PYTHON_CMD || (os.platform() === 'win32' ? 'python' : 'python3')),
    node: resolveCommand(process.env.NODE_CMD || 'node'),
    javac: resolveCommand(process.env.JAVAC_CMD || 'javac'),
    java: resolveCommand(process.env.JAVA_CMD || 'java'),
    c: resolveCommand(process.env.CC || 'gcc'),
    cpp: resolveCommand(process.env.CXX || 'g++'),
};

// Language configuration map — Judge0-compatible IDs
const langMap = {
    71: { ext: 'py',   compile: null,                 runner: runtimeCommands.python, args: (f) => ['-u', f] },
    63: { ext: 'js',   compile: null,                 runner: runtimeCommands.node,   args: (f) => [f] },
    62: { ext: 'java', compile: runtimeCommands.javac, runner: runtimeCommands.java,   args: () => [] },
    54: { ext: 'cpp',  compile: runtimeCommands.cpp,   runner: null,                   args: () => [] },
    50: { ext: 'c',    compile: runtimeCommands.c,     runner: null,                   args: () => [] },
};

const missingToolHints = {
    gcc: {
        win32: 'Install MSYS2 or MinGW-w64 and add its bin directory to PATH, or run the backend with Docker.',
        linux: 'Install the C/C++ toolchain on the server. Debian/Ubuntu: apt-get install -y build-essential.',
        darwin: 'Install Xcode Command Line Tools: xcode-select --install.',
        default: 'Install gcc and make sure it is available on PATH.',
    },
    'g++': {
        win32: 'Install MSYS2 or MinGW-w64 and add its bin directory to PATH, or run the backend with Docker.',
        linux: 'Install the C/C++ toolchain on the server. Debian/Ubuntu: apt-get install -y build-essential.',
        darwin: 'Install Xcode Command Line Tools: xcode-select --install.',
        default: 'Install g++ and make sure it is available on PATH.',
    },
    javac: {
        default: 'Install a JDK and make sure javac is available on PATH.',
    },
    java: {
        default: 'Install a JDK or JRE and make sure java is available on PATH.',
    },
    python: {
        default: 'Install Python and make sure python is available on PATH.',
    },
    python3: {
        default: 'Install Python 3 and make sure python3 is available on PATH.',
    },
    node: {
        default: 'Install Node.js and make sure node is available on PATH.',
    },
};

function missingToolMessage(command, code = 'ENOENT') {
    const key = path.basename(command).toLowerCase().replace(/\.exe$/, '');
    const hints = missingToolHints[key];
    const hint = hints?.[os.platform()] || hints?.default || `Install ${command} and make sure it is available on PATH.`;
    const problem = code === 'EPERM' ? 'could not be started' : 'not found';
    return `${command} ${problem}. ${hint}`;
}

function normalizeSpawnError(err, command) {
    return err?.code === 'ENOENT' || err?.code === 'EPERM'
        ? new Error(missingToolMessage(command, err.code))
        : err;
}

function withToolchainPath(options = {}) {
    if (os.platform() !== 'win32' || windowsToolchainDirs.length === 0) {
        return options;
    }

    const env = { ...process.env, ...(options.env || {}) };
    const currentPath = env.Path || env.PATH || '';
    const pathValue = [...windowsToolchainDirs, currentPath].filter(Boolean).join(path.delimiter);

    env.Path = pathValue;
    env.PATH = pathValue;

    return { ...options, env };
}

function spawnProcess(command, args, options) {
    try {
        return spawn(command, args, withToolchainPath(options));
    } catch (err) {
        throw normalizeSpawnError(err, command);
    }
}

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
                    compileCmd = lang.compile;
                    compileArgs = [];
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
                        const compileProcess = spawnProcess(compileCmd, ['-cp', cp, ...javaFiles], {
                            cwd: tmpPath,
                            shell: false,
                        });

                        // Expose compile process so Stop button can kill it
                        socket._compileProcess = compileProcess;

                        let stderrBuf = '';
                        compileProcess.stderr.on('data', (d) => { stderrBuf += d.toString(); });

                        compileProcess.on('error', (err) => {
                            reject(normalizeSpawnError(err, compileCmd));
                        });

                        compileProcess.on('close', (code) => {
                            socket._compileProcess = null;
                            if (code === 0) resolve();
                            else reject(new Error(stderrBuf || `Compilation failed with exit code ${code}`));
                        });
                    }).catch(reject);
                } else {
                    const compileProcess = spawnProcess(compileCmd, compileArgs, {
                        cwd: tmpPath,
                        shell: false,
                    });

                    socket._compileProcess = compileProcess;

                    let stderrBuf = '';
                    compileProcess.stderr.on('data', (d) => { stderrBuf += d.toString(); });

                    compileProcess.on('error', (err) => {
                        reject(normalizeSpawnError(err, compileCmd));
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
        runnerCmd = lang.runner;
        runnerArgs = ['-cp', '.', className];
    } else if (lang.ext === 'cpp' || lang.ext === 'c') {
        runnerCmd = os.platform() === 'win32' ? path.join(tmpPath, 'output.exe') : './output';
        runnerArgs = [];
    } else {
        runnerCmd = lang.runner;
        runnerArgs = lang.args(runFile);
    }

    let child;
    try {
        child = spawnProcess(runnerCmd, runnerArgs, {
            cwd: tmpPath,
            shell: false,
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
        });
    } catch (err) {
        socket.emit('terminal_error', err.message + '\n');
        socket.emit('execution_complete', calculateStats({
            status: { id: 13, description: 'Internal Error' }
        }, startTime));
        fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {});
        return null;
    }

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
        if (err.code === 'ENOENT' || err.code === 'EPERM') {
            socket.emit('terminal_error', `Error: ${missingToolMessage(runnerCmd, err.code)}\n`);
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
                    compileCmd = lang.compile;
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
                        const proc = spawnProcess(compileCmd, ['-cp', '.', ...javaFiles], { cwd: tmpPath });
                        let stderr = '';
                        proc.stderr.on('data', d => { stderr += d.toString(); });
                        proc.on('error', err => reject(normalizeSpawnError(err, compileCmd)));
                        proc.on('close', code => code === 0 ? resolve() : reject(new Error(stderr)));
                    }).catch(reject);
                } else {
                    const proc = spawnProcess(compileCmd, compileArgs, { cwd: tmpPath });
                    let stderr = '';
                    proc.stderr.on('data', d => { stderr += d.toString(); });
                    proc.on('error', err => reject(normalizeSpawnError(err, compileCmd)));
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
        runnerCmd = lang.runner;
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
        let child;
        try {
            child = spawnProcess(runnerCmd, runnerArgs, {
                cwd: tmpPath,
                shell: false,
                env: { ...process.env, PYTHONUNBUFFERED: '1' },
            });
        } catch (err) {
            resolve(calculateStats({
                stdout: '', stderr: err.message, compile_output: '',
                status: { id: 13, description: 'Internal Error' }
            }, startTime));
            fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {});
            return;
        }

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
                stdout: '', stderr: err.code === 'ENOENT' || err.code === 'EPERM' ? missingToolMessage(runnerCmd, err.code) : err.message, compile_output: '',
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
