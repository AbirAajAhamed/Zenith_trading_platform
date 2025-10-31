import React from 'react';
import Card from '../components/ui/Card';
import { User } from '../types';

interface AdminPageProps {
    currentUser: User | null;
    users: User[];
}

const AdminPage: React.FC<AdminPageProps> = ({ currentUser, users }) => {
    // Check for admin role from the logged-in user prop.
    if (currentUser?.role !== 'Admin') {
        return (
             <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <Card title="Access Denied">
                    <div className="text-center py-8">
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                         </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Unauthorized Access</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            You do not have the necessary permissions to view this page.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }
    
    const getStatusColor = (status: User['botStatus']) => {
        switch (status) {
            case 'Running': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Stopped': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'Error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return '';
        }
    };

    const handleViewTrades = (email: string) => {
        alert(`Viewing trades for ${email}`);
    };

    const handleViewLogs = (email: string) => {
        alert(`Viewing logs for ${email}`);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            
            <Card title="User Management">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bot Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member Since</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.botStatus)}`}>
                                            {user.botStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.createdAt}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleViewTrades(user.email)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">View Trades</button>
                                        <button onClick={() => handleViewLogs(user.email)} className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-200">View Logs</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminPage;