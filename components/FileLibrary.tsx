import React, { useState, useRef, useEffect } from 'react';
import { FileAsset } from '../types';
import {
  FileText, Download, Search, Plus,
  Smartphone, Globe, Server, HelpCircle, BookOpen, LayoutTemplate, Filter,
  Eye, Save, Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  ChevronLeft, Wand2, FileQuestion, ChevronDown, Briefcase, Loader
} from 'lucide-react';
import { generateDocumentTemplate } from '../services/geminiService';
import { getSystemDetails } from '../utils/uiHelpers';
import { getDocuments, uploadDocument, updateDocumentStatus, Document } from '../services/fileService';

const FileLibrary: React.FC = () => {
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'creator'>('list');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSystem, setFilterSystem] = useState('4'); // Default to Rent Mgmt System
  const [loadError, setLoadError] = useState('');
  
  // Creator State
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docCategory, setDocCategory] = useState<'Template' | 'Legal' | 'FAQ' | 'Guide' | 'Book' | 'News' | 'Tutorial' | 'Handbook' | 'HowTo'>('Template');
  const [docSection, setDocSection] = useState('tenant-onboarding');
  const [docCountry, setDocCountry] = useState<'ALL' | 'UK' | 'NG' | 'US' | 'IE'>('ALL');
  const [docSystemId, setDocSystemId] = useState('4'); // Rent Mgmt System
  const [previewMode, setPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const documents = await getDocuments();
      const mappedFiles: FileAsset[] = documents.map((doc: Document) => {
        const categoryMatch = doc.documentName.match(/^\[(Template|Guide|Legal|FAQ|Book|News|Tutorial|Handbook|HowTo)\]/i);
        return {
        id: doc.id,
        name: doc.documentName,
        size: doc.size || '0 KB',
        type: doc.type?.split('/')[1]?.toUpperCase() || 'FILE',
        uploadedAt: new Date(doc.createdAt).toISOString().split('T')[0],
        category: (categoryMatch?.[1] || doc.docType || 'Template') as FileAsset['category'],
        systemId: (doc as Document & { systemId?: string }).systemId || '4',
        status: (doc as Document & { isPublished?: boolean }).isPublished === false ? 'Draft' : 'Published',
        url: doc.documentUrl?.[0] || '',
      };
      });
      setFiles(mappedFiles);
    } catch (error: any) {
      setLoadError(error?.message || 'Documents could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Normalize category matching (handle case-insensitive and partial matches)
    const fileCategory = f.category.toLowerCase();
    const activeCat = activeCategory.toLowerCase();
    const matchesCategory = activeCategory === 'all' || 
                           fileCategory === activeCat || 
                           (activeCat === 'faq' && fileCategory === 'faq') ||
                           (activeCat === 'template' && fileCategory === 'template') ||
                           (activeCat === 'legal' && fileCategory === 'legal') ||
                           (activeCat === 'guide' && fileCategory === 'guide') ||
                           (activeCat === 'book' && fileCategory === 'book') ||
                           (activeCat === 'news' && fileCategory === 'news') ||
                           (activeCat === 'tutorial' && fileCategory === 'tutorial') ||
                           (activeCat === 'handbook' && fileCategory === 'handbook') ||
                           (activeCat === 'howto' && fileCategory === 'howto');
    const matchesSystem = filterSystem === 'all' || f.systemId === filterSystem;
    return matchesSearch && matchesCategory && matchesSystem;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'draft' | 'publish'>('draft');

  const handleSaveDocument = async () => {
    if(!docTitle || !docContent.trim()) {
      alert('Please provide a title and content for the document');
      return;
    }
    
    // Convert HTML content to blob and upload
    try {
      setIsSaving(true);
      
      // Include category in document name for proper categorization
      const categoryPrefix = docCategory === 'FAQ' ? '[FAQ]' : 
                            docCategory === 'Template' ? '[Template]' :
                            docCategory === 'Guide' ? '[Guide]' :
                            docCategory === 'Legal' ? '[Legal]' :
                            docCategory === 'Book' ? '[Book]' :
                            docCategory === 'News' ? '[News]' :
                            docCategory === 'Tutorial' ? '[Tutorial]' :
                            docCategory === 'Handbook' ? '[Handbook]' :
                            docCategory === 'HowTo' ? '[HowTo]' : '';
      // Vendor App library sections use vendor-library routing; landlord templates keep templates:*.
      const isVendorLibrary = docSystemId === '2' || docSection.startsWith('vendor-');
      const routingPrefix = isVendorLibrary ? 'vendor-library' : 'templates';
      const routingSuffix = docCountry === 'ALL'
        ? `[${routingPrefix}:${docSection}]`
        : `[${routingPrefix}:${docSection}:${docCountry}]`;
      const documentName = categoryPrefix
        ? `${categoryPrefix} ${docTitle} ${routingSuffix}`
        : `${docTitle} ${routingSuffix}`;
      
      const blob = new Blob([docContent], { type: 'text/html' });
      const file = new File([blob], `${documentName}.html`, { type: 'text/html' });
      
      const isPublished = publishStatus === 'publish';
      await uploadDocument(file, documentName, docCategory, docSystemId, isPublished);
      await loadFiles(); // Refresh files
      
      setViewMode('list');
      // Reset form
      setDocTitle('');
      setDocContent('');
      setDocCategory('Template');
      setDocSection('tenant-onboarding');
      setDocCountry('ALL');
      setPublishStatus('draft');
      alert('Document saved successfully!');
    } catch (error: any) {
      console.error('Error saving document:', error);
      alert(`Error saving document: ${error.message || 'Please try again'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!docTitle) return;
    setIsGenerating(true);
    const template = await generateDocumentTemplate(docTitle, docCategory);
    setDocContent(template);
    if (editorRef.current) editorRef.current.innerHTML = template;
    setIsGenerating(false);
  };

  const formatDoc = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) setDocContent(editorRef.current.innerHTML);
  };

  const getFileIcon = (type: string, category: string) => {
    if (category === 'Template') return <LayoutTemplate className="text-purple-500" />;
    if (category === 'Guide') return <BookOpen className="text-blue-500" />;
    if (category === 'Book') return <BookOpen className="text-red-600" />;
    if (category === 'News') return <Globe className="text-orange-500" />;
    if (category === 'Tutorial') return <Smartphone className="text-indigo-600" />;
    if (category === 'HowTo') return <ListOrdered className="text-sky-600" />;
    if (category === 'Handbook') return <BookOpen className="text-emerald-700" />;
    if (category === 'Legal') return <Briefcase className="text-amber-600" />;
    if (category === 'FAQ') return <HelpCircle className="text-green-500" />;
    return <FileText className="text-gray-500" />;
  };

  if (viewMode === 'creator') {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('list')} className="p-2 bg-white/40 hover:bg-white/80 rounded-xl transition-colors"><ChevronLeft size={24} className="text-gray-600" /></button>
            <div>
              <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Document Creator</h2>
              <p className="text-gray-600 text-sm font-medium">Create new resources for the Asher Library.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPreviewMode(!previewMode)} className="px-5 py-2.5 bg-white/40 hover:bg-white/60 rounded-xl font-bold text-gray-600 transition-colors flex items-center gap-2 border border-white/40">
               <Eye size={18} />{previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
            <div className="flex items-center gap-2">
              <select 
                value={publishStatus} 
                onChange={(e) => setPublishStatus(e.target.value as 'draft' | 'publish')}
                className="px-4 py-2.5 bg-white/40 hover:bg-white/60 rounded-xl font-bold text-gray-700 transition-colors border border-white/40 cursor-pointer"
              >
                <option value="draft">Save as Draft</option>
                <option value="publish">Publish</option>
              </select>
            </div>
            <button 
              onClick={handleSaveDocument} 
              disabled={isSaving}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
               {isSaving ? 'Saving...' : publishStatus === 'publish' ? 'Publish Document' : 'Save Document'}
            </button>
          </div>
        </div>

        <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col relative border border-white/40 shadow-2xl">
           <div className="p-4 border-b border-white/30 bg-white/20 backdrop-blur-md grid grid-cols-12 gap-4 items-center z-10">
              <div className="col-span-4">
                 <input type="text" placeholder="Enter Document Title..." value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="w-full bg-transparent text-xl font-bold outline-none border-b-2 border-transparent focus:border-red-400 placeholder-gray-400 text-gray-800" />
              </div>
              <div className="col-span-8 flex gap-4 justify-end items-center">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Category</span>
                    <select
                      value={docCategory}
                      onChange={(e) => {
                        const next = e.target.value as typeof docCategory;
                        setDocCategory(next);
                        if (next === 'Book') {
                          setDocSystemId('2');
                          setDocSection('books');
                        } else if (next === 'News') {
                          setDocSystemId('2');
                          setDocSection('news');
                        } else if (next === 'Tutorial') {
                          setDocSystemId('2');
                          setDocSection('tutorials');
                          setDocCountry('ALL');
                        } else if (next === 'HowTo') {
                          setDocSystemId('2');
                          setDocSection('howtos');
                          setDocCountry('ALL');
                        } else if (next === 'Handbook') {
                          setDocSystemId('2');
                          setDocSection('handbooks');
                        }
                      }}
                      className="glass-input py-1.5 px-3 rounded-lg text-sm font-bold cursor-pointer bg-white/40"
                    >
                       <option value="Template">Template</option>
                       <option value="Guide">Guide</option>
                       <option value="FAQ">FAQ</option>
                       <option value="Legal">Legal Doc</option>
                       <option value="Tutorial">Vendor Tutorial</option>
                       <option value="HowTo">Vendor How-to</option>
                       <option value="Handbook">Vendor Handbook</option>
                       <option value="Book">Vendor Book</option>
                       <option value="News">Vendor News</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Section</span>
                    <select value={docSection} onChange={(e) => setDocSection(e.target.value)} className="glass-input py-1.5 px-3 rounded-lg text-sm font-bold cursor-pointer bg-white/40">
                       <option value="tenant-onboarding">Tenant onboarding</option>
                       <option value="property-operations">Property operations</option>
                       <option value="legal-compliance">Legal &amp; compliance</option>
                       <option value="financial-reporting">Financial reporting</option>
                       <option value="tutorials">Vendor tutorials</option>
                       <option value="howtos">Vendor how-tos</option>
                       <option value="handbooks">Vendor handbooks</option>
                       <option value="books">Vendor books</option>
                       <option value="news">Vendor news (goods &amp; services)</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Market</span>
                    <select value={docCountry} onChange={(e) => setDocCountry(e.target.value as typeof docCountry)} className="glass-input py-1.5 px-3 rounded-lg text-sm font-bold cursor-pointer bg-white/40">
                       <option value="ALL">All markets</option>
                       <option value="UK">United Kingdom</option>
                       <option value="NG">Nigeria</option>
                       <option value="US">United States</option>
                       <option value="IE">Ireland</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">System</span>
                    <select value={docSystemId} onChange={(e) => setDocSystemId(e.target.value)} className="glass-input py-1.5 px-3 rounded-lg text-sm font-bold cursor-pointer bg-white/40">
                       <option value="5">Admin System</option>
                       <option value="1">Tenant Portal</option>
                       <option value="2">Vendor App</option>
                       <option value="4">Rent Mgmt</option>
                    </select>
                 </div>
                 <button 
                    onClick={handleAiGenerate} 
                    disabled={isGenerating || !docTitle} 
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                 >
                    <Wand2 size={14} /> {isGenerating ? 'Generating...' : 'AI Generate Content'}
                 </button>
              </div>
           </div>

           {!previewMode && (
             <div className="px-4 py-2 border-b border-white/30 bg-gray-50/80 flex gap-1 overflow-x-auto z-10 backdrop-blur-md">
                <button onMouseDown={(e) => {e.preventDefault(); formatDoc('bold')}} className="p-2 hover:bg-white hover:text-red-600 rounded transition text-gray-600" title="Bold"><Bold size={18}/></button>
                <button onMouseDown={(e) => {e.preventDefault(); formatDoc('italic')}} className="p-2 hover:bg-white hover:text-red-600 rounded transition text-gray-600" title="Italic"><Italic size={18}/></button>
                <button onMouseDown={(e) => {e.preventDefault(); formatDoc('underline')}} className="p-2 hover:bg-white hover:text-red-600 rounded transition text-gray-600" title="Underline"><Underline size={18}/></button>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <button onMouseDown={(e) => {e.preventDefault(); formatDoc('formatBlock', 'H1')}} className="p-2 hover:bg-white hover:text-red-600 rounded transition text-gray-600" title="H1"><Heading1 size={18}/></button>
                <button onMouseDown={(e) => {e.preventDefault(); formatDoc('formatBlock', 'H2')}} className="p-2 hover:bg-white hover:text-red-600 rounded transition text-gray-600" title="H2"><Heading2 size={18}/></button>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <button onMouseDown={(e) => {e.preventDefault(); formatDoc('insertUnorderedList')}} className="p-2 hover:bg-white hover:text-red-600 rounded transition text-gray-600" title="List"><List size={18}/></button>
                <button onMouseDown={(e) => {e.preventDefault(); formatDoc('insertOrderedList')}} className="p-2 hover:bg-white hover:text-red-600 rounded transition text-gray-600" title="Ordered List"><ListOrdered size={18}/></button>
             </div>
           )}

           <div className="flex-1 bg-gray-100/50 relative overflow-y-auto custom-scrollbar flex justify-center p-8" onClick={() => !previewMode && editorRef.current?.focus()}>
              {previewMode ? (
                 <iframe title="Document preview" sandbox="" srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Inter,Arial,sans-serif;line-height:1.55;color:#1f2937;margin:20mm}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d1d5db;padding:8px}</style></head><body>${docContent}</body></html>`} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-sm animate-in fade-in" />
              ) : (
                 <div 
                    ref={editorRef} 
                    contentEditable 
                    onInput={() => setDocContent(editorRef.current?.innerHTML || '')} 
                    className="w-[210mm] min-h-[1123px] bg-white shadow-xl rounded-sm p-[20mm] outline-none prose prose-lg prose-red max-w-none focus:ring-2 focus:ring-red-500/20 transition-shadow"
                    data-placeholder="Start typing or use AI to generate content..."
                 />
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Sidebar Categories */}
      <div className="w-64 flex flex-col glass-panel rounded-3xl overflow-hidden border border-white/40">
         <div className="p-6 border-b border-white/30 bg-white/20 backdrop-blur-md">
            <h3 className="font-bold text-gray-800 text-lg">Asher Library</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">Centralized Knowledge Base</p>
         </div>
         <div className="p-4 space-y-1 flex-1 overflow-y-auto">
            {[
               { id: 'all', label: 'All Documents', icon: FileText },
               { id: 'template', label: 'Templates', icon: LayoutTemplate },
               { id: 'legal', label: 'Legal Docs', icon: Briefcase },
               { id: 'faq', label: 'FAQ', icon: HelpCircle },
               { id: 'guide', label: 'Guides', icon: BookOpen },
               { id: 'tutorial', label: 'Vendor Tutorials', icon: Smartphone },
               { id: 'howto', label: 'Vendor How-tos', icon: ListOrdered },
               { id: 'handbook', label: 'Vendor Handbooks', icon: BookOpen },
               { id: 'book', label: 'Vendor Books', icon: BookOpen },
               { id: 'news', label: 'Vendor News', icon: Globe },
            ].map(cat => (
               <button 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.id)} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                     activeCategory === cat.id 
                     ? 'bg-red-50 text-red-700 shadow-sm border border-red-100' 
                     : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                  }`}
               >
                  <cat.icon size={18} className={activeCategory === cat.id ? 'text-red-500' : 'text-gray-400'}/>
                  {cat.label}
               </button>
            ))}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
         {/* Toolbar */}
         <div className="flex justify-between items-end gap-4">
            <div className="flex flex-1 gap-4">
               <div className="flex-1 max-w-xl relative">
                  <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                  <input 
                     type="text" 
                     placeholder="Search file name..." 
                     value={searchQuery} 
                     onChange={(e) => setSearchQuery(e.target.value)} 
                     className="glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                  />
               </div>
               <div className="relative min-w-[200px]">
                  <div className="absolute left-4 top-3 text-gray-400 pointer-events-none"><Filter size={20}/></div>
                  <select 
                     value={filterSystem} 
                     onChange={(e) => setFilterSystem(e.target.value)} 
                     className="glass-input w-full pl-12 pr-8 py-3 rounded-2xl text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                  >
                     <option value="all">All Systems</option>
                     <option value="4">Rent Mgmt System</option>
                     <option value="1">Tenant Portal</option>
                     <option value="2">Vendor App</option>
                     <option value="3">Listing Website</option>
                     <option value="5">Admin</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-400 pointer-events-none"/>
               </div>
            </div>
            <button onClick={() => setViewMode('creator')} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-red-700 transition hover:shadow-red-500/30">
               <Plus size={20} />Create Doc
            </button>
         </div>

         {/* File List */}
         {loadError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{loadError} <button onClick={() => void loadFiles()} className="font-bold underline">Try again</button></div>}
         <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col border border-white/40 shadow-xl">
            <div className="p-4 border-b border-white/40 bg-white/20 flex justify-between items-center backdrop-blur-md">
               <h4 className="font-bold text-gray-700 ml-2 flex items-center gap-2"><Server size={18}/> System Assets</h4>
               <span className="text-xs font-bold text-gray-500 bg-white/40 px-3 py-1 rounded-full">{filteredFiles.length} Files</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
               {loading ? (
                  <div className="flex items-center justify-center h-64">
                     <Loader className="animate-spin text-red-600" size={32} />
                  </div>
               ) : filteredFiles.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-white/10 text-xs font-bold text-gray-500 uppercase">
                        <tr>
                           <th className="p-4 pl-6">File Name</th>
                           <th className="p-4">Category</th>
                           <th className="p-4">System</th>
                           <th className="p-4">Status</th>
                           <th className="p-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/20">
                        {filteredFiles.map((file) => {
                           const sysDetails = getSystemDetails(file.systemId);
                           return (
                              <tr key={file.id} className="group hover:bg-white/40 transition-colors">
                                 <td className="p-4 pl-6">
                                    <div className="flex items-center gap-4">
                                       <div className="p-3 bg-white/60 rounded-2xl text-gray-600 shadow-sm border border-white/50">
                                          {getFileIcon(file.type, file.category)}
                                       </div>
                                       <div>
                                          <p className="font-bold text-gray-800 text-sm">{file.name}</p>
                                          <p className="text-xs text-gray-500 font-medium">{file.size} • {file.uploadedAt}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-4">
                                    <span className="text-xs font-bold bg-white/50 border border-white/50 px-2.5 py-1 rounded-lg text-gray-600">{file.category}</span>
                                 </td>
                                 <td className="p-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                       <span className={`w-2 h-2 rounded-full ${sysDetails.color.split(' ')[0].replace('text', 'bg')}`}></span>
                                       {sysDetails.name}
                                    </div>
                                 </td>
                                 <td className="p-4"><span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${file.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{file.status}</span></td>
                                 <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => void updateDocumentStatus(file.id, file.status !== 'Published').then(loadFiles).catch((e) => setLoadError(e?.message || 'Publish status could not be updated.'))} className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-red-600 hover:bg-white rounded-xl transition">{file.status === 'Published' ? 'Unpublish' : 'Publish'}</button>
                                       <button
                                          onClick={() => file.url && window.open(file.url, '_blank', 'noopener,noreferrer')}
                                          disabled={!file.url}
                                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-xl transition disabled:opacity-30 disabled:hover:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                          title={file.url ? 'Download' : 'No file URL available'}
                                       >
                                          <Download size={18} />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                     <FileQuestion size={48} className="mb-3 opacity-20" />
                     <p className="font-medium">No documents found.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default FileLibrary;
