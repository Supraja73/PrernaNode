import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMessages, postMessage, togglePinMessage, toggleStarMessage } from '../services/chat';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext.jsx';

const timeOf = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatWindow = () => {
  const { id: chatId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [file, setFile] = useState(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetchMessages(chatId);
      if (!cancelled) setMessages(res.data);
    };
    load();

    const socket = getSocket();
    socket.emit('chat:join', chatId);
    socket.emit('chat:seen', { chatId });

    const onMessage = (msg) => {
      if (String(msg.chat) === String(chatId)) setMessages((prev) => [...prev, msg]);
    };
    const onTyping = ({ chatId: cid, userId, isTyping }) => {
      if (cid !== chatId || userId === (user?._id || user?.id)) return;
      setTypingUser(isTyping ? userId : null);
    };
    const onDeleted = ({ messageId, forEveryone }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, deletedForEveryone: forEveryone, text: forEveryone ? '' : m.text, __hiddenForMe: !forEveryone } : m))
      );
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:message-deleted', onDeleted);

    return () => {
      cancelled = true;
      socket.emit('chat:leave', chatId);
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:message-deleted', onDeleted);
    };
  }, [chatId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    const socket = getSocket();
    socket.emit('chat:typing', { chatId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('chat:typing', { chatId, isTyping: false }), 1500);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
    const socket = getSocket();

    if (file) {
      // Attachments go through the REST fallback (Cloudinary upload needs multipart, sockets don't do files well)
      const formData = new FormData();
      formData.append('text', text);
      if (replyTo) formData.append('replyTo', replyTo._id);
      const field = file.type.startsWith('image/') ? 'images' : file.type.startsWith('audio/') ? 'voice' : 'document';
      formData.append(field, file);
      await postMessage(chatId, formData);
      setFile(null);
    } else {
      socket.emit('chat:message', { chatId, text: text.trim(), replyTo: replyTo?._id }, (ack) => {
        if (!ack?.success) console.error(ack?.message);
      });
    }
    setText('');
    setReplyTo(null);
  };

  const deleteMessage = (messageId, forEveryone) => {
    getSocket().emit('chat:delete', { messageId, forEveryone });
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-24 pb-4 px-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/messages" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">←</Link>
          <h1 className="font-display font-semibold">Conversation</h1>
        </div>

        <div className="glass rounded-2xl flex-1 flex flex-col p-4 min-h-[60vh] max-h-[70vh]">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.map((m) => {
              const mine = user && (m.sender?._id === user._id || m.sender?._id === user.id);
              const hidden = m.deletedForEveryone || m.__hiddenForMe;
              return (
                <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] group relative`}>
                    <div className={`text-sm px-4 py-2 rounded-2xl ${mine ? 'bg-gradient-to-r from-gold to-magenta text-void' : 'bg-black/[0.04] dark:bg-white/10'}`}>
                      {m.replyTo && !hidden && (
                        <p className="text-[10px] opacity-70 border-l-2 pl-2 mb-1">{m.replyTo.text?.slice(0, 40) || 'Attachment'}</p>
                      )}
                      {hidden ? (
                        <span className="italic opacity-60">Message deleted</span>
                      ) : (
                        <>
                          {m.text && <p>{m.text}</p>}
                          {m.attachments?.map((a, i) =>
                            a.type === 'image' ? (
                              <img key={i} src={a.url} alt="" className="mt-1 rounded-lg max-w-full max-h-48 object-cover" />
                            ) : (
                              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block mt-1 text-xs underline">
                                📎 {a.fileName || 'Attachment'}
                              </a>
                            )
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-ink/30 dark:text-white/30 font-mono">
                      <span>{timeOf(m.createdAt)}</span>
                      {!hidden && (
                        <>
                          <button onClick={() => setReplyTo(m)} className="hover:text-cyan">Reply</button>
                          <button onClick={() => toggleStarMessage(m._id)} className="hover:text-gold">★</button>
                          {mine && <button onClick={() => deleteMessage(m._id, true)} className="hover:text-magenta">Delete</button>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {typingUser && <p className="text-xs text-ink/40 dark:text-white/40 font-mono mt-2">Typing…</p>}

          {replyTo && (
            <div className="flex items-center justify-between text-xs bg-black/5 dark:bg-white/5 rounded-lg px-3 py-1.5 mt-2">
              <span className="truncate">Replying to: {replyTo.text?.slice(0, 50) || 'Attachment'}</span>
              <button onClick={() => setReplyTo(null)} className="text-magenta">✕</button>
            </div>
          )}

          <form onSubmit={send} className="flex items-center gap-2 mt-3">
            <label className="cursor-pointer text-lg shrink-0">
              📎
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <input
              value={text}
              onChange={(e) => { setText(e.target.value); handleTyping(); }}
              placeholder={file ? `Attaching: ${file.name}` : 'Type a message…'}
              className="flex-1 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 outline-none focus:border-cyan"
            />
            <button type="submit" className="text-sm font-semibold text-void bg-gradient-to-r from-gold to-magenta px-5 py-2.5 rounded-full shrink-0">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
