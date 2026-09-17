import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { 
  FileText, UploadCloud, Search, Edit2, Trash2, X, Music, SortDesc, SortAsc, FileOutput, RefreshCcw
} from "lucide-react";

export default function SongLyrics() {
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'list'
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // List state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest"); // 'newest', 'oldest', 'alphabetical'

  // Upload state
  const [uploadStep, setUploadStep] = useState(1); // 1 = File Select, 2 = Edit & Review Details
  const [selectedFile, setSelectedFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Upload Fields
  const [uploadTitleTamil, setUploadTitleTamil] = useState("");
  const [uploadTitleEnglish, setUploadTitleEnglish] = useState("");
  const [uploadTitleSource, setUploadTitleSource] = useState("generated"); // 'generated' | 'manual'
  
  const [uploadLyricsTamil, setUploadLyricsTamil] = useState("");
  const [uploadLyricsThanglish, setUploadLyricsThanglish] = useState("");
  const [uploadThanglishStatus, setUploadThanglishStatus] = useState("needs_review");
  const [uploadThanglishSource, setUploadThanglishSource] = useState("manual");

  // Edit State
  const [editingSong, setEditingSong] = useState(null);
  const [editTitleTamil, setEditTitleTamil] = useState("");
  const [editTitleEnglish, setEditTitleEnglish] = useState("");
  const [editTitleSource, setEditTitleSource] = useState("manual");
  
  const [editLyricsTamil, setEditLyricsTamil] = useState("");
  const [editLyricsThanglish, setEditLyricsThanglish] = useState("");
  const [editThanglishStatus, setEditThanglishStatus] = useState("needs_review");
  const [editThanglishSource, setEditThanglishSource] = useState("manual");
  const [editFile, setEditFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const scrollContainerRef = useRef(null);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === "list") {
      fetchSongs();
    }
  }, [activeTab, searchQuery, sortOption]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, activeTab]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/song-lyrics?search=${encodeURIComponent(searchQuery)}&sort=${sortOption}`);
      setSongs(res.data.data);
    } catch (err) {
      toast.error("Failed to load songs");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(songs.length / ITEMS_PER_PAGE);
  const currentSongs = songs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* =========================
     LIVE TITLE TRANSLITERATION
  ========================= */
  useEffect(() => {
    if (uploadTitleSource === "manual" || activeTab !== "upload" || uploadStep !== 2) return;
    
    if (!uploadTitleTamil.trim()) {
      setUploadTitleEnglish("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await API.post('/song-lyrics/regenerate-thanglish', { lyricsTamil: uploadTitleTamil });
        setUploadTitleEnglish(res.data.data.lyricsThanglish);
      } catch (e) {
        // Silently fail for live typing to not disturb the user
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [uploadTitleTamil, uploadTitleSource, uploadStep, activeTab]);

  useEffect(() => {
    if (editTitleSource === "manual" || !editingSong) return;

    if (!editTitleTamil.trim()) {
      setEditTitleEnglish("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await API.post('/song-lyrics/regenerate-thanglish', { lyricsTamil: editTitleTamil });
        setEditTitleEnglish(res.data.data.lyricsThanglish);
      } catch (e) {
        // Silently fail
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [editTitleTamil, editTitleSource, editingSong]);


  /* =========================
     UPLOAD HANDLERS
  ========================= */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0], setSelectedFile);
    }
  };

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0], setter);
    }
  };

  const validateAndSetFile = (file, setter) => {
    const validTypes = [
      "text/plain", 
      "application/vnd.ms-powerpoint", 
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    const validExts = [".txt", ".ppt", ".pptx"];
    
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      toast.error("Unsupported file type. Please upload a TXT, PPT, or PPTX file.");
      return;
    }
    
    setter(file);
  };

  // Step 1: Extract Text & Generate Preview
  const handleExtractPreview = async () => {
    if (!selectedFile) return toast.error("Please select a file to extract.");
    
    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await API.post("/song-lyrics/extract-preview", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { lyricsTamil, lyricsThanglish, thanglishStatus, thanglishSource } = res.data.data;
      
      setUploadLyricsTamil(lyricsTamil || "");
      setUploadLyricsThanglish(lyricsThanglish || "");
      setUploadThanglishStatus(thanglishStatus || "needs_review");
      setUploadThanglishSource(thanglishSource || "manual");
      
      // Auto-extract title from filename if possible
      const baseName = selectedFile.name.split('.').slice(0, -1).join('.');
      setUploadTitleSource("generated"); // Re-enable title auto-generation for the new file
      if (/[\u0B80-\u0BFF]/.test(baseName)) {
         setUploadTitleTamil(baseName);
      } else {
         setUploadTitleEnglish(baseName);
         setUploadTitleSource("manual"); // If it's English, we lock it so it doesn't get erased
      }
      
      setUploadStep(2);
    } catch (err) {
      toast.error("File processing error. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUploadThanglishChange = (val) => {
    setUploadLyricsThanglish(val);
    setUploadThanglishSource("manual");
    if (val.trim()) {
      setUploadThanglishStatus("available");
    } else {
      setUploadThanglishStatus("needs_review");
    }
  };

  const handleUploadTitleEnglishChange = (val) => {
    setUploadTitleEnglish(val);
    setUploadTitleSource("manual");
  };

  const handleRegenerateUploadTitle = async () => {
    if (!window.confirm("Regenerate Thanglish title?\n\nThis will replace your current Thanglish title.")) return;
    setIsRegeneratingTitle(true);
    try {
      const res = await API.post('/song-lyrics/regenerate-thanglish', { lyricsTamil: uploadTitleTamil });
      setUploadTitleEnglish(res.data.data.lyricsThanglish);
      setUploadTitleSource("generated");
    } catch(e) {
      toast.error("Failed to generate title.");
    } finally {
      setIsRegeneratingTitle(false);
    }
  };

  // Step 2: Final Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitleTamil.trim() || !uploadTitleEnglish.trim()) {
      return toast.error("Both Tamil and English titles are required");
    }
    if (!selectedFile) {
      return toast.error("File is missing. Please go back to step 1.");
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("titleTamil", uploadTitleTamil.trim());
    formData.append("titleEnglish", uploadTitleEnglish.trim());
    formData.append("lyricsText", uploadLyricsTamil);
    formData.append("lyricsThanglish", uploadLyricsThanglish);
    formData.append("thanglishStatus", uploadThanglishStatus);
    formData.append("thanglishSource", uploadThanglishSource);
    formData.append("file", selectedFile);

    try {
      await API.post("/song-lyrics", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Song uploaded successfully!");
      resetUploadState();
      setActiveTab("list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to upload song.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadState = () => {
    setUploadStep(1);
    setSelectedFile(null);
    setUploadTitleTamil("");
    setUploadTitleEnglish("");
    setUploadTitleSource("generated");
    setUploadLyricsTamil("");
    setUploadLyricsThanglish("");
    setUploadThanglishStatus("needs_review");
    setUploadThanglishSource("manual");
  };

  /* =========================
     EDIT / DELETE HANDLERS
  ========================= */
  const openEdit = async (song) => {
    setEditingSong(song);
    setEditTitleTamil(song.titleTamil || song.title || "");
    setEditTitleEnglish(song.titleEnglish || "");
    setEditTitleSource("manual"); // Ensure we don't accidentally overwrite existing titles
    setEditFile(null);

    // Fetch the full lyrics payload for editing since the list excludes it
    try {
      const res = await API.get(`/song-lyrics/${song._id}`);
      const data = res.data.data;
      setEditLyricsTamil(data.lyricsText || "");
      setEditLyricsThanglish(data.lyricsThanglish || "");
      setEditThanglishStatus(data.thanglishStatus || "needs_review");
      setEditThanglishSource(data.thanglishSource || "manual");
    } catch(e) {
      toast.error("Failed to load full song details");
    }
  };

  const closeEdit = () => {
    setEditingSong(null);
    setEditTitleTamil("");
    setEditTitleEnglish("");
    setEditTitleSource("manual");
    setEditLyricsTamil("");
    setEditLyricsThanglish("");
    setEditThanglishStatus("needs_review");
    setEditThanglishSource("manual");
    setEditFile(null);
  };

  const handleEditTitleEnglishChange = (val) => {
    setEditTitleEnglish(val);
    setEditTitleSource("manual");
  };

  const handleRegenerateEditTitle = async () => {
    if (!window.confirm("Regenerate Thanglish title?\n\nThis will replace the current Thanglish title.")) return;
    setIsRegeneratingTitle(true);
    try {
      const res = await API.post('/song-lyrics/regenerate-thanglish', { lyricsTamil: editTitleTamil });
      setEditTitleEnglish(res.data.data.lyricsThanglish);
      setEditTitleSource("generated");
    } catch(e) {
      toast.error("Failed to generate title.");
    } finally {
      setIsRegeneratingTitle(false);
    }
  };

  const handleEditThanglishChange = (val) => {
    setEditLyricsThanglish(val);
    setEditThanglishSource("manual");
    if (val.trim()) {
      setEditThanglishStatus("available");
    } else {
      setEditThanglishStatus("needs_review");
    }
  };

  const handleRegenerateThanglish = async () => {
    if (!window.confirm("Regenerate Thanglish?\n\nThis will replace the current Thanglish lyrics.")) return;
    
    setIsRegenerating(true);
    try {
       const res = await API.post('/song-lyrics/regenerate-thanglish', { lyricsTamil: editLyricsTamil });
       setEditLyricsThanglish(res.data.data.lyricsThanglish);
       setEditThanglishStatus("available");
       setEditThanglishSource("generated");
       toast.success("Thanglish regenerated successfully!");
    } catch(e) {
       toast.error("Thanglish could not be generated automatically. You can add it manually.");
    } finally {
       setIsRegenerating(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitleTamil.trim() || !editTitleEnglish.trim()) {
      return toast.error("Both Tamil and English titles are required");
    }

    setIsEditing(true);
    const formData = new FormData();
    formData.append("titleTamil", editTitleTamil.trim());
    formData.append("titleEnglish", editTitleEnglish.trim());
    formData.append("lyricsText", editLyricsTamil);
    formData.append("lyricsThanglish", editLyricsThanglish);
    formData.append("thanglishStatus", editThanglishStatus);
    formData.append("thanglishSource", editThanglishSource);
    
    if (editFile) {
      formData.append("file", editFile);
    }

    try {
      await API.put(`/song-lyrics/${editingSong._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Song updated successfully!");
      closeEdit();
      fetchSongs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update song.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this song?")) {
      try {
        await API.delete(`/song-lyrics/${id}`);
        toast.success("Song deleted successfully");
        if (currentSongs.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        fetchSongs();
      } catch (err) {
        toast.error("Failed to delete song");
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen w-full flex-col bg-[#F4EFE7]">
      {/* Header */}
      <div className="flex-none bg-white px-6 py-4 shadow-sm md:px-8">
        <h1 className="text-xl font-bold text-[#531B24] flex items-center gap-2">
          <Music className="w-6 h-6" />
          Song Lyrics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your church song lyrics, titles, and presentations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-none px-6 md:px-8 pt-6 pb-2 border-b border-slate-200 bg-[#F4EFE7]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("upload")}
            className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
              activeTab === "upload" 
                ? "border-[#531B24] text-[#531B24]" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Upload Song
          </button>
          <button
            onClick={() => { setActiveTab("list"); resetUploadState(); }}
            className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
              activeTab === "list" 
                ? "border-[#531B24] text-[#531B24]" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Song List
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 md:px-8 admin-scrollbar">
        
        {/* =========================
            UPLOAD TAB
        ========================= */}
        {activeTab === "upload" && (
          <div className="max-w-4xl bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in mx-auto">
            
            {/* Step 1: File Selection */}
            {uploadStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-800">Step 1: Choose File</h2>
                  <p className="text-sm text-slate-500 mt-2">Select a file. We will extract the lyrics and automatically generate Thanglish if possible.</p>
                </div>
                <div>
                  <div 
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-12 transition-colors ${
                      dragActive ? "border-[#531B24] bg-[#531B24]/5" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mb-4" />
                    <p className="text-sm sm:text-base text-slate-700 font-medium mb-1 text-center">Drag & drop your file here</p>
                    <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center">or click to browse</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-[#531B24] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#6c232f] transition-colors w-full sm:w-auto"
                    >
                      Choose File
                    </button>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-6 font-semibold uppercase tracking-wider text-center">
                      TXT • PPT • PPTX
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".txt,.ppt,.pptx,text/plain,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={(e) => handleFileChange(e, setSelectedFile)}
                    />
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200 animate-fade-in">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden w-full sm:w-auto">
                      <FileText className="w-8 h-8 text-[#531B24] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExtractPreview}
                      disabled={isExtracting}
                      className="w-full sm:w-auto justify-center rounded-xl bg-[#531B24] px-5 py-2.5 sm:py-2 text-sm font-bold text-white transition-all hover:bg-[#6c232f] disabled:opacity-50 disabled:cursor-wait flex items-center gap-2 shadow-sm"
                    >
                      {isExtracting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Generating Thanglish...
                        </>
                      ) : (
                        <>
                          <FileOutput className="w-4 h-4" /> Next Step
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Edit & Review */}
            {uploadStep === 2 && (
              <form onSubmit={handleUploadSubmit} className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Step 2: Review & Submit</h2>
                    <p className="text-sm text-slate-500 mt-1">Verify titles and lyrics before saving.</p>
                  </div>
                  <button type="button" onClick={() => setUploadStep(1)} className="text-sm font-medium text-slate-500 hover:text-slate-800">
                    &larr; Back to File Selection
                  </button>
                </div>

                {uploadThanglishStatus === "needs_review" && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <span className="text-amber-500 mt-0.5">⚠️</span>
                    <p className="text-sm text-amber-800 font-medium">Thanglish could not be generated automatically or needs review. You can add it manually in the Thanglish lyrics field.</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Song Title (Tamil) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadTitleTamil}
                      onChange={(e) => setUploadTitleTamil(e.target.value)}
                      placeholder="e.g. ஆத்துமமே என் முழு உள்ளமே"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24]"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                      <label className="block text-sm font-semibold text-slate-700">
                        Song Title (English / Thanglish) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateUploadTitle}
                        disabled={isRegeneratingTitle || !uploadTitleTamil.trim()}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-2 py-1 rounded transition-colors disabled:opacity-50"
                        title="Regenerate Thanglish Title"
                      >
                        <RefreshCcw className={`w-3 h-3 ${isRegeneratingTitle ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={uploadTitleEnglish}
                      onChange={(e) => handleUploadTitleEnglishChange(e.target.value)}
                      placeholder="e.g. Aathumamae En Muzhu Ullamae"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Tamil Lyrics
                    </label>
                    <textarea
                      value={uploadLyricsTamil}
                      onChange={(e) => setUploadLyricsTamil(e.target.value)}
                      rows={12}
                      className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24] admin-scrollbar"
                      placeholder="Tamil lyrics will appear here..."
                    />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                       <label className="block text-sm font-semibold text-slate-700">
                         Thanglish Lyrics
                       </label>
                       <div className="flex items-center gap-2">
                         {uploadThanglishSource === "generated" && (
                           <span className="text-[10px] sm:text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wide">Auto-Generated</span>
                         )}
                         {uploadThanglishSource === "manual" && uploadLyricsThanglish.trim() !== "" && (
                           <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">Manual</span>
                         )}
                       </div>
                    </div>
                    <textarea
                      value={uploadLyricsThanglish}
                      onChange={(e) => handleUploadThanglishChange(e.target.value)}
                      rows={12}
                      className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24] admin-scrollbar"
                      placeholder="Thanglish lyrics will appear here..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading || !uploadTitleTamil || !uploadTitleEnglish}
                    className="w-full sm:w-auto justify-center rounded-xl bg-[#531B24] px-8 py-3.5 sm:py-3 text-sm font-bold text-white transition-all hover:bg-[#6c232f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      "Save Song to Database"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* =========================
            LIST TAB
        ========================= */}
        {activeTab === "list" && (
          <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Tamil, English or Thanglish titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24]"
                />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-700 focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24]"
                >
                  <option value="alphabetical">Alphabetical</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <SortDesc className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#531B24]/20 border-t-[#531B24]" />
              </div>
            ) : songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                <Music className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium text-lg">No songs found.</p>
              </div>
            ) : (
              <div className="flex flex-col border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                {currentSongs.map((song, idx) => (
                  <div key={song._id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 hover:bg-slate-50 transition-colors gap-3 sm:gap-4 ${idx !== currentSongs.length - 1 ? 'border-b border-slate-200' : ''}`}>
                    
                    <div className="min-w-0 flex-1 w-full sm:w-auto">
                      <h3 className="font-bold text-[#531B24] text-lg leading-tight break-words whitespace-normal">
                        {song.titleTamil || song.title}
                      </h3>
                      {song.titleEnglish && (
                        <h4 className="text-sm font-medium text-slate-500 italic mt-1 break-words whitespace-normal">{song.titleEnglish}</h4>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto w-full sm:w-auto">
                      <button
                        onClick={() => openEdit(song)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-4 py-2.5 sm:py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors border border-slate-200"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(song._id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 sm:py-2 text-sm font-bold text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {activeTab === "list" && !loading && totalPages > 1 && (
              <div className="mt-8 mb-4 flex flex-wrap justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-lg"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                        currentPage === pageNum 
                          ? 'bg-[#531B24] text-white shadow-sm' 
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-lg"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================
          EDIT MODAL
      ========================= */}
      {editingSong && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-scale-up relative mt-16 sm:my-8 flex flex-col max-h-[90vh]">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 md:px-8 py-4 sm:py-5 rounded-t-3xl flex items-center justify-between z-10 shrink-0">
              <h2 className="text-xl font-bold text-[#531B24]">Edit Song</h2>
              <button
                onClick={closeEdit}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto admin-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Song Title (Tamil) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitleTamil}
                    onChange={(e) => setEditTitleTamil(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24]"
                    required
                  />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                    <label className="block text-sm font-semibold text-slate-700">
                      Song Title (English / Thanglish) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateEditTitle}
                      disabled={isRegeneratingTitle || !editTitleTamil.trim()}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-2 py-1 rounded transition-colors disabled:opacity-50"
                      title="Regenerate Thanglish Title"
                    >
                      <RefreshCcw className={`w-3 h-3 ${isRegeneratingTitle ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editTitleEnglish}
                    onChange={(e) => handleEditTitleEnglishChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tamil Lyrics
                  </label>
                  <textarea
                    value={editLyricsTamil}
                    onChange={(e) => setEditLyricsTamil(e.target.value)}
                    rows={8}
                    className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24] admin-scrollbar"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Thanglish Lyrics
                    </label>
                    <div className="flex items-center gap-2">
                      {editThanglishSource === "generated" && (
                         <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wide">Auto-Generated</span>
                      )}
                      {editThanglishSource === "manual" && editLyricsThanglish.trim() !== "" && (
                         <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">Manual</span>
                      )}
                      <button
                        type="button"
                        onClick={handleRegenerateThanglish}
                        disabled={isRegenerating || !editLyricsTamil.trim()}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-2 py-1 rounded transition-colors disabled:opacity-50"
                        title="Regenerate Thanglish"
                      >
                        <RefreshCcw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={editLyricsThanglish}
                    onChange={(e) => handleEditThanglishChange(e.target.value)}
                    rows={8}
                    className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24] admin-scrollbar"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Replace Song File <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-300 shadow-sm"
                  >
                    Choose File
                  </button>
                  <span className="text-sm font-medium text-slate-600 truncate">
                    {editFile ? editFile.name : "No new file selected"}
                  </span>
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.ppt,.pptx,text/plain,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={(e) => handleFileChange(e, setEditFile)}
                />
              </div>

              <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="w-full sm:w-auto rounded-xl px-6 py-3.5 sm:py-3 text-sm font-bold text-slate-600 bg-slate-100 sm:bg-transparent hover:bg-slate-200 sm:hover:bg-slate-100 transition-colors text-center order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing || !editTitleTamil || !editTitleEnglish}
                  className="w-full sm:w-auto justify-center rounded-xl bg-[#531B24] px-8 py-3.5 sm:py-3 text-sm font-bold text-white transition-all hover:bg-[#6c232f] disabled:opacity-50 flex items-center gap-2 shadow-md order-1 sm:order-2"
                >
                  {isEditing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    "Update Song"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
