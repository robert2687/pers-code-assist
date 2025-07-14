import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import CopyButton from './CopyButton';
import { Message, Role, Agent } from '../../types';

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
    generationType: 'text' | 'image' | null;
    activeAgent: Agent;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, generationType, activeAgent }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getAgentColor = (agent: Agent) => {
        const colors = {
            [Agent.Default]: 'text-blue-400',
            [Agent.SystemsArchitect]: 'text-purple-400',
            [Agent.BehavioralModeler]: 'text-green-400',
            [Agent.DigitalTwin]: 'text-orange-400',
            [Agent.ApiIntegration]: 'text-red-400',
        };
        return colors[agent] || 'text-blue-400';
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={`flex ${message.role === Role.USER ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-3xl rounded-lg p-4 ${
                            message.role === Role.USER
                                ? 'bg-blue-600 text-white'
                                : message.role === Role.ERROR
                                ? 'bg-red-900 text-red-100 border border-red-700'
                                : 'bg-slate-800 text-slate-100'
                        }`}
                    >
                        {message.role === Role.MODEL && message.agent && (
                            <div className={`text-xs font-medium mb-2 ${getAgentColor(message.agent)}`}>
                                {message.agent}
                            </div>
                        )}
                        
                        {message.imageUrls && message.imageUrls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {message.imageUrls.map((url, imgIndex) => (
                                    <img
                                        key={imgIndex}
                                        src={url}
                                        alt={`Generated image ${imgIndex + 1}`}
                                        className="rounded-lg max-w-full h-auto"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="relative group">
                                <div className="prose prose-invert max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeHighlight]}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                                {message.role !== Role.USER && message.content && (
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CopyButton text={message.content} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-slate-800 rounded-lg p-4 max-w-3xl">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                            <span className="text-slate-300">
                                {generationType === 'image' ? 'Generating image...' : 'Thinking...'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatWindow;