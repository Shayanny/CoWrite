package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"encoding/json"

	"minidocs/api/config"
	"minidocs/api/handlers"
	"minidocs/api/middleware"
	"minidocs/api/utils"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {

	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Initialize database connection
	config.InitDB()
	defer config.DB.Close()

	// Create router
	router := mux.NewRouter()

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

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Printf(" Server starting on port %s...", port)
	fmt.Println("Shayanny here! :)")
	log.Fatal(http.ListenAndServe(":"+port, router))
}
