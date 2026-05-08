import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check Authorization header first (cross-origin primary method)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // 2. Fall back to cookies (same-origin or sameSite=none)
        else if (req.cookies && req.cookies.token && req.cookies.token !== 'none') {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ error: 'Not authorized, no token' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('✗ JWT_SECRET is not set — cannot verify tokens');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired, please login again' });
        }
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};
