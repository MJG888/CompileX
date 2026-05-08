import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin (Vercel↔Render)
    };

    // Dual delivery: cookie + response body
    // Frontend can use Bearer token if cross-origin cookies are blocked
    res.status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            token, // Include token in body for cross-origin fallback
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

    // Input validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        console.error('Signup Error:', error.message);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// @desc    Login user
// @route   POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    try {
        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// @desc    Logout user / clear cookie
// @route   GET /auth/logout
router.get('/logout', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
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
