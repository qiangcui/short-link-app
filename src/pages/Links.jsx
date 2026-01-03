import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FaCopy, FaTrash, FaEdit, FaSearch, FaGlobe, FaCheck, FaChartLine } from 'react-icons/fa';

const Links = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editUrl, setEditUrl] = useState('');

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }
        fetchLinks();
        // Keep original dark theme
    }, [currentUser, navigate]);

    const fetchLinks = async () => {
        if (!currentUser) return;
        
        setLoading(true);
        try {
            const linksRef = collection(db, 'users', currentUser.uid, 'shortLinks');
            let querySnapshot;
            try {
                const q = query(linksRef, orderBy('createdAt', 'desc'));
                querySnapshot = await getDocs(q);
            } catch (orderByError) {
                querySnapshot = await getDocs(linksRef);
            }
            
            const linksData = querySnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    if (data.shortCode && data.originalUrl) {
                        return {
                            id: doc.id,
                            shortCode: data.shortCode,
                            originalUrl: data.originalUrl,
                            userId: data.userId || currentUser.uid,
                            clicks: data.clicks || 0,
                            createdAt: data.createdAt || null
                        };
                    }
                    return null;
                })
                .filter(link => link !== null);
            
            linksData.sort((a, b) => {
                if (!a.createdAt && !b.createdAt) return 0;
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                const aTime = a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                const bTime = b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                return bTime - aTime;
            });
            
            setLinks(linksData);
        } catch (err) {
            console.error('Error fetching links:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (linkId, shortCode) => {
        if (!window.confirm('Are you sure you want to delete this link?')) return;

        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'shortLinks', linkId));
            try {
                await deleteDoc(doc(db, 'publicLinks', shortCode));
            } catch (err) {
                console.error('Error deleting public link:', err);
            }
            fetchLinks();
        } catch (err) {
            console.error('Error deleting link:', err);
            alert('Failed to delete link');
        }
    };

    const copyToClipboard = (shortUrl, linkId) => {
        navigator.clipboard.writeText(shortUrl);
        setCopiedId(linkId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredLinks = links.filter(link => {
        const searchLower = searchTerm.toLowerCase();
        return (
            link.originalUrl?.toLowerCase().includes(searchLower) ||
            link.shortCode?.toLowerCase().includes(searchLower) ||
            `${window.location.origin}/${link.shortCode}`.toLowerCase().includes(searchLower)
        );
    });

    if (!currentUser) {
        return null;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div style={{
                marginLeft: sidebarCollapsed ? '80px' : '240px',
                width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 240px)',
                transition: 'all 0.3s ease'
            }}>
                <Header sidebarCollapsed={sidebarCollapsed} />
                <main style={{
                    marginTop: '64px',
                    padding: '2rem',
                    minHeight: 'calc(100vh - 64px)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2rem'
                    }}>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: 'var(--text-primary)'
                        }}>
                            Links
                        </h1>
                        <button
                            onClick={() => navigate('/dashboard/create')}
                            className="btn-primary"
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span>+</span> Create new
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="glass-panel" style={{
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem'
                            }} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search links by URL or short code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Links Table */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <p style={{ color: '#6b7280' }}>Loading your links...</p>
                        </div>
                    ) : filteredLinks.length === 0 ? (
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '4rem',
                            textAlign: 'center'
                        }}>
                            <FaLink style={{ fontSize: '3rem', color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No links found</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                {searchTerm ? 'Try a different search term' : 'Create your first short link to get started'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => navigate('/dashboard/create')}
                                    className="btn-primary"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Create Link
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem',
                            overflow: 'hidden'
                        }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Short Link</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Original URL</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Clicks</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Created</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLinks.map((link) => {
                                            const shortUrl = `${window.location.origin}/${link.shortCode}`;
                                            return (
                                                <tr key={link.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <a
                                                                href={shortUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    color: 'var(--accent-primary)',
                                                                    textDecoration: 'none',
                                                                    fontWeight: '500',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                            >
                                                                {shortUrl}
                                                            </a>
                                                            <button
                                                                onClick={() => copyToClipboard(shortUrl, link.id)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    color: copiedId === link.id ? '#10b981' : 'var(--text-secondary)',
                                                                    padding: '0.25rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center'
                                                                }}
                                                                title="Copy"
                                                            >
                                                                {copiedId === link.id ? <FaCheck /> : <FaCopy />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <a
                                                            href={link.originalUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                color: 'var(--text-primary)',
                                                                textDecoration: 'none',
                                                                fontSize: '0.875rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                maxWidth: '400px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            <FaGlobe style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }} />
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.originalUrl}</span>
                                                        </a>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            background: 'rgba(139, 92, 246, 0.1)',
                                                            color: 'var(--accent-primary)',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {link.clicks || 0}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                        {formatDate(link.createdAt)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => navigate(`/dashboard/analytics?link=${link.id}`)}
                                                                style={{
                                                                    background: 'rgba(139, 92, 246, 0.1)',
                                                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                                                    color: 'var(--accent-primary)',
                                                                    padding: '0.5rem',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                title="View Analytics"
                                                            >
                                                                <FaChartLine />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(link.id, link.shortCode)}
                                                                style={{
                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                    color: '#ef4444',
                                                                    padding: '0.5rem',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                title="Delete"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Links;

