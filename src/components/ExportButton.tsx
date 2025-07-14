import React, { useState } from 'react';
import { downloadTextFile, formatChatForExport, formatChatForJsonExport } from '../utils/textUtils';
import { ChatSession, Agent } from '../../types';

interface ExportButtonProps {
    session: ChatSession;
    agent: Agent;
    className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ session, agent, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleExportText = () => {
        const content = formatChatForExport(session.messages, session.title, agent);
        const filename = `${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_${agent.replace(/\s+/g, '_')}.txt`;
        downloadTextFile(content, filename, 'text/plain');
        setIsOpen(false);
    };

    const handleExportJson = () => {
        const content = formatChatForJsonExport(session, agent);
        const filename = `${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_${agent.replace(/\s+/g, '_')}.json`;
        downloadTextFile(content, filename, 'application/json');
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1.5 rounded hover:bg-slate-600 transition-colors ${className}`}
                title="Export chat"
            >
                <svg className="w-4 h-4 text-slate-400 hover:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-8 bg-slate-700 border border-slate-600 rounded-lg shadow-lg py-1 z-10 min-w-32">
                    <button
                        onClick={handleExportText}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-600 transition-colors"
                    >
                        Export as Text
                    </button>
                    <button
                        onClick={handleExportJson}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-600 transition-colors"
                    >
                        Export as JSON
                    </button>
                </div>
            )}

            {isOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default ExportButton;