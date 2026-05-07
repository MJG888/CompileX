import express from 'express';
import Execution from '../models/Execution.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user execution history
// @route   GET /history
router.get('/', protect, async (req, res) => {
    try {
        const history = await Execution.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .limit(100); // Limit to 100 for now
        
        res.status(200).json({
            success: true,
            count: history.length,
            data: history,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @desc    Save new execution to history
// @route   POST /history
router.post('/', protect, async (req, res) => {
    try {
        const { language, files, stdin, output, status } = req.body;

        const execution = await Execution.create({
            userId: req.user.id,
            language,
            files,
            stdin,
            output,
            status,
        });

        res.status(201).json({
            success: true,
            data: execution,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @desc    Delete a history item
// @route   DELETE /history/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const execution = await Execution.findById(req.params.id);

        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }

        // Make sure user owns the execution history item
        if (execution.userId.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized to delete this' });
        }

        await execution.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Execution history deleted',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
