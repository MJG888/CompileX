import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { executeCodeLocally, executeInteractive } from './execute.js';

const app = express();
const server = http.createServer(app);

// Production-ready CORS
const io = new Server(server, { 
    cors: { 
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    } 
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('CompileX Execution Server is Running');
});

app.post('/execute', async (req, res) => {
    const { source_code, files, main_file, language_id, stdin } = req.body;
    
    // Support backwards compatibility
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
            status: { id: result.stderr || result.compile_output ? 11 : 3, description: result.stderr ? 'Runtime Error' : 'Accepted' }
        });
    } catch (error) {
        console.error('Execution Error:', error);
        res.status(500).json({
            stdout: '',
            stderr: error.message || 'Internal Server Error',
            compile_output: '',
            time: '0.00',
            memory: 0,
            status: { id: 13, description: 'Internal Error' }
        });
    }
});

// WebSocket logic for interactive execution
io.on('connection', (socket) => {
    let activeProcess = null;

    socket.on('execute', async (data) => {
        if (activeProcess) {
            activeProcess.kill();
        }
        try {
            activeProcess = await executeInteractive(data, socket);
        } catch (error) {
            socket.emit('terminal_error', `Server Error: ${error.message}\n`);
            socket.emit('execution_complete', { status: 'error' });
        }
    });

    socket.on('input', (inputStr) => {
        if (activeProcess && activeProcess.stdin && !activeProcess.killed) {
            // Write to stdin
            activeProcess.stdin.write(inputStr + '\n');
        }
    });

    socket.on('stop', () => {
        if (activeProcess && !activeProcess.killed) {
            activeProcess.kill('SIGINT');
            socket.emit('terminal_error', '\n[Execution manually stopped]\n');
            socket.emit('execution_complete', { status: 'stopped' });
            activeProcess = null;
        }
    });

    socket.on('disconnect', () => {
        if (activeProcess && !activeProcess.killed) {
            activeProcess.kill('SIGKILL');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Backend Execution Server running on http://localhost:${PORT}`);
});
