import React, { useState } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/Dashboard';
import BacktestingPage from './pages/BacktestingPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import { Page } from './constants';
import { User } from './types';

// Mock users for demonstration
const mockUsers: User[] = [
    { id: 'u1', email: 'alice@example.com', role: 'User', botStatus: 'Running', createdAt: '2023-08-15' },
    { id: 'u2', email: 'bob@example.com', role: 'User', botStatus: 'Stopped', createdAt: '2023-08-16' },
    { id: 'u3', email: 'charlie-admin@example.com', role: 'Admin', botStatus: 'Running', createdAt: '2023-08-10' },
    { id: 'u4', email: 'diana@example.com', role: 'User', botStatus: 'Error', createdAt: '2023-08-18' },
];

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (email: string, pass: string): boolean => {
    const user = mockUsers.find(u => u.email === email);
    // In a real app, you'd check a hashed password.
    // This is a simple mock check.
    const mockPassword = user?.role === 'Admin' ? 'adminpass' : 'userpass';
    if (user && pass === mockPassword) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('Dashboard'); // Reset to default page on logout
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'Backtesting':
        return <BacktestingPage />;
      case 'Settings':
        return <SettingsPage />;
      case 'Admin Panel':
        return <AdminPage currentUser={currentUser} users={mockUsers} />;
      default:
        return <DashboardPage />;
    }
  };

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <DashboardLayout
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        onLogout={handleLogout}
      >
        {renderPage()}
      </DashboardLayout>
    </div>
  );
}

export default App;