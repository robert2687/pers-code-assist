import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '../../types';

interface UserInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    activeAgent: Agent;
}

const UserInput: React.FC<UserInputProps> = ({ onSendMessage, isLoading, activeAgent }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const getPlaceholder = () => {
        switch (activeAgent) {
            case Agent.Default:
                return "Type your message... (or /imagine for image generation)";
            case Agent.SystemsArchitect:
                return "Describe the application you want to architect...";
            case Agent.BehavioralModeler:
                return "Describe the AI agent behavior you need...";
            case Agent.DigitalTwin:
                return "Describe the system you want to simulate...";
            case Agent.ApiIntegration:
                return "Which API or service do you want to integrate?";
            default:
                return "Type your message...";
        }
    };

    return (
        <div className="border-t border-slate-700 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[50px] max-h-32"
                        disabled={isLoading}
                        rows={1}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Sending...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>Send</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default UserInput;