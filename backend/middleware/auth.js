import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in cookies
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } 
        // Also check Authorization header as fallback
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: 'Not authorized, no token' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};
