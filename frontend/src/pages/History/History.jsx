import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineSearch, HiOutlineTrash, HiOutlineCode, HiOutlinePlay, HiOutlineCalendar, HiOutlineExternalLink } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './History.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLang, setFilterLang] = useState('all');
    
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/history`);
            setHistory(res.data.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this execution from history?')) return;
        
        try {
            await axios.delete(`${API_URL}/history/${id}`);
            setHistory(history.filter(item => item._id !== id));
        } catch (err) {
            console.error('Error deleting history item:', err);
        }
    };

    const handleOpen = (item) => {
        // We'll pass the history item to the main app via state or a specialized function
        // For now, let's just navigate to home and maybe the App component will handle it if we use a shared state or URL params
        // Better yet, we can use localStorage to pass the code temporarily or a query param
        localStorage.setItem('compilex_restore', JSON.stringify({
            language: item.language,
            files: item.files,
            stdin: item.stdin
        }));
        navigate('/');
    };

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.language.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.files[0]?.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLang = filterLang === 'all' || item.language === filterLang;
        return matchesSearch && matchesLang;
    });

    const languages = ['all', ...new Set(history.map(item => item.language))];

    if (loading) {
        return (
            <div className="history-loading">
                <div className="spinner"></div>
                <p>Fetching your code history...</p>
            </div>
        );
    }

    return (
        <div className="history-container">
            <div className="history-header">
                <div>
                    <h1>Execution History</h1>
                    <p>Track and manage your past code executions</p>
                </div>
                
                <div className="history-controls">
                    <div className="search-box">
                        <HiOutlineSearch />
                        <input 
                            type="text" 
                            placeholder="Search history..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        value={filterLang} 
                        onChange={(e) => setFilterLang(e.target.value)}
                        className="lang-filter"
                    >
                        {languages.map(lang => (
                            <option key={lang} value={lang}>
                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="empty-history">
                    <HiOutlineCode size={48} />
                    <h3>No history found</h3>
                    <p>Your executed code will appear here once you run them.</p>
                </div>
            ) : (
                <div className="history-grid">
                    <AnimatePresence>
                        {filteredHistory.map((item) => (
                            <motion.div 
                                key={item._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="history-card"
                                onClick={() => handleOpen(item)}
                            >
                                <div className="card-header">
                                    <span className={`lang-badge ${item.language}`}>
                                        {item.language}
                                    </span>
                                    <span className="timestamp">
                                        <HiOutlineCalendar />
                                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                
                                <div className="code-preview">
                                    <pre>{item.files[0]?.content.substring(0, 150)}...</pre>
                                </div>

                                <div className="card-footer">
                                    <div className="status-info">
                                        <span className={`status-dot ${item.status?.id === 3 ? 'success' : 'error'}`} />
                                        {item.status?.description}
                                    </div>
                                    <div className="card-actions">
                                        <button onClick={(e) => handleDelete(e, item._id)} title="Delete">
                                            <HiOutlineTrash />
                                        </button>
                                        <button title="Open in Editor">
                                            <HiOutlineExternalLink />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default History;
