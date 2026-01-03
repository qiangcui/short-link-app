import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FaLink, FaChartLine, FaArrowLeft, FaGlobe, FaCopy, FaCheck } from 'react-icons/fa';

const Analytics = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [links, setLinks] = useState([]);
    const [selectedLink, setSelectedLink] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }
        fetchLinks();
        // Keep original dark theme
    }, [currentUser, navigate]);

    useEffect(() => {
        const linkId = searchParams.get('link');
        if (linkId && links.length > 0) {
            const link = links.find(l => l.id === linkId);
            if (link) {
                setSelectedLink(link);
            }
        }
    }, [searchParams, links]);

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
            day: 'numeric'
        });
    };

    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const topLinks = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);

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
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <button
                            onClick={() => navigate('/dashboard/analytics')}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <FaArrowLeft />
                        </button>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            color: '#ffffff'
                        }}>
                            Analytics
                        </h1>
                    </div>

                    {/* Overview Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                            }}>
                                <FaChartLine style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }} />
                                <span style={{
                                    fontSize: '1rem',
                                    color: '#ffffff',
                                    fontWeight: '500'
                                }}>
                                    TOTAL CLICKS
                                </span>
                            </div>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: '#ffffff'
                            }}>
                                {totalClicks}
                            </div>
                        </div>

                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                            }}>
                                <FaLink style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }} />
                                <span style={{
                                    fontSize: '1rem',
                                    color: '#ffffff',
                                    fontWeight: '500'
                                }}>
                                    TOTAL LINKS
                                </span>
                            </div>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: '#ffffff'
                            }}>
                                {links.length}
                            </div>
                        </div>

                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                            }}>
                                <FaChartLine style={{ color: '#10b981', fontSize: '1.25rem' }} />
                                <span style={{
                                    fontSize: '1rem',
                                    color: '#ffffff',
                                    fontWeight: '500'
                                }}>
                                    AVG CLICKS/LINK
                                </span>
                            </div>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: '#ffffff'
                            }}>
                                {links.length > 0 ? Math.round(totalClicks / links.length) : 0}
                            </div>
                        </div>
                    </div>

                    {/* Link Selection */}
                    {!selectedLink && (
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: '#ffffff',
                                marginBottom: '1rem'
                            }}>
                                Select a link to view analytics
                            </h2>
                            {loading ? (
                                <p style={{ color: '#ffffff' }}>Loading...</p>
                            ) : links.length === 0 ? (
                                <p style={{ color: '#ffffff' }}>No links found. Create your first link to see analytics.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {links.map((link) => {
                                        const shortUrl = `${window.location.origin}/${link.shortCode}`;
                                        return (
                                            <div
                                                key={link.id}
                                                onClick={() => setSelectedLink(link)}
                                                style={{
                                                    padding: '1rem',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--bg-secondary)';
                                                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        color: 'var(--accent-primary)',
                                                        fontWeight: '500',
                                                        marginBottom: '0.25rem'
                                                    }}>
                                                        {shortUrl}
                                                    </div>
                                                    <div style={{
                                                        color: '#94a3b8',
                                                        fontSize: '1rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <FaGlobe style={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                                                        <span style={{
                                                            maxWidth: '400px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {link.originalUrl}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem'
                                                }}>
                                                    <div style={{
                                                        background: 'rgba(139, 92, 246, 0.1)',
                                                        color: 'var(--accent-primary)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '12px',
                                                        fontSize: '1rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {link.clicks || 0} clicks
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selected Link Analytics */}
                    {selectedLink && (
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.5rem'
                                    }}>
                                        <a
                                            href={`${window.location.origin}/${selectedLink.shortCode}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: 'var(--accent-primary)',
                                                textDecoration: 'none',
                                                fontWeight: '600',
                                                fontSize: '1.125rem'
                                            }}
                                        >
                                            {window.location.origin}/{selectedLink.shortCode}
                                        </a>
                                        <button
                                            onClick={() => copyToClipboard(`${window.location.origin}/${selectedLink.shortCode}`, selectedLink.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: copiedId === selectedLink.id ? '#10b981' : '#ffffff',
                                                padding: '0.25rem'
                                            }}
                                        >
                                            {copiedId === selectedLink.id ? <FaCheck /> : <FaCopy />}
                                        </button>
                                    </div>
                                    <div style={{
                                        color: '#94a3b8',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <FaGlobe style={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                                        <span>{selectedLink.originalUrl}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedLink(null)}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        color: '#ffffff',
                                        fontSize: '1rem'
                                    }}
                                >
                                    View All
                                </button>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        fontSize: '1rem',
                                        color: '#94a3b8',
                                        marginBottom: '0.25rem'
                                    }}>
                                        Total Clicks
                                    </div>
                                    <div style={{
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        color: '#ffffff'
                                    }}>
                                        {selectedLink.clicks || 0}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        fontSize: '1rem',
                                        color: '#94a3b8',
                                        marginBottom: '0.25rem'
                                    }}>
                                        Created
                                    </div>
                                    <div style={{
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        color: '#ffffff'
                                    }}>
                                        {formatDate(selectedLink.createdAt)}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '8px',
                                color: '#94a3b8',
                                fontSize: '1rem'
                            }}>
                                <strong style={{ color: '#ffffff' }}>Note:</strong> Detailed analytics (click events, referrers, locations, etc.) will be available soon. Currently showing total click count.
                            </div>
                        </div>
                    )}

                    {/* Top Performing Links */}
                    {!selectedLink && topLinks.length > 0 && (
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginTop: '2rem'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: '#ffffff',
                                marginBottom: '1rem'
                            }}>
                                Top Performing Links
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {topLinks.map((link, index) => {
                                    const shortUrl = `${window.location.origin}/${link.shortCode}`;
                                    return (
                                        <div
                                            key={link.id}
                                            onClick={() => setSelectedLink(link)}
                                            style={{
                                                padding: '1rem',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: 'rgba(139, 92, 246, 0.1)',
                                                    color: 'var(--accent-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '600',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    {index + 1}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        color: 'var(--accent-primary)',
                                                        fontWeight: '500',
                                                        marginBottom: '0.25rem'
                                                    }}>
                                                        {shortUrl}
                                                    </div>
                                                    <div style={{
                                                        color: '#94a3b8',
                                                        fontSize: '1rem'
                                                    }}>
                                                        {link.clicks || 0} clicks
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Analytics;

