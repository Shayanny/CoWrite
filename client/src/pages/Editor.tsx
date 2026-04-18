import { useState, useEffect, useRef } from 'react';
import { documentService, type Document } from '../services/documentService';
import './Editor.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { wsService } from '../services/websocketService';
import DiffMatchPatch from 'diff-match-patch';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  const [chatMessages, setChatMessages] = useState<Array<{
    type: 'join' | 'leave' | 'chat';
    username: string;
    timestamp: Date;
    text?: string; // Only for chat messages
  }>>([]);

  const [chatInput, setChatInput] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const getQRCodeUrl = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
  };


  //const [userCursors, setUserCursors] = useState<Record<string, { position: number, length: number, color: string }>>({});

  const dmp = useRef(new DiffMatchPatch());
  const previousContent = useRef('');

  //const cursorColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  //const getUserColor = (username: string) => {
  //   const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  //  return cursorColors[hash % cursorColors.length];
  // };

  // Reference for auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Load document when component mounts
  useEffect(() => {
    loadDocument();
  }, []);

  const handleExportPDF = async () => {
    const editorElement = window.document.querySelector('.ql-editor') as HTMLElement;
    if (!editorElement) return;

    const canvas = await html2canvas(editorElement);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${title || 'document'}.pdf`);
  };


  // Set up WebSocket listeners once on mount
  useEffect(() => {
    const unsubJoin = wsService.on('join', (message) => {
      if (message.documentId === documentId) {
        // Add to activity feed (only if not current user)
        if (message.username !== currentUser.username) {
          setChatMessages(prev => {
            // Check if user already joined in last 2 seconds
            const recentJoin = prev.find(
              msg => msg.type === 'join' &&
                msg.username === message.username &&
                Date.now() - msg.timestamp.getTime() < 2000
            );

            // Skip if duplicate within 2 seconds
            if (recentJoin) return prev;

            const newMessages = [...prev, {
              type: 'join' as const,
              username: message.username,
              timestamp: new Date()
            }];
            // Keep only last 20 messages
            return newMessages.slice(-20);
          });
        }

        // Add to active users list (prevent duplicates)
        setActiveUsers(prev => {
          if (!prev.includes(message.username)) {
            return [...prev, message.username];
          }
          return prev;
        });
      }

    });


    const unsubMembers = wsService.on('members', (message) => {
      if (message.documentId === documentId) {
        // Set active users from the server's list
        const members = message.payload as string[];
        setActiveUsers(members);
      }
    });

    const unsubLeave = wsService.on('leave', (message) => {
      if (message.documentId === documentId) {
        // Add to activity feed (only if not current user)
        if (message.username !== currentUser.username) {
          setChatMessages(prev => {
            // Check if user already left in last 2 seconds
            const recentLeave = prev.find(
              msg => msg.type === 'leave' &&
                msg.username === message.username &&
                Date.now() - msg.timestamp.getTime() < 2000
            );

            // Skip if duplicate within 2 seconds
            if (recentLeave) return prev;

            const newMessages = [...prev, {
              type: 'leave' as const,
              username: message.username,
              timestamp: new Date()
            }];
            // Keep only last 10 messages
            return newMessages.slice(-20);
          });
        }

        // Remove from active users list
        setActiveUsers(prev => prev.filter(user => user !== message.username));
      }
    });

    const unsubEdit = wsService.on('edit', (message) => {

      // Skip if this is our own edit
      if (message.username !== currentUser.username && message.documentId === documentId) {

        const payload = message.payload as any;

        if (payload.fullContent) {

          const receiveTime = performance.now();
          if (payload.sentAt) {
            console.log(`[DMP] Round-trip latency: ${(receiveTime - payload.sentAt).toFixed(2)}ms`);
          }

          // Update content
          setContent(payload.fullContent);
          previousContent.current = payload.fullContent;

          console.log(' Content updated in state');
        } else {
          console.log(' No fullContent in payload');
        }
      } else {
        console.log(' Skipping - this is my own edit');
      }
    });

    const unsubChat = wsService.on('chat', (message) => {
      if (message.documentId === documentId) {
        const payload = message.payload as { text: string };
        setChatMessages(prev => {
          const newMessages = [...prev, {
            type: 'chat' as const,
            username: message.username,
            timestamp: new Date(),
            text: payload.text
          }];
          return newMessages.slice(-20);
        });
      }
    });



    // Cleanup all subscriptions when component unmounts
    return () => {
      setChatMessages([]);
      setActiveUsers([]);
      unsubJoin();
      unsubLeave();
      unsubEdit();
      unsubMembers();
      unsubChat();
      wsService.disconnect();
    };
  }, []); // Empty array = runs once on mount, cleanup on unmount
  // Auto-save effect - saves every 3 seconds if there are changes
  useEffect(() => {
    if (hasUnsavedChanges && !saving) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for 5 seconds
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true); // true = auto-save
      }, 5000);
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
      previousContent.current = response.data.content;
      wsService.connect(documentId);

      setActiveUsers([currentUser.username]);
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

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {

      const patchStart = performance.now();
      const patches = dmp.current.patch_make(previousContent.current, value);
      const patchText = dmp.current.patch_toText(patches);
      const patchEnd = performance.now();

      console.log(`[DMP] Patch generation took: ${(patchEnd - patchStart).toFixed(2)}ms`);
      console.log(`[DMP] Patch size: ${patchText.length} bytes vs full content: ${value.length} bytes`);
      console.log(' Patches:', patchText);

      const sendTime = performance.now();
      wsService.send('edit', {
        patches: patchText,
        fullContent: value,
        sentAt: sendTime
      });

      previousContent.current = value;
    }, 300);
  };

  const handleSelectionChange = (range: any) => {
    if (range) {
      wsService.send('cursor', {
        position: range.index,
        length: range.length
      });
    }
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
      setTimeout(() => setSaveStatus(''), 3000);
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

  const handleInvite = async () => {
    // Validate email
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteMessage('Please enter a valid email address');
      return;
    }

    setInviteLoading(true);
    setInviteMessage('');

    try {
      const response = await fetch(`http://localhost:8080/api/documents/${documentId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setInviteMessage('✅ ' + data.message);
        setInviteEmail('');
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteMessage('');
        }, 2000);
      } else {
        setInviteMessage('❌ ' + data.error);
      }
    } catch (error) {
      setInviteMessage('❌ Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    wsService.send('chat', { text: chatInput });
    setChatInput('');
  };

  const getWordCount = (htmlContent: string, titleText: string = ''): { words: number, chars: number } => {
    const plainText = htmlContent
      .replace(/<[^>]*>/g, ' ')  // replace tags with space not nothing
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')  // collapse multiple spaces
      .trim();

    const combined = (titleText + ' ' + plainText).trim();
    const words = combined === '' ? 0 : combined.split(/\s+/).filter(w => w.length > 0).length;
    const chars = combined.replace(/\s/g, '').length; // chars without spaces
    return { words, chars };
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
            onClick={handleExportPDF}
            className="btn-export"
          >
            Export PDF
          </button>
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

        <div className="editor-wrapper">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            onChangeSelection={handleSelectionChange}
            modules={modules}
            formats={formats}
            placeholder="Start writing..."
          />
        </div>
      </div>

      <div className="chat-box">
        <div className="chat-header">
          <span>Activity</span>
          <button
            className="btn-invite"
            onClick={() => setShowInviteModal(true)}
          >+ Invite</button>
        </div>

        {/* Show active users */}
        {activeUsers.length > 0 && (
          <div className="active-users">
            <div className="active-users-header">
              Active Users ({activeUsers.length})
            </div>
            <div className="active-users-list">
              {activeUsers.map((username, idx) => (
                <div key={idx} className="active-user">
                  <span className="user-indicator">🟢</span>
                  <span className="username">{username}</span>
                  {username === currentUser.username && <span className="you-badge">(you)</span>}
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Activity feed */}
        <div className="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="chat-message">
              {msg.type === 'chat' ? (
                <span className="chat-msg">
                  <strong>{msg.username}:</strong> {msg.text}
                </span>
              ) : (
                <span className={msg.type === 'join' ? 'join-msg' : 'leave-msg'}>
                  {msg.type === 'join' ? '🟢' : '🔴'} {msg.username} {msg.type === 'join' ? 'joined' : 'left'}
                </span>
              )}
              <span className="timestamp">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
            placeholder="Send a message..."
            className="chat-input"
          />
          <button onClick={sendChatMessage} className="btn-chat-send">Send</button>
        </div>
      </div>


      <footer className="editor-footer">
        <span className="doc-info">
          Last updated: {document ? new Date(document.updated_at).toLocaleString() : 'Never'}
        </span>
        <span className="word-count">
          {getWordCount(content, title).words} words · {getWordCount(content, title).chars} chars
        </span>
        <span className="footer-right">
          {hasUnsavedChanges && !saving && (
            <span className="unsaved-indicator">• Unsaved changes</span>
          )}
        </span>
      </footer>
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite Collaborator</h3>
              <button
                className="modal-close"
                onClick={() => setShowInviteModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Enter the email address of the person you want to invite.
                They must have a CoWrite account.
              </p>

              <input
                type="email"
                placeholder="collaborator@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                className="invite-input"
                disabled={inviteLoading}
              />

              {inviteMessage && (
                <p className={`invite-message ${inviteMessage.startsWith('✅') ? 'success' : 'error'}`}>
                  {inviteMessage}
                </p>
              )}

              <div className="qr-code-section">
                <p className="qr-label">Or share this QR code:</p>
                <img
                  src={getQRCodeUrl(window.location.href)}
                  alt="QR Code"
                  width={150}
                  height={150}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowInviteModal(false)}
                disabled={inviteLoading}
              >
                Cancel
              </button>
              <button
                className="btn-copy-link"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? '✅ Copied!' : '🔗 Copy Link'}
              </button>
              <button
                className="btn-send-invite"
                onClick={handleInvite}
                disabled={inviteLoading}
              >
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Editor;