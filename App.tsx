import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message, Role, Agent, ChatSession } from './types';
import Header from '@/src/components/Header';
import ChatWindow from '@/src/components/ChatWindow';
import UserInput from '@/src/components/UserInput';
import ErrorDisplay from '@/src/components/ErrorDisplay';
import HistorySidebar from '@/src/components/HistorySidebar';

const agentSystemInstructions: Record<Agent, string> = {
    [Agent.Default]: 'You are a helpful and friendly AI assistant named Gemini. Format your responses clearly, using markdown where appropriate.',
    [Agent.SystemsArchitect]: "You are a world-class Systems Architect AI. Your goal is to design the complete end-to-end architecture for software applications based on a user's high-level description. Your response must be structured, detailed, and professional. It should cover: 1. **Core Functionality**: A summary of what the app does. 2. **Data Models/Schema**: Define necessary database schemas or data objects (use JSON or SQL DDL in code blocks). 3. **API Design**: Suggest key API endpoints (e.g., RESTful endpoints). 4. **Technology Stack**: Recommend frontend, backend, and database technologies. 5. **User Interaction Flow**: Describe how a user would interact with the app. Do not write the full application code, but provide a comprehensive blueprint.",
    [Agent.BehavioralModeler]: "You are a specialist AI Behavioral Modeler. Your purpose is to design the personality, communication style, goals, and decision-making logic for AI agents within an application. Based on the user's request, create a detailed persona for the specified AI. Your response should include: 1. **Personality Traits**: A list of key characteristics (e.g., Encouraging, Analytical, Humorous). 2. **Communication Style**: Define the tone and manner of speaking. 3. **Core Directives**: What are the agent's primary goals? 4. **Sample Dialogues**: Provide 2-3 examples of interactions with a user to illustrate the defined behavior. Use markdown for formatting.",
    [Agent.DigitalTwin]: "You are an expert Digital Twin Agent. You specialize in creating virtual models of real-world systems, processes, or objects. Given a user's description, your task is to design the data model and simulation logic for its digital twin. Your output must include: 1. **Data Schema**: A precise data model representing the system's state (use JSON Schema or TypeScript interfaces in code blocks). 2. **Simulation Logic**: Describe the core functions or algorithms that would govern the twin's behavior and state changes. Provide pseudocode or actual code snippets for key simulations (e.g., 'what-if' scenarios). 3. **Interfaces**: Define how one would interact with the digital twin (e.g., function signatures for updating state or running simulations).",
    [Agent.ApiIntegration]: "You are a senior API Integration Agent. Your sole focus is to provide expert, production-ready code for connecting applications to external services and APIs. When a user specifies a service (e.g., Google Maps, OpenAI, a weather API), provide a clean, well-documented code snippet to handle the integration. Your response should: 1. **Specify Language**: Default to TypeScript/Node.js unless another language is requested. 2. **Provide Code**: Write a self-contained function for making the API call, including error handling. 3. **Explain Dependencies**: List any required libraries or packages (e.g., `axios`, `node-fetch`). 4. **Show Usage**: Include a brief example of how to call your function. Use markdown code blocks for all code."
};

const agentIntroMessages: Record<Agent, string> = {
    [Agent.Default]: "Hello! I'm Gemini. Ask me anything, or try generating an image by typing `/imagine <your prompt>`.",
    [Agent.SystemsArchitect]: "Systems Architect at your service. Describe the application you want to build, and I will design its complete architecture.",
    [Agent.BehavioralModeler]: "Behavioral Modeler online. Describe the AI agent you need, and I'll define its personality and behavior.",
    [Agent.DigitalTwin]: "Digital Twin agent ready. Tell me about the system you want to simulate, and I'll construct its virtual model.",
    [Agent.ApiIntegration]: "API Integration specialist here. Name a service, and I'll write the code to connect to it.",
};

const getInitialState = () => {
    try {
        const savedSessions = localStorage.getItem('chatSessions');
        const savedActiveIds = localStorage.getItem('activeSessionIds');
        if (savedSessions && savedActiveIds) {
            return {
                sessions: JSON.parse(savedSessions),
                activeSessionIds: JSON.parse(savedActiveIds),
            };
        }
    } catch (error) {
        console.error("Failed to load state from localStorage", error);
    }

    // Default initial state
    const sessions = {} as Record<Agent, ChatSession[]>;
    const activeSessionIds = {} as Record<Agent, string>;

    for (const agent of Object.values(Agent)) {
        const id = `chat-${Date.now()}-${agent}`;
        sessions[agent] = [{
            id,
            title: 'New Chat',
            messages: [{ role: Role.MODEL, content: agentIntroMessages[agent], agent }],
        }];
        activeSessionIds[agent] = id;
    }

    return { sessions, activeSessionIds };
};


const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generationType, setGenerationType] = useState<'text' | 'image' | null>(null);
    const [activeAgent, setActiveAgent] = useState<Agent>(Agent.Default);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [sessions, setSessions] = useState<Record<Agent, ChatSession[]>>(getInitialState().sessions);
    const [activeSessionIds, setActiveSessionIds] = useState<Record<Agent, string>>(getInitialState().activeSessionIds);
    
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        try {
            if (!process.env.API_KEY) {
                setError("API_KEY environment variable not set.");
                return;
            }
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "An unknown error occurred during initialization.");
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
            localStorage.setItem('activeSessionIds', JSON.stringify(activeSessionIds));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [sessions, activeSessionIds]);
    
    const activeSessionId = activeSessionIds[activeAgent];
    const activeSession = sessions[activeAgent]?.find(s => s.id === activeSessionId);

    const updateMessagesInSession = (sessionId: string, updateFn: (messages: Message[]) => Message[]) => {
        setSessions(prev => {
            const agentSessions = prev[activeAgent];
            const sessionIndex = agentSessions.findIndex(s => s.id === sessionId);
            if (sessionIndex === -1) return prev;

            const updatedSession = { ...agentSessions[sessionIndex], messages: updateFn(agentSessions[sessionIndex].messages) };
            const newAgentSessions = [...agentSessions];
            newAgentSessions[sessionIndex] = updatedSession;

            return { ...prev, [activeAgent]: newAgentSessions };
        });
    };
    
    const generateTitle = useCallback(async (prompt: string): Promise<string> => {
        if (!aiRef.current) return 'New Chat';
        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate a concise, 4-word or less title for a conversation that starts with this user message: "${prompt}"\n\nDo not include any quotation marks in the title.`,
                config: {
                    temperature: 0.2,
                }
            });
            return response.text.replace(/["*]/g, '').trim();
        } catch (e) {
            console.error("Title generation failed:", e);
            return 'New Chat';
        }
    }, []);

    const handleChatStream = useCallback(async (text: string) => {
        const ai = aiRef.current;
        if (!ai || !activeSession) {
            setError("Chat session is not ready. Please check your API key and refresh.");
            setIsLoading(false);
            return;
        }

        setGenerationType('text');
        const userMessage: Message = { role: Role.USER, content: text };
        
        updateMessagesInSession(activeSession.id, (messages) => [...messages, userMessage, { role: Role.MODEL, content: '', agent: activeAgent }]);

        try {
            const historyForApi = activeSession.messages
                .map(msg => ({
                    role: msg.role === Role.USER ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
                .filter(m => m.role === 'user' || m.role === 'model');

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: agentSystemInstructions[activeAgent] },
                history: historyForApi
            });
            
            const stream = await chat.sendMessageStream({ message: text });

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    updateMessagesInSession(activeSession.id, (messages) => {
                         const newMessages = [...messages];
                         const lastMessage = newMessages[newMessages.length - 1];
                         if (lastMessage && lastMessage.role === Role.MODEL) {
                             lastMessage.content += chunkText;
                         }
                         return newMessages;
                    });
                }
            }
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            const finalError = `Sorry, something went wrong: ${errorMessage}`;
            updateMessagesInSession(activeSession.id, (messages) => messages.slice(0, -1).concat({ role: Role.ERROR, content: finalError }));
            setError(finalError);
        } finally {
            setIsLoading(false);
            setGenerationType(null);
        }
    }, [activeAgent, activeSession, agentSystemInstructions]);

    const handleImageGeneration = useCallback(async (prompt: string) => {
        if (!aiRef.current || !activeSession) {
            setError("AI Client is not initialized.");
            setIsLoading(false);
            return;
        }
        if (!prompt) {
            setError("Please provide a prompt for the image.");
            setIsLoading(false);
            return;
        }
    
        setGenerationType('image');
        const userMessage: Message = { role: Role.USER, content: `/imagine ${prompt}` };
        updateMessagesInSession(activeSession.id, messages => [...messages, userMessage]);
    
        try {
            let cleanPrompt = prompt;
            let numberOfImages = 1;
            let aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = '1:1';
            const supportedAspectRatios: ("1:1" | "3:4" | "4:3" | "9:16" | "16:9")[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    
            const nMatch = cleanPrompt.match(/--n\s+(\d+)/);
            if (nMatch && nMatch[1]) {
                numberOfImages = parseInt(nMatch[1], 10);
                numberOfImages = Math.max(1, Math.min(4, numberOfImages)); 
                cleanPrompt = cleanPrompt.replace(/--n\s+\d+/, '').trim();
            }
    
            const arMatch = cleanPrompt.match(/--ar\s+([\d:]+)/);
            if (arMatch && arMatch[1]) {
                const ratio = arMatch[1];
                if (supportedAspectRatios.includes(ratio as any)) {
                    aspectRatio = ratio as typeof aspectRatio;
                    cleanPrompt = cleanPrompt.replace(/--ar\s+[\d:]+/, '').trim();
                }
            }
            
            const response = await aiRef.current.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: cleanPrompt,
                config: {
                    numberOfImages,
                    outputMimeType: 'image/jpeg',
                    aspectRatio,
                },
            });
            
            const imageUrls = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
    
            const modelMessage: Message = { role: Role.MODEL, content: '', imageUrls, agent: Agent.Default };
            updateMessagesInSession(activeSession.id, messages => [...messages, modelMessage]);
    
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            const finalError = `Sorry, something went wrong while generating the image: ${errorMessage}`;
            updateMessagesInSession(activeSession.id, messages => [...messages, { role: Role.ERROR, content: finalError }]);
            setError(finalError);
        } finally {
            setIsLoading(false);
            setGenerationType(null);
        }
    }, [activeSession]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (isLoading || !text.trim() || !activeSession) return;

        setIsLoading(true);
        setError(null);
        
        const isNewChat = activeSession.messages.length === 1;

        const trimmedText = text.trim();
        if (trimmedText.toLowerCase().startsWith('/imagine ') && activeAgent === Agent.Default) {
            const prompt = trimmedText.substring(8).trim();
            await handleImageGeneration(prompt);
        } else {
            await handleChatStream(trimmedText);
        }

        if (isNewChat) {
            const newTitle = await generateTitle(trimmedText);
            setSessions(prev => {
                const newAgentSessions = prev[activeAgent].map(s => s.id === activeSession.id ? { ...s, title: newTitle } : s);
                return { ...prev, [activeAgent]: newAgentSessions };
            });
        }

    }, [isLoading, handleChatStream, handleImageGeneration, activeAgent, activeSession, generateTitle]);
    
    const handleNewChat = useCallback(() => {
        const newSession: ChatSession = {
            id: `chat-${Date.now()}`,
            title: 'New Chat',
            messages: [{
                role: Role.MODEL,
                content: agentIntroMessages[activeAgent],
                agent: activeAgent,
            }],
        };

        setSessions(prev => ({
            ...prev,
            [activeAgent]: [newSession, ...(prev[activeAgent] || [])],
        }));

        setActiveSessionIds(prev => ({
            ...prev,
            [activeAgent]: newSession.id,
        }));
    }, [activeAgent]);
    
    const handleSelectSession = useCallback((sessionId: string) => {
        setActiveSessionIds(prev => ({
            ...prev,
            [activeAgent]: sessionId
        }));
    }, [activeAgent]);

    const handleDeleteSession = useCallback((sessionId: string) => {
        setSessions(prev => {
            const newAgentSessions = prev[activeAgent].filter(s => s.id !== sessionId);
            // If we deleted the active session, select a new one
            if (activeSessionId === sessionId) {
                 const newActiveId = newAgentSessions.length > 0 ? newAgentSessions[0].id : null;
                 if (newActiveId) {
                    setActiveSessionIds(p => ({...p, [activeAgent]: newActiveId}));
                 } else {
                    // if no sessions left, create a new one
                    handleNewChat();
                 }
            }
            return { ...prev, [activeAgent]: newAgentSessions };
        });
    }, [activeAgent, activeSessionId, handleNewChat]);

    return (
        <div className="flex h-screen bg-slate-900 font-sans text-white">
            <HistorySidebar 
                isOpen={isSidebarOpen}
                sessions={sessions[activeAgent] || []}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                agent={activeAgent}
            />
            <div className="flex flex-col flex-1">
                <Header 
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    activeAgent={activeAgent} 
                    onAgentChange={setActiveAgent} 
                    activeSession={activeSession}
                />
                {error && !activeSession?.messages.some(m => m.role === Role.ERROR) && <ErrorDisplay message={error} />}
                <ChatWindow 
                    messages={activeSession?.messages || []} 
                    isLoading={isLoading} 
                    generationType={generationType} 
                    activeAgent={activeAgent} 
                />
                <UserInput onSendMessage={handleSendMessage} isLoading={isLoading} activeAgent={activeAgent} />
            </div>
        </div>
    );
};

export default App;