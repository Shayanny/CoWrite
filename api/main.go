package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"minidocs/api/config"
	"minidocs/api/handlers"
	"minidocs/api/middleware"
	"minidocs/api/utils"

	corsHandlers "github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {

	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database connection
	config.InitDB()
	defer config.DB.Close()

	// Initialize Redis connection
	config.InitRedis()

	// Create router
	router := mux.NewRouter()

	// Testing route
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("CoWrite API is running!"))
	}).Methods("GET")

	// Authentication routes
	router.HandleFunc("/api/register", handlers.Register).Methods("POST")
	router.HandleFunc("/api/login", handlers.Login).Methods("POST")

	router.Handle("/api/protected", middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get user info from context
		claims := r.Context().Value(middleware.UserContextKey).(*utils.Claims)

		// Send back user info as JSON
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "You are authenticated!",
			"user": map[string]interface{}{
				"id":       claims.UserID,
				"username": claims.Username,
				"email":    claims.Email,
			},
		})
	}))).Methods("GET")

	// Document routes (all protected with AuthMiddleware)
	router.Handle("/api/documents", middleware.AuthMiddleware(
		http.HandlerFunc(handlers.CreateDocument),
	)).Methods("POST")

	router.Handle("/api/documents", middleware.AuthMiddleware(
		http.HandlerFunc(handlers.GetMyDocuments),
	)).Methods("GET")

	router.Handle("/api/documents/{id}", middleware.AuthMiddleware(
		http.HandlerFunc(handlers.GetDocument),
	)).Methods("GET")

	router.Handle("/api/documents/{id}", middleware.AuthMiddleware(
		http.HandlerFunc(handlers.UpdateDocument),
	)).Methods("PUT")

	router.Handle("/api/documents/{id}", middleware.AuthMiddleware(
		http.HandlerFunc(handlers.DeleteDocument),
	)).Methods("DELETE")

	router.Handle("/api/documents/{id}/invite", middleware.AuthMiddleware(
		http.HandlerFunc(handlers.InviteUserToDocument),
	)).Methods("POST")

	// WebSocket route (auth is handled inside the handler via query param token)
	router.HandleFunc("/ws/{documentId}", handlers.WebSocketHandler)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	corsHandler := corsHandlers.CORS(
		corsHandlers.AllowedOrigins([]string{
			"http://localhost:5173",
			"https://cowrite-api.up.railway.app",
			"https://cowrite.up.railway.app",
		}),
		corsHandlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		corsHandlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)(router)

	// Start server
	log.Printf(" Server starting on port %s...", port)
	fmt.Println("Shayanny here! :)")
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}
