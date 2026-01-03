import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaLink, FaChartLine, FaCog, FaChevronLeft } from 'react-icons/fa';

const Sidebar = ({ isCollapsed, onToggle }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', icon: FaHome, label: 'Home' },
        { path: '/dashboard/links', icon: FaLink, label: 'Links' },
        { path: '/dashboard/analytics', icon: FaChartLine, label: 'Analytics' },
        { path: '/dashboard/settings', icon: FaCog, label: 'Settings' },
    ];

    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div style={{
            width: isCollapsed ? '80px' : '240px',
            height: '100vh',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--glass-border)',
            position: 'fixed',
            left: 0,
            top: 0,
            transition: 'width 0.3s ease',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 0'
        }}>
            {/* Logo */}
            <div style={{
                padding: isCollapsed ? '0 1rem' : '0 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {!isCollapsed && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}>
                            S
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            ShortLink
                        </span>
                    </div>
                )}
                {isCollapsed && (
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        margin: '0 auto'
                    }}>
                        S
                    </div>
                )}
                <button
                    onClick={onToggle}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: 'auto'
                    }}
                >
                    <FaChevronLeft style={{
                        transform: isCollapsed ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.3s'
                    }} />
                </button>
            </div>

            {/* Create Button */}
            <div style={{ padding: isCollapsed ? '0 1rem' : '0 1.5rem', marginBottom: '1rem' }}>
                <Link
                    to="/dashboard/create"
                    className="btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>+</span>
                    {!isCollapsed && <span>Create new</span>}
                </Link>
            </div>

            {/* Menu Items */}
            <nav style={{ flex: 1, padding: '0 0.5rem' }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                margin: '0.25rem 0',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                background: active ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                fontWeight: active ? '600' : '500',
                                transition: 'all 0.2s',
                                justifyContent: isCollapsed ? 'center' : 'flex-start'
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            <Icon style={{ fontSize: '1.1rem' }} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;

