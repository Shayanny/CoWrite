package handlers

import (
	"encoding/json"
	"net/http"

	"minidocs/api/config"
	"minidocs/api/models"
	"minidocs/api/utils"
)

// RegisterRequest represents the registration request body
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token    string `json:"token"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// Register handles user registration
func Register(w http.ResponseWriter, r *http.Request) {
	// Set response header to JSON
	w.Header().Set("Content-Type", "application/json")

	// Parse request body
	var req RegisterRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request body"})
		return
	}

	// Validate input
	if req.Username == "" || req.Email == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "All fields are required"})
		return
	}

	existingUser, err := models.GetUserByUsername(config.DB, req.Username)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Database error"})
		return
	}
	if existingUser != nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Username already taken"})
		return
	}

	// Check if email already exists (you might already have this)
	existingEmail, err := models.GetUserByEmail(config.DB, req.Email)
	if err == nil && existingEmail != nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Email already registered"})
		return
	}

	// Create user in database by calling the function and capturing any error
	err = models.CreateUser(config.DB, req.Username, req.Email, req.Password)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to create user"})
		return
	}

	// Success response
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User created successfully",
	})
}

// Login handles user login
func Login(w http.ResponseWriter, r *http.Request) {
	// Set response header to JSON
	w.Header().Set("Content-Type", "application/json")

	// Parse request body
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request body"})
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Email and password are required"})
		return
	}

	// Get user from database
	user, err := models.GetUserByEmail(config.DB, req.Email)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid credentials"})
		return
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Username, user.Email)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to generate token"})
		return
	}

	// Success response with token
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(AuthResponse{
		Token:    token,
		Username: user.Username,
		Email:    user.Email,
	})
}
