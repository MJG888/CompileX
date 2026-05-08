import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Set axios defaults for credentials
axios.defaults.withCredentials = true;

// ─── Token Management ───
const getStoredToken = () => localStorage.getItem('compilex_token');
const storeToken = (token) => localStorage.setItem('compilex_token', token);
const clearStoredToken = () => localStorage.removeItem('compilex_token');

// Set Bearer header on axios if token exists
const setAxiosAuthHeader = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

// Map network errors to user-friendly messages
const getErrorMessage = (err) => {
    if (!err.response) {
        // Network error — server unreachable
        return 'Unable to reach the server. Please check your connection.';
    }
    const msg = err.response?.data?.error;
    if (msg) return msg;
    if (err.response.status === 429) return 'Too many requests. Please wait a moment.';
    if (err.response.status >= 500) return 'Server error. Please try again later.';
    return 'Something went wrong. Please try again.';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user on mount — check stored token first
    useEffect(() => {
        const loadUser = async () => {
            const token = getStoredToken();
            if (token) {
                setAxiosAuthHeader(token);
            }

            try {
                const res = await axios.get(`${API_URL}/auth/me`);
                setUser(res.data.user);
            } catch (err) {
                // Token invalid or expired — clear it
                clearStoredToken();
                setAxiosAuthHeader(null);
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

            // Store token from response body (cross-origin fallback)
            if (res.data.token) {
                storeToken(res.data.token);
                setAxiosAuthHeader(res.data.token);
            }

            setUser(res.data.user);
            toast.success(`Welcome, ${res.data.user.name}!`);
            return { success: true };
        } catch (err) {
            const message = getErrorMessage(err);
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Login
    const login = async (userData) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, userData);

            // Store token from response body (cross-origin fallback)
            if (res.data.token) {
                storeToken(res.data.token);
                setAxiosAuthHeader(res.data.token);
            }

            setUser(res.data.user);
            toast.success(`Welcome back, ${res.data.user.name}!`);
            return { success: true };
        } catch (err) {
            const message = getErrorMessage(err);
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Logout
    const logout = async () => {
        try {
            await axios.get(`${API_URL}/auth/logout`);
        } catch (err) {
            // Logout API might fail if server is down, still clear local state
            console.warn('Logout API call failed, clearing local session');
        }
        setUser(null);
        clearStoredToken();
        setAxiosAuthHeader(null);
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
