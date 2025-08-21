# Audio Calling Feature Documentation

## Overview
The audio calling feature allows users to make real-time audio calls within the E2E messaging platform. It uses WebRTC for peer-to-peer audio communication and WebSocket for signaling.

## Features Implemented

### 1. Audio Call Component (`/web/components/AudioCall.tsx`)
- **Real-time audio calling** using WebRTC
- **Call states**: idle, calling, ringing, connected, ended
- **Audio controls**: mute/unmute, speaker toggle
- **Call timer** showing duration during active calls
- **Incoming call handling** with accept/reject options
- **Professional UI** with gradient avatars and smooth animations

### 2. Chat Page Integration (`/web/app/chat/page.tsx`)
- **Call button** in chat header (phone icon)
- **Incoming call notifications** with overlay modal
- **Call state management** for both outgoing and incoming calls
- **WebSocket message handling** for call signaling

### 3. Server-side Signaling (`/server/src/index.ts`)
- **Call offer/answer** message handling
- **ICE candidate** exchange for WebRTC connection
- **Call rejection/ending** signal forwarding
- **Real-time message delivery** to connected users

## How to Use

### Starting an Audio Call
1. Open a chat conversation with any user
2. Click the **phone icon** (📞) in the chat header
3. The call interface will appear with "Calling..." status
4. Wait for the recipient to answer

### Receiving an Audio Call
1. When someone calls you, an **incoming call modal** appears
2. You'll see the caller's name and avatar
3. Click the **green phone button** to accept
4. Click the **red phone button** to reject

### During a Call
- **Mute/Unmute**: Click the microphone button
- **Speaker**: Click the speaker button (mainly for mobile)
- **End Call**: Click the red phone button to hang up
- **Call Duration**: Shows in MM:SS format

## Technical Implementation

### WebRTC Configuration
- Uses Google STUN servers for NAT traversal
- Audio-only communication with echo cancellation
- Automatic connection state management

### Call Signaling Messages
- `call-offer`: Initiates a call with WebRTC offer
- `call-answer`: Responds to a call with WebRTC answer
- `call-reject`: Rejects an incoming call
- `call-end`: Ends an active call
- `ice-candidate`: Exchanges ICE candidates for connection

### Audio Features
- Echo cancellation enabled
- Noise suppression enabled
- Auto gain control enabled
- Microphone access with permission handling

## Browser Compatibility
- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support (with HTTPS required)
- **Edge**: Full support

## Security & Privacy
- **Peer-to-peer**: Audio streams directly between users
- **Encrypted**: WebRTC provides built-in encryption
- **No server storage**: Audio is not recorded or stored
- **Permission-based**: Requires microphone access permission

## Troubleshooting

### Common Issues
1. **"Could not access microphone"**
   - Grant microphone permissions in browser
   - Check if another app is using the microphone

2. **Call not connecting**
   - Ensure both users have stable internet
   - Check firewall settings
   - Try refreshing the browser

3. **No audio during call**
   - Check microphone/speaker settings
   - Ensure devices are not muted
   - Try toggling mute/unmute

### Browser Permissions
The application requires microphone access for audio calls. Users will be prompted to grant permissions when making their first call.

## Future Enhancements
- Video calling support
- Call history and logs
- Group audio calls
- Call recording (with permissions)
- Screen sharing during calls
- Better mobile support with native ringtones
