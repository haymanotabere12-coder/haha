/**
 * Client-Side Real-Time WebRTC & WebSocket Classroom Service
 * Handles:
 * 1. Low-latency WebRTC live audio & video streaming from teacher to students
 * 2. Real-time stage mode, slides, and whiteboard drawing synchronization
 * 3. Multi-user presence & interactive live chat
 * 4. Automatic reconnection and fallback
 */

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 10,
};

export interface LiveRoomParticipant {
  id: string;
  name: string;
  role: string;
}

export interface LiveRoomInfo {
  roomId: string;
  broadcasterId: string | null;
  teacherName: string | null;
  stageMode: string;
  currentSlideIndex: number;
  isBroadcasting: boolean;
  users: Record<string, LiveRoomParticipant>;
  userCount: number;
  messages: any[];
}

export type LiveStreamEventCallback = {
  onRoomInit?: (room: LiveRoomInfo) => void;
  onUserJoined?: (user: LiveRoomParticipant, userCount: number) => void;
  onUserLeft?: (userId: string, userCount: number) => void;
  onBroadcastStarted?: (info: { teacherId: string; teacherName: string; stageMode: string }) => void;
  onBroadcastStopped?: () => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onVideoFrame?: (frameBase64: string) => void;
  onAudioChunk?: (chunkBase64: string) => void;
  onStageUpdated?: (info: { stageMode: string; currentSlideIndex: number }) => void;
  onWhiteboardStroke?: (data: { stroke: any; target?: string }) => void;
  onChatMessage?: (message: any) => void;
};

export class LiveClassroomClient {
  private ws: WebSocket | null = null;
  private roomId: string;
  private user: { id: string; name: string; role: string };
  private callbacks: LiveStreamEventCallback;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private isBroadcaster: boolean = false;
  private reconnectTimer: any = null;
  private isClosed: boolean = false;
  private audioRecorder: MediaRecorder | null = null;

  constructor(
    roomId: string,
    user: { id: string; name: string; role: string },
    callbacks: LiveStreamEventCallback
  ) {
    this.roomId = roomId;
    this.user = user;
    this.callbacks = callbacks;
    this.isBroadcaster = user.role === 'teacher' || user.role === 'admin';
    this.connect();
  }

  private connect() {
    if (this.isClosed) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send join payload
        this.send({
          type: 'join-room',
          roomId: this.roomId,
          user: this.user,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.warn('WS Message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.cleanupPeers();
        if (!this.isClosed) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
      };

      this.ws.onerror = () => {
        // Gracefully handled by reconnection loop
      };
    } catch (e) {
      console.warn('Could not initialize WebSocket:', e);
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private async handleMessage(data: any) {
    switch (data.type) {
      case 'room-init':
        this.callbacks.onRoomInit?.(data.room);
        break;

      case 'user-joined':
        this.callbacks.onUserJoined?.(data.user, data.userCount);
        break;

      case 'user-left':
        this.callbacks.onUserLeft?.(data.userId, data.userCount);
        if (this.peerConnections.has(data.userId)) {
          this.peerConnections.get(data.userId)?.close();
          this.peerConnections.delete(data.userId);
        }
        break;

      case 'broadcast:started':
        this.callbacks.onBroadcastStarted?.(data);
        break;

      case 'broadcast:stopped':
        this.callbacks.onBroadcastStopped?.();
        this.cleanupPeers();
        break;

      case 'viewer-connected': {
        // Broadcaster receives this when a new viewer joins while broadcasting
        if (this.localStream) {
          this.isBroadcaster = true;
          this.createOfferForViewer(data.viewerId);
        }
        break;
      }

      case 'signal:offer': {
        // Viewer receives offer from broadcaster
        if (!this.isBroadcaster && data.fromId !== this.user.id) {
          this.handleReceiveOffer(data.fromId, data.sdp);
        }
        break;
      }

      case 'signal:answer': {
        // Teacher receives answer from viewer
        const pc = this.peerConnections.get(data.fromId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          } catch (e) {
            console.warn('Error setting remote description from viewer:', e);
          }
        }
        break;
      }

      case 'signal:candidate': {
        const pc = this.peerConnections.get(data.fromId);
        if (pc && data.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn('Error adding ICE candidate:', e);
          }
        }
        break;
      }

      case 'stage:updated':
        this.callbacks.onStageUpdated?.(data);
        break;

      case 'video:frame':
        this.callbacks.onVideoFrame?.(data.frame);
        break;

      case 'audio:chunk':
        this.callbacks.onAudioChunk?.(data.chunk);
        break;

      case 'whiteboard:stroke':
        this.callbacks.onWhiteboardStroke?.(data);
        break;

      case 'chat:message':
        this.callbacks.onChatMessage?.(data.message);
        break;
    }
  }

  // Set local stream (camera + composite canvas + mic) and broadcast
  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    if (stream) {
      if (this.isBroadcaster) {
        this.startAudioBroadcasting();
      }
      // Re-send stream to all connected viewers
      for (const [viewerId, pc] of this.peerConnections.entries()) {
        const senders = pc.getSenders();
        let needsRenegotiate = false;
        stream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch((err) => {
              console.warn('replaceTrack warning:', err);
            });
          } else {
            pc.addTrack(track, stream);
            needsRenegotiate = true;
          }
        });
        if (needsRenegotiate && pc.signalingState === 'stable') {
          this.createOfferForViewer(viewerId);
        }
      }
    }
  }

  // Update participant role dynamically (e.g. switching between Student and Teacher)
  public changeRole(newRole: string) {
    this.user.role = newRole;
    if (newRole === 'teacher' || newRole === 'admin') {
      this.isBroadcaster = true;
    }
  }

  // Announce broadcast start
  public startBroadcast(stageMode: string, subject?: string, topic?: string) {
    this.isBroadcaster = true;
    this.send({
      type: 'broadcast:start',
      stageMode,
      subject,
      topic,
    });
    this.startAudioBroadcasting();
  }

  // Announce broadcast stop
  public stopBroadcast() {
    this.isBroadcaster = false;
    this.stopAudioBroadcasting();
    this.stopFrameBroadcasting();
    this.send({
      type: 'broadcast:stop',
    });
    this.cleanupPeers();
  }

  // Fallback Audio Streamer over WebSocket (guarantees student hears teacher even if WebRTC P2P is blocked by NAT)
  public startAudioBroadcasting() {
    this.stopAudioBroadcasting();
    if (!this.localStream) return;
    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const audioStream = new MediaStream(audioTracks);
      const mimeType = (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      if (typeof MediaRecorder !== 'undefined') {
        const recorder = new MediaRecorder(audioStream, { mimeType });
        recorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const base64 = res.includes(',') ? res.split(',')[1] : res;
              if (base64) {
                this.send({ type: 'audio:chunk', chunk: base64 });
              }
            };
            reader.readAsDataURL(e.data);
          }
        };
        recorder.start(1000); // 1s slice
        this.audioRecorder = recorder;
      }
    } catch (err) {
      console.warn('Audio fallback streaming note:', err);
    }
  }

  public stopAudioBroadcasting() {
    if (this.audioRecorder) {
      try {
        if (this.audioRecorder.state !== 'inactive') {
          this.audioRecorder.stop();
        }
      } catch {}
      this.audioRecorder = null;
    }
  }

  // Lightweight frame broadcaster fallback (keeps students seeing live camera even if WebRTC P2P is blocked by NAT)
  private frameCanvas: HTMLCanvasElement | null = null;
  private frameInterval: any = null;

  public startFrameBroadcasting(getVideoElement: () => HTMLVideoElement | null) {
    this.stopFrameBroadcasting();
    this.frameInterval = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const video = getVideoElement();
      if (!video || video.readyState < 2 || video.paused || video.ended) return;
      try {
        if (!this.frameCanvas) {
          this.frameCanvas = document.createElement('canvas');
        }
        const targetW = 480;
        const targetH = 270;
        this.frameCanvas.width = targetW;
        this.frameCanvas.height = targetH;
        const ctx = this.frameCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, targetW, targetH);
          const dataUrl = this.frameCanvas.toDataURL('image/jpeg', 0.55);
          this.send({
            type: 'video:frame',
            frame: dataUrl,
          });
        }
      } catch (e) {}
    }, 125); // ~8 fps lightweight snapshot stream
  }

  public stopFrameBroadcasting() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
  }

  // TEACHER: Create WebRTC Offer for a specific student viewer
  private async createOfferForViewer(viewerId: string) {
    if (!this.localStream) return;
    try {
      let pc = this.peerConnections.get(viewerId);
      if (!pc || pc.connectionState === 'closed') {
        pc = new RTCPeerConnection(RTC_CONFIG);
        this.peerConnections.set(viewerId, pc);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            this.send({
              type: 'signal:candidate',
              targetId: viewerId,
              candidate: event.candidate,
            });
          }
        };
      }

      // Ensure every track from localStream (both video AND audio) is actively added to senders
      const currentSenders = pc.getSenders();
      this.localStream.getTracks().forEach((track) => {
        const sender = currentSenders.find((s) => s.track?.id === track.id || s.track?.kind === track.kind);
        if (!sender) {
          try {
            pc!.addTrack(track, this.localStream!);
          } catch (e) {
            console.warn('addTrack note:', e);
          }
        } else if (sender.track?.id !== track.id) {
          sender.replaceTrack(track).catch((err) => {
            console.warn('replaceTrack note:', err);
          });
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.send({
        type: 'signal:offer',
        targetId: viewerId,
        sdp: offer,
      });
    } catch (err) {
      console.warn('Failed to create WebRTC offer for viewer:', err);
    }
  }

  // STUDENT: Handle offer received from teacher
  private async handleReceiveOffer(teacherId: string, sdp: RTCSessionDescriptionInit) {
    try {
      let pc = this.peerConnections.get(teacherId);
      if (!pc || pc.connectionState === 'closed') {
        pc = new RTCPeerConnection(RTC_CONFIG);
        this.peerConnections.set(teacherId, pc);

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            this.callbacks.onRemoteStream?.(event.streams[0]);
          } else if (event.track) {
            const singleStream = new MediaStream([event.track]);
            this.callbacks.onRemoteStream?.(singleStream);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            this.send({
              type: 'signal:candidate',
              targetId: teacherId,
              candidate: event.candidate,
            });
          }
        };
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.send({
        type: 'signal:answer',
        targetId: teacherId,
        sdp: answer,
      });
    } catch (err) {
      console.warn('Failed to handle WebRTC offer from teacher:', err);
    }
  }

  // Sync stage mode and slide index
  public updateStage(stageMode: string, currentSlideIndex: number) {
    this.send({
      type: 'stage:update',
      stageMode,
      currentSlideIndex,
    });
  }

  // Sync real-time drawing
  public sendWhiteboardStroke(stroke: any, target: 'slide' | 'whiteboard' = 'whiteboard') {
    this.send({
      type: 'whiteboard:stroke',
      stroke,
      target,
    });
  }

  // Send chat message
  public sendChatMessage(text: string) {
    this.send({
      type: 'chat:message',
      text,
    });
  }

  private cleanupPeers() {
    for (const pc of this.peerConnections.values()) {
      try {
        pc.close();
      } catch {}
    }
    this.peerConnections.clear();
  }

  public destroy() {
    this.isClosed = true;
    clearTimeout(this.reconnectTimer);
    this.stopFrameBroadcasting();
    this.cleanupPeers();
    if (this.ws) {
      const socket = this.ws;
      this.ws = null;
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => {
            try { socket.close(); } catch {}
          };
        }
      } catch {}
    }
  }
}

// Server Recordings API Client: Upload, fetch, and delete recordings across all devices
export async function uploadRecordedVideoToServer(payload: {
  id: string;
  title: string;
  subject: string;
  instructor: string;
  duration: string;
  level: string;
  blob: Blob;
  chapter?: string;
  keyTakeaways?: string[];
}): Promise<string | null> {
  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(payload.blob);
    const videoBase64 = await base64Promise;

    const res = await fetch('/api/recordings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payload.id,
        title: payload.title,
        subject: payload.subject,
        instructor: payload.instructor,
        duration: payload.duration,
        level: payload.level,
        chapter: payload.chapter,
        keyTakeaways: payload.keyTakeaways,
        videoBase64,
        timestamp: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.streamUrl || `/api/recordings/stream/${payload.id}`;
    }
  } catch (err) {
    console.warn('Could not upload recording to server:', err);
  }
  return null;
}

export async function fetchServerRecordings(): Promise<any[]> {
  try {
    const res = await fetch('/api/recordings');
    if (res.ok) {
      const data = await res.json();
      return data.recordings || [];
    }
  } catch (e) {
    console.warn('Could not fetch server recordings:', e);
  }
  return [];
}

export async function deleteServerRecording(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/recordings/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export interface ActiveBroadcastInfo {
  roomId: string;
  teacherId?: string;
  teacherName: string;
  subject?: string;
  topic?: string;
  stageMode?: string;
  userCount?: number;
}

export async function checkLiveBroadcastStatus(): Promise<ActiveBroadcastInfo[]> {
  try {
    const res = await fetch('/api/live/status');
    if (res.ok) {
      const data = await res.json();
      return data.broadcasts || [];
    }
  } catch (e) {
    console.warn('Could not check live broadcast status:', e);
  }
  return [];
}

/**
 * Global Real-Time Listener for Students:
 * Connects to WebSocket to instantly notify when a teacher goes live anywhere in the app!
 */
export function listenGlobalLiveBroadcasts(
  onBroadcastStarted: (info: ActiveBroadcastInfo) => void,
  onBroadcastStopped: (info?: { roomId?: string }) => void
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/live`;
  let ws: WebSocket | null = null;
  let isClosed = false;
  let retryTimer: any = null;

  function connect() {
    if (isClosed) return;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            type: 'join-room',
            roomId: '__global_presence__',
            user: { id: `global-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: 'App Viewer', role: 'student' },
          })
        );
        // Inquire if a teacher is currently live right now on entry!
        ws?.send(JSON.stringify({ type: 'check-status' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'global:broadcast-started') {
            onBroadcastStarted({
              roomId: data.roomId,
              teacherId: data.teacherId,
              teacherName: data.teacherName,
              subject: data.subject,
              topic: data.topic,
              stageMode: data.stageMode,
            });
          } else if (data.type === 'global:broadcast-stopped') {
            onBroadcastStopped({ roomId: data.roomId });
          } else if (data.type === 'global:live-status') {
            if (data.broadcasts && data.broadcasts.length > 0) {
              onBroadcastStarted(data.broadcasts[0]);
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!isClosed) {
          retryTimer = setTimeout(connect, 4000);
        }
      };

      ws.onerror = () => {};
    } catch {}
  }

  connect();

  return () => {
    isClosed = true;
    clearTimeout(retryTimer);
    if (ws) {
      const socket = ws;
      ws = null;
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => {
            try { socket.close(); } catch {}
          };
        }
      } catch {}
    }
  };
}
