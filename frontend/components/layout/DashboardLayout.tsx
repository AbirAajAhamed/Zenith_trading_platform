
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Page } from '../../constants';
import { User } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentPage, setCurrentPage, currentUser, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header 
          setSidebarOpen={setSidebarOpen} 
          currentUser={currentUser} 
          onLogout={onLogout} 
        />
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
