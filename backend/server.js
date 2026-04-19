import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { executeCodeLocally, executeInteractive } from './execute.js';

const app = express();
const server = http.createServer(app);

// Allowed frontend origins
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : '*',
}));
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CompileX Execution Server',
        uptime: process.uptime(),
    });
});

// REST execution endpoint (batch mode, non-interactive)
app.post('/execute', async (req, res) => {
    const { source_code, files, main_file, language_id, stdin } = req.body;

    // Backwards compatibility: accept single source_code or files array
    const codeFiles = files || (source_code ? [{ name: 'main', content: source_code }] : []);

    if (codeFiles.length === 0) {
        return res.status(400).json({ error: 'files or source_code is required' });
    }

    try {
        const result = await executeCodeLocally({ files: codeFiles, main_file, language_id, stdin });
        res.json({
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            compile_output: result.compile_output || '',
            time: result.time || '0.00',
            memory: result.memory || 0,
            status: result.status || { id: 3, description: 'Accepted' },
        });
    } catch (error) {
        console.error('Execution Error:', error);
        res.status(500).json({
            stdout: '',
            stderr: error.message || 'Internal Server Error',
            compile_output: '',
            time: '0.00',
            memory: 0,
            status: { id: 13, description: 'Internal Error' },
        });
    }
});

// WebSocket — real-time interactive execution
io.on('connection', (socket) => {
    let activeProcess = null;

    socket.on('execute', async (data) => {
        // Kill any previous process
        if (activeProcess && !activeProcess.killed) {
            activeProcess.kill('SIGKILL');
        }
        if (socket._compileProcess && !socket._compileProcess.killed) {
            socket._compileProcess.kill('SIGKILL');
        }

        try {
            activeProcess = await executeInteractive(data, socket);
        } catch (error) {
            socket.emit('terminal_error', `Server Error: ${error.message}\n`);
            socket.emit('execution_complete', { status: { id: 13, description: 'Internal Error' }, time: '0.00', memory: 0 });
        }
    });

    socket.on('input', (inputStr) => {
        if (activeProcess && activeProcess.stdin && !activeProcess.killed) {
            activeProcess.stdin.write(inputStr + '\n');
        }
    });

    socket.on('stop', () => {
        // Stop compilation if in progress
        if (socket._compileProcess && !socket._compileProcess.killed) {
            socket._compileProcess.kill('SIGKILL');
            socket._compileProcess = null;
        }
        // Stop runtime if in progress
        if (activeProcess && !activeProcess.killed) {
            activeProcess.kill('SIGINT');
            activeProcess = null;
        }
        socket.emit('terminal_error', '\n[Execution stopped]\n');
        socket.emit('execution_complete', { status: { id: 15, description: 'Stopped' }, time: '0.00', memory: 0 });
    });

    socket.on('disconnect', () => {
        if (socket._compileProcess && !socket._compileProcess.killed) {
            socket._compileProcess.kill('SIGKILL');
        }
        if (activeProcess && !activeProcess.killed) {
            activeProcess.kill('SIGKILL');
        }
    });
});

server.listen(PORT, () => {
    console.log(`✓ CompileX Backend running on http://localhost:${PORT}`);
});
