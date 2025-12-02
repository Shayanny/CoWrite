package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB initializes the database connection
func InitDB() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Get database credentials from environment variables
	// := declares and assigns variables but can also be written as shown below.
	//var host string = os.Getenv("DB_HOST")
	//port := os.Getenv("DB_PORT")
	//user := os.Getenv("DB_USER")
	//password := os.Getenv("DB_PASSWORD")
	//dbname := os.Getenv("DB_NAME")

	// Read Neon connection string
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	// Create connection string
	// Format: "host=postgres port=5432 user=postgres password=postgres dbname=minidocs sslmode=disable"
	//psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
	//	host, port, user, password, dbname)

	// Open database connection
//	DB, err = sql.Open("postgres", psqlInfo)
	//if err != nil {
	//	log.Fatal("Error connecting to database:", err)
	//}

	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Error creating database connection:", err)
	}

	// Test the connection
	err = DB.Ping()
	if err != nil {
		log.Fatal("Error pinging database:", err)
	}

	fmt.Println("Successfully connected to PostgreSQL!")
}
