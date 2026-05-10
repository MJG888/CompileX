import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineCalendar,
    HiOutlineCode,
    HiOutlineExternalLink,
    HiOutlineFilter,
    HiOutlineSearch,
    HiOutlineTrash,
} from 'react-icons/hi';
import { LANGUAGES } from '../../constants/languages';
import { useTheme } from '../../themes/ThemeContext';
import './History.css';

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const MotionDiv = motion.div;

const getLanguageDefaultCode = (language) => {
    const normalized = (language || '').toLowerCase();
    return LANGUAGES.find(lang => lang.id === normalized || lang.label.toLowerCase() === normalized)?.defaultCode?.trim() || '';
};

const getPrimaryFile = (item) => {
    const files = item.files || [];
    const mainFile = item.mainFile || item.main_file;
    const exactMainFile = mainFile ? files.find(file => file.name === mainFile) : null;
    if (exactMainFile) return exactMainFile;

    const defaultCode = getLanguageDefaultCode(item.language);
    const changedFile = files.find(file => {
        const content = (file.content || '').trim();
        return content && content !== defaultCode;
    });

    return changedFile || files[0] || { name: '', content: '' };
};

const History = () => {
    const { themeName } = useTheme();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLang, setFilterLang] = useState('all');

    const navigate = useNavigate();

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/history`);
            setHistory(res.data.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(fetchHistory, 0);
        return () => window.clearTimeout(timer);
    }, [fetchHistory]);

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
        const primaryFile = getPrimaryFile(item);
        localStorage.setItem('compilex_restore', JSON.stringify({
            language: item.language,
            files: item.files,
            mainFile: item.mainFile || primaryFile.name,
            activeFileName: item.mainFile || primaryFile.name,
            stdin: item.stdin,
        }));
        navigate('/compiler');
    };

    const filteredHistory = history.filter(item => {
        const content = getPrimaryFile(item).content || '';
        const langStr = item.language || '';
        const matchesSearch = langStr.toLowerCase().includes(searchTerm.toLowerCase())
            || content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLang = filterLang === 'all' || langStr === filterLang;
        return matchesSearch && matchesLang;
    });

    const languages = ['all', ...new Set(history.map(item => item.language))];

    if (loading) {
        return (
            <div className="history-container" data-theme={themeName}>
                <div className="history-content">
                    <div className="loading-history">
                        <div className="spinner" />
                        <p>Fetching your code history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="history-container" data-theme={themeName}>
            <div className="history-content">
                <header className="history-header">
                    <div className="header-top">
                        <div className="header-text">
                            <h1>Code History</h1>
                            <p>Restore the exact file you ran and keep your coding rhythm intact.</p>
                        </div>
                        <button className="refresh-btn" onClick={fetchHistory} title="Refresh History" type="button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </button>
                    </div>

                    <div className="history-controls">
                        <div className="search-box">
                            <HiOutlineSearch className="control-icon" />
                            <input
                                type="text"
                                placeholder="Search by code or language..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-box">
                            <HiOutlineFilter className="control-icon" />
                            <select
                                value={filterLang}
                                onChange={(e) => setFilterLang(e.target.value)}
                            >
                                {languages.map(lang => (
                                    <option key={lang} value={lang}>
                                        {lang === 'all' ? 'All Languages' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                {filteredHistory.length === 0 ? (
                    <div className="empty-history">
                        <div className="empty-icon-wrapper">
                            <HiOutlineCode />
                        </div>
                        <h2>No history entries found</h2>
                        <p>Your executed code snippets will appear here once you run them in the compiler.</p>
                        <button className="goto-ide-btn" onClick={() => navigate('/compiler')} type="button">Start Coding</button>
                    </div>
                ) : (
                    <div className="history-grid">
                        <AnimatePresence>
                            {filteredHistory.map((item) => {
                                const primaryFile = getPrimaryFile(item);

                                return (
                                    <MotionDiv
                                        key={item._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="history-item"
                                    >
                                        <div className="item-header">
                                            <div className="item-title-group">
                                                <span className="lang-badge">{item.language}</span>
                                                {primaryFile.name && <span className="file-name-badge">{primaryFile.name}</span>}
                                            </div>
                                            <div className={`status-indicator ${item.status?.id === 3 ? 'status-success' : 'status-error'}`}>
                                                <span className="history-status-dot" />
                                                <span>{item.status?.description || 'Executed'}</span>
                                            </div>
                                        </div>

                                        <div className="code-preview">
                                            <pre>{primaryFile.content || ''}</pre>
                                        </div>

                                        <div className="item-footer">
                                            <div className="execution-time">
                                                <HiOutlineCalendar className="footer-icon" />
                                                <span>
                                                    {new Date(item.timestamp).toLocaleDateString()} - {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className="item-actions">
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => handleDelete(e, item._id)}
                                                    title="Delete from history"
                                                    type="button"
                                                >
                                                    <HiOutlineTrash size={18} />
                                                </button>
                                                <button
                                                    className="view-btn"
                                                    onClick={() => handleOpen(item)}
                                                    type="button"
                                                >
                                                    <span>Restore</span>
                                                    <HiOutlineExternalLink />
                                                </button>
                                            </div>
                                        </div>
                                    </MotionDiv>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
