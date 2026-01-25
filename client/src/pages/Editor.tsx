import { useState, useEffect, useRef } from 'react';
import { documentService, type Document } from '../services/documentService';
import './Editor.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Reference for auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Load document when component mounts
  useEffect(() => {
    loadDocument();
  }, []);

  // Auto-save effect - saves every 3 seconds if there are changes
  useEffect(() => {
    if (hasUnsavedChanges && !saving) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for 3 seconds
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true); // true = auto-save
      }, 3000);
    }

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, hasUnsavedChanges]);

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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
  };

  const handleSave = async (isAutoSave = false) => {
    setSaving(true);
    setSaveStatus(isAutoSave ? 'Auto-saving...' : 'Saving...');

    const response = await documentService.updateDocument(documentId, {
      title,
      content,
    });

    setSaving(false);

    if (response.error) {
      if (!isAutoSave) {
        alert('Failed to save: ' + response.error);
      };
      setSaveStatus('Save failed');
    } else {

      setHasUnsavedChanges(false); // Reset unsaved changes flag
      setSaveStatus('Saved');
      // Clear "Saved" message after 2 seconds
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };


  const handleBackToDashboard = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = confirm('You have unsaved changes. Do you want to save before leaving?');
      if (confirmLeave) {
        handleSave();
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      window.location.href = '/dashboard';
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link'
  ];

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
            onClick={() => handleSave(false)}
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
          onChange={handleTitleChange}
          placeholder="Document Title"
          className="editor-title"
        />

        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          placeholder="Start writing..."
          className="editor-quill"
        />
      </div>

      <footer className="editor-footer">
        <span className="doc-info">
          Last updated: {document ? new Date(document.updated_at).toLocaleString() : 'Never'}
        </span>
        {hasUnsavedChanges && !saving && (
            <span className="unsaved-indicator"> • Unsaved changes</span>
          )}
      </footer>
    </div>
  );
}

export default Editor;