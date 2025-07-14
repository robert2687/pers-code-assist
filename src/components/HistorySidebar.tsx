import React from 'react';
import ExportButton from './ExportButton';
import { ChatSession, Agent } from '../../types';

interface HistorySidebarProps {
    isOpen: boolean;
    sessions: ChatSession[];
    activeSessionId: string;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
    agent: Agent;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
    isOpen,
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    agent
}) => {
    if (!isOpen) return null;

    const getAgentColor = (agent: Agent) => {
        const colors = {
            [Agent.Default]: 'border-blue-500',
            [Agent.SystemsArchitect]: 'border-purple-500',
            [Agent.BehavioralModeler]: 'border-green-500',
            [Agent.DigitalTwin]: 'border-orange-500',
            [Agent.ApiIntegration]: 'border-red-500',
        };
        return colors[agent] || 'border-blue-500';
    };

    return (
        <div className={`w-80 bg-slate-800 border-r border-slate-700 flex flex-col ${getAgentColor(agent)} border-l-2`}>
            <div className="p-4 border-b border-slate-700">
                <button
                    onClick={onNewChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Chat</span>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                    <h3 className="text-sm font-medium text-slate-400 mb-2 px-2">
                        {agent} Sessions
                    </h3>
                    <div className="space-y-1">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                    session.id === activeSessionId
                                        ? 'bg-slate-700 text-white'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                                onClick={() => onSelectSession(session.id)}
                            >
                                <div className="flex-1 truncate">
                                    <div className="text-sm font-medium truncate">
                                        {session.title}
                                    </div>
                                    <div className="text-xs text-slate-400 truncate">
                                        {session.messages.length} messages
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <ExportButton session={session} agent={agent} />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession(session.id);
                                        }}
                                        className="p-1 hover:bg-red-600 rounded transition-all"
                                        aria-label="Delete session"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistorySidebar;