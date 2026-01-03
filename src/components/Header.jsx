import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaSearch, FaQuestionCircle, FaChevronDown } from 'react-icons/fa';

const Header = ({ sidebarCollapsed = false }) => {
    const { currentUser, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <header style={{
            height: '64px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'fixed',
            top: 0,
            left: sidebarCollapsed ? '80px' : '240px',
            right: 0,
            zIndex: 90,
            transition: 'left 0.3s ease'
        }}>
            {/* Search Bar */}
            <div style={{
                position: 'relative',
                flex: 1,
                maxWidth: '500px'
            }}>
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
                                    placeholder="Search..."
                                    className="input-field"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 1rem 0.5rem 2.5rem',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
            </div>

            {/* Right Side */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                {/* Help Icon */}
                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        fontSize: '1.2rem',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Help"
                >
                    <FaQuestionCircle />
                </button>

                {/* User Menu */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '8px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(139, 92, 246, 0.1)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                        }}>
                            {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span style={{
                            color: 'var(--text-primary)',
                            fontWeight: '500',
                            fontSize: '0.9rem'
                        }}>
                            {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                        </span>
                        <FaChevronDown style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem'
                        }} />
                    </button>

                    {showUserMenu && (
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            borderRadius: '8px',
                            minWidth: '200px',
                            padding: '0.5rem',
                            zIndex: 1000
                        }}>
                            <button
                                onClick={signOut}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#ef4444',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

