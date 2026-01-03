import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FaGlobe, FaSave, FaCheck, FaInfoCircle } from 'react-icons/fa';

const Settings = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [customDomain, setCustomDomain] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }
        // Keep original dark theme
    }, [currentUser, navigate]);

    const handleSaveDomain = async (e) => {
        e.preventDefault();
        // TODO: Implement custom domain verification and setup
        // This would typically involve:
        // 1. Validating the domain
        // 2. Providing DNS records to add
        // 3. Verifying domain ownership
        // 4. Storing domain in Firestore
        
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        alert('Custom domain feature coming soon! This will allow you to use your own domain for short links.');
    };

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
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '2rem'
                    }}>
                        Settings
                    </h1>

                    {/* Custom Domain Section */}
                    <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1rem'
                        }}>
                            <FaGlobe style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }} />
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)'
                            }}>
                                Custom Domain
                            </h2>
                        </div>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            marginBottom: '1.5rem'
                        }}>
                            Connect your own domain to use custom short links like <strong>yourdomain.com/abc123</strong>
                        </p>

                        <form onSubmit={handleSaveDomain}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Domain
                                </label>
                                <input
                                    type="text"
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                    placeholder="example.com"
                                    style={{
                                        width: '100%',
                                        maxWidth: '400px',
                                        padding: '0.75rem',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                                />
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginTop: '0.5rem',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem'
                                }}>
                                    <FaInfoCircle />
                                    <span>You'll need to add DNS records to verify domain ownership</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{
                                    background: saved ? '#10b981' : undefined,
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
                                {saved ? (
                                    <>
                                        <FaCheck /> Saved!
                                    </>
                                ) : (
                                    <>
                                        <FaSave /> Save Domain
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Account Settings */}
                    <div className="glass-panel" style={{
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem'
                    }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '1rem'
                        }}>
                            Account Settings
                        </h2>
                        <div style={{
                            padding: '1rem',
                                    background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{
                                        fontWeight: '500',
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        Email
                                    </div>
                                    <div style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.875rem'
                                    }}>
                                        {currentUser.email}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{
                            padding: '1rem',
                                    background: 'var(--bg-secondary)',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{
                                        fontWeight: '500',
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        Display Name
                                    </div>
                                    <div style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.875rem'
                                    }}>
                                        {currentUser.displayName || 'Not set'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Other Settings */}
                    <div className="glass-panel" style={{
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '1rem'
                        }}>
                            Preferences
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem'
                        }}>
                            More settings coming soon...
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;

