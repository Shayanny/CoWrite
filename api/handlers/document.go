package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"minidocs/api/config"
	"minidocs/api/middleware"
	"minidocs/api/models"
	"minidocs/api/utils"

	"github.com/gorilla/mux"
)

// CreateDocumentRequest represents the request to create a document
type CreateDocumentRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// UpdateDocumentRequest represents the request to update a document
type UpdateDocumentRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// CreateDocument handles document creation
func CreateDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get user from context (set by AuthMiddleware)
	claims := r.Context().Value(middleware.UserContextKey).(*utils.Claims)

	// Parse request body
	var req CreateDocumentRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request body"})
		return
	}

	// Validate input
	if req.Title == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Title is required"})
		return
	}

	// Create document in database
	doc, err := models.CreateDocument(config.DB, req.Title, req.Content, claims.UserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to create document"})
		return
	}

	// Success response
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(doc)
}

// GetMyDocuments returns all documents owned by the authenticated user
func GetMyDocuments(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get user from context
	claims := r.Context().Value(middleware.UserContextKey).(*utils.Claims)

	// Get documents from database
	documents, err := models.GetDocumentsByOwner(config.DB, claims.UserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to retrieve documents"})
		return
	}

	// Return documents (empty array if none found)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(documents)
}

// GetDocument returns a specific document by ID
func GetDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get document ID from URL
	vars := mux.Vars(r)
	idStr := vars["id"]
	
	// Convert string to int
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid document ID"})
		return
	}

	// Get document from database
	doc, err := models.GetDocumentByID(config.DB, id)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Document not found"})
		return
	}

	// TODO: Check if user has permission to view this document
	// For now, anyone authenticated can view any document

	// Return document
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(doc)
}

// UpdateDocument handles document updates
func UpdateDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get user from context
	claims := r.Context().Value(middleware.UserContextKey).(*utils.Claims)

	// Get document ID from URL
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid document ID"})
		return
	}

	// Check if document exists and user owns it
	existingDoc, err := models.GetDocumentByID(config.DB, id)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Document not found"})
		return
	}

	// Check ownership
	if existingDoc.OwnerID != claims.UserID {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "You don't have permission to edit this document"})
		return
	}

	// Parse request body
	var req UpdateDocumentRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid request body"})
		return
	}

	// Validate input
	if req.Title == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Title is required"})
		return
	}

	// Update document in database
	updatedDoc, err := models.UpdateDocument(config.DB, id, req.Title, req.Content)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to update document"})
		return
	}

	// Success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedDoc)
}

// DeleteDocument handles document deletion
func DeleteDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get user from context
	claims := r.Context().Value(middleware.UserContextKey).(*utils.Claims)

	// Get document ID from URL
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid document ID"})
		return
	}

	// Check if document exists and user owns it
	existingDoc, err := models.GetDocumentByID(config.DB, id)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Document not found"})
		return
	}

	// Check ownership
	if existingDoc.OwnerID != claims.UserID {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "You don't have permission to delete this document"})
		return
	}

	// Delete document from database
	err = models.DeleteDocument(config.DB, id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to delete document"})
		return
	}

	// Success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Document deleted successfully",
	})
}