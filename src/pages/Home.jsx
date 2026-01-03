import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { collection, addDoc, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaCopy, FaMagic, FaCheck, FaArrowRight, FaChartLine } from 'react-icons/fa';

const Home = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [customPath, setCustomPath] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setShortUrl('');
        setCopied(false);
        // Don't clear customPath here - user might want to reuse it

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
            // Clear custom path after successful creation
            setCustomPath('');
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

    return (
        <div style={{ paddingTop: '8rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in">
            <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
                    Shorten Your Loooong Links <br />
                    <span className="gradient-text">In Seconds</span>
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                    A premium URL shortener built for speed and reliability.
                    Start tracking your links today.
                </p>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Paste your long URL here..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    style={{ height: '54px' }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '54px', minWidth: '140px', justifyContent: 'center' }}
                            >
                                {loading ? 'Shortening...' : <><FaMagic /> Shorten</>}
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                {window.location.origin}/
                            </span>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="custom-path (optional)"
                                value={customPath}
                                onChange={(e) => setCustomPath(e.target.value)}
                                style={{ flex: 1, minWidth: '200px', maxWidth: '300px', height: '40px', fontSize: '0.9rem' }}
                            />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                Leave empty for random code
                            </span>
                        </div>
                    </form>

                    {error && (
                        <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    {shortUrl && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.5rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                <a
                                    href={shortUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}
                                >
                                    {shortUrl}
                                </a>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={copyToClipboard}
                                        style={{
                                            background: copied ? '#10b981' : 'var(--bg-secondary)',
                                            color: copied ? 'white' : 'var(--text-primary)',
                                            padding: '0.5rem 1rem',
                                            border: '1px solid var(--glass-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy</>}
                                    </button>
                                    {currentUser && (
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="btn-primary"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem 1rem'
                                            }}
                                        >
                                            <FaChartLine /> View Dashboard
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    {/* Feature 1 */}
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
                        <div style={{ color: 'var(--accent-primary)', fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Lightning Fast</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Instant redirections and reliable uptime for all your links.</p>
                    </div>
                    {/* Feature 2 */}
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
                        <div style={{ color: 'var(--accent-primary)', fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Secure & Safe</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>All links are encrypted and protected against malicious use.</p>
                    </div>
                    {/* Feature 3 */}
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left' }}>
                        <div style={{ color: 'var(--accent-primary)', fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Analytics Ready</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Track clicks and engagement (coming soon).</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
