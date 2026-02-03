package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"

	"minidocs/api/utils"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// upgrader upgrades an HTTP connection to a WebSocket connection.
// CheckOrigin allows connections from the React dev server.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:5173"
	},
}

// Client represents a single WebSocket connection (one user in one document).
type Client struct {
	conn       *websocket.Conn
	send       chan []byte // buffered channel of outgoing messages
	documentID int
	userID     int
	username   string
}

// Room represents all clients currently editing the same document.
type Room struct {
	clients map[*Client]bool
	mu      sync.RWMutex // protects the clients map
}

// Message is the generic envelope for everything we send/receive over the WebSocket.
// The "type" field lets us distinguish between edit operations, cursor moves, join/leave events, etc.
type Message struct {
	Type       string          `json:"type"`              // e.g. "edit", "join", "leave", "cursor"
	DocumentID int             `json:"documentId"`
	UserID     int             `json:"userId"`
	Username   string          `json:"username"`
	Payload    json.RawMessage `json:"payload,omitempty"` // type-specific data (kept raw so we can forward it without re-parsing)
}

// roomManager holds all active rooms and guards the map with a mutex.
// It is a singleton 
var roomManager = struct {
	rooms map[int]*Room // keyed by document ID
	mu    sync.RWMutex
}{
	rooms: make(map[int]*Room),
}

// getOrCreateRoom returns the Room for a document, creating it if it doesn't exist yet.
func getOrCreateRoom(documentID int) *Room {
	roomManager.mu.Lock()
	defer roomManager.mu.Unlock()

	room, exists := roomManager.rooms[documentID]
	if !exists {
		room = &Room{
			clients: make(map[*Client]bool),
		}
		roomManager.rooms[documentID] = room
	}
	return room
}

// removeClientFromRoom removes the client and, if the room is now empty, deletes the room entirely.
func removeClientFromRoom(client *Client) {
	roomManager.mu.Lock()
	room, exists := roomManager.rooms[client.documentID]
	roomManager.mu.Unlock()

	if !exists {
		return
	}

	room.mu.Lock()
	delete(room.clients, client)
	empty := len(room.clients) == 0
	room.mu.Unlock()

	if empty {
		roomManager.mu.Lock()
		delete(roomManager.rooms, client.documentID)
		roomManager.mu.Unlock()
	}
}

// broadcast sends a raw message to every client in the room EXCEPT the sender.
func broadcast(room *Room, sender *Client, message []byte) {
	room.mu.RLock()
	defer room.mu.RUnlock()

	for client := range room.clients {
		if client == sender {
			continue // don't echo back to the sender
		}
		select {
		case client.send <- message:
			// message queued
		default:
			// client's send buffer is full — they're too slow; close them out
			close(client.send)
			delete(room.clients, client)
		}
	}
}

// URL pattern: /ws/{documentId}?token=<jwt>
// We pass the JWT as a query parameter because the browser WebSocket API does not support custom headers.
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Parse & validate the document ID from the URL
	vars := mux.Vars(r)
	docIDStr := vars["documentId"]
	documentID, err := strconv.Atoi(docIDStr)
	if err != nil {
		http.Error(w, "Invalid document ID", http.StatusBadRequest)
		return
	}

	// 2. Authenticate via the token query parameter
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing authentication token", http.StatusUnauthorized)
		return
	}

	claims, err := utils.ValidateToken(token)
	if err != nil {
		http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
		return
	}

	//  3. Upgrade HTTP to WebSocket 
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return // upgrader already wrote the HTTP error
	}

	// 4. Create the Client and register it in the room 
	client := &Client{
		conn:       conn,
		send:       make(chan []byte, 64), // 64-message buffer before we consider the client stalled
		documentID: documentID,
		userID:     claims.UserID,
		username:   claims.Username,
	}

	room := getOrCreateRoom(documentID)
	room.mu.Lock()
	room.clients[client] = true
	room.mu.Unlock()

	// 5. Notify everyone in the room that this user joined
	joinMsg, _ := json.Marshal(Message{
		Type:       "join",
		DocumentID: documentID,
		UserID:     claims.UserID,
		Username:   claims.Username,
	})
	// Broadcast join to others
	broadcast(room, client, joinMsg)
	// Also send the join message back to the new client so they know their own connection is live
	client.send <- joinMsg

	log.Printf("User %s (ID %d) joined document %d", claims.Username, claims.UserID, documentID)

	//  6. Start the write pump (goroutine) and read pump (current goroutine) 
	go writePump(client)
	readPump(client, room)
}

// readPump reads messages from the WebSocket and broadcasts them to the room.
// It runs on the goroutine that called WebSocketHandler and blocks until the connection closes.
func readPump(client *Client, room *Room) {
	defer func() {
		// Cleanup: notify others that this user left, then close the connection
		leaveMsg, _ := json.Marshal(Message{
			Type:       "leave",
			DocumentID: client.documentID,
			UserID:     client.userID,
			Username:   client.username,
		})
		broadcast(room, client, leaveMsg)

		removeClientFromRoom(client)
		client.conn.Close()
		log.Printf("User %s (ID %d) left document %d", client.username, client.userID, client.documentID)
	}()

	// Set a max message size (1 MB) — protects against huge payloads
	client.conn.SetReadLimit(1024 * 1024)

	for {
		_, rawMessage, err := client.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("WebSocket read error for user %d: %v", client.userID, err)
			}
			break // exit the loop → triggers the deferred cleanup
		}

		// Parse just enough to stamp the sender info onto the message
		var msg Message
		if err := json.Unmarshal(rawMessage, &msg); err != nil {
			log.Printf("Failed to parse message from user %d: %v", client.userID, err)
			continue
		}

		// Overwrite sender fields so clients can't spoof another user's identity
		msg.UserID = client.userID
		msg.Username = client.username
		msg.DocumentID = client.documentID

		// Re-marshal with the corrected fields
		sanitised, err := json.Marshal(msg)
		if err != nil {
			log.Printf("Failed to marshal message: %v", err)
			continue
		}

		// Push to everyone else in the room
		broadcast(room, client, sanitised)
	}
}

// writePump drains the client's send channel and writes each message to the WebSocket.
// It runs in its own goroutine so that slow network I/O doesn't block the read loop.
func writePump(client *Client) {
	defer client.conn.Close()

	for message := range client.send {
		err := client.conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("WebSocket write error for user %d: %v", client.userID, err)
			break
		}
	}
}