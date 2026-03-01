package models

import (
	"database/sql"
	"errors"
	"time"
)

// Document represents a document strcuture in the database
type Document struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	OwnerID   int       `json:"owner_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateDocument creates a new document in the database
func CreateDocument(db *sql.DB, title, content string, ownerID int) (*Document, error) {
	query := `
		INSERT INTO documents (title, content, owner_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, title, content, owner_id, created_at, updated_at
	`

	doc := &Document{}
	now := time.Now()

	err := db.QueryRow(query, title, content, ownerID, now, now).Scan(
		&doc.ID,
		&doc.Title,
		&doc.Content,
		&doc.OwnerID,
		&doc.CreatedAt,
		&doc.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return doc, nil
}

// GetDocumentsByOwner retrieves all documents owned by a specific user
func GetDocumentsByOwner(db *sql.DB, ownerID int) ([]Document, error) {
	query := `
		SELECT id, title, content, owner_id, created_at, updated_at
		FROM documents
		WHERE owner_id = $1
		ORDER BY updated_at DESC
	`

	rows, err := db.Query(query, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	documents := []Document{}

	for rows.Next() {
		var doc Document
		err := rows.Scan(
			&doc.ID,
			&doc.Title,
			&doc.Content,
			&doc.OwnerID,
			&doc.CreatedAt,
			&doc.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, doc)
	}

	return documents, nil
}

// GetDocumentByID retrieves a specific document by its ID , used for viewing/editing a single document
func GetDocumentByID(db *sql.DB, id int) (*Document, error) {
	doc := &Document{}

	query := `
		SELECT id, title, content, owner_id, created_at, updated_at
		FROM documents
		WHERE id = $1
	`

	err := db.QueryRow(query, id).Scan(
		&doc.ID,
		&doc.Title,
		&doc.Content,
		&doc.OwnerID,
		&doc.CreatedAt,
		&doc.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("document not found")
		}
		return nil, err
	}

	return doc, nil
}

// UpdateDocument updates an existing document
func UpdateDocument(db *sql.DB, id int, title, content string) (*Document, error) {
	query := `
		UPDATE documents
		SET title = $1, content = $2, updated_at = $3
		WHERE id = $4
		RETURNING id, title, content, owner_id, created_at, updated_at
	`

	doc := &Document{}
	now := time.Now()

	err := db.QueryRow(query, title, content, now, id).Scan(
		&doc.ID,
		&doc.Title,
		&doc.Content,
		&doc.OwnerID,
		&doc.CreatedAt,
		&doc.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("document not found")
		}
		return nil, err
	}

	return doc, nil
}

// DeleteDocument deletes a document from the database
func DeleteDocument(db *sql.DB, id int) error {
	query := `DELETE FROM documents WHERE id = $1`

	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("document not found")
	}

	return nil
}

// ShareDocument shares a document with another user
func ShareDocument(db *sql.DB, documentID int, sharedWithUserID int) error {
	query := `
		INSERT INTO document_shares (document_id, shared_with_user_id)
		VALUES ($1, $2)
		ON CONFLICT (document_id, shared_with_user_id) DO NOTHING
	`
	
	_, err := db.Exec(query, documentID, sharedWithUserID)
	return err
}

// IsDocumentSharedWithUser checks if a document is shared with a specific user
func IsDocumentSharedWithUser(db *sql.DB, documentID int, userID int) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM document_shares
			WHERE document_id = $1 AND shared_with_user_id = $2
		)
	`
	
	err := db.QueryRow(query, documentID, userID).Scan(&exists)
	return exists, err
}

// GetSharedDocuments returns all documents shared with a user
func GetSharedDocuments(db *sql.DB, userID int) ([]Document, error) {
	query := `
		SELECT d.id, d.title, d.content, d.owner_id, d.created_at, d.updated_at
		FROM documents d
		INNER JOIN document_shares ds ON d.id = ds.document_id
		WHERE ds.shared_with_user_id = $1
		ORDER BY d.updated_at DESC
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []Document
	for rows.Next() {
		var doc Document
		err := rows.Scan(&doc.ID, &doc.Title, &doc.Content, &doc.OwnerID, &doc.CreatedAt, &doc.UpdatedAt)
		if err != nil {
			return nil, err
		}
		documents = append(documents, doc)
	}

	return documents, nil
}