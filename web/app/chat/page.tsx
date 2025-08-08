"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const wsRef = useRef<WebSocket | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

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
    const ciphertext = btoa(messageText.trim());
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

  const Avatar = ({ name }: { name: string }) => (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white grid place-items-center text-sm font-semibold shadow-sm">
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );

  // If not authenticated, render nothing (we redirect)
  if (!token) return null;

  return (
    <main className="h-[100dvh] flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/60">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight">Messenger</Link>
          <span className={`text-xs px-2 py-0.5 rounded-full ${wsReady ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            WS {wsReady ? "connected" : "offline"}
          </span>
        </div>
        {me ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">{me.displayName} ({me.phone})</div>
            <Avatar name={me.displayName} />
            <button onClick={logout} className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-gray-800">Logout</button>
          </div>
        ) : null}
      </header>

      <div className="flex-1 grid grid-cols-[300px_1fr]">
        {/* Sidebar: Chat list with infinite scroll */}
        <aside className="border-r flex flex-col bg-white/70 dark:bg-gray-900/60 backdrop-blur">
          <div className="px-4 py-3 text-xs text-gray-500 border-b">Chats</div>
          <div ref={chatListRef} className="flex-1 overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No other users yet.</div>
            ) : (
              <ul>
                {users.map((u) => (
                  <li key={u.id}>
                    <button
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 ${selectedUserId === u.id ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <Avatar name={u.displayName} />
                      <div>
                        <div className="font-medium leading-tight">{u.displayName}</div>
                        <div className="text-xs text-gray-500">{u.phone}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {usersHasMore ? (
              <div className="p-3 text-center">
                <button onClick={loadUsers} disabled={loadingUsers} className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
                  {loadingUsers ? 'Loading…' : 'Load more'}
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Conversation Pane with load older */}
        <section className="flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          {selectedUser ? (
            <>
              <div className="px-4 py-3 border-b bg-white/70 dark:bg-gray-900/60 backdrop-blur flex items-center gap-3">
                <Avatar name={selectedUser.displayName} />
                <div>
                  <div className="font-medium">{selectedUser.displayName}</div>
                  <div className="text-xs text-gray-500">{selectedUser.phone}</div>
                </div>
              </div>
              <div className="p-2 text-center text-xs">
                {msgHasMoreByPeer[selectedUser.id] ? (
                  <button
                    onClick={() => loadMessagesFor(selectedUser.id)}
                    className="px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Load older messages
                  </button>
                ) : (
                  <span className="text-gray-400">No more messages</span>
                )}
              </div>
              <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {conversationMessages.map((m) => {
                  const mine = m.senderId === me?.id;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[70%] rounded-2xl px-3 py-2 shadow-sm ${
                        mine ? "ml-auto bg-blue-600 text-white" : "mr-auto bg-white dark:bg-gray-900 border"
                      }`}
                    >
                      <div className="text-[10px] opacity-70 mb-0.5">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                      <div>{atob(m.ciphertext)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t bg-white/70 dark:bg-gray-900/60 backdrop-blur flex gap-2">
                <input
                  className="border rounded-xl px-3 py-2 flex-1"
                  placeholder="Type a message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"
                  onClick={sendMessage}
                  disabled={!wsReady || !messageText.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-gray-500">
              Select a chat to start messaging.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
