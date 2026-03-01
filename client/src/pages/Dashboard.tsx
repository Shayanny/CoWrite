import { useState, useEffect } from 'react';
import { documentService, type Document } from '../services/documentService';
import { authService } from '../services/authService';
import './Dashboard.css';

function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const user = authService.getUser();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const response = await documentService.getMyDocuments();

    if (response.error) {
      setError(response.error);
    } else {
      setDocuments(response.data || []);
    }

    setLoading(false);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const response = await documentService.createDocument({
      title: newDocTitle,
      content: '',
    });

    setCreating(false);

    if (response.error) {
      alert('Failed to create document: ' + response.error);
    } else {
      setShowCreateModal(false);
      setNewDocTitle('');
      loadDocuments(); // Reload the list
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const response = await documentService.deleteDocument(id);

    if (response.error) {
      alert('Failed to delete document: ' + response.error);
    } else {
      loadDocuments(); // Reload the list
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  // Helper function to strip HTML and get plain text preview
  const getPlainTextPreview = (htmlContent: string, maxLength: number = 100): string => {
    // Remove HTML tags
    const plainText = htmlContent.replace(/<[^>]*>/g, ' ');

    // Decode HTML entities (like &nbsp;)
    const decoded = plainText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    // Remove extra whitespace (multiple spaces, newlines, tabs)
    const cleaned = decoded
      .replace(/\s+/g, ' ')  // Replace multiple spaces/newlines with single space
      .trim();

    // Truncate if too long
    if (cleaned.length > maxLength) {
      return cleaned.substring(0, maxLength) + '...';
    }

    return cleaned || 'Empty document';
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>CoWrite</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}!</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="documents-header">
          <h2>My Documents</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-create"
          >
            + New Document
          </button>
        </div>

        {loading && <p>Loading documents...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && documents.length === 0 && (
          <div className="empty-state">
            <p>No documents yet. Create your first one!</p>
          </div>
        )}

        <div className="documents-grid">
          {documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-header">
                <h3>{doc.title}</h3>
                {doc.is_shared && (
                  <span className="shared-badge" title="Shared with you">
                    👥
                  </span>
                )}
              </div>
              <p className="doc-preview">
                {getPlainTextPreview(doc.content, 100) || 'Empty document'}
                {doc.content.length > 100 && '...'}
              </p>
              <div className="doc-meta">
                <span>Updated: {new Date(doc.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="doc-actions">
                <button
                  onClick={() => window.location.href = `/document/${doc.id}`}
                  className="btn-open"
                >
                  Open
                </button>
                {!doc.is_shared && (
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Document</h2>
            <form onSubmit={handleCreateDocument}>
              <div className="form-group">
                <label htmlFor="title">Document Title</label>
                <input
                  type="text"
                  id="title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Enter document title"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;