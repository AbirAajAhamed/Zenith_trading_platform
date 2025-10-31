// frontend/components/Dashboard/StrategyUpload.tsx
import React, { useState, useRef } from 'react';
import { uploadStrategy } from '../../services/apiClient';

interface StrategyUploadProps {
    onUploadSuccess: () => void; // আপলোড সফল হলে BacktestingPage-কে জানানোর জন্য
}

const StrategyUpload: React.FC<StrategyUploadProps> = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (file.name.endsWith('.py')) {
                setSelectedFile(file);
                setMessage('');
            } else {
                setMessage('Error: Please select a .py file.');
                setSelectedFile(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setMessage('');

        try {
            const response = await uploadStrategy(selectedFile);
            setMessage(`Success: ${response.message}`);
            setSelectedFile(null);
            if(fileInputRef.current) fileInputRef.current.value = ""; // ফাইল ইনপুট রিসেট করা
            onUploadSuccess(); // প্যারেন্ট কম্পোনেন্টকে জানানো যে তালিকা রিফ্রেশ করতে হবে
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };
    
    return (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
             <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">Upload New Strategy</h4>
             <div className="flex items-center space-x-2">
                 <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleFileChange}
                     accept=".py"
                     className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                 />
                 <button
                     onClick={handleUpload}
                     disabled={!selectedFile || isUploading}
                     className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                 >
                     {isUploading ? 'Uploading...' : 'Upload'}
                 </button>
             </div>
             {message && <p className={`mt-2 text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
        </div>
    );
};

export default StrategyUpload;