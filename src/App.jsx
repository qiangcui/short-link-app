import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Links from './pages/Links';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import CreateLink from './pages/CreateLink';
import Redirect from './pages/Redirect';

// Simple footer component inline for now
const Footer = () => (
  <footer style={{ marginTop: 'auto', padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)' }}>
    <div className="container">
      &copy; {new Date().getFullYear()} ShortLink. All rights reserved.
    </div>
  </footer>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/create" element={<CreateLink />} />
          <Route path="/dashboard/links" element={<Links />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          {/* Route for redirection, no navbar/footer to be faster visually */}
          <Route path="/:code" element={<Redirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
