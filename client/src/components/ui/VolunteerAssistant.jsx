import { useEffect, useRef, useState } from 'react';
import { assistantAPI } from '../../services/api';
import assistantAvatar from '../../assets/volunteer-assistant-avatar.jpg';

const INITIAL_POSITION = { x: 20, y: 92 };

const starterPrompts = [
  'What campaigns are active now?',
  'What tasks can I help with?',
  'Who can I contact about donations?',
];

const initialMessages = [
  {
    role: 'assistant',
    content: 'Hi, I can help you find campaigns, missions, tasks, dates, donation contacts, and organizer details.',
  },
];

const SendIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const normalizeAssistantText = (content) => (
  content
    .replace(/\s+(\d+)\.\s+/g, '\n$1. ')
    .replace(/\s+-\s+/g, '\n- ')
    .trim()
);

const renderInline = (text, isUser) => {
  const parts = [];
  const pattern = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={`strong-${match.index}`} className="font-bold">{match[2]}</strong>);
    } else if (match[3] && match[4]) {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[4]}
          target="_blank"
          rel="noreferrer"
          className={`font-semibold underline underline-offset-2 ${isUser ? 'text-white' : 'text-emerald-700 hover:text-emerald-800'}`}
        >
          {match[3]}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const FormattedMessage = ({ content, isUser }) => {
  const text = isUser ? content : normalizeAssistantText(content);
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  return (
    <div className="space-y-1.5" dir="auto">
      {lines.map((line, index) => {
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        const bulletMatch = line.match(/^[-*]\s+(.*)$/);

        if (numberedMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isUser ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>
                {numberedMatch[1]}
              </span>
              <span>{renderInline(numberedMatch[2], isUser)}</span>
            </div>
          );
        }

        if (bulletMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2 pl-1">
              <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${isUser ? 'bg-white/70' : 'bg-slate-400'}`} />
              <span>{renderInline(bulletMatch[1], isUser)}</span>
            </div>
          );
        }

        return <p key={`${line}-${index}`}>{renderInline(line, isUser)}</p>;
      })}
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-md'
            : 'bg-slate-100 text-slate-700 rounded-bl-md'
        }`}
      >
        <FormattedMessage content={message.content} isUser={isUser} />
      </div>
    </div>
  );
};

const VolunteerAssistant = () => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dragRef = useRef(null);
  const justDraggedRef = useRef(false);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const clampPosition = (nextPosition) => {
    const margin = 12;
    const panelWidth = open ? Math.min(384, window.innerWidth - 40) : 56;
    const panelHeight = open ? 560 : 56;
    const maxX = Math.max(margin, window.innerWidth - panelWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - panelHeight - margin);

    return {
      x: Math.min(Math.max(nextPosition.x, margin), maxX),
      y: Math.min(Math.max(nextPosition.y, margin), maxY),
    };
  };

  const startDrag = (event) => {
    if (event.button !== 0) return;

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };

    const handlePointerMove = (moveEvent) => {
      if (!dragRef.current) return;

      const deltaX = moveEvent.clientX - dragRef.current.startX;
      const deltaY = moveEvent.clientY - dragRef.current.startY;
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        dragRef.current.moved = true;
      }

      setPosition(clampPosition({
        x: dragRef.current.originX + deltaX,
        y: dragRef.current.originY + deltaY,
      }));
    };

    const handlePointerUp = () => {
      justDraggedRef.current = !!dragRef.current?.moved;
      dragRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const sendMessage = async (content) => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const { data } = await assistantAPI.chat(nextMessages);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.data.reply,
        },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'The assistant is having trouble answering right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div
      className="fixed z-50 flex flex-col items-start gap-3"
      style={{ left: position.x, top: position.y }}
    >
      <button
        type="button"
        onPointerDown={startDrag}
        onClick={() => {
          if (justDraggedRef.current) {
            justDraggedRef.current = false;
            return;
          }
          setOpen((current) => !current);
        }}
        aria-label={open ? 'Close volunteer assistant' : 'Open volunteer assistant'}
        className="group relative flex h-16 w-16 cursor-grab items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white shadow-card-hover transition-all hover:-translate-y-0.5 active:scale-95 active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        <img
          src={assistantAvatar}
          alt=""
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          draggable="false"
        />
        <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
      </button>

      {open && (
        <div className="w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-hover">
          <div
            onPointerDown={startDrag}
            className="flex cursor-grab items-center justify-between border-b border-slate-100 bg-slate-950 px-4 py-3 text-white active:cursor-grabbing"
          >
            <div>
              <p className="text-sm font-bold">Volunteer assistant</p>
              <p className="text-xs text-emerald-200">Campaigns, tasks, donations</p>
            </div>
            <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-bold text-slate-950">
              Live
            </span>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <MessageBubble key={`${message.role}-${index}`} message={message} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2 text-sm text-slate-500">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            {messages.length === 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                rows={1}
                placeholder="Ask about campaigns..."
                className="min-h-[42px] max-h-24 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerAssistant;
