package middleware

import(
	"context"
	"net/http"
	"strings"

	"minidocs/api/utils"
)

// contextKey is a custom type for context keys to avoid collisions
type contextKey string

// UserContextKey is the key for storing user info in context
const UserContextKey contextKey = "user"

func AuthMiddleware(next http.Handler) http.Handler{
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		
		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")

		// Check if header exists
		if authHeader == "" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Missing authorization header"}`))
			return
		}

		// Split the header into parts: "Bearer" and "token"
		parts := strings.Split(authHeader, " ")

		// Check if we have exactly 2 parts
		if len(parts) != 2 {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Invalid authorization header format"}`))
			return
		}

		// Check if the first part is "Bearer"
		if parts[0] != "Bearer" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Invalid authorization header format"}`))
			return
		}

		// Extract the actual token
		tokenString := parts[1]

		// Validate the token and get the claims
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Invalid or expired token"}`))
			return
		}

		// Store the claims in the request context
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		
		// Create a new request with the updated context
		r = r.WithContext(ctx)
		
		// Call the next handler
		next.ServeHTTP(w, r)
	})
}