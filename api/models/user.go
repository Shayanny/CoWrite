package models

import (
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the database
type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`  // The "-" means don't include in JSON responses
	CreatedAt    time.Time `json:"created_at"`
}

// CreateUser creates a new user in the database
func CreateUser(db *sql.DB, username, email, password string) error {
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Insert user into database
	query := `
		INSERT INTO users (username, email, password_hash, created_at)
		VALUES ($1, $2, $3, $4)
	`
	
	_, err = db.Exec(query, username, email, string(hashedPassword), time.Now())
	if err != nil {
		return err
	}

	return nil
}

// GetUserByEmail retrieves a user by their email
func GetUserByEmail(db *sql.DB, email string) (*User, error) {
	//User{} creates an empty User and gets its pointer (&)
	user := &User{}
	
	query := `
		SELECT id, username, email, password_hash, created_at
		FROM users
		WHERE email = $1
	`
	
	err := db.QueryRow(query).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

// CheckPassword compares a password with the stored hash
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}