import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, orderBy, serverTimestamp, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FaLink, FaChartLine, FaArrowRight, FaCheck, FaCopy, FaTrash, FaEdit, FaGlobe } from 'react-icons/fa';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [quickCreateUrl, setQuickCreateUrl] = useState('');
    const [quickCreatePath, setQuickCreatePath] = useState('');
    const [quickCreateLoading, setQuickCreateLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editUrl, setEditUrl] = useState('');

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }
        fetchLinks();
        // Add dashboard theme class to body
        // Keep original dark theme, don't change body class
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

    const handleQuickCreate = async (e) => {
        e.preventDefault();
        if (!quickCreateUrl.trim()) return;

        setQuickCreateLoading(true);
        try {
            let normalizedUrl = quickCreateUrl.trim();
            if (!normalizedUrl.match(/^https?:\/\//i)) {
                normalizedUrl = 'https://' + normalizedUrl;
            }
            new URL(normalizedUrl);

            const userId = currentUser.uid;
            let shortCode;
            
            if (quickCreatePath.trim()) {
                const customPathTrimmed = quickCreatePath.trim();
                if (!/^[a-zA-Z0-9_-]+$/.test(customPathTrimmed) || customPathTrimmed.length < 3 || customPathTrimmed.length > 50) {
                    alert('Invalid custom path');
                    setQuickCreateLoading(false);
                    return;
                }
                const publicLinkRef = doc(db, 'publicLinks', customPathTrimmed);
                const publicLinkSnap = await getDoc(publicLinkRef);
                if (publicLinkSnap.exists()) {
                    alert('This custom path is already taken');
                    setQuickCreateLoading(false);
                    return;
                }
                shortCode = customPathTrimmed;
            } else {
                shortCode = nanoid(6);
            }

            const shortLinkId = nanoid();
            const shortLinkRef = doc(db, 'users', userId, 'shortLinks', shortLinkId);
            await setDoc(shortLinkRef, {
                userId: userId,
                shortCode: shortCode,
                originalUrl: normalizedUrl,
                createdAt: serverTimestamp(),
                clicks: 0
            });

            const publicLinkRef = doc(db, 'publicLinks', shortCode);
            await setDoc(publicLinkRef, {
                shortLinkId: shortLinkId,
                userId: userId,
                originalUrl: normalizedUrl,
                createdAt: serverTimestamp()
            });

            setQuickCreateUrl('');
            setQuickCreatePath('');
            fetchLinks();
        } catch (err) {
            console.error('Error creating link:', err);
            alert('Failed to create link');
        } finally {
            setQuickCreateLoading(false);
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

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayClicks = links.reduce((sum, link) => {
        // For now, we'll use total clicks (in a real app, you'd filter by date)
        return sum + (link.clicks || 0);
    }, 0);

    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const remainingLinks = Math.max(0, 500 - links.length);

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
                    {/* Page Title */}
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '2rem'
                    }}>
                        Your Connections Platform
                    </h1>

                    {/* Quick Create Card */}
                    <div className="glass-panel" style={{
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1rem'
                        }}>
                            <div>
                                <h2 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Quick create
                                </h2>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.875rem'
                                }}>
                                    You can create <strong>{remainingLinks}</strong> more short links this month.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleQuickCreate} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Domain:
                                </label>
                                <select className="input-field" style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}>
                                    <option>{window.location.hostname}</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Enter your destination URL
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={quickCreateUrl}
                                    onChange={(e) => setQuickCreateUrl(e.target.value)}
                                    placeholder="https://example.com/my-long-url"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Custom path (optional)
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{window.location.origin}/</span>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={quickCreatePath}
                                        onChange={(e) => setQuickCreatePath(e.target.value)}
                                        placeholder="my-custom-link"
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={quickCreateLoading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: quickCreateLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    opacity: quickCreateLoading ? 0.6 : 1
                                }}
                            >
                                {quickCreateLoading ? 'Creating...' : 'Create your ShortLink'}
                            </button>
                        </form>
                    </div>

                    {/* Today's Stats */}
                    <div className="glass-panel" style={{
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)'
                            }}>
                                Today's stats
                            </h2>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    <FaChartLine style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        fontWeight: '500'
                                    }}>
                                        ENGAGEMENTS
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: 'var(--text-primary)'
                                }}>
                                    {totalClicks}
                                </div>
                            </div>

                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    <FaLink style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }} />
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        fontWeight: '500'
                                    }}>
                                        LINK CLICKS
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: 'var(--text-primary)'
                                }}>
                                    {totalClicks}
                                </div>
                            </div>

                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    <FaLink style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }} />
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        fontWeight: '500'
                                    }}>
                                        TOTAL LINKS
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: 'var(--text-primary)'
                                }}>
                                    {links.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Links Table */}
                    {links.length > 0 && (
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem'
                        }}>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginBottom: '1.5rem'
                            }}>
                                Recent Links
                            </h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Short Link</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Original URL</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Clicks</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {links.slice(0, 10).map((link) => {
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
                                                                    padding: '0.25rem'
                                                                }}
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
                                                                maxWidth: '300px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            <FaGlobe style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
                                                            {link.originalUrl}
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
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleDelete(link.id, link.shortCode)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    color: '#ef4444',
                                                                    padding: '0.5rem'
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

export default Dashboard;
