import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaLink } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const Navbar = () => {
    const { currentUser, signOut } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error('Error signing out:', err);
        }
    };

    return (
        <>
            <nav style={{
                padding: '1.5rem 0',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        <FaLink style={{ color: 'var(--accent-primary)' }} />
                        <span className="gradient-text">ShortLink</span>
                    </Link>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        {currentUser ? (
                            <>
                                <Link 
                                    to="/dashboard" 
                                    style={{ color: 'var(--text-secondary)', transition: 'var(--transition-fast)', textDecoration: 'none' }}
                                    onMouseOver={e => e.target.style.color = 'var(--text-primary)'}
                                    onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}
                                >
                                    Dashboard
                                </Link>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                    {currentUser.displayName || currentUser.email}
                                </span>
                                <button
                                    onClick={handleSignOut}
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <a href="#" style={{ color: 'var(--text-secondary)', transition: 'var(--transition-fast)' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Features</a>
                                <a href="#" style={{ color: 'var(--text-secondary)', transition: 'var(--transition-fast)' }} onMouseOver={e => e.target.style.color = 'var(--text-primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Pricing</a>
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    Login
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </>
    );
};

export default Navbar;
