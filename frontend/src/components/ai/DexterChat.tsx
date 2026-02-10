import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Sparkles, BarChart, FileText, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const DexterChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm Dexter, your AI assistant. How can I help you with your accounting today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // TODO: Get actual UCID from context if available
            const response = await api.post<{ reply: string }>('/ai/chat', {
                message: userMessage.content,
                ucid: '94EE', // Hardcoded for now, should be dynamic
            });

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.reply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I encountered an error processing your request.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
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

    const handleQuickAction = (action: string) => {
        let message = "";
        switch (action) {
            case "suggest":
                message = "Can you suggest an account for a transaction?";
                break;
            case "chart":
                message = "Generate a chart of my top expenses.";
                break;
            case "report":
                message = "Create a summary report for this month.";
                break;
            default:
                return;
        }
        setInput(message);
        if (inputRef.current) inputRef.current.focus();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen ? (
                <Card className="w-[400px] h-[600px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 border-primary/20 glass-effect">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/30 rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                                <Sparkles className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold">Dexter AI</CardTitle>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden relative bg-background/50">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-6 pb-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                                            message.role === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                                message.role === 'user'
                                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                                    : "bg-card border text-card-foreground rounded-bl-none"
                                            )}
                                        >
                                            {message.role === 'assistant' ? (
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                message.content
                                            )}
                                            <div className={cn("text-[10px] mt-1 opacity-70", message.role === 'user' ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-card border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                            <div className="flex space-x-1">
                                                <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce"></div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <div className="p-2 border-t bg-muted/20 grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-8 bg-background/50 hover:bg-background hover:text-primary border-dashed" onClick={() => handleQuickAction("suggest")}>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> Suggest
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8 bg-background/50 hover:bg-background hover:text-primary border-dashed" onClick={() => handleQuickAction("chart")}>
                            <BarChart className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Chart
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8 bg-background/50 hover:bg-background hover:text-primary border-dashed" onClick={() => handleQuickAction("report")}>
                            <FileText className="mr-1.5 h-3.5 w-3.5 text-green-500" /> Report
                        </Button>
                    </div>

                    <CardFooter className="p-3 bg-background border-t">
                        <div className="flex w-full items-center gap-2 relative">
                            <Input
                                ref={inputRef}
                                placeholder="Ask Dexter anything..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 pr-10 h-11 rounded-full border-muted-foreground/20 focus-visible:ring-primary/20"
                                disabled={isLoading}
                            />
                            <Button
                                size="icon"
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-1 h-9 w-9 rounded-full shadow-sm"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110 group relative"
                >
                    <MessageSquare className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-background"></span>
                </Button>
            )}
        </div>
    );
};

export default DexterChat;
