import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { getSafeAuthRedirect, withAuthSearch } from './authRedirect';
import './Auth.css';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    
    const { signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const authRedirect = useMemo(() => getSafeAuthRedirect(location.search), [location.search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!name.trim() || !email.trim() || !password.trim()) {
            setFormError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setFormError('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);
        const result = await signup({ name: name.trim(), email: email.trim(), password });
        setIsSubmitting(false);

        if (result.success) {
            navigate(authRedirect, { replace: true });
        } else {
            setFormError(result.error || 'Signup failed');
        }
    };

    const clearError = () => { if (formError) setFormError(''); };

    return (
        <div className="auth-container">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="auth-card"
            >
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join the CompileX community today</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <HiOutlineUser className="input-icon" />
                            <input 
                                type="text" 
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => { setName(e.target.value); clearError(); }}
                                className={formError ? 'input-error' : ''}
                                autoComplete="name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <HiOutlineMail className="input-icon" />
                            <input 
                                type="email" 
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearError(); }}
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
                                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                className={formError ? 'input-error' : ''}
                                autoComplete="new-password"
                                minLength={6}
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
                            <span>!</span> {formError}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="auth-submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to={withAuthSearch('/login', location.search)}>Login</Link></p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
