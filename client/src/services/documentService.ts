import { api } from './api';

export interface Document {
  id: number;
  title: string;
  content: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentRequest {
  title: string;
  content: string;
}

export interface UpdateDocumentRequest {
  title: string;
  content: string;
}

class DocumentService {
  async getMyDocuments() {
    return api.request<Document[]>('/api/documents', {
      method: 'GET',
    });
  }

  async getDocument(id: number) {
    return api.request<Document>(`/api/documents/${id}`, {
      method: 'GET',
    });
  }

  async createDocument(data: CreateDocumentRequest) {
    return api.request<Document>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDocument(id: number, data: UpdateDocumentRequest) {
    return api.request<Document>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: number) {
    return api.request<{ message: string }>(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  }
}

export const documentService = new DocumentService();