import mongoose from 'mongoose';

const executionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    language: {
        type: String,
        required: true
    },
    mainFile: {
        type: String,
        default: ''
    },
    files: [
        {
            name: String,
            content: String
        }
    ],
    stdin: {
        type: String,
        default: ''
    },
    output: {
        stdout: String,
        stderr: String,
        compile_output: String
    },
    status: {
        id: Number,
        description: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

const Execution = mongoose.model('Execution', executionSchema);
export default Execution;
