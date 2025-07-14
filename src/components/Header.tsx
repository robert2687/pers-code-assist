import React from 'react';
import ExportButton from './ExportButton';
import { Agent } from '../../types';

interface HeaderProps {
    onToggleSidebar: () => void;
    activeAgent: Agent;
    onAgentChange: (agent: Agent) => void;
    activeSession?: any;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeAgent, onAgentChange, activeSession }) => {
    return (
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h1 className="text-xl font-semibold">Gemini AI Chat</h1>
            </div>
            
            <div className="flex items-center space-x-2">
                {activeSession && (
                    <ExportButton session={activeSession} agent={activeAgent} />
                )}
                <label htmlFor="agent-select" className="text-sm text-slate-300">Agent:</label>
                <select
                    id="agent-select"
                    value={activeAgent}
                    onChange={(e) => onAgentChange(e.target.value as Agent)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {Object.values(Agent).map((agent) => (
                        <option key={agent} value={agent}>
                            {agent}
                        </option>
                    ))}
                </select>
            </div>
        </header>
    );
};

export default Header;