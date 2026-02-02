import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { getProfileComments, addProfileComment, deleteProfileComment } from '../services/supabaseService';
import { supabase, isSupabaseReady } from '../config/supabase';
import { getCurrentUser } from '../config/users';

const ProfileComments = ({ walletAddress }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (walletAddress) {
      loadComments();
      
      // Only set up real-time subscription if Supabase is configured
      if (isSupabaseReady) {
        const channel = supabase
          .channel(`profile-comments-${walletAddress}`)
          .on('postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'profile_comments',
              filter: `wallet_address=eq.${walletAddress}`
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setComments(prev => [payload.new, ...prev]);
              } else if (payload.eventType === 'DELETE') {
                setComments(prev => prev.filter(c => c.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [walletAddress]);

  const loadComments = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    const { data, error: err } = await getProfileComments(walletAddress);
    if (err) {
      setError('Failed to load comments. Please check your Supabase connection.');
      console.error(err);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !walletAddress) return;

    setSubmitting(true);
    setError(null);
    
    // Get current logged-in user
    const currentUser = getCurrentUser();
    const author = currentUser?.name || 'Admin';
    
    const { data, error: err } = await addProfileComment(walletAddress, newComment.trim(), author);
    if (err) {
      const errorMessage = err.message || 'Failed to add comment. Please try again.';
      setError(errorMessage);
      console.error('Error adding comment:', err);
    } else {
      setNewComment('');
      // Reload comments to ensure it appears (in case real-time subscription isn't working)
      await loadComments();
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    const { error: err } = await deleteProfileComment(commentId);
    if (err) {
      setError('Failed to delete comment. Please try again.');
      console.error(err);
    }
    // Comment will be removed via real-time subscription
  };

  if (!walletAddress) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-8">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-indigo-600" size={20} />
          <h3 className="text-lg font-bold text-slate-900">Profile Comments</h3>
          <span className="ml-auto text-sm text-slate-500">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>

      {/* Add Comment Form */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <form onSubmit={handleSubmitComment} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment about this wallet..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-0"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Send size={16} />
                <span>Add</span>
              </>
            )}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Comments List */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="text-slate-300 mx-auto mb-2" size={32} />
            <p className="text-slate-500 text-sm">No comments yet. Add the first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-sm">
                        {(comment.author || 'Admin').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{comment.author || 'Admin'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileComments;

