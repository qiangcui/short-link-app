import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { FaExclamationTriangle } from 'react-icons/fa';

const Redirect = () => {
    const { code } = useParams();
    const [error, setError] = React.useState('');
    const redirectedRef = useRef(false);

    // Override body background during redirect
    useEffect(() => {
        const originalBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#ffffff'; // White background during redirect
        
        return () => {
            // Restore original background when component unmounts
            document.body.style.backgroundColor = originalBg || '';
        };
    }, []);

    useEffect(() => {
        // Prevent double execution
        if (redirectedRef.current) return;
        
        const fetchAndRedirect = async () => {
            try {
                // Query the public collection for redirects (no auth required)
                const publicLinkRef = doc(db, 'publicLinks', code);
                const publicLinkSnap = await getDoc(publicLinkRef);

                if (!publicLinkSnap.exists()) {
                    setError('Link not found');
                    return;
                }

                const publicData = publicLinkSnap.data();
                const { originalUrl, userId, shortLinkId } = publicData;

                // Mark as redirected to prevent double execution
                redirectedRef.current = true;

                // Increment click count asynchronously (don't wait for it)
                if (userId && shortLinkId) {
                    const shortLinkRef = doc(db, 'users', userId, 'shortLinks', shortLinkId);
                    updateDoc(shortLinkRef, {
                        clicks: increment(1)
                    }).catch(err => {
                        console.error("Error updating clicks (may require auth):", err);
                    });
                }

                // Use window.location.href for faster redirect (browser optimization)
                // This is faster than replace() in some browsers
                window.location.href = originalUrl;

            } catch (err) {
                console.error("Redirect error:", err);
                setError('Error retrieving link');
            }
        };

        if (code && !redirectedRef.current) {
            fetchAndRedirect();
        }
    }, [code]);

    // Show absolutely nothing while redirecting - white/transparent background
    if (!error) {
        return (
            <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                background: '#ffffff', // White background to override app's dark background
                zIndex: 9999
            }} />
        );
    }

    // Only show error page if redirect failed
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <FaExclamationTriangle style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '2rem' }}>Oops!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{error}</p>
            <a href="/" className="btn-primary" style={{ marginTop: '2rem' }}>Go Home</a>
        </div>
    );
};

export default Redirect;
