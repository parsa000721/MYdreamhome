import React, { useState } from 'react';
import { MessageSquare, Image as ImageIcon, Sparkles, Loader2, Send } from 'lucide-react';
import { generateDesignAdvice, generateRender } from '../services/geminiService';

interface AIAssistantProps {
  onCaptureCanvas: () => string; // Function to get base64 image of canvas
  projectContext: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onCaptureCanvas, projectContext }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'render'>('chat');
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  const handleSendChat = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt;
    setPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const advice = await generateDesignAdvice(userMsg, projectContext);
      setChatHistory(prev => [...prev, { role: 'ai', text: advice }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRender = async () => {
    if (!prompt.trim()) return;

    // API Key check for Veo/Imagen models as per guidelines
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.hasSelectedApiKey && aistudio.openSelectKey) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await aistudio.openSelectKey();
        }
    }

    setIsLoading(true);
    setRenderedImage(null);
    try {
      const canvasImage = onCaptureCanvas();
      const result = await generateRender(canvasImage, 'photorealistic', prompt);
      setRenderedImage(result);
    } catch (e: any) {
      console.error(e);
      // Guidelines: If the request fails with an error message containing "Requested entity was not found.", reset the key selection state and prompt the user to select a key again via openSelectKey().
      if (e && e.message && e.message.includes('Requested entity was not found') && aistudio && aistudio.openSelectKey) {
         await aistudio.openSelectKey();
         setChatHistory(prev => [...prev, { role: 'ai', text: "API Key required. Please select a valid key and try again." }]);
      } else {
         setChatHistory(prev => [...prev, { role: 'ai', text: "Render failed. Please check console." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 bg-panel border-l border-border flex flex-col h-full shadow-2xl z-20">
      <div className="flex border-b border-border">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${activeTab === 'chat' ? 'text-accent border-b-2 border-accent bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          <MessageSquare size={16} />
          <span>Consultant</span>
        </button>
        <button 
          onClick={() => setActiveTab('render')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${activeTab === 'render' ? 'text-accent border-b-2 border-accent bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          <ImageIcon size={16} />
          <span>Renderer</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
        {activeTab === 'chat' ? (
          <>
            {chatHistory.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <Sparkles size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Ask me about interior design, material choices, or spatial planning.</p>
              </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-accent text-white' : 'bg-gray-700 text-gray-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-accent flex justify-center"><Loader2 className="animate-spin" /></div>}
          </>
        ) : (
          <div className="flex flex-col space-y-4">
             <div className="text-xs text-gray-400 bg-blue-900/20 border border-blue-500/30 p-3 rounded">
               <p className="font-semibold text-blue-400 mb-1">How to use:</p>
               Describe the desired style, lighting, and materials. The AI will transform your current floor plan into a visualization.
             </div>
             
             {renderedImage ? (
                <div className="rounded-lg overflow-hidden border border-border shadow-lg relative group">
                  <img src={renderedImage} alt="Rendered" className="w-full h-auto" />
                  <a 
                    href={renderedImage} 
                    download="render.png" 
                    className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Download
                  </a>
                </div>
             ) : (
                <div className="aspect-video bg-black/40 rounded border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs">
                  {isLoading ? <Loader2 className="animate-spin" /> : "Render preview will appear here"}
                </div>
             )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-panel">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={activeTab === 'chat' ? "Ask the Architect..." : "Describe the render style..."}
            className="w-full bg-black/30 border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-gray-200 focus:border-accent focus:outline-none resize-none h-20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                activeTab === 'chat' ? handleSendChat() : handleGenerateRender();
              }
            }}
          />
          <button
            onClick={activeTab === 'chat' ? handleSendChat : handleGenerateRender}
            disabled={isLoading || !prompt.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeTab === 'chat' ? <Send size={14} /> : <Sparkles size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;