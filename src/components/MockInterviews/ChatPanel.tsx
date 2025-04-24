import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

type Message = {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
};

type ChatPanelProps = {
  interviewId: string;
  userId: string;
  userName: string;
};

const ChatPanel = ({ interviewId, userId, userName }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Set up Supabase real-time channel for chat
    channelRef.current = supabase.channel(`chat-${interviewId}`);

    channelRef.current.on('broadcast', { event: 'message' }, ({ payload }) => {
      // Add received messages to the chat
      setMessages(prev => [...prev, payload]);
    });

    channelRef.current.subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [interviewId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: crypto.randomUUID(),
      text: newMessage,
      sender: userName,
      timestamp: Date.now()
    };

    // Add our own message to the chat immediately
    setMessages(prev => [...prev, message]);

    // Then broadcast it to others
    channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-lg">
      <div className="p-3 border-b">
        <h3 className="font-semibold">Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.sender === userName ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-2 ${
                  message.sender === userName
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm font-medium">{message.sender}</p>
                <p>{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
