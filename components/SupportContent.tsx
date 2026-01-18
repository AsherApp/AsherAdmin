import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  EyeOff,
  Loader,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getAllHelpArticles,
  createHelpArticle,
  updateHelpArticle,
  deleteHelpArticle,
  getAllVideoTutorials,
  createVideoTutorial,
  updateVideoTutorial,
  deleteVideoTutorial,
  getAllSupportAgents,
  createSupportAgent,
  updateSupportAgent,
  deleteSupportAgent,
  FAQ,
  HelpArticle,
  VideoTutorial,
  SupportAgent
} from '../services/supportContentService';

type TabType = 'faq' | 'help-articles' | 'video-tutorials' | 'support-agents';

const SupportContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('faq');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ State
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'general', order: 0, isPublished: true });

  // Help Article State
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [articleForm, setArticleForm] = useState({ 
    title: '', 
    description: '', 
    content: '', 
    category: 'Getting Started', 
    readTime: '', 
    thumbnail: '',
    isPublished: true 
  });

  // Video Tutorial State
  const [videoTutorials, setVideoTutorials] = useState<VideoTutorial[]>([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoTutorial | null>(null);
  const [videoForm, setVideoForm] = useState({ 
    title: '', 
    description: '', 
    videoUrl: '', 
    thumbnail: '', 
    duration: '', 
    category: 'Getting Started',
    isPublished: true 
  });

  // Support Agent State
  const [supportAgents, setSupportAgents] = useState<SupportAgent[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SupportAgent | null>(null);
  const [agentForm, setAgentForm] = useState({ 
    userId: '', 
    name: '', 
    role: '', 
    status: 'offline' as 'online' | 'away' | 'busy' | 'offline',
    isActive: true 
  });

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'faq':
          const faqsData = await getAllFAQs(undefined, undefined, searchQuery);
          setFaqs(faqsData);
          break;
        case 'help-articles':
          const articlesData = await getAllHelpArticles(undefined, undefined, searchQuery);
          setHelpArticles(articlesData);
          break;
        case 'video-tutorials':
          const videosData = await getAllVideoTutorials(undefined, undefined, searchQuery);
          setVideoTutorials(videosData);
          break;
        case 'support-agents':
          const agentsData = await getAllSupportAgents(undefined, undefined);
          setSupportAgents(agentsData);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // FAQ Handlers
  const handleCreateFAQ = async () => {
    try {
      await createFAQ(faqForm);
      setShowFAQModal(false);
      setFaqForm({ question: '', answer: '', category: 'general', order: 0, isPublished: true });
      loadData();
    } catch (error) {
      console.error('Error creating FAQ:', error);
    }
  };

  const handleUpdateFAQ = async () => {
    if (!editingFAQ) return;
    try {
      await updateFAQ(editingFAQ.id, faqForm);
      setShowFAQModal(false);
      setEditingFAQ(null);
      setFaqForm({ question: '', answer: '', category: 'general', order: 0, isPublished: true });
      loadData();
    } catch (error) {
      console.error('Error updating FAQ:', error);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await deleteFAQ(id);
      loadData();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  const openEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isPublished: faq.isPublished
    });
    setShowFAQModal(true);
  };

  // Help Article Handlers
  const handleCreateArticle = async () => {
    try {
      await createHelpArticle(articleForm);
      setShowArticleModal(false);
      setArticleForm({ title: '', description: '', content: '', category: 'Getting Started', readTime: '', thumbnail: '', isPublished: true });
      loadData();
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const handleUpdateArticle = async () => {
    if (!editingArticle) return;
    try {
      await updateHelpArticle(editingArticle.id, articleForm);
      setShowArticleModal(false);
      setEditingArticle(null);
      setArticleForm({ title: '', description: '', content: '', category: 'Getting Started', readTime: '', thumbnail: '', isPublished: true });
      loadData();
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteHelpArticle(id);
      loadData();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const openEditArticle = (article: HelpArticle) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      description: article.description,
      content: article.content,
      category: article.category,
      readTime: article.readTime,
      thumbnail: article.thumbnail || '',
      isPublished: article.isPublished
    });
    setShowArticleModal(true);
  };

  // Video Tutorial Handlers
  const handleCreateVideo = async () => {
    try {
      await createVideoTutorial(videoForm);
      setShowVideoModal(false);
      setVideoForm({ title: '', description: '', videoUrl: '', thumbnail: '', duration: '', category: 'Getting Started', isPublished: true });
      loadData();
    } catch (error) {
      console.error('Error creating video:', error);
    }
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo) return;
    try {
      await updateVideoTutorial(editingVideo.id, videoForm);
      setShowVideoModal(false);
      setEditingVideo(null);
      setVideoForm({ title: '', description: '', videoUrl: '', thumbnail: '', duration: '', category: 'Getting Started', isPublished: true });
      loadData();
    } catch (error) {
      console.error('Error updating video:', error);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video tutorial?')) return;
    try {
      await deleteVideoTutorial(id);
      loadData();
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const openEditVideo = (video: VideoTutorial) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail,
      duration: video.duration,
      category: video.category,
      isPublished: video.isPublished
    });
    setShowVideoModal(true);
  };

  // Support Agent Handlers
  const handleCreateAgent = async () => {
    try {
      await createSupportAgent(agentForm);
      setShowAgentModal(false);
      setAgentForm({ userId: '', name: '', role: '', status: 'offline', isActive: true });
      loadData();
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;
    try {
      await updateSupportAgent(editingAgent.id, agentForm);
      setShowAgentModal(false);
      setEditingAgent(null);
      setAgentForm({ userId: '', name: '', role: '', status: 'offline', isActive: true });
      loadData();
    } catch (error) {
      console.error('Error updating agent:', error);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this support agent?')) return;
    try {
      await deleteSupportAgent(id);
      loadData();
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const openEditAgent = (agent: SupportAgent) => {
    setEditingAgent(agent);
    setAgentForm({
      userId: agent.userId,
      name: agent.name,
      role: agent.role,
      status: agent.status,
      isActive: agent.isActive
    });
    setShowAgentModal(true);
  };

  const tabs = [
    { id: 'faq' as TabType, label: 'FAQs', icon: HelpCircle, count: faqs.length },
    { id: 'help-articles' as TabType, label: 'Help Articles', icon: BookOpen, count: helpArticles.length },
    { id: 'video-tutorials' as TabType, label: 'Video Tutorials', icon: Video, count: videoTutorials.length },
    { id: 'support-agents' as TabType, label: 'Support Agents', icon: Users, count: supportAgents.length },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Support Content Management</h2>
          <p className="text-gray-600 text-sm mt-1 font-medium">Manage FAQs, Help Articles, Video Tutorials, and Support Agents</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-2 rounded-2xl flex gap-2 border border-white/40 bg-white/40 backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                  : 'text-gray-600 hover:bg-white/50 hover:text-red-600'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Actions */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-4 border border-white/40 bg-white/40 backdrop-blur-md">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab.replace('-', ' ')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/60 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-gray-800 placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => {
            if (activeTab === 'faq') {
              setEditingFAQ(null);
              setFaqForm({ question: '', answer: '', category: 'general', order: 0, isPublished: true });
              setShowFAQModal(true);
            } else if (activeTab === 'help-articles') {
              setEditingArticle(null);
              setArticleForm({ title: '', description: '', content: '', category: 'Getting Started', readTime: '', thumbnail: '', isPublished: true });
              setShowArticleModal(true);
            } else if (activeTab === 'video-tutorials') {
              setEditingVideo(null);
              setVideoForm({ title: '', description: '', videoUrl: '', thumbnail: '', duration: '', category: 'Getting Started', isPublished: true });
              setShowVideoModal(true);
            } else if (activeTab === 'support-agents') {
              setEditingAgent(null);
              setAgentForm({ userId: '', name: '', role: '', status: 'offline', isActive: true });
              setShowAgentModal(true);
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Create New
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 bg-white/40 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="animate-spin text-red-600" size={32} />
          </div>
        ) : (
          <>
            {/* FAQ Tab Content */}
            {activeTab === 'faq' && (
              <div className="p-6">
                <div className="space-y-4">
                  {faqs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No FAQs found. Create your first FAQ!</p>
                    </div>
                  ) : (
                    faqs.map((faq) => (
                      <div key={faq.id} className="bg-white/60 p-4 rounded-xl border border-white/40 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900">{faq.question}</h3>
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                faq.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {faq.isPublished ? 'Published' : 'Draft'}
                              </span>
                              <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                                {faq.category}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{faq.answer}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Views: {faq.views}</span>
                              <span>Order: {faq.order}</span>
                              <span>Created: {new Date(faq.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => openEditFAQ(faq)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteFAQ(faq.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Help Articles Tab Content */}
            {activeTab === 'help-articles' && (
              <div className="p-6">
                <div className="space-y-4">
                  {helpArticles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No help articles found. Create your first article!</p>
                    </div>
                  ) : (
                    helpArticles.map((article) => (
                      <div key={article.id} className="bg-white/60 p-4 rounded-xl border border-white/40 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900">{article.title}</h3>
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                article.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {article.isPublished ? 'Published' : 'Draft'}
                              </span>
                              <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                                {article.category}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{article.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Views: {article.views}</span>
                              <span>Read Time: {article.readTime}</span>
                              <span>Created: {new Date(article.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => openEditArticle(article)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Video Tutorials Tab Content */}
            {activeTab === 'video-tutorials' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoTutorials.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Video size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No video tutorials found. Create your first video!</p>
                    </div>
                  ) : (
                    videoTutorials.map((video) => (
                      <div key={video.id} className="bg-white/60 p-4 rounded-xl border border-white/40 hover:shadow-md transition-all">
                        <div className="mb-3">
                          {video.thumbnail && (
                            <img src={video.thumbnail} alt={video.title} className="w-full h-32 object-cover rounded-lg mb-2" />
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-sm">{video.title}</h3>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                              video.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {video.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                            </span>
                          </div>
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2">{video.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{video.duration}</span>
                            <span>Views: {video.views}</span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">{video.category}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditVideo(video)}
                            className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-semibold"
                          >
                            <Edit size={14} className="inline mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-semibold"
                          >
                            <Trash2 size={14} className="inline mr-1" /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Support Agents Tab Content */}
            {activeTab === 'support-agents' && (
              <div className="p-6">
                <div className="space-y-4">
                  {supportAgents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No support agents found. Create your first agent!</p>
                    </div>
                  ) : (
                    supportAgents.map((agent) => (
                      <div key={agent.id} className="bg-white/60 p-4 rounded-xl border border-white/40 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900">{agent.name}</h3>
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                agent.status === 'online' ? 'bg-green-100 text-green-700' :
                                agent.status === 'away' ? 'bg-yellow-100 text-yellow-700' :
                                agent.status === 'busy' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {agent.status}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                agent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {agent.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{agent.role}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>User ID: {agent.userId}</span>
                              {agent.user?.email && <span>Email: {agent.user.email}</span>}
                              {agent.lastSeen && <span>Last Seen: {new Date(agent.lastSeen).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => openEditAgent(agent)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAQ Modal */}
      {showFAQModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editingFAQ ? 'Edit FAQ' : 'Create FAQ'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Question</label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Answer</label>
                <textarea
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Category</label>
                  <select
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="leasing">Leasing</option>
                    <option value="finance">Finance</option>
                    <option value="properties">Properties</option>
                    <option value="reports">Reports</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Order</label>
                  <input
                    type="number"
                    value={faqForm.order}
                    onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={faqForm.isPublished}
                  onChange={(e) => setFaqForm({ ...faqForm, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-semibold">Published</label>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowFAQModal(false);
                    setEditingFAQ(null);
                    setFaqForm({ question: '', answer: '', category: 'general', order: 0, isPublished: true });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingFAQ ? handleUpdateFAQ : handleCreateFAQ}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  {editingFAQ ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Article Modal */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editingArticle ? 'Edit Help Article' : 'Create Help Article'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  value={articleForm.description}
                  onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Content</label>
                <textarea
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Category</label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Getting Started">Getting Started</option>
                    <option value="Finance">Finance</option>
                    <option value="Communication">Communication</option>
                    <option value="Leasing">Leasing</option>
                    <option value="Reports">Reports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Read Time</label>
                  <input
                    type="text"
                    value={articleForm.readTime}
                    onChange={(e) => setArticleForm({ ...articleForm, readTime: e.target.value })}
                    placeholder="e.g., 8 min read"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Thumbnail URL</label>
                  <input
                    type="text"
                    value={articleForm.thumbnail}
                    onChange={(e) => setArticleForm({ ...articleForm, thumbnail: e.target.value })}
                    placeholder="Image URL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={articleForm.isPublished}
                  onChange={(e) => setArticleForm({ ...articleForm, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-semibold">Published</label>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowArticleModal(false);
                    setEditingArticle(null);
                    setArticleForm({ title: '', description: '', content: '', category: 'Getting Started', readTime: '', thumbnail: '', isPublished: true });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingArticle ? handleUpdateArticle : handleCreateArticle}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  {editingArticle ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Tutorial Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editingVideo ? 'Edit Video Tutorial' : 'Create Video Tutorial'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Video URL</label>
                <input
                  type="text"
                  value={videoForm.videoUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                  placeholder="YouTube, Vimeo, or direct link"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Thumbnail URL</label>
                  <input
                    type="text"
                    value={videoForm.thumbnail}
                    onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    value={videoForm.duration}
                    onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                    placeholder="e.g., 12:30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Category</label>
                  <select
                    value={videoForm.category}
                    onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Getting Started">Getting Started</option>
                    <option value="Properties">Properties</option>
                    <option value="Tenants">Tenants</option>
                    <option value="Finance">Finance</option>
                    <option value="Reports">Reports</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={videoForm.isPublished}
                  onChange={(e) => setVideoForm({ ...videoForm, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-semibold">Published</label>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setEditingVideo(null);
                    setVideoForm({ title: '', description: '', videoUrl: '', thumbnail: '', duration: '', category: 'Getting Started', isPublished: true });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingVideo ? handleUpdateVideo : handleCreateVideo}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  {editingVideo ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editingAgent ? 'Edit Support Agent' : 'Create Support Agent'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">User ID</label>
                <input
                  type="text"
                  value={agentForm.userId}
                  onChange={(e) => setAgentForm({ ...agentForm, userId: e.target.value })}
                  placeholder="User ID from users table"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Role</label>
                <input
                  type="text"
                  value={agentForm.role}
                  onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value })}
                  placeholder="e.g., Senior Support, Technical Support"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Status</label>
                  <select
                    value={agentForm.status}
                    onChange={(e) => setAgentForm({ ...agentForm, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="online">Online</option>
                    <option value="away">Away</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    checked={agentForm.isActive}
                    onChange={(e) => setAgentForm({ ...agentForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-semibold">Active</label>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAgentModal(false);
                    setEditingAgent(null);
                    setAgentForm({ userId: '', name: '', role: '', status: 'offline', isActive: true });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingAgent ? handleUpdateAgent : handleCreateAgent}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  {editingAgent ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportContent;

