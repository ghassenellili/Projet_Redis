import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  History, 
  BarChart3, 
  Settings, 
  User, 
  Search, 
  ShieldAlert, 
  Package, 
  MessageSquare, 
  Terminal,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000/ws';

const App = () => {
  const [currentUser, setCurrentUser] = useState('user_123');
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, by_type: {} });
  const [isConnected, setIsConnected] = useState(false);
  const [searchId, setSearchId] = useState('user_123');
  
  const ws = useRef(null);

  useEffect(() => {
    connectWS();
    fetchAnalytics();
    fetchHistory(currentUser);
    
    const analyticsInterval = setInterval(fetchAnalytics, 10000);
    return () => {
      if (ws.current) ws.current.close();
      clearInterval(analyticsInterval);
    };
  }, [currentUser]);

  const connectWS = () => {
    if (ws.current) ws.current.close();
    
    ws.current = new WebSocket(`${WS_BASE}/${currentUser}`);
    
    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(prev => [data, ...prev].slice(0, 50));
      // Refresh history if we are viewing the same user
      if (searchId === currentUser) {
        setHistory(prev => [data, ...prev].slice(0, 100));
      }
      fetchAnalytics();
    };
  };

  const fetchHistory = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/history/${id}`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package size={18} />;
      case 'alert': return <ShieldAlert size={18} />;
      case 'message': return <MessageSquare size={18} />;
      default: return <Bell size={18} />;
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="glass-card" style={{ width: '260px', margin: '20px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px' }}>
            <Activity color="white" />
          </div>
          <h2 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Aura Notify</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavItem icon={<Bell size={20} />} label="Live Feed" active />
          <NavItem icon={<History size={20} />} label="History" />
          <NavItem icon={<BarChart3 size={20} />} label="Analytics" />
          <NavItem icon={<User size={20} />} label="Users" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="glass-card" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
              <Terminal size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Redis Node 01</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <span className="status-indicator"></span> Connected
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 40px 40px 0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header / Analytics Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-dim)' }}>Real-time monitoring and event streaming</p>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <StatCard label="Total Events" value={analytics.total} />
            <StatCard label="Orders" value={analytics.by_type?.order || 0} color="var(--color-order)" />
            <StatCard label="Alerts" value={analytics.by_type?.alert || 0} color="var(--color-alert)" />
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', height: '100%' }}>
          
          {/* Live Stream */}
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', height: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--accent-primary)" />
                Live Feed
              </h3>
              <div className="glass-card" style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '20px' }}>
                {isConnected ? 'STREAMING' : 'DISCONNECTED'}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
              <AnimatePresence initial={false}>
                {notifications.map((notif, idx) => (
                  <motion.div
                    key={notif.timestamp + idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`glass-card notification-item type-${notif.type}`}
                    style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                  >
                    <div className={`type-${notif.type}`} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                      {getIcon(notif.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{notif.user_id}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(notif.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>{notif.message}</p>
                    </div>
                  </motion.div>
                ))}
                {notifications.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '40px' }}>
                    Waiting for events...
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* User History Lookup */}
          <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', height: '600px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--accent-secondary)" />
              Event History
            </h3>

            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} />
              <input 
                type="text" 
                placeholder="Search User ID..." 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchHistory(searchId)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '10px 10px 10px 40px',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
              {history.map((notif, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '12px', 
                    borderRadius: '10px', 
                    borderBottom: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{notif.message}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(notif.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} className={`type-${notif.type}`}>
                    {notif.type.toUpperCase()}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '40px' }}>
                  No history found for this user.
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
    color: active ? 'var(--accent-primary)' : 'var(--text-dim)',
    transition: 'all 0.2s ease',
    fontWeight: active ? 600 : 400
  }}>
    {icon}
    <span style={{ fontSize: '0.95rem' }}>{label}</span>
  </div>
);

const StatCard = ({ label, value, color = 'var(--text-main)' }) => (
  <div className="glass-card" style={{ padding: '16px 24px', minWidth: '140px' }}>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{label}</p>
    <p style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</p>
  </div>
);

export default App;
