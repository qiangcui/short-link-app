import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, query, where, getDocs, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FaLink, FaMagic, FaCheck, FaCopy, FaArrowLeft, FaChevronUp, FaChevronDown, FaUpload } from 'react-icons/fa';

const CreateLink = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [url, setUrl] = useState('');
    const [customPath, setCustomPath] = useState('');
    const [title, setTitle] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [linkDetailsExpanded, setLinkDetailsExpanded] = useState(true);
    const [sharingOptionsExpanded, setSharingOptionsExpanded] = useState(true);
    const [totalLinks, setTotalLinks] = useState(0);

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }
        fetchLinkCount();
    }, [currentUser, navigate]);

    const fetchLinkCount = async () => {
        if (!currentUser) return;
        try {
            const linksRef = collection(db, 'users', currentUser.uid, 'shortLinks');
            const querySnapshot = await getDocs(linksRef);
            setTotalLinks(querySnapshot.size);
        } catch (err) {
            console.error('Error fetching link count:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setShortUrl('');
        setCopied(false);

        if (!currentUser) {
            setError('Please sign in to create short links');
            return;
        }

        if (!url) {
            setError('Please enter a valid URL');
            return;
        }

        // Normalize URL - add https:// if no protocol is specified
        let normalizedUrl = url.trim();
        if (!normalizedUrl.match(/^https?:\/\//i)) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        // Basic URL validation
        try {
            new URL(normalizedUrl);
        } catch (_) {
            setError('Please enter a valid URL');
            return;
        }

        setLoading(true);

        try {
            const userId = currentUser.uid;
            
            // Determine the short code to use
            let shortCode;
            if (customPath.trim()) {
                // Validate custom path
                const customPathTrimmed = customPath.trim();
                
                // Check if custom path is valid (alphanumeric, hyphens, underscores only)
                if (!/^[a-zA-Z0-9_-]+$/.test(customPathTrimmed)) {
                    setError('Custom path can only contain letters, numbers, hyphens, and underscores');
                    setLoading(false);
                    return;
                }
                
                // Check minimum length
                if (customPathTrimmed.length < 3) {
                    setError('Custom path must be at least 3 characters long');
                    setLoading(false);
                    return;
                }
                
                // Check maximum length
                if (customPathTrimmed.length > 50) {
                    setError('Custom path must be less than 50 characters');
                    setLoading(false);
                    return;
                }
                
                // Check if custom path is already taken
                const publicLinkRef = doc(db, 'publicLinks', customPathTrimmed);
                const publicLinkSnap = await getDoc(publicLinkRef);
                
                if (publicLinkSnap.exists()) {
                    setError('This custom path is already taken. Please choose another one.');
                    setLoading(false);
                    return;
                }
                
                shortCode = customPathTrimmed;
            } else {
                // Check if this URL already has a short link for this user (only if no custom path)
                const linksRef = collection(db, 'users', userId, 'shortLinks');
                const existingQuery = query(linksRef, where('originalUrl', '==', normalizedUrl));
                const existingSnapshot = await getDocs(existingQuery);
                
                if (!existingSnapshot.empty) {
                    // URL already exists, use the existing short link
                    const existingDoc = existingSnapshot.docs[0];
                    const existingData = existingDoc.data();
                    setShortUrl(`${window.location.origin}/${existingData.shortCode}`);
                    setLoading(false);
                    return;
                }
                
                // Generate random short code
                shortCode = nanoid(6);
            }
            
            const shortLinkId = nanoid(); // Generate unique ID for the short link document

            // Create short link in user's collection (private, managed)
            try {
                const shortLinkRef = doc(db, 'users', userId, 'shortLinks', shortLinkId);
                await setDoc(shortLinkRef, {
                    userId: userId,
                    shortCode: shortCode,
                    originalUrl: normalizedUrl,
                    title: title.trim() || null,
                    createdAt: serverTimestamp(),
                    clicks: 0
                });
            } catch (err) {
                console.error("Error creating private link: ", err);
                if (err.code === 'permission-denied') {
                    throw new Error('Permission denied creating private link. Check rules for /users/{userId}/shortLinks');
                }
                throw err;
            }

            // Also create a public entry for redirects (readable without auth)
            try {
                const publicLinkRef = doc(db, 'publicLinks', shortCode);
                await setDoc(publicLinkRef, {
                    shortLinkId: shortLinkId,
                    userId: userId,
                    originalUrl: normalizedUrl,
                    createdAt: serverTimestamp()
                });
            } catch (err) {
                console.error("Error creating public link: ", err);
                if (err.code === 'permission-denied') {
                    throw new Error('Permission denied creating public link. Make sure you added the /publicLinks collection rules. See FIREBASE_SECURITY_RULES.md');
                }
                throw err;
            }

            setShortUrl(`${window.location.origin}/${shortCode}`);
            // Clear form after successful creation
            setUrl('');
            setCustomPath('');
            setTitle('');
            fetchLinkCount();
        } catch (err) {
            console.error("Error adding document: ", err);
            if (err.code === 'permission-denied' || err.message.includes('Permission denied')) {
                setError(err.message || 'Permission denied. Check your Firebase rules. Make sure you added the /publicLinks collection rules.');
            } else if (err.message.includes("api-key")) {
                setError('Firebase not configured. Please check your firebase.js.');
            }
            else {
                setError(err.message || 'Failed to shorten URL. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const remainingLinks = Math.max(0, 500 - totalLinks);

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
                    {/* Page Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2rem'
                    }}>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            color: '#ffffff'
                        }}>
                            Create a new link
                        </h1>
                        <button
                            onClick={() => {/* TODO: Implement bulk upload */}}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(139, 92, 246, 0.1)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            <FaUpload /> Bulk upload
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Link Details Card */}
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div
                                onClick={() => setLinkDetailsExpanded(!linkDetailsExpanded)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    marginBottom: linkDetailsExpanded ? '1.5rem' : '0'
                                }}
                            >
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '600',
                                    color: '#ffffff'
                                }}>
                                    Link details
                                </h2>
                                {linkDetailsExpanded ? <FaChevronUp style={{ color: '#ffffff' }} /> : <FaChevronDown style={{ color: '#ffffff' }} />}
                            </div>

                            {linkDetailsExpanded && (
                                <>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        borderRadius: '8px',
                                        marginBottom: '1.5rem',
                                        fontSize: '1rem',
                                        color: '#ffffff'
                                    }}>
                                        You have <strong style={{ color: '#ffffff' }}>{remainingLinks}</strong> links and <strong style={{ color: '#ffffff' }}>{remainingLinks}</strong> custom back-halves remaining this month. <a href="#" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Upgrade for more</a>.
                                    </div>

                                    {/* Destination URL */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            color: '#ffffff',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Destination URL
                                        </label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="https://example.com/my-long-url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            style={{ height: '48px', fontSize: '1rem', color: '#ffffff' }}
                                        />
                                    </div>

                                    {/* Short link */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            color: '#ffffff',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Short link
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <select className="input-field" style={{
                                                minWidth: '200px',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                height: '48px',
                                                color: '#ffffff'
                                            }}>
                                                <option style={{ background: 'var(--bg-secondary)', color: '#ffffff' }}>{window.location.hostname}</option>
                                            </select>
                                            <span style={{ color: '#ffffff', fontSize: '1.5rem' }}>/</span>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Enter custom back-half or leave blank"
                                                value={customPath}
                                                onChange={(e) => setCustomPath(e.target.value)}
                                                style={{ flex: 1, minWidth: '200px', height: '48px', fontSize: '1rem', color: '#ffffff' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Title (optional) */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            color: '#ffffff',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Title (optional)
                                        </label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Enter a title for this link"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            style={{ height: '48px', fontSize: '1rem', color: '#ffffff' }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sharing Options Card */}
                        <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <div
                                onClick={() => setSharingOptionsExpanded(!sharingOptionsExpanded)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    marginBottom: sharingOptionsExpanded ? '1.5rem' : '0'
                                }}
                            >
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '600',
                                    color: '#ffffff'
                                }}>
                                    Sharing options
                                </h2>
                                {sharingOptionsExpanded ? <FaChevronUp style={{ color: '#ffffff' }} /> : <FaChevronDown style={{ color: '#ffffff' }} />}
                            </div>

                            {sharingOptionsExpanded && (
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    color: '#ffffff'
                                }}>
                                    Additional sharing options coming soon...
                                </div>
                            )}
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                fontSize: '1rem'
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {shortUrl && (
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid #10b981',
                                color: '#10b981',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                fontSize: '1rem'
                            }}>
                                Link created successfully! <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: '600' }}>{shortUrl}</a>
                            </div>
                        )}

                        {/* Action Bar */}
                        <div style={{
                            position: 'sticky',
                            bottom: 0,
                            background: 'var(--bg-secondary)',
                            borderTop: '1px solid var(--glass-border)',
                            padding: '1rem 2rem',
                            margin: '2rem -2rem -2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--glass-border)',
                                    color: '#ffffff',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--bg-secondary)';
                                    e.target.style.borderColor = 'var(--accent-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'var(--bg-primary)';
                                    e.target.style.borderColor = 'var(--glass-border)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    minWidth: '150px'
                                }}
                            >
                                {loading ? 'Creating...' : <><FaMagic /> Create your link</>}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default CreateLink;
