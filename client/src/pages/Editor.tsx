import { useState, useEffect } from 'react';
import { documentService, type Document } from '../services/documentService';
import './Editor.css';

function Editor() {
  // Get document ID from URL
  const pathParts = window.location.pathname.split('/');
  const documentId = parseInt(pathParts[pathParts.length - 1]);

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'Saved' or 'Saving...'
  const [error, setError] = useState('');

  // Load document when component mounts
  useEffect(() => {
    loadDocument();
  }, []);

  const loadDocument = async () => {
    setLoading(true);
    const response = await documentService.getDocument(documentId);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setDocument(response.data);
      setTitle(response.data.title);
      setContent(response.data.content);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('Saving...');

    const response = await documentService.updateDocument(documentId, {
      title,
      content,
    });

    setSaving(false);

    if (response.error) {
      alert('Failed to save: ' + response.error);
      setSaveStatus('');
    } else {
      setSaveStatus('Saved ✓');
      // Clear "Saved" message after 2 seconds
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="editor-container">
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-container">
        <p className="error">{error}</p>
        <button onClick={handleBackToDashboard}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <button onClick={handleBackToDashboard} className="btn-back">
          ← Back to Dashboard
        </button>
        <div className="editor-actions">
          {saveStatus && <span className="save-status">{saveStatus}</span>}
          <button 
            onClick={handleSave} 
            className="btn-save"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <div className="editor-content">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document Title"
          className="editor-title"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="editor-textarea"
        />
      </div>

      <footer className="editor-footer">
        <span className="doc-info">
          Last updated: {document ? new Date(document.updated_at).toLocaleString() : 'Never'}
        </span>
      </footer>
    </div>
  );
}

export default Editor;