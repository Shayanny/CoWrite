// Manages a single WebSocket connection to the CoWrite backend.
// Provides typed send/receive, reconnection logic, and an event-emitter pattern

const WS_BASE_URL = import.meta.env.VITE_WS_BASE || 'ws://localhost:8080';



export interface WebSocketMessage {
  type: string;       // "edit", "join", "leave", "cursor", …
  documentId: number;
  userId: number;
  username: string;
  payload?: unknown;  // type-specific data; will be typed per message kind later
}

// A callback that a component registers to hear about a particular message type.
type MessageHandler = (message: WebSocketMessage) => void;


class WebSocketService {
  private ws: WebSocket | null = null;
  private documentId: number | null = null;

  // Reconnection state
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly baseReconnectDelay = 1000; // 1 s — doubles on each retry (exponential back-off)
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Event system: maps message type -> array of handler functions
  private handlers: Map<string, MessageHandler[]> = new Map();

 
  connect(documentId: number): void {
    this.documentId = documentId;
    this.reconnectAttempts = 0; // fresh connection resets the counter
    this.openConnection();
  }

  
  disconnect(): void {
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close(1000, 'User left the document'); // 1000 = normal closure
      this.ws = null;
    }
    this.documentId = null;
  }

  
   //Send a typed message to the server (which will broadcast it to the room).
   
  send(type: string, payload?: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Tried to send but connection is not open.');
      return;
    }

    const message: WebSocketMessage = {
      type,
      documentId: this.documentId!,
      userId: 0,       // server will overwrite with the authenticated user's ID
      username: '',     // same — server stamps the real value
      payload,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Subscribe to a message type.  Returns an unsubscribe function so cleanup is easy:
   *   const unsub = wsService.on('edit', handleEdit);
   *   // later …
   *   unsub();
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);

    // Return an unsubscribe function
    return () => {
      const list = this.handlers.get(type);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx !== -1) list.splice(idx, 1);
      }
    };
  }

  //Whether the socket is currently open 
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }


  private openConnection(): void {
    if (!this.documentId) return;

    // JWT is passed as a query parameter because the browser WebSocket API
    // does not allow setting custom headers (like Authorization: Bearer …).
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[WebSocket] No auth token found — cannot connect.');
      return;
    }

    const url = `${WS_BASE_URL}/ws/${this.documentId}?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[WebSocket] Connected to document ${this.documentId}`);
      this.reconnectAttempts = 0; // successful connection resets backoff
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data as string);
        this.dispatch(message);
      } catch (err) {
        console.error('[WebSocket] Failed to parse incoming message:', err);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Connection error:', error);
      // onclose will fire next — that's where we kick off reconnection
    };

    this.ws.onclose = (event) => {
      console.log(`[WebSocket] Disconnected (code ${event.code}). Reason: ${event.reason}`);
      this.ws = null;

      // Don't reconnect if the user intentionally left (code 1000)
      if (event.code === 1000) return;

      this.scheduleReconnect();
    };
  }

  // Exponential back-off reconnection 
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnection attempts reached. Giving up.');
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})…`);

    this.reconnectTimer = setTimeout(() => {
      if (this.documentId !== null) {
        this.openConnection();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  //Fan out an incoming message to all registered handlers for its type 
  private dispatch(message: WebSocketMessage): void {
    const list = this.handlers.get(message.type);
    if (list) {
      list.forEach((handler) => handler(message));
    }
  }
}

// Export a singleton — the entire app shares one WebSocket connection at a time.
export const wsService = new WebSocketService();