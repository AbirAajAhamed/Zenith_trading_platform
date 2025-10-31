
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { ApiKey, NotificationSettings } from '../types';
import ToggleSwitch from '../components/ui/ToggleSwitch';

const mockApiKeys: ApiKey[] = [
    { id: 'ak1', exchange: 'Binance', key: 'bn_****...***_key', secret: 'bn_****...***_secret' },
    { id: 'ak2', exchange: 'KuCoin', key: 'kc_****...***_key', secret: 'kc_****...***_secret' },
];

const SettingsPage: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        telegramChatId: '',
        email: 'user@example.com',
        notifyOnTrade: true,
        notifyOnError: false,
    });
    
    const handleNotificationChange = (field: keyof NotificationSettings, value: string | boolean) => {
        setNotificationSettings(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

            {/* API Key Management */}
            <Card title="API Key Management">
                <div className="space-y-4">
                    {apiKeys.map(apiKey => (
                        <div key={apiKey.id} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 flex justify-between items-center">
                            <div>
                                <span className="font-semibold text-gray-900 dark:text-white">{apiKey.exchange}</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{apiKey.key}</p>
                            </div>
                            <div className="space-x-2">
                                <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm font-medium">Edit</button>
                                <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 text-sm font-medium">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-6">
                    <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">Add New API Key</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="exchange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Exchange</label>
                            <select id="exchange" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option>Binance</option>
                                <option>KuCoin</option>
                                <option>Bybit</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                            <input type="password" id="api-key" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="api-secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Secret</label>
                            <input type="password" id="api-secret" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white" />
                        </div>
                    </div>
                     <div className="mt-4 text-right">
                        <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Add Key</button>
                    </div>
                </div>
            </Card>

            {/* Notification Settings */}
            <Card title="Notification Settings">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="telegram-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telegram Chat ID</label>
                        <input type="text" id="telegram-id" value={notificationSettings.telegramChatId} onChange={e => handleNotificationChange('telegramChatId', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <input type="email" id="email" value={notificationSettings.email} onChange={e => handleNotificationChange('email', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notify on executed trades</span>
                        <ToggleSwitch enabled={notificationSettings.notifyOnTrade} onChange={v => handleNotificationChange('notifyOnTrade', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notify on system errors</span>
                        <ToggleSwitch enabled={notificationSettings.notifyOnError} onChange={v => handleNotificationChange('notifyOnError', v)} />
                    </div>
                </div>
                 <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4 text-right">
                    <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Save Notification Settings</button>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;
