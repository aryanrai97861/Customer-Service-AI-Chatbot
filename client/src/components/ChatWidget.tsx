import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

const API_URL = 'http://localhost:3000'; // Hardcoded for demo

export const ChatWidget: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('chat_session_id'));
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load history on mount
    useEffect(() => {
        if (sessionId) {
            fetch(`${API_URL}/chat/history/${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.messages) {
                        // Map backend messages to UI format
                        const mapped = data.messages.map((m: any) => ({
                            role: m.sender,
                            content: m.content
                        }));
                        setMessages(mapped);
                    }
                })
                .catch(err => console.error("Failed to load history", err));
        }
    }, [sessionId]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        // Optimistic update
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, sessionId })
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);

            if (!sessionId && data.sessionId) {
                setSessionId(data.sessionId);
                localStorage.setItem('chat_session_id', data.sessionId);
            }

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "⚠️ Error sending message. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="avatar">🤖</div>
                <div>
                    <h3>Spur Assistant</h3>
                    <span className="status">Online</span>
                </div>
            </div>

            <div className="messages-list">
                {messages.length === 0 && (
                    <div className="empty-state">
                        <p>👋 Hi! asking me anything about valid shipping or return policies.</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message-row ${msg.role}`}>
                        <div className="message-bubble">
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message-row ai">
                        <div className="message-bubble typing">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                    ➤
                </button>
            </div>
        </div>
    );
};
