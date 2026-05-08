import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// ─── Startup Environment Validation ───
const requiredEnvVars = ['MONGODB_URI'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`✗ FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('  → Set these in your .env file or deployment platform (Render/Vercel).');
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.warn('⚠ WARNING: JWT_SECRET is not set. Authentication will be insecure.');
}
if (!process.env.FRONTEND_URL) {
    console.warn('⚠ WARNING: FRONTEND_URL is not set. CORS will allow all origins.');
}

import express from 'express';
import cors from 'cors';
import http from 'http';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { executeCodeLocally, executeInteractive } from './execute.js';
import connectDB from './config/db.js';

// Route files
import authRoutes from './routes/auth.js';
import historyRoutes from './routes/history.js';

const app = express();
const server = http.createServer(app);

// Allowed frontend origins
const rawFrontendUrl = process.env.FRONTEND_URL || '';
const cleanFrontendUrl = rawFrontendUrl.replace(/\/$/, '');

const ALLOWED_ORIGINS = [
    cleanFrontendUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
].filter(Boolean);

// Super Fail-safe CORS
const corsOrigin = (origin, callback) => {
    if (!origin || cleanFrontendUrl === '*' || ALLOWED_ORIGINS.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
    } else {
        console.warn(`CORS: Potential mismatch for origin ${origin}. Allowing for now.`);
        callback(null, true); 
    }
};

const io = new Server(server, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: corsOrigin,
    credentials: true, // Allow cookies
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Mount routes
app.use('/auth', authRoutes);
app.use('/history', historyRoutes);

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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('💥 GLOBAL ERROR:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
    });
});

// ─── Start Server ───
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`✓ CompileX Backend running on port ${PORT}`);
        });
    } catch (err) {
        console.error('✗ FATAL: Server failed to start:', err.message);
        process.exit(1);
    }
};

startServer();
