"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";
import { Send as SendIcon, Mic as MicIcon, Users as UsersIcon, X as XIcon, Square as StopIcon, Trash as TrashIcon, Play as PlayIcon, Pause as PauseIcon, MessageSquare as MessageIcon, Search as SearchIcon, Plus as PlusIcon, Check as CheckIcon, CheckCheck as CheckDoubleIcon, Paperclip as PaperclipIcon, Smile as EmojiIcon, File as FileIcon, Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, Download as DownloadIcon } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
if (typeof window !== 'undefined') {
  axios.defaults.baseURL = API_URL;
}

// File Attachment Component
function FileAttachment({ fileUrl, fileName, fileType, fileSize, mimeType, isOwn }: { 
  fileUrl: string; 
  fileName: string; 
  fileType: string; 
  fileSize?: number; 
  mimeType: string;
  isOwn: boolean;
}) {
  const getFileIcon = () => {
    if (fileType === 'image') return <ImageIcon className="w-4 h-4" />;
    if (fileType === 'video') return <VideoIcon className="w-4 h-4" />;
    if (fileType === 'audio') return <MusicIcon className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `${API_URL}${fileUrl}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (fileType === 'image') {
    return (
      <div className="max-w-xs">
        <img 
          src={`${API_URL}${fileUrl}`} 
          alt={fileName}
          className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.open(`${API_URL}${fileUrl}`, '_blank')}
        />
        <div className={`text-xs mt-1 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
          {fileName}
        </div>
      </div>
    );
  }

  if (fileType === 'video') {
    return (
      <div className="max-w-xs">
        <video 
          controls 
          className="rounded-lg max-w-full"
          src={`${API_URL}${fileUrl}`}
        >
          Your browser does not support the video tag.
        </video>
        <div className={`text-xs mt-1 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
          {fileName} • {formatFileSize(fileSize)}
        </div>
      </div>
    );
  }

  if (fileType === 'audio') {
    return (
      <div className="min-w-64">
        <audio 
          controls 
          className="w-full"
          src={`${API_URL}${fileUrl}`}
        >
          Your browser does not support the audio tag.
        </audio>
        <div className={`text-xs mt-1 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
          {fileName} • {formatFileSize(fileSize)}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleDownload}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer hover:opacity-80 transition-opacity min-w-64 ${
        isOwn 
          ? 'border-white/20 bg-white/10' 
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        isOwn ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
      }`}>
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate text-sm ${
          isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-100'
        }`}>
          {fileName}
        </div>
        <div className={`text-xs ${
          isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatFileSize(fileSize)} • Click to download
        </div>
      </div>
      <DownloadIcon className={`w-4 h-4 ${
        isOwn ? 'text-white/60' : 'text-gray-400'
      }`} />
    </div>
  );
}

// Voice Message Component
function VoiceMessage({ audioData, duration, isOwn }: { audioData: string; duration: number; isOwn: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioData);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      // Only update duration if it wasn't provided or is invalid
      if (!duration || duration <= 0 || isNaN(duration)) {
        setAudioDuration(audio.duration);
      }
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioData, duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    // Handle NaN or invalid time values
    if (!time || isNaN(time) || time < 0) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 min-w-48">
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isOwn 
            ? 'bg-white/20 hover:bg-white/30 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isPlaying ? (
          <PauseIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4 ml-0.5" />
        )}
      </button>
      
      <div className="flex-1">
        <div className={`h-1 rounded-full overflow-hidden ${
          isOwn ? 'bg-white/20' : 'bg-gray-300 dark:bg-gray-600'
        }`}>
          <div 
            className={`h-full transition-all duration-150 ${
              isOwn ? 'bg-white/60' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`text-xs mt-1 ${
          isOwn ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <MicIcon className={`w-3 h-3 ${
          isOwn ? 'text-white/60' : 'text-gray-400'
        }`} />
      </div>
    </div>
  );
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [attachedFile, setAttachedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Global audio state - only one voice message can play at a time
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentMenuRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to stop any currently playing audio
  const stopCurrentAudio = useCallback(() => {
    if (currentlyPlayingAudio && !currentlyPlayingAudio.paused) {
      currentlyPlayingAudio.pause();
      currentlyPlayingAudio.currentTime = 0;
    }
    setCurrentlyPlayingAudio(null);
    setCurrentlyPlayingId(null);
  }, [currentlyPlayingAudio]);

  // Function to set new playing audio (stops previous one)
  const setPlayingAudio = useCallback((audio: HTMLAudioElement, messageId: string) => {
    stopCurrentAudio();
    setCurrentlyPlayingAudio(audio);
    setCurrentlyPlayingId(messageId);
  }, [stopCurrentAudio]);

  // Restore session or redirect to /login
  useEffect(() => {
    const t = localStorage.getItem("token");
    const m = localStorage.getItem("me");
    if (t && m) {
      setToken(t);
      try { 
        setMe(JSON.parse(m)); 
        // Set axios header immediately when restoring session
        axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
      } catch {
        // Clear corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("me");
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  // Keep axios auth header in sync
  useEffect(() => {
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete axios.defaults.headers.common["Authorization"];
  }, [token]);

  // Add axios response interceptor for global 401 handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem("token");
          localStorage.removeItem("me");
          setToken(null);
          setMe(null);
          router.replace('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router]);

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
      if (data.type === "message" || data.type === "voice-message") {
        // Process the message to determine if it's a voice message or file
        let processedMessage = { ...data.message };
        
        if (data.message.mediaUrl) {
          // It's a file attachment
          processedMessage.messageType = 'file';
        } else if (data.message.ciphertext) {
          try {
            const decodedContent = decodeURIComponent(escape(atob(data.message.ciphertext)));
            // Check if it's a voice message (JSON with type: 'voice')
            try {
              const parsedContent = JSON.parse(decodedContent);
              if (parsedContent.type === 'voice') {
                processedMessage.messageType = 'voice';
                processedMessage.audioData = parsedContent.audioData;
                processedMessage.duration = parsedContent.duration;
              } else {
                processedMessage.messageType = 'text';
              }
            } catch (e) {
              // If JSON parse fails, it's a regular text message
              processedMessage.messageType = 'text';
            }
          } catch (e) {
            // If base64 decode fails, use content field
            processedMessage.messageType = 'text';
          }
        }
        
        setMessages((m) => {
          const peerId = processedMessage.senderId === me?.id ? processedMessage.receiverId : processedMessage.senderId;
          const list = m[peerId] || [];
          return { ...m, [peerId]: [...list, processedMessage] };
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

  // Token validation function
  const validateToken = useCallback(async () => {
    if (!token) return false;
    try {
      // Test the token by making an authenticated request
      await axios.get('/auth/verify');
      return true;
    } catch (error: any) {
      console.log('Token validation failed:', error);
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("me");
      setToken(null);
      setMe(null);
      return false;
    }
  }, [token]);

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
      if (status === 404) setUsersHasMore(false);
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [token, usersCursor, usersHasMore, loadingUsers, router]);

  useEffect(() => { 
    if (token && me) {
      validateToken().then((valid) => {
        if (valid) {
          loadUsers();
        } else {
          router.replace('/login');
        }
      });
    }
  }, [token, me, validateToken, loadUsers, router]);

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
            messageType: 'text'
          },
        ],
      }));
      setMessageText("");
    } catch {}
  }

  // File upload functions
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, fileCategory?: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type based on category
    if (fileCategory) {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      let isValidType = false;
      
      switch (fileCategory) {
        case 'image':
          isValidType = fileType.startsWith('image/') || 
                       /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(fileName);
          break;
        case 'video':
          isValidType = fileType.startsWith('video/') || 
                       /\.(mp4|avi|mkv|mov|wmv|flv|webm|m4v)$/.test(fileName);
          break;
        case 'audio':
          isValidType = fileType.startsWith('audio/') || 
                       /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/.test(fileName);
          break;
        case 'document':
          isValidType = fileType.includes('pdf') || 
                       fileType.includes('document') || 
                       fileType.includes('text') ||
                       fileType.includes('spreadsheet') ||
                       fileType.includes('presentation') ||
                       /\.(pdf|doc|docx|txt|rtf|odt|xls|xlsx|ppt|pptx|zip|rar|7z)$/.test(fileName);
          break;
        default:
          isValidType = true;
      }
      
      if (!isValidType) {
        const categoryNames = {
          image: 'images',
          video: 'videos', 
          audio: 'audio files',
          document: 'documents'
        };
        alert(`Please select a valid ${categoryNames[fileCategory as keyof typeof categoryNames]} file.`);
        event.target.value = ''; // Reset file input
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setAttachedFile({
          ...response.data.file,
          originalFile: file,
        });
        setShowAttachmentMenu(false);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    // Reset all file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const sendFileMessage = () => {
    if (!wsRef.current || !selectedUserId || !me || !attachedFile) return;

    try {
      wsRef.current.send(JSON.stringify({
        type: "send-message",
        toUserId: selectedUserId,
        ciphertext: '', // Empty ciphertext for file messages
        mediaUrl: attachedFile.url,
        mediaType: attachedFile.mimeType,
        fileName: attachedFile.originalName,
        fileSize: attachedFile.size,
      }));

      setMessages((m) => ({
        ...m,
        [selectedUserId]: [
          ...(m[selectedUserId] || []),
          {
            id: `local-${Date.now()}`,
            conversationId: null,
            senderId: me.id,
            receiverId: selectedUserId,
            ciphertext: '',
            mediaUrl: attachedFile.url,
            mediaType: attachedFile.mimeType,
            fileName: attachedFile.originalName,
            fileSize: attachedFile.size,
            createdAt: new Date().toISOString(),
            messageType: 'file'
          },
        ],
      }));

      removeAttachedFile();
    } catch (error) {
      console.error('Error sending file message:', error);
    }
  };

  // Voice message functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setAudioBlob(null);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !wsRef.current || !selectedUserId || !me) return;

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        
        // Create a voice message payload that includes both audio data and metadata
        const voiceMessageData = {
          type: 'voice',
          audioData: base64Audio,
          duration: recordingTime
        };
        
        // Encode the voice message data as ciphertext (same format as text messages)
        const ciphertext = btoa(unescape(encodeURIComponent(JSON.stringify(voiceMessageData))));

        // Send voice message through WebSocket using the same format as text messages
        wsRef.current!.send(JSON.stringify({ 
          type: "send-message", 
          toUserId: selectedUserId, 
          ciphertext
        }));

        // Add to local messages
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
              messageType: 'voice',
              audioData: base64Audio,
              duration: recordingTime
            },
          ],
        }));

        // Clean up
        setAudioBlob(null);
        setRecordingTime(0);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Typing indicator simulation
  useEffect(() => {
    if (messageText.length > 0) {
      setTyping(true);
      const timer = setTimeout(() => setTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [messageText]);

  // Close emoji picker and attachment menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    }

    if (showEmojiPicker || showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showAttachmentMenu]);

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
    
    let text = '';
    if (last.messageType === 'voice') {
      text = '🎙️ Voice message';
    } else if (last.messageType === 'file' || last.mediaUrl) {
      // Determine file type icon
      if (last.mediaType?.startsWith('image/')) {
        text = '📷 Photo';
      } else if (last.mediaType?.startsWith('video/')) {
        text = '🎥 Video';
      } else if (last.mediaType?.startsWith('audio/')) {
        text = '🎵 Audio';
      } else if (last.mediaType?.includes('pdf')) {
        text = '📄 PDF';
      } else if (last.mediaType?.includes('document')) {
        text = '📄 Document';
      } else {
        text = '📎 File';
      }
    } else if (last.ciphertext) {
      try {
        const decodedContent = decodeURIComponent(escape(atob(last.ciphertext)));
        // Check if it's a voice message encoded as JSON
        try {
          const parsedContent = JSON.parse(decodedContent);
          if (parsedContent.type === 'voice') {
            text = '🎙️ Voice message';
          } else {
            text = decodedContent;
          }
        } catch (e) {
          // If JSON parse fails, it's a regular text message
          text = decodedContent;
        }
      } catch (e) {
        text = last.content || 'Message content unavailable';
      }
    } else {
      text = last.content || 'Message content unavailable';
    }
    
    return {
      text,
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
              E2E
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
                            {(() => {
                              // Determine message type and content
                              let isVoiceMessage = false;
                              let isFileMessage = false;
                              let audioData = '';
                              let duration = 0;
                              let textContent = '';

                              // Check if it's a file message
                              if (message.messageType === 'file' || message.mediaUrl) {
                                isFileMessage = true;
                              } else if (message.messageType === 'voice') {
                                isVoiceMessage = true;
                                audioData = message.audioData;
                                duration = message.duration || 0;
                              } else if (message.ciphertext) {
                                try {
                                  const decodedContent = decodeURIComponent(escape(atob(message.ciphertext)));
                                  try {
                                    const parsedContent = JSON.parse(decodedContent);
                                    if (parsedContent.type === 'voice') {
                                      isVoiceMessage = true;
                                      audioData = parsedContent.audioData;
                                      duration = parsedContent.duration || 0;
                                    } else {
                                      textContent = decodedContent;
                                    }
                                  } catch (e) {
                                    textContent = decodedContent;
                                  }
                                } catch (e) {
                                  textContent = message.content || 'Message content unavailable';
                                }
                              } else {
                                textContent = message.content || 'Message content unavailable';
                              }

                              if (isFileMessage) {
                                const fileType = message.mediaType?.startsWith('image/') ? 'image' :
                                                message.mediaType?.startsWith('video/') ? 'video' :
                                                message.mediaType?.startsWith('audio/') ? 'audio' : 'file';
                                
                                return (
                                  <FileAttachment
                                    fileUrl={message.mediaUrl}
                                    fileName={message.fileName || 'Unknown file'}
                                    fileType={fileType}
                                    fileSize={message.fileSize}
                                    mimeType={message.mediaType || ''}
                                    isOwn={isOwn}
                                  />
                                );
                              } else if (isVoiceMessage) {
                                return (
                                  <VoiceMessage 
                                    audioData={audioData} 
                                    duration={duration} 
                                    isOwn={isOwn}
                                  />
                                );
                              } else {
                                return (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {textContent}
                                  </p>
                                );
                              }
                            })()}
                            
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
                {/* Attached file preview */}
                {attachedFile && (
                  <div className="mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/20 dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                          {attachedFile.type === 'image' ? <ImageIcon className="w-5 h-5 text-white" /> :
                           attachedFile.type === 'video' ? <VideoIcon className="w-5 h-5 text-white" /> :
                           attachedFile.type === 'audio' ? <MusicIcon className="w-5 h-5 text-white" /> :
                           <FileIcon className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {attachedFile.originalName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={removeAttachedFile}
                        className="btn-ghost p-2"
                        title="Remove attachment"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-3 relative">
                  {/* Attachment Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className="btn-ghost p-2 mb-2" 
                      title="Attach file"
                      disabled={uploading}
                    >
                      <PaperclipIcon className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
                    </button>
                    
                    {/* Attachment Menu */}
                    {showAttachmentMenu && (
                      <div 
                        ref={attachmentMenuRef}
                        className="absolute bottom-full left-0 mb-2 w-48 surface-glass border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-2">
                          <button
                            onClick={() => {
                              documentInputRef.current?.click();
                              setShowAttachmentMenu(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <FileIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Document
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                PDF, DOC, TXT, ZIP
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              imageInputRef.current?.click();
                              setShowAttachmentMenu(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Photos
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                JPG, PNG, GIF, WEBP
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              videoInputRef.current?.click();
                              setShowAttachmentMenu(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                              <VideoIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Videos
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                MP4, AVI, MOV, WEBM
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              audioInputRef.current?.click();
                              setShowAttachmentMenu(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <MusicIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Audio
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                MP3, WAV, OGG, AAC
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Hidden file inputs for each category */}
                    <input
                      ref={documentInputRef}
                      type="file"
                      onChange={(e) => handleFileSelect(e, 'document')}
                      accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip"
                      className="hidden"
                      disabled={uploading}
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      onChange={(e) => handleFileSelect(e, 'image')}
                      accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp"
                      className="hidden"
                      disabled={uploading}
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      onChange={(e) => handleFileSelect(e, 'video')}
                      accept="video/*,.mp4,.avi,.mkv,.mov,.wmv,.flv,.webm,.m4v"
                      className="hidden"
                      disabled={uploading}
                    />
                    <input
                      ref={audioInputRef}
                      type="file"
                      onChange={(e) => handleFileSelect(e, 'audio')}
                      accept="audio/*,.mp3,.wav,.ogg,.aac,.flac,.m4a,.wma"
                      className="hidden"
                      disabled={uploading}
                    />
                    
                    {/* General file input (kept for backward compatibility) */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => handleFileSelect(e)}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                  
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
                  {!isRecording && !audioBlob ? (
                    <button 
                      onClick={startRecording}
                      className="btn-ghost p-2 mb-2" 
                      title="Record voice message"
                    >
                      <MicIcon className="w-4 h-4" />
                    </button>
                  ) : null}
                  
                  {/* Recording UI */}
                  {isRecording && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          {formatRecordingTime(recordingTime)}
                        </span>
                      </div>
                      <button 
                        onClick={cancelRecording}
                        className="btn-ghost p-2"
                        title="Cancel recording"
                      >
                        <XIcon className="w-4 h-4 text-red-500" />
                      </button>
                      <button 
                        onClick={stopRecording}
                        className="btn-ghost p-2"
                        title="Stop recording"
                      >
                        <StopIcon className="w-4 h-4 text-blue-500" />
                      </button>
                    </div>
                  )}
                  
                  {/* Audio Preview */}
                  {audioBlob && !isRecording && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-2 px-3 py-2 surface-glass border border-white/20 dark:border-gray-700/50 rounded-xl">
                        <MicIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {formatRecordingTime(recordingTime)}
                        </span>
                      </div>
                      <button 
                        onClick={() => setAudioBlob(null)}
                        className="btn-ghost p-2"
                        title="Delete recording"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                      <button 
                        onClick={sendVoiceMessage}
                        className="btn-primary p-2"
                        title="Send voice message"
                      >
                        <SendIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {!isRecording && !audioBlob && (
                    <button
                      onClick={() => {
                        if (attachedFile) {
                          sendFileMessage();
                        } else {
                          sendMessage();
                        }
                      }}
                      disabled={!wsReady || (!messageText.trim() && !attachedFile)}
                      className={`p-3 rounded-2xl transition-all ${
                        wsReady && (messageText.trim() || attachedFile)
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                      title={attachedFile ? "Send file" : "Send message"}
                    >
                      <SendIcon className="w-4 h-4" />
                    </button>
                  )}
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
                  Welcome to E2E
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

function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
