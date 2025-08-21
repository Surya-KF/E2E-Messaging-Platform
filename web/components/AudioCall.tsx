"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface AudioCallProps {
  isVisible: boolean;
  onClose: () => void;
  recipientName: string;
  recipientId: string;
  wsRef: React.MutableRefObject<WebSocket | null>;
  me: any;
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  isMuted: boolean;
  isSpeakerOn: boolean;
  duration: number;
  isInitializing?: boolean;
}

// Development mode for same-device testing
const DEV_MODE = process.env.NODE_ENV === 'development';
const MOCK_AUDIO_FOR_TESTING = DEV_MODE && typeof window !== 'undefined' && 
  window.location.search.includes('mockAudio=true');

export default function AudioCall({
  isVisible,
  onClose,
  recipientName,
  recipientId,
  wsRef,
  me,
  isIncoming = false,
  onAccept,
  onReject
}: AudioCallProps) {
  const [callState, setCallState] = useState<CallState>({
    status: isIncoming ? 'ringing' : 'idle',
    isMuted: false,
    isSpeakerOn: false,
    duration: 0,
    isInitializing: false
  });

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const audioPlayPromiseRef = useRef<Promise<void> | null>(null);

  // Safe audio play/pause functions
  const safePlayAudio = useCallback(async (audio: HTMLAudioElement) => {
    try {
      // Wait for any previous play operation to complete
      if (audioPlayPromiseRef.current) {
        await audioPlayPromiseRef.current.catch(() => {});
      }
      
      audioPlayPromiseRef.current = audio.play();
      await audioPlayPromiseRef.current;
    } catch (error) {
      // Ignore AbortError which is expected when interrupting audio
      if (error.name !== 'AbortError') {
        console.warn('Audio play error:', error);
      }
    } finally {
      audioPlayPromiseRef.current = null;
    }
  }, []);

  const safePauseAudio = useCallback(async (audio: HTMLAudioElement) => {
    try {
      // Wait for any pending play operation before pausing
      if (audioPlayPromiseRef.current) {
        await audioPlayPromiseRef.current.catch(() => {});
      }
      audio.pause();
    } catch (error) {
      console.warn('Audio pause error:', error);
    } finally {
      audioPlayPromiseRef.current = null;
    }
  }, []);

  // Initialize ringtone
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ringtoneRef.current = new Audio();
      ringtoneRef.current.loop = true;
      // You can add a ringtone audio file here
      // ringtoneRef.current.src = '/ringtone.mp3';
      
      // Handle audio play errors
      ringtoneRef.current.addEventListener('error', (e) => {
        console.warn('Ringtone audio error:', e);
      });
    }
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, []);

  // Start call timer
  const startCallTimer = useCallback(() => {
    setCallState(prev => ({ ...prev, duration: 0 }));
    callTimerRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  // Stop call timer
  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup function for call end
  const cleanupCall = useCallback(() => {
    setCallState({
      status: 'ended',
      isMuted: false,
      isSpeakerOn: false,
      duration: 0,
      isInitializing: false
    });
    setTimeout(() => onClose(), 1500);
  }, [onClose]);

  // Complete reset function
  const resetCallState = useCallback(() => {
    // Stop call timer
    stopCallTimer();

    // Clear pending ICE candidates
    pendingIceCandidatesRef.current = [];

    // Stop and clear local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.removeEventListener('ended', () => {});
      });
      localStreamRef.current = null;
    }

    // Close and clear peer connection with proper cleanup
    if (peerConnectionRef.current) {
      try {
        const pc = peerConnectionRef.current;
        const connectionId = (pc as any)._debugId || 'unknown';
        console.log(`Completely resetting peer connection: ${connectionId}`);
        
        // Clear all event listeners to prevent memory leaks
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        pc.onicegatheringstatechange = null;
        pc.onsignalingstatechange = null;
        
        // Remove all transceivers to completely clear SDP state
        const transceivers = pc.getTransceivers();
        transceivers.forEach((transceiver, index) => {
          console.log(`Stopping transceiver ${index}:`, transceiver.direction);
          if (transceiver.sender && transceiver.sender.track) {
            transceiver.sender.track.stop();
          }
          try {
            transceiver.stop();
          } catch (transceiverError) {
            console.warn(`Error stopping transceiver ${index}:`, transceiverError);
          }
        });
        
        // Remove all senders as fallback
        const senders = pc.getSenders();
        senders.forEach((sender, index) => {
          if (sender.track) {
            console.log(`Removing sender ${index}:`, sender.track.kind);
            try {
              pc.removeTrack(sender);
            } catch (senderError) {
              console.warn(`Error removing sender ${index}:`, senderError);
            }
          }
        });
        
        // Close the connection
        pc.close();
      } catch (error) {
        console.warn('Error closing peer connection during reset:', error);
      }
      peerConnectionRef.current = null;
    }

    // Stop ringtone
    if (ringtoneRef.current) {
      safePauseAudio(ringtoneRef.current);
    }

    // Reset audio promise ref
    audioPlayPromiseRef.current = null;
  }, [stopCallTimer, safePauseAudio]);

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    // Prevent multiple initializations
    if (callState.isInitializing) {
      console.log('WebRTC initialization already in progress');
      return;
    }

    try {
      setCallState(prev => ({ ...prev, isInitializing: true }));

      // Complete reset before initializing
      resetCallState();
      
      // Wait a moment for any previous peer connection to fully close
      await new Promise(resolve => setTimeout(resolve, 200));

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      // Create new peer connection
      const peerConnection = new RTCPeerConnection(configuration);
      
      // Check if component is still mounted before proceeding
      if (!isVisible) {
        console.log('Component unmounted during initialization, aborting');
        peerConnection.close();
        return;
      }
      
      // Add a unique identifier for debugging
      const connectionId = Date.now().toString(36);
      // @ts-ignore - Adding custom property for debugging
      peerConnection._debugId = connectionId;
      console.log(`Created new peer connection: ${connectionId}`);
      
      // Check if peer connection is already closed
      if ((peerConnection.connectionState as string) === 'closed') {
        console.error('Peer connection was closed immediately after creation');
        throw new Error('Peer connection creation failed');
      }
      
      peerConnectionRef.current = peerConnection;

      // Get user media (audio only)
      let stream: MediaStream;
      
      if (MOCK_AUDIO_FOR_TESTING) {
        // Create a mock audio stream for same-device testing
        console.log('Using mock audio stream for testing');
        try {
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          const destination = audioContext.createMediaStreamDestination();
          
          // Create a very quiet tone to simulate audio
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.01, audioContext.currentTime); // Very low volume
          
          oscillator.connect(gainNode);
          gainNode.connect(destination);
          oscillator.start();
          
          stream = destination.stream;
          
          // Note: MediaStreamTrack.label is read-only, so we can't set it
          console.log('Mock audio stream created with', stream.getAudioTracks().length, 'tracks');
        } catch (mockError) {
          console.warn('Mock audio failed, falling back to getUserMedia:', mockError);
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }
      
      // Check again if component is still mounted and connection is valid
      if (!isVisible || !peerConnectionRef.current || (peerConnection.connectionState as string) === 'closed') {
        console.log('Component unmounted or connection closed during media acquisition, cleaning up');
        stream.getTracks().forEach(track => track.stop());
        if ((peerConnection.connectionState as string) !== 'closed') {
          peerConnection.close();
        }
        return;
      }      localStreamRef.current = stream;

      // Add local stream to peer connection with consistent track ordering
      const audioTracks = stream.getAudioTracks();
      console.log(`Adding ${audioTracks.length} audio tracks to peer connection ${connectionId}`);
      
      // Add tracks in a specific order to ensure consistency
      for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        console.log(`Adding audio track ${i}:`, track.label || 'Unnamed');
        
        // Double-check peer connection state before adding each track
        if ((peerConnection.connectionState as string) === 'closed') {
          console.error(`Cannot add track ${i}: peer connection is closed`);
          throw new Error(`Peer connection closed during track addition`);
        }
        
        try {
          peerConnection.addTrack(track, stream);
        } catch (trackError) {
          console.error(`Error adding audio track ${i}:`, trackError);
          throw trackError;
        }
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log(`Received remote track for connection ${connectionId}`);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          try {
            wsRef.current.send(JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate,
              toUserId: recipientId
            }));
          } catch (sendError) {
            console.error('Error sending ICE candidate:', sendError);
          }
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        const signalingState = peerConnection.signalingState;
        // @ts-ignore
        const debugId = peerConnection._debugId || 'unknown';
        console.log(`Peer connection ${debugId} state: ${state}, signaling: ${signalingState}`);
        
        if (state === 'connected') {
          setCallState(prev => ({ ...prev, status: 'connected', isInitializing: false }));
          startCallTimer();
          if (ringtoneRef.current) {
            safePauseAudio(ringtoneRef.current);
          }
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          console.log(`Peer connection ${debugId} ended, cleaning up`);
          cleanupCall();
        }
      };

      setCallState(prev => ({ ...prev, isInitializing: false }));
      console.log(`WebRTC initialization complete for connection ${connectionId}`);

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      
      // Clean up on error
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      setCallState(prev => ({ ...prev, isInitializing: false }));
      alert('Could not initialize audio call. Please check microphone permissions and try again.');
      onClose();
    }
  }, [recipientId, wsRef, startCallTimer, onClose, safePauseAudio, cleanupCall, callState.isInitializing, resetCallState, isVisible]);

  // Start outgoing call
  const startCall = useCallback(async () => {
    if (!wsRef.current || !me) return;

    // Prevent multiple call attempts
    if (callState.status === 'calling' || callState.isInitializing) {
      console.log('Call already in progress');
      return;
    }

    setCallState(prev => ({ ...prev, status: 'calling' }));
    
    try {
      // Force complete cleanup and fresh initialization
      console.log('Starting fresh call, forcing cleanup...');
      resetCallState();
      
      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Initialize completely fresh WebRTC connection
      await initializeWebRTC();

      if (!peerConnectionRef.current) {
        throw new Error('Peer connection not initialized');
      }

      // Verify peer connection is in fresh state
      const pc = peerConnectionRef.current;
      const connectionId = (pc as any)._debugId || 'unknown';
      console.log(`Creating offer with fresh peer connection: ${connectionId}, state: ${pc.signalingState}`);
      
      if (pc.signalingState !== 'stable') {
        throw new Error(`Peer connection not in stable state: ${pc.signalingState}`);
      }

      // Check for any existing transceivers (there should be none in a fresh connection)
      const existingTransceivers = pc.getTransceivers();
      if (existingTransceivers.length === 0) {
        console.warn('No transceivers found, this might indicate an issue with track addition');
      } else {
        console.log(`Found ${existingTransceivers.length} transceivers, ensuring they're properly configured`);
      }

      // Create offer with fresh SDP
      const offer = await pc.createOffer({
        offerToReceiveAudio: true
      });
      
      console.log('Setting local description...');
      await pc.setLocalDescription(offer);
      console.log('Local description set successfully');

      // Send call offer through WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'call-offer',
        offer,
        toUserId: recipientId,
        callerName: me.displayName
      }));

      // Play outgoing call sound
      if (ringtoneRef.current) {
        safePlayAudio(ringtoneRef.current);
      }

    } catch (error) {
      console.error('Error starting call:', error);
      // Handle error without calling endCall here to avoid dependency issue
      setCallState({ status: 'ended', isMuted: false, isSpeakerOn: false, duration: 0 });
      setTimeout(() => onClose(), 1500);
    }
  }, [wsRef, me, recipientId, initializeWebRTC, safePlayAudio, onClose, callState.status, callState.isInitializing]);

  // Accept incoming call
  const acceptCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!wsRef.current) return;

    // Prevent multiple accept attempts
    if (callState.isInitializing) {
      console.log('Call accept already in progress');
      return;
    }

    setCallState(prev => ({ ...prev, status: 'connected' }));
    
    try {
      // Force complete cleanup and fresh initialization
      console.log('Accepting call with fresh connection, forcing cleanup...');
      resetCallState();
      
      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Initialize completely fresh WebRTC connection
      await initializeWebRTC();

      if (!peerConnectionRef.current) {
        throw new Error('Peer connection not initialized');
      }

      // Verify peer connection is in fresh state
      const pc = peerConnectionRef.current;
      const connectionId = (pc as any)._debugId || 'unknown';
      console.log(`Accepting call with fresh peer connection: ${connectionId}, state: ${pc.signalingState}`);

      if (pc.signalingState !== 'stable') {
        throw new Error(`Peer connection not in stable state: ${pc.signalingState}`);
      }

      console.log('Setting remote description from offer...');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Remote description set successfully');
      
      // Add any pending ICE candidates
      const pendingCandidates = pendingIceCandidatesRef.current;
      for (const candidate of pendingCandidates) {
        try {
          if (pc && (pc.signalingState as string) !== 'closed') {
            await pc.addIceCandidate(candidate);
          }
        } catch (error) {
          console.error('Error adding pending ICE candidate:', error);
        }
      }
      pendingIceCandidatesRef.current = [];

      const answer = await peerConnectionRef.current.createAnswer({
        offerToReceiveAudio: true
      });
      
      await peerConnectionRef.current.setLocalDescription(answer);

      // Send answer through WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'call-answer',
        answer,
        toUserId: recipientId
      }));

      if (onAccept) onAccept();

    } catch (error) {
      console.error('Error accepting call:', error);
      // Handle error without calling endCall to avoid dependency issue
      setCallState({ status: 'ended', isMuted: false, isSpeakerOn: false, duration: 0 });
      setTimeout(() => onClose(), 1500);
    }
  }, [wsRef, recipientId, initializeWebRTC, onAccept, onClose, callState.isInitializing]);

  // Reject call
  const rejectCall = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'call-reject',
        toUserId: recipientId
      }));
    }
    if (onReject) onReject();
    endCall();
  }, [wsRef, recipientId, onReject]);

  // End call
  const endCall = useCallback(() => {
    // Stop ringtone safely
    if (ringtoneRef.current) {
      safePauseAudio(ringtoneRef.current);
    }

    // Stop call timer
    stopCallTimer();

    // Clear pending ICE candidates
    pendingIceCandidatesRef.current = [];

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Send end call signal
    if (wsRef.current && callState.status !== 'idle') {
      wsRef.current.send(JSON.stringify({
        type: 'call-end',
        toUserId: recipientId
      }));
    }

    setCallState({
      status: 'ended',
      isMuted: false,
      isSpeakerOn: false,
      duration: 0
    });

    setTimeout(() => {
      onClose();
    }, 1500);
  }, [wsRef, recipientId, callState.status, stopCallTimer, onClose, safePauseAudio]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = callState.isMuted;
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  }, [callState.isMuted]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
    // Note: Speaker toggle is mainly for mobile devices
    // For web, this is more of a UI indicator
  }, []);

  // Handle WebSocket messages for call signaling
  useEffect(() => {
    if (!wsRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'call-offer':
          if (data.fromUserId === recipientId) {
            acceptCall(data.offer);
          }
          break;
        case 'call-answer':
          if (data.fromUserId === recipientId && peerConnectionRef.current) {
            peerConnectionRef.current.setRemoteDescription(data.answer).then(() => {
              // Add any pending ICE candidates after setting remote description
              const pendingCandidates = pendingIceCandidatesRef.current;
              for (const candidate of pendingCandidates) {
                if (peerConnectionRef.current) {
                  peerConnectionRef.current.addIceCandidate(candidate).catch(error => {
                    console.error('Error adding pending ICE candidate:', error);
                  });
                }
              }
              pendingIceCandidatesRef.current = [];
            }).catch(error => {
              console.error('Error setting remote description:', error);
            });
          }
          break;
        case 'ice-candidate':
          if (data.fromUserId === recipientId && peerConnectionRef.current) {
            // Check if remote description is set before adding ICE candidate
            if (peerConnectionRef.current.remoteDescription) {
              peerConnectionRef.current.addIceCandidate(data.candidate).catch(error => {
                console.error('Error adding ICE candidate:', error);
              });
            } else {
              // Queue the candidate for later when remote description is set
              pendingIceCandidatesRef.current.push(data.candidate);
            }
          }
          break;
        case 'call-reject':
        case 'call-end':
          if (data.fromUserId === recipientId) {
            endCall();
          }
          break;
      }
    };

    wsRef.current.addEventListener('message', handleMessage);

    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener('message', handleMessage);
      }
    };
  }, [wsRef, recipientId, acceptCall, endCall]);

  // Auto-start call if not incoming
  useEffect(() => {
    if (isVisible && !isIncoming && callState.status === 'idle') {
      startCall();
    }
    
    // Play incoming call ringtone
    if (isVisible && isIncoming && callState.status === 'ringing' && ringtoneRef.current) {
      safePlayAudio(ringtoneRef.current);
    }
  }, [isVisible, isIncoming, callState.status, startCall, safePlayAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
        {/* Call Status */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {recipientName[0]?.toUpperCase()}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {recipientName}
          </h2>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {callState.status === 'calling' && 'Calling...'}
            {callState.status === 'ringing' && 'Incoming call'}
            {callState.status === 'connected' && formatDuration(callState.duration)}
            {callState.status === 'ended' && 'Call ended'}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center items-center gap-4 mb-6">
          {/* Mute Button */}
          {(callState.status === 'connected') && (
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                callState.isMuted 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={callState.isMuted ? 'Unmute' : 'Mute'}
            >
              {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Speaker Button */}
          {(callState.status === 'connected') && (
            <button
              onClick={toggleSpeaker}
              className={`p-4 rounded-full transition-all ${
                callState.isSpeakerOn 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={callState.isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
            >
              {callState.isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {isIncoming && callState.status === 'ringing' ? (
            <>
              {/* Accept Call */}
              <button
                onClick={() => onAccept && onAccept()}
                className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all shadow-lg"
                title="Accept call"
              >
                <Phone className="w-6 h-6" />
              </button>
              
              {/* Reject Call */}
              <button
                onClick={rejectCall}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                title="Reject call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          ) : (
            /* End Call */
            <button
              onClick={endCall}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
              title="End call"
              disabled={callState.status === 'ended'}
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Status Indicator */}
        {callState.status === 'calling' && (
          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio elements */}
      <audio ref={localAudioRef} muted />
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
