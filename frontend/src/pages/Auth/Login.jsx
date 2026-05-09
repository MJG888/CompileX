import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import './Auth.css';

const MotionDiv = motion.div;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!email.trim() || !password.trim()) {
            setFormError('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        const result = await login({ email: email.trim(), password });
        setIsSubmitting(false);

        if (result.success) {
            navigate('/compiler');
        } else {
            setFormError(result.error || 'Login failed');
        }
    };

    return (
        <div className="auth-container">
            <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="auth-card"
            >
                <div className="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Continue your coding journey with CompileX</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <HiOutlineMail className="input-icon" />
                            <input 
                                type="email" 
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
                                className={formError ? 'input-error' : ''}
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <HiOutlineLockClosed className="input-icon" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                                className={formError ? 'input-error' : ''}
                                autoComplete="current-password"
                                required
                            />
                            <button 
                                type="button" 
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                            </button>
                        </div>
                    </div>

                    {formError && (
                        <div className="form-error">
                            <span>⚠</span> {formError}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="auth-submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                </div>
            </MotionDiv>
        </div>
    );
};

export default Login;
