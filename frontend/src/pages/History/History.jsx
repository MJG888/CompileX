import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineSearch, HiOutlineTrash, HiOutlineCode, HiOutlineCalendar, HiOutlineExternalLink, HiOutlineFilter } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './History.css';

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

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
        localStorage.setItem('compilex_restore', JSON.stringify({
            language: item.language,
            files: item.files,
            stdin: item.stdin
        }));
        navigate('/');
    };

    const filteredHistory = history.filter(item => {
        const content = item.files[0]?.content || '';
        const matchesSearch = item.language.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLang = filterLang === 'all' || item.language === filterLang;
        return matchesSearch && matchesLang;
    });

    const languages = ['all', ...new Set(history.map(item => item.language))];

    if (loading) {
        return (
            <div className="history-container">
                <div className="history-content">
                    <div className="loading-history">
                        <div className="spinner"></div>
                        <p>Fetching your code history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="history-container">
            <div className="history-content">
                <header className="history-header">
                    <h1>Execution History</h1>
                    <p>Track and manage your past code executions</p>
                    
                    <div style={{ display: 'flex', gap: '16px', marginTop: '32px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            flex: 1, 
                            minWidth: '200px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: 'rgba(30, 41, 59, 0.6)', 
                            borderRadius: '12px', 
                            padding: '0 16px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <HiOutlineSearch color="rgba(255,255,255,0.4)" />
                            <input 
                                type="text" 
                                placeholder="Search code or language..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#fff', 
                                    padding: '12px', 
                                    width: '100%',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: 'rgba(30, 41, 59, 0.6)', 
                            borderRadius: '12px', 
                            padding: '0 16px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <HiOutlineFilter color="rgba(255,255,255,0.4)" style={{ marginRight: '8px' }} />
                            <select 
                                value={filterLang} 
                                onChange={(e) => setFilterLang(e.target.value)}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#fff', 
                                    padding: '12px 0',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {languages.map(lang => (
                                    <option key={lang} value={lang} style={{ background: '#1e293b' }}>
                                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                {filteredHistory.length === 0 ? (
                    <div className="empty-history">
                        <HiOutlineCode size={48} color="rgba(99, 102, 241, 0.5)" style={{ marginBottom: '16px' }} />
                        <h2>No history found</h2>
                        <p>Your executed code will appear here once you run them.</p>
                    </div>
                ) : (
                    <div className="history-grid">
                        <AnimatePresence>
                            {filteredHistory.map((item) => (
                                <motion.div 
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="history-item"
                                >
                                    <div className="item-header">
                                        <span className="lang-badge">{item.language}</span>
                                        <div className={`status-indicator ${item.status?.id === 3 ? 'status-success' : 'status-error'}`}>
                                            <span className="status-dot"></span>
                                            <span>{item.status?.description || 'Executed'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="code-preview">
                                        <pre>{item.files[0]?.content}</pre>
                                    </div>

                                    <div className="item-footer">
                                        <div className="execution-time">
                                            <HiOutlineCalendar style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button 
                                                onClick={(e) => handleDelete(e, item._id)} 
                                                style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.6)', cursor: 'pointer' }}
                                                title="Delete"
                                            >
                                                <HiOutlineTrash size={18} />
                                            </button>
                                            <button 
                                                className="view-btn"
                                                onClick={() => handleOpen(item)}
                                            >
                                                View <HiOutlineExternalLink />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
