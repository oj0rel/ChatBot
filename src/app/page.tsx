"use client"

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageContent = input;
    setInput("");
    setIsLoading(true);

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userMessageContent };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMessage, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.body) throw new Error("Erro na conexão");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        fullContent += chunk;

        setMessages((prev) => {
          const newArr = [...prev];
          const index = newArr.findIndex(m => m.id === assistantMessageId);
          if (index !== -1) {
            newArr[index] = {...newArr[index], content: fullContent};
          }
          return newArr;
        });
      }

    } catch (error) {
      console.error("Erro:", error);
      setMessages((prev) => {
        const newArr = [...prev];
        const index = newArr.findIndex(m => m.id === assistantMessageId);
          if (index !== -1) {
            newArr[index] = {...newArr[index], content: "Erro ao gerar resposta. Tente novamente."};
          }
          return newArr;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center">
      <Card className="w-[440px] h-[700px] grid grid-rows-[min-content_1fr_min-content]">
        <CardHeader>
          <CardTitle>Chat AI</CardTitle>
          <CardDescription>Chatbot usando Google Gemini.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm mt-10">
              <p>Comece uma nova conversa...</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 text-sm ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar>
                  <AvatarFallback>IA</AvatarFallback>
                  <AvatarImage src="https://github.com/gemini-code-assist.png" />
                </Avatar>
              )}

              <div
                className={`px-4 py-2 rounded-lg max-w-[80%] break-words ${
                  message.role === "user"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-800 border"
                }`}
              >
                {message.content}
              </div>

              {message.role === "user" && (
                <Avatar>
                  <AvatarFallback>GS</AvatarFallback>
                  <AvatarImage src="https://github.com/oj0rel.png" />
                </Avatar>
              )}
            </div>
          ))}

          {/* Loading Visual */}
          {isLoading && (
            <div className="flex gap-3 text-slate-500 text-xs ml-2">
              <span className="animate-pulse">Gerando resposta...</span>
            </div>
          )}
          
          {/* Div invisível para rolagem automática */}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="space-x-2">
          <div className="w-full flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={sendMessage} disabled={isLoading}>
              Enviar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
