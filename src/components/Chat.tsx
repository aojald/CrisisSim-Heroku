import React, { useState, useEffect, useRef } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useNotifications } from '../context/NotificationContext';
import { MessageSquare, Send, X } from 'lucide-react';
import wsClient, { debug } from '../utils/socket';

interface Message {
  id: string;
  playerId: string;
  playerName: string;
  playerRole: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  showPlayerDashboard: boolean;
}

export default function Chat({ showPlayerDashboard }: ChatProps) {
  const { state } = useSimulation();
  const { addUnreadMessage, clearUnreadMessages } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear unread messages when chat becomes visible
  useEffect(() => {
    if (showPlayerDashboard) {
      clearUnreadMessages();
    }
  }, [showPlayerDashboard, clearUnreadMessages]);

  // Listen for chat messages from other players
  useEffect(() => {
    const handleChatMessage = (data: any) => {
      debug('Received chat message:', data);
      if (data.message) {
        setMessages(prev => {
          // Avoid duplicate messages
          const exists = prev.some(msg => msg.id === data.message.id);
          if (exists) return prev;
          
          // If message is from another player and chat is not visible, increment unread count
          if (data.message.playerId !== currentPlayer?.id && !showPlayerDashboard) {
            addUnreadMessage();
          }
          
          return [...prev, data.message];
        });
      }
    };

    // Register chat message listener
    wsClient.on('chat_message', handleChatMessage);

    return () => {
      wsClient.off('chat_message', handleChatMessage);
    };
  }, [currentPlayer?.id, showPlayerDashboard, addUnreadMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentPlayer || !state.simulationCode) return;

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      playerRole: currentPlayer.role,
      text: newMessage.trim(),
      timestamp: Date.now()
    };

    // Add to local messages immediately for better UX
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    try {
      // Send message through WebSocket
      await wsClient.sendChatMessage(message);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      // Message already added locally, so just log the error
    }
  };

  if (!currentPlayer) return null;

  return (
    <>
      {/* Chat Panel */}
      {showPlayerDashboard && (
        <div className="fixed bottom-24 right-6 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Team Chat</h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No messages yet. Start the conversation!
              </div>
            )}
            
            {messages.map(message => {
              const isCurrentPlayer = message.playerId === currentPlayer.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentPlayer ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isCurrentPlayer ? 'order-2' : ''}`}>
                    <div className={`rounded-lg p-3 shadow-sm ${
                      isCurrentPlayer
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className={`text-xs mb-1 font-medium ${
                        isCurrentPlayer ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {message.playerName} ({message.playerRole})
                      </div>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>
                    <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                      isCurrentPlayer ? 'text-right' : 'text-left'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {newMessage.length}/500 characters
            </div>
          </form>
        </div>
      )}
    </>
  );
}