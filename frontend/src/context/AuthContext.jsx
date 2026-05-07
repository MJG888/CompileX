import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Set axios defaults for credentials
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/auth/me`);
                setUser(res.data.user);
            } catch (err) {
                // User not logged in, ignore
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    // Signup
    const signup = async (userData) => {
        try {
            const res = await axios.post(`${API_URL}/auth/signup`, userData);
            setUser(res.data.user);
            toast.success(`Welcome, ${res.data.user.name}!`);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.error || 'Signup failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Login
    const login = async (userData) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, userData);
            setUser(res.data.user);
            toast.success(`Welcome back, ${res.data.user.name}!`);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.error || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Logout
    const logout = async () => {
        try {
            await axios.get(`${API_URL}/auth/logout`);
            setUser(null);
            toast.success('Logged out successfully');
        } catch (err) {
            toast.error('Logout failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
