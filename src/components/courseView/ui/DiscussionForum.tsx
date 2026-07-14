'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowUp, MessageCircle, ChevronDown, ChevronUp, Send, X } from 'lucide-react';
import { toast } from 'react-toastify';
import '../styles/discussion-forum.css';
import PostModal from './postmodal';
import type { DiscussionPost, Question, ForumSectionInfo, ForumSectionQuestionsResponse } from '../data/discussion';
import { selectIsAuthenticated } from '../../../redux/slices/auth/index';
import api from '../../../lib/api';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const forumData = {
  forum: {
    searchPlaceholder: 'Search discussions...',
    sortOptions: [
      { id: 'recent', label: 'Most Recent' },
      { id: 'popular', label: 'Most Popular' },
      { id: 'unanswered', label: 'Unanswered' },
    ],
  },
  ui: {
    buttons: {
      writePost: 'Write a Post',
      viewReplies: 'View {count} replies',
      hideReplies: 'Hide replies',
      sendReply: 'Reply',
    },
    placeholders: {
      reply: 'Write a reply...',
    },
    messages: {
      postAction: 'posted a question',
      noPosts: 'No discussions yet. Be the first to start one!',
    },
  },
};

interface DiscussionForumProps {
  courseId?: number;
  courseUrl?: string;
  sectionUrl?: string;
  sectionId?: number;
}

const mapQuestionToPost = (q: Question): DiscussionPost => ({
  id: q.id,
  author: q.user_name || q.user_email?.split('@')[0] || 'User',
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(q.user_email || q.id.toString())}`,
  title: q.title || 'No title',
  content: q.question || '',
  week: q.week || (q as any).section_name || 'Week',
  date: q.created_date
    ? new Date(q.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  replyCount: q.reply_count || q.replies?.length || 0,
  replies: (q.replies || []).map(r => ({
    id: r.id,
    author: r.user_name || r.user_email?.split('@')[0] || 'User',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.user_email || r.id.toString())}`,
    content: r.reply,
    timestamp: r.created_date
      ? new Date(r.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
    sub_replies: r.sub_replies?.map(sr => ({
      id: sr.id,
      author: sr.user_name || sr.user_email?.split('@')[0] || 'User',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sr.user_email || sr.id.toString())}`,
      content: sr.sub_reply,
      timestamp: sr.created_date
        ? new Date(sr.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '',
    })),
  })),
  isExpanded: false,
});

const DiscussionForum: React.FC<DiscussionForumProps> = ({
  courseId,
  courseUrl,
  sectionUrl: initialSectionUrl,
}) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [postmodal, setPostModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>(initialSectionUrl || '');
  const [sections, setSections] = useState<ForumSectionInfo[]>([]);

  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [originalPosts, setOriginalPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContents, setReplyContents] = useState<Record<number, string>>({});
  const [replyingToSub, setReplyingToSub] = useState<{ qid: number; rid: number } | null>(null);
  const [subReplyContents, setSubReplyContents] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }
    return null;
  }, [isAuthenticated]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        setShowSectionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch sections
  useEffect(() => {
    if (!courseId || !courseUrl) return;
    const fetchSections = async () => {
      try {
        const response = await api.get(`/courses/${courseId}/${courseUrl}/discussionforum/`);
        const responseData = response.data;
        if (responseData.success) {
          setSections(responseData.sections);
          if (responseData.sections.length > 0) {
            const matchingSection = responseData.sections.find((s: any) => s.url === initialSectionUrl);
            setSelectedSection(matchingSection ? matchingSection.url : responseData.sections[0].url);
          }
        }
      } catch (err) {
        console.error('Failed to fetch sections:', err);
      }
    };
    fetchSections();
  }, [courseId, courseUrl, initialSectionUrl]);

  // Fetch questions
  useEffect(() => {
    if (!courseId || !courseUrl || !selectedSection) return;
    const invalidSectionPatterns = ['machinelearning', 'overview', 'discussionforum'];
    if (invalidSectionPatterns.includes(selectedSection.toLowerCase())) return;

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(
          `/courses/${courseId}/${courseUrl}/discussionforum/${selectedSection}/?page=1&limit=20`
        );
        const data: ForumSectionQuestionsResponse = response.data;
        if (data.success) {
          const mapped = data.questions.map(mapQuestionToPost);
          setOriginalPosts(mapped);
          setPosts(mapped);
        } else {
          setPosts([]);
          setOriginalPosts([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [courseId, courseUrl, selectedSection]);

  // Search
  const searchQuestions = useCallback(async () => {
    if (!searchQuery.trim()) {
      setPosts(originalPosts);
      return;
    }
    if (!courseId || !courseUrl || !selectedSection) return;
    try {
      setLoading(true);
      setError(null);
      const keyword = encodeURIComponent(searchQuery.trim());
      const response = await api.get(
        `/courses/${courseId}/${courseUrl}/discussionforum/${selectedSection}/search/?keyword=${keyword}`
      );
      const data = response.data;
      if (data.success) {
        setPosts(data.questions.map(mapQuestionToPost));
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, courseId, courseUrl, selectedSection, originalPosts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => searchQuestions(), 300);
    return () => clearTimeout(timer);
  }, [searchQuestions]);

  // Filter and sort
  useEffect(() => {
    let filtered = [...originalPosts];
    if (activeFilter !== 'all') {
      filtered = filtered.filter(p => p.week.toLowerCase().includes(activeFilter.toLowerCase()));
    }
    switch (activeSort) {
      case 'recent': filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); break;
      case 'popular': filtered.sort((a, b) => b.replyCount - a.replyCount); break;
      case 'unanswered': filtered.sort((a, b) => a.replyCount - b.replyCount); break;
    }
    setPosts(filtered);
  }, [activeFilter, activeSort, originalPosts]);

  // Submit reply
  const handleSubmitReply = async (questionId: number) => {
    const content = replyContents[questionId] || '';
    if (!content.trim() || !courseId || !courseUrl || !selectedSection) return;
    setSubmittingReply(true);
    try {
      const res = await api.post(
        `/courses/${courseId}/${courseUrl}/discussionforum/${selectedSection}/${questionId}/create_reply/`,
        { reply: content.trim() }
      );
      const data = res.data;
      if (!data.success) throw new Error(data.message || 'Failed to create reply');
      const replyId = data.reply?.id;
      if (!replyId || isNaN(Number(replyId))) throw new Error('Reply created but ID is invalid.');
      const newReply = {
        id: Number(replyId),
        author: 'You',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
        content: content.trim(),
        timestamp: new Date().toLocaleDateString(),
        sub_replies: [],
      };
      const updatePost = (p: DiscussionPost) =>
        p.id === questionId
          ? { ...p, replies: [...p.replies, newReply], replyCount: p.replyCount + 1, isExpanded: true }
          : p;
      setPosts(prev => prev.map(updatePost));
      setOriginalPosts(prev => prev.map(updatePost));
      setReplyContents(prev => ({ ...prev, [questionId]: '' }));
      setReplyingTo(null);
    } catch (e: any) {
      toast.error(e.message || 'Reply failed');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Submit subreply
  const handleSubmitSubReply = async (questionId: number, replyId: number) => {
    const key = `${questionId}-${replyId}`;
    const content = subReplyContents[key] || '';
    if (!content.trim() || !courseId || !courseUrl || !selectedSection) return;
    setSubmittingReply(true);
    try {
      const res = await api.post(
        `/courses/${courseId}/${courseUrl}/discussionforum/${selectedSection}/${questionId}/${replyId}/create_subreply/`,
        { sub_reply: content.trim() }
      );
      const data = res.data;
      if (!data.success) throw new Error(data.message || 'Failed to create subreply');
      const subReplyId = data.subreply?.id;
      if (!subReplyId || isNaN(Number(subReplyId))) throw new Error('Subreply created but ID is invalid.');
      const newSR = {
        id: Number(subReplyId),
        author: 'You',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
        content: content.trim(),
        timestamp: new Date().toLocaleDateString(),
      };
      const updatePost = (p: DiscussionPost) =>
        p.id === questionId
          ? {
              ...p,
              replies: p.replies.map(r =>
                r.id === replyId ? { ...r, sub_replies: [...(r.sub_replies || []), newSR] } : r
              ),
            }
          : p;
      setPosts(prev => prev.map(updatePost));
      setOriginalPosts(prev => prev.map(updatePost));
      setSubReplyContents(prev => ({ ...prev, [key]: '' }));
      setReplyingToSub(null);
    } catch (e: any) {
      toast.error(e.message || 'Sub-reply failed');
    } finally {
      setSubmittingReply(false);
    }
  };

  const toggleReplies = (postId: number) => {
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, isExpanded: !p.isExpanded } : p)));
  };

  const toggleSortDropdown = () => setShowSortDropdown(v => !v);

  const handleSortSelect = (sortId: string) => {
    setActiveSort(sortId);
    setShowSortDropdown(false);
  };

  const getSortLabel = () => forumData.forum.sortOptions.find(o => o.id === activeSort)?.label || 'Sort';

  const handleWritePost = () => {
    const authCheck = requireAuth();
    if (authCheck) return;
    setPostModal(true);
  };

  const renderSectionSelector = () => {
    const selectedSectionObj = sections.find(s => s.url === selectedSection);
    const selectedLabel = selectedSectionObj
      ? `${selectedSectionObj.name}${selectedSectionObj.question_count !== undefined ? ` (${selectedSectionObj.question_count})` : ''}`
      : 'Select Section';

    return (
      <div ref={sectionRef} className={`section-dropdown ${showSectionDropdown ? 'active' : ''}`}>
        <button className="section-btn" onClick={() => setShowSectionDropdown(v => !v)}>
          <span>{selectedLabel}</span>
          <ChevronDown size={15} className={`chevron-icon ${showSectionDropdown ? 'rotate-180' : ''}`} />
        </button>
        <div className="dropdown-content" style={{ display: showSectionDropdown ? 'block' : 'none' }}>
          {sections.map(section => (
            <button
              key={section.url}
              className={`dropdown-option-btn ${selectedSection === section.url ? 'active' : ''}`}
              onClick={() => {
                setSelectedSection(section.url);
                setShowSectionDropdown(false);
              }}
            >
              {section.name}{section.question_count !== undefined ? ` (${section.question_count})` : ''}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const authCheck = requireAuth();
  if (authCheck) return authCheck;

  return (
    <div className="forum-container">

      {/* ── Forum Header ── */}
      <div className="forum-header">

        {/* Row 1: Search Bar */}
        <div className="search-bar-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder={forumData.forum.searchPlaceholder}
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Row 2: Section Selector + Sort Dropdown */}
        <div className="forum-controls">
          {renderSectionSelector()}

          <div ref={sortRef} className={`sort-dropdown ${showSortDropdown ? 'active' : ''}`}>

            
            <button className="sort-btn" onClick={toggleSortDropdown}>
              <ArrowUp size={15} />
              <span>{getSortLabel()}</span>
            </button>

            
            <div className="dropdown-content" style={{ display: showSortDropdown ? 'block' : 'none' }}>
              {forumData.forum.sortOptions.map((option) => (
                <button
                  key={option.id}
                  className={`sort-option ${activeSort === option.id ? 'active' : ''}`}
                  onClick={() => handleSortSelect(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Write a Post */}
        <button className="write-post-btn" onClick={handleWritePost}>
          {forumData.ui.buttons.writePost}
        </button>

      </div>

      {/* ── Discussions List ── */}
      <div className="discussions-list">
        {loading ? (
          <div className="loading-message">Loading posts...</div>
        ) : error ? (
          <div className="error-message">
            <p>Failed to load posts: {error}</p>
            <button className="write-post-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="no-posts-message">
            <p>{forumData.ui.messages.noPosts}</p>
            <button className="write-post-btn" onClick={handleWritePost}>
              {forumData.ui.buttons.writePost}
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="discussion-post">
              <div className="post-header">
                <img
                  src={post.avatar}
                  alt={post.author}
                  className="user-avatar"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                <div className="post-meta">
                  <div className="author-info">
                    <span className="author-name">{post.author}</span>
                    <span className="post-action">{forumData.ui.messages.postAction}</span>
                  </div>
                  <span className="post-date">{post.date}</span>
                </div>
              </div>

              <div className="post-content">
                <h4 className="post-title">{post.title}</h4>
                <p className="post-description">{post.content}</p>

                {post.replyCount > 0 && (
                  <button className="view-replies-btn" onClick={() => toggleReplies(post.id)}>
                    {post.isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {post.isExpanded
                      ? forumData.ui.buttons.hideReplies
                      : forumData.ui.buttons.viewReplies.replace('{count}', post.replyCount.toString())}
                  </button>
                )}

                {post.isExpanded && post.replies.length > 0 && (
                  <div className="replies-container">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="reply-item">
                        <img
                          src={reply.avatar}
                          alt={reply.author}
                          className="reply-avatar"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                        <div className="reply-content">
                          <div className="reply-author">
                            {reply.author}
                            <span className="reply-timestamp">{reply.timestamp}</span>
                          </div>
                          <p className="reply-text">{reply.content}</p>

                          {reply.sub_replies && reply.sub_replies.length > 0 && (
                            <div className="subreplies-container">
                              {reply.sub_replies.map((sr) => (
                                <div key={sr.id} className="subreply-item">
                                  <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sr.author || 'User')}`}
                                    alt={sr.author}
                                    className="subreply-avatar"
                                  />
                                  <div className="subreply-content">
                                    <div className="subreply-author">
                                      {sr.author}
                                      <span className="subreply-timestamp">{sr.timestamp}</span>
                                    </div>
                                    <p className="subreply-text">{sr.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {!(replyingToSub?.rid === reply.id && replyingToSub?.qid === post.id) && (
                            <button
                              className="reply-to-reply-btn"
                              onClick={() => setReplyingToSub({ qid: post.id, rid: reply.id })}
                            >
                              <MessageCircle size={13} />
                              Reply
                            </button>
                          )}

                          {replyingToSub?.rid === reply.id && replyingToSub?.qid === post.id && (
                            <div className="subreply-input-container">
                              <input
                                type="text"
                                placeholder={forumData.ui.placeholders.reply}
                                className="reply-input"
                                value={subReplyContents[`${post.id}-${reply.id}`] || ''}
                                onChange={(e) =>
                                  setSubReplyContents(prev => ({
                                    ...prev,
                                    [`${post.id}-${reply.id}`]: e.target.value,
                                  }))
                                }
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && (subReplyContents[`${post.id}-${reply.id}`] || '').trim()) {
                                    handleSubmitSubReply(post.id, reply.id);
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                className="send-reply-btn"
                                onClick={() => handleSubmitSubReply(post.id, reply.id)}
                                disabled={submittingReply || !(subReplyContents[`${post.id}-${reply.id}`] || '').trim()}
                              >
                                <Send size={14} />
                              </button>
                              <button className="cancel-reply-btn" onClick={() => setReplyingToSub(null)}>
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === post.id && (
                  <div className="reply-input-container">
                    <input
                      type="text"
                      placeholder={forumData.ui.placeholders.reply}
                      className="reply-input"
                      id={`reply-input-${post.id}`}
                      value={replyContents[post.id] || ''}
                      onChange={(e) => setReplyContents(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && (replyContents[post.id] || '').trim()) {
                          handleSubmitReply(post.id);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      className="send-reply-btn"
                      onClick={() => handleSubmitReply(post.id)}
                      disabled={submittingReply || !(replyContents[post.id] || '').trim()}
                    >
                      {forumData.ui.buttons.sendReply}
                    </button>
                  </div>
                )}

                {replyingTo !== post.id && (
                  <button
                    className="write-post-btn"
                    style={{ marginTop: '14px', height: '34px', fontSize: '13px', padding: '0 14px' }}
                    onClick={() => setReplyingTo(post.id)}
                  >
                    {forumData.ui.buttons.sendReply}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {postmodal && (
        <PostModal
          onClose={() => setPostModal(false)}
          onSubmit={function () {}}
          sections={sections}
          courseId={courseId}
          courseUrl={courseUrl}
          selectedSection={selectedSection}
          onPostCreated={(newQuestion: Question) => {
            const mapped = mapQuestionToPost(newQuestion);
            setOriginalPosts(prev => [mapped, ...prev]);
            setPosts(prev => [mapped, ...prev]);
          }}
        />
      )}
    </div>
  );
};

export default DiscussionForum;
