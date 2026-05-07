import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    };

    res.status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
};

// @desc    Register user
// @route   POST /auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @desc    Login user
// @route   POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @desc    Logout user / clear cookie
// @route   GET /auth/logout
router.get('/logout', (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    res.status(200).json({ success: true, message: 'Logged out' });
});

// @desc    Get current logged in user
// @route   GET /auth/me
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

export default router;
