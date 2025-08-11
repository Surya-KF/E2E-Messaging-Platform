"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
if (typeof window !== 'undefined') {
  axios.defaults.baseURL = API_URL;
}

export default function ChatPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersCursor, setUsersCursor] = useState<string | null>(null);
  const [usersHasMore, setUsersHasMore] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const [messages, setMessages] = useState<Record<string, any[]>>({}); // keyed by peerId
  const [msgCursorByPeer, setMsgCursorByPeer] = useState<Record<string, string | null>>({});
  const [msgHasMoreByPeer, setMsgHasMoreByPeer] = useState<Record<string, boolean>>({});
  const [messageText, setMessageText] = useState("");

  const [mobileListCollapsed, setMobileListCollapsed] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Restore session or redirect to /login
  useEffect(() => {
    const t = localStorage.getItem("token");
    const m = localStorage.getItem("me");
    if (t && m) {
      setToken(t);
      try { setMe(JSON.parse(m)); } catch {}
    } else {
      router.replace('/login');
    }
  }, [router]);

  // Keep axios auth header in sync
  useEffect(() => {
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete axios.defaults.headers.common["Authorization"];
  }, [token]);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) || null, [users, selectedUserId]);
  const conversationMessages = useMemo(() => {
    if (!me || !selectedUserId) return [] as any[];
    const list = messages[selectedUserId] || [];
    return list.slice().sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, me, selectedUserId]);

  // Auto-scroll newest
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [conversationMessages.length, selectedUserId]);

  // WebSocket lifecycle
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${API_URL.replace("http", "ws")}/?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => setWsReady(true);
    ws.onclose = () => setWsReady(false);
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === "ready") return;
      if (data.type === "message") {
        setMessages((m) => {
          const peerId = data.message.senderId === me?.id ? data.message.receiverId : data.message.senderId;
          const list = m[peerId] || [];
          return { ...m, [peerId]: [...list, data.message] };
        });
        try { ws.send(JSON.stringify({ type: "receipt", messageId: data.message.id, kind: "delivered" })); } catch {}
      }
      if (data.type === "receipt") {
        setMessages((m) => {
          const copy: Record<string, any[]> = { ...m };
          for (const key of Object.keys(copy)) {
            copy[key] = copy[key].map((x) => (x.id === data.messageId ? { ...x, [`${data.kind}At`]: new Date().toISOString() } : x));
          }
          return copy;
        });
      }
      if (data.type === "user-registered") {
        setUsers((prev) => {
          const exists = prev.some((u) => u.id === data.user.id);
          if (exists || data.user.id === me?.id) return prev;
          return [data.user, ...prev];
        });
      }
    };
    return () => ws.close();
  }, [token, me?.id]);

  // Fetch chat list paginated
  const loadUsers = useCallback(async () => {
    if (!token || loadingUsers || !usersHasMore) return;
    setLoadingUsers(true);
    try {
      const { data } = await axios.get(`/users`, { params: { limit: 20, cursor: usersCursor || undefined } });
      setUsers((u) => [...u, ...(data.items || [])]);
      setUsersCursor(data.nextCursor);
      setUsersHasMore(Boolean(data.nextCursor));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) router.replace('/login');
      if (status === 404) setUsersHasMore(false);
    } finally {
      setLoadingUsers(false);
    }
  }, [token, usersCursor, usersHasMore, loadingUsers, router]);

  useEffect(() => { if (token) loadUsers(); }, [token]);

  // Infinite scroll for users list
  useEffect(() => {
    const el = chatListRef.current;
    if (!el) return;
    function onScroll() {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
        loadUsers();
      }
    }
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [loadUsers]);

  // Load paginated messages for selected user
  const loadMessagesFor = useCallback(async (peerId: string) => {
    try {
      const currentCursor = msgCursorByPeer[peerId] || undefined;
      const { data } = await axios.get(`/conversations/${peerId}/messages`, { params: { limit: 25, cursor: currentCursor } });
      const items = (data.items || []).reverse();
      setMessages((prev) => ({
        ...prev,
        [peerId]: [...(prev[peerId] || []), ...items],
      }));
      setMsgCursorByPeer((m) => ({ ...m, [peerId]: data.nextCursor }));
      setMsgHasMoreByPeer((m) => ({ ...m, [peerId]: Boolean(data.nextCursor) }));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) router.replace('/login');
      if (status === 404) setMsgHasMoreByPeer((m) => ({ ...m, [peerId]: false }));
    }
  }, [msgCursorByPeer, router]);

  useEffect(() => {
    if (!selectedUserId) return;
    if (!(messages[selectedUserId] && messages[selectedUserId].length)) {
      loadMessagesFor(selectedUserId);
    }
  }, [selectedUserId]);

  function logout() {
    setToken(null);
    setMe(null);
    setUsers([]);
    setMessages({});
    setSelectedUserId(null);
    setUsersCursor(null);
    setUsersHasMore(true);
    localStorage.removeItem("token");
    localStorage.removeItem("me");
    router.replace('/login');
  }

  function sendMessage() {
    if (!wsRef.current || !selectedUserId || !me || !messageText.trim()) return;
    // Use proper UTF-8 encoding to handle emojis and special characters
    const ciphertext = btoa(unescape(encodeURIComponent(messageText.trim())));
    try {
      wsRef.current!.send(JSON.stringify({ type: "send-message", toUserId: selectedUserId, ciphertext }));
      setMessages((m) => ({
        ...m,
        [selectedUserId]: [
          ...(m[selectedUserId] || []),
          {
            id: `local-${Date.now()}`,
            conversationId: null,
            senderId: me.id,
            receiverId: selectedUserId,
            ciphertext,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setMessageText("");
    } catch {}
  }

  // Typing indicator simulation
  useEffect(() => {
    if (messageText.length > 0) {
      setTyping(true);
      const timer = setTimeout(() => setTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [messageText]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
    '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
    '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
    '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
    '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
    '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵',
    '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦵', '🦿',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
    '🔥', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬',
    '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🎃', '🎄', '🎆', '🎇'
  ];

  const addEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const Avatar = ({ name, online = false }: { name: string; online?: boolean }) => (
    <div className="relative">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white grid place-items-center text-sm font-semibold shadow-lg">
        {name?.[0]?.toUpperCase() || "?"}
      </div>
      {online && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
      )}
    </div>
  );

  const getLastMessage = (userId: string) => {
    const msgs = messages[userId] || [];
    if (msgs.length === 0) return null;
    const last = msgs[msgs.length - 1];
    return {
      text: decodeURIComponent(escape(atob(last.ciphertext))),
      time: new Date(last.createdAt),
      isOwn: last.senderId === me?.id
    };
  };

  // If not authenticated, render nothing (we redirect)
  if (!token) return null;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-pink-400/20 to-orange-600/20 blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 surface-glass border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold gradient-text">
              Messenger
            </Link>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              wsReady 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${wsReady ? "bg-green-500" : "bg-red-500"} ${wsReady ? "animate-pulse-glow" : ""}`} />
              {wsReady ? "Connected" : "Disconnected"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden md:flex items-center gap-3">
                <Avatar name={me.displayName} online={wsReady} />
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{me.displayName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{me.phone}</div>
                </div>
              </div>
            )}
            <ThemeToggle />
            <button onClick={logout} className="btn-ghost text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <div className="flex-1 flex relative z-10 min-h-0">
        {/* Sidebar - Chat List */}
        <aside className={`w-full sm:w-80 surface-glass border-r border-white/10 flex flex-col ${
          selectedUserId ? 'hidden sm:flex' : 'flex'
        }`}>
          {/* Chat List Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
              <div className="flex items-center gap-2">
                <button className="btn-ghost text-xs p-2" title="Search">
                  <SearchIcon className="w-4 h-4" />
                </button>
                <button className="btn-ghost text-xs p-2" title="New Chat">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat List */}
          <div ref={chatListRef} className="flex-1 overflow-y-auto">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-4">
                  <UsersIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Start chatting by selecting a user from your contacts
                </p>
              </div>
            ) : (
              <ul className="p-2 space-y-1">
                {users.map((user) => {
                  const lastMsg = getLastMessage(user.id);
                  return (
                    <li key={user.id}>
                      <button
                        className={`w-full text-left p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 ${
                          selectedUserId === user.id 
                            ? "bg-white/70 dark:bg-gray-800/70 shadow-sm" 
                            : ""
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={user.displayName} online={wsReady} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {user.displayName}
                              </h4>
                              {lastMsg && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(lastMsg.time)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {lastMsg ? (
                                  <>
                                    {lastMsg.isOwn && <span className="mr-1">You:</span>}
                                    {lastMsg.text}
                                  </>
                                ) : (
                                  user.phone
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {usersHasMore && (
              <div className="p-3 text-center">
                <button 
                  onClick={loadUsers} 
                  disabled={loadingUsers} 
                  className="btn-ghost text-sm"
                >
                  {loadingUsers ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden sm:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="surface-glass border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="sm:hidden btn-ghost p-2"
                    aria-label="Back to chats"
                  >
                    ←
                  </button>
                  <Avatar name={selectedUser.displayName} online={wsReady} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {selectedUser.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {typing ? "typing..." : selectedUser.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Load More Messages */}
              {msgHasMoreByPeer[selectedUser.id] && (
                <div className="p-4 text-center border-b border-white/10">
                  <button
                    onClick={() => loadMessagesFor(selectedUser.id)}
                    className="btn-ghost text-sm"
                  >
                    Load older messages
                  </button>
                </div>
              )}

              {/* Messages Area */}
              <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 opacity-20">
                      <MessageIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  conversationMessages.map((message, index) => {
                    const isOwn = message.senderId === me?.id;
                    const prevMessage = conversationMessages[index - 1];
                    const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
                    const showTime = !prevMessage || 
                      (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) > 300000; // 5 minutes

                    return (
                      <div key={message.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {showAvatar && !isOwn ? (
                          <Avatar name={selectedUser.displayName} />
                        ) : (
                          <div className="w-10" />
                        )}
                        
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs sm:max-w-md`}>
                          {showTime && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mb-1 px-3">
                              {formatMessageTime(new Date(message.createdAt))}
                            </div>
                          )}
                          
                          <div className={`relative px-4 py-2 rounded-2xl shadow-sm ${
                            isOwn
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                              : "surface-glass text-gray-900 dark:text-gray-100"
                          } ${!showAvatar && isOwn ? 'rounded-br-md' : ''} ${!showAvatar && !isOwn ? 'rounded-bl-md' : ''}`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {decodeURIComponent(escape(atob(message.ciphertext)))}
                            </p>
                            
                            {/* Message status for own messages */}
                            {isOwn && (
                              <div className="flex justify-end mt-1">
                                <div className="flex items-center text-xs opacity-70">
                                  {message.deliveredAt ? (
                                    <CheckDoubleIcon className="w-3 h-3" />
                                  ) : (
                                    <CheckIcon className="w-3 h-3" />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="surface-glass border-t border-white/10 p-4">
                <div className="flex items-end gap-3 relative">
                  {/* Attachment Button */}
                  <button 
                    className="btn-ghost p-2 mb-2" 
                    title="Attach file"
                  >
                    <PaperclipIcon className="w-4 h-4" />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="w-full px-4 py-3 pr-12 bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/50 rounded-2xl text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                    />
                    
                    {/* Emoji Button */}
                    <button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost p-1" 
                      title="Add emoji"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <EmojiIcon className="w-4 h-4" />
                    </button>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute bottom-full right-0 mb-2 w-80 max-h-64 surface-glass border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-white/10">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Choose an emoji
                          </h3>
                        </div>
                        <div className="p-2 max-h-48 overflow-y-auto">
                          <div className="grid grid-cols-8 gap-1">
                            {emojis.map((emoji, index) => (
                              <button
                                key={index}
                                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                                onClick={() => {
                                  addEmoji(emoji);
                                  setShowEmojiPicker(false);
                                }}
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-2 border-t border-white/10">
                          <div className="flex flex-wrap gap-1">
                            {['❤️', '😂', '😍', '👍', '😢', '😮', '😡', '🎉'].map((emoji, index) => (
                              <button
                                key={index}
                                className="px-2 py-1 text-sm hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                                onClick={() => {
                                  addEmoji(emoji);
                                  setShowEmojiPicker(false);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Voice Message Button */}
                  <button 
                    className="btn-ghost p-2 mb-2" 
                    title="Voice message"
                  >
                    <MicIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!wsReady || !messageText.trim()}
                    className={`p-3 rounded-2xl transition-all ${
                      wsReady && messageText.trim()
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                    title="Send message"
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-6">
                  <MessageIcon className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Welcome to Messenger
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Select a conversation from the sidebar to start chatting. Your messages are secure and encrypted.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button className="btn-primary">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Chat
                  </button>
                  <button className="btn-ghost">
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Find Contacts
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Helper functions
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  
  return date.toLocaleDateString();
}

function formatMessageTime(date: Date): string {
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (yesterday.toDateString() === date.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}

// Icons
function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function CheckDoubleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="m16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function EmojiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
