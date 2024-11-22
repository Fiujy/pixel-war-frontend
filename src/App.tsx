import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

const App: React.FC = () => {
  const [messages, setMessages] = useState<{ username: string; message: string }[]>([]);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const socket = io('http://localhost:8080');
    socketRef.current = socket;

    socket.on('init', (pixels: Record<string, { x: number; y: number; color: string }>) => {
      Object.values(pixels).forEach(({ x, y, color }) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 10, 10);
      });
    });

    socket.on('draw', ({ x, y, color }: { x: number; y: number; color: string }) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 10, 10);
    });

    socket.on('erase', ({ x, y }: { x: number; y: number }) => {
      ctx.clearRect(x, y, 10, 10);
    });

    socket.on('chat', ({ username, message }: { username: string; message: string }) => {
      setMessages((prev) => [...prev, { username, message }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDraw = (event: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / 10) * 10 - 5;
    const y = Math.floor((event.clientY - rect.top) / 10) * 10 - 5;
    socketRef.current?.emit('draw', { x, y, color: 'primary' });
  };

  const handleErase = (event: React.MouseEvent) => {
    event.preventDefault();
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / 10) * 10 - 5;
    const y = Math.floor((event.clientY - rect.top) / 10) * 10 - 5;
    socketRef.current?.emit('erase', { x, y });
  };

  const sendMessage = () => {
    socketRef.current?.emit('message', message);
    setMessage('');
  };

  const updateUsername = () => {
    socketRef.current?.emit('set-username', username);
  };

  return (
    <div className="flex flex-col items-center pt-10 space-y-6">
      <div className='flex flex-row space-x-5'>
        <div>
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="border-2 border-primary"
            onClick={handleDraw}
            onContextMenu={handleErase}
          />
        </div>
        <div className='space-y-5'>
          {/* Instructions */}
          <div className="bg-white p-6 rounded-lg shadow-md w-96 text-gray-800">
            <h2 className="text-xl font-bold mb-3 text-primary-content">Comment jouer ?</h2>
            <p className="mb-2">
              <span className="text-primary font-semibold">Clic gauche:</span> Ajouter un pixel
            </p>
            <p>
              <span className="text-primary font-semibold">Clic droit:</span> Effacer un pixel
            </p>
          </div>

          {/* Username */}
          <div className="flex space-x-3 items-center">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-gray-300 bg-base-100 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-0 focus:border-primary"
            />
            <button
              onClick={updateUsername}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition"
            >
              Set Username
            </button>
          </div>

          {/* Chat */}
          <div className="w-96">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="text"
                placeholder="Enter a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-grow border border-gray-300 bg-base-100 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-0 focus:border-primary"
              />
              <button
                onClick={sendMessage}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition"
              >
                Send
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md overflow-y-auto">
              <h3 className="text-lg font-bold mb-2 text-primary-content">Chat</h3>
              {messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <strong className="text-primary">{msg.username}:</strong> <span className='text-primary-content'>{msg.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
