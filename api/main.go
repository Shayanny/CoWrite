package main

import (
	"log"
	"fmt"
	"net/http"
	"os"

	"minidocs/api/config"
	"minidocs/api/handlers"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "MiniDocs API is running")
	})
	fmt.Println("API listening on :8080")
	fmt.Println("Shayanny here! :)")
	http.ListenAndServe(":8080", nil)

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

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Printf(" Server starting on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
