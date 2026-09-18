import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { 
  FileText, UploadCloud, Search, Edit2, Trash2, X, Music, SortDesc, SortAsc, FileOutput, RefreshCcw, Zap, CheckCircle2, AlertCircle, SkipForward, ListPlus
} from "lucide-react";
import { useConfirm } from "../../context/ConfirmContext";

export default function SongLyrics() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'list' | 'automation' | 'requests'
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // List state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest"); // 'newest', 'oldest', 'alphabetical'
  const [totalSongsCount, setTotalSongsCount] = useState(0);

  // Upload state
  const [uploadStep, setUploadStep] = useState(1); // 1 = File Select, 2 = Edit & Review Details
  const [selectedFile, setSelectedFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [duplicateFileError, setDuplicateFileError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isManualUpload, setIsManualUpload] = useState(false);
  
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
  const isRegeneratingTitleRef = useRef(false);
  const isRegeneratingRef = useRef(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const scrollContainerRef = useRef(null);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  
  // Automation State
  const [automationFiles, setAutomationFiles] = useState([]);
  const [isAutomating, setIsAutomating] = useState(false);
  const [automationProgress, setAutomationProgress] = useState(null);
  const automationInputRef = useRef(null);
  // Requests State
  const [songRequests, setSongRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState("Pending"); // 'All', 'Pending', 'Added', 'Rejected'
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const validateFileType = (file) => {
    const validTypes = [
      "text/plain", 
      "application/vnd.ms-powerpoint", 
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    const validExts = [".txt", ".ppt", ".pptx"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    return validTypes.includes(file.type) || validExts.includes(ext);
  };

  useEffect(() => {
    fetchSongs();
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
      if (res.data.total) setTotalSongsCount(res.data.total);
    } catch (err) {
      console.error("Failed to fetch songs");
    } finally {
      setLoading(false);
    }
  };

  const fetchSongRequests = async (isRefresh = false) => {
    setRequestsLoading(true);
    try {
      const res = await API.get(`/song-requests`);
      const data = res.data.data;
      setSongRequests(data);
      setPendingRequestsCount(data.filter(r => r.status === "pending").length);
      if (isRefresh) {
        toast.success("Requests refreshed");
      }
    } catch (err) {
      console.error("Failed to fetch song requests", err);
      if (isRefresh) {
        toast.error("Failed to refresh song requests. Please try again.");
      }
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongRequests();
  }, []);

  const totalPages = Math.ceil(songs.length / ITEMS_PER_PAGE);
  const currentSongs = songs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* =========================
     LIVE TITLE TRANSLITERATION - REMOVED
     Per requirements: Do not automatically regenerate when typing.
  ========================= */


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
    if (!validateFileType(file)) {
      toast.error("Unsupported file type. Please upload a TXT, PPT, or PPTX file.");
      return;
    }
    setter(file);
    if (setter === setSelectedFile) {
      setDuplicateFileError(false); // Reset duplicate state on new file
    }
  };

  useEffect(() => {
    if (selectedFile && uploadStep === 1 && !isExtracting && !duplicateFileError) {
      handleExtractPreview();
    }
  }, [selectedFile]);

  const resolveSongTitles = async (filename, lyricsTamil) => {
    let baseName = filename.split('.').slice(0, -1).join('.');
    baseName = baseName.replace(/[_-]/g, ' ');
    baseName = baseName.replace(/\s+(final|copy|new|latest|v?\d+)\s*$/i, '').trim();
    
    let resolvedTamil = "";
    let resolvedEnglish = "";
    
    const isTamil = /[\u0B80-\u0BFF]/.test(baseName);
    
    if (isTamil) {
      resolvedTamil = baseName;
      try {
        const titleRes = await API.post('/song-lyrics/regenerate-thanglish', { lyricsTamil: resolvedTamil });
        resolvedEnglish = titleRes.data.data.lyricsThanglish;
      } catch (e) {
        resolvedEnglish = "";
      }
    } else {
      resolvedEnglish = baseName;
      const exactMatch = songs.find(s => 
        s.titleEnglish && s.titleEnglish.toLowerCase().trim() === baseName.toLowerCase()
      );
      
      if (exactMatch && exactMatch.titleTamil) {
        resolvedTamil = exactMatch.titleTamil;
      } else {
        const firstLine = (lyricsTamil || "").split('\n').map(l => l.trim()).find(l => l.length > 0 && /[\u0B80-\u0BFF]/.test(l));
        if (firstLine && firstLine.length < 50) {
          resolvedTamil = firstLine;
        } else {
          resolvedTamil = "";
        }
      }
    }
    
    return { titleTamil: resolvedTamil, titleEnglish: resolvedEnglish };
  };

  const runAutomation = async () => {
    if (automationFiles.length === 0) return;
    
    setIsAutomating(true);
    setAutomationProgress({
      total: automationFiles.length,
      processed: 0,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      logs: []
    });

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;
    let logs = [];

    const addLog = (filename, status, message) => {
      logs = [...logs, { filename, status, message }];
      setAutomationProgress(prev => ({ ...prev, logs }));
    };

    for (let i = 0; i < automationFiles.length; i++) {
      const file = automationFiles[i];
      let titleTamil = "";
      let titleEnglish = "";
      
      try {
        const formData = new FormData();
        formData.append("file", file);

        let extractRes;
        try {
          extractRes = await API.post("/song-lyrics/extract-preview", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } catch (err) {
          if (err.response?.status === 409) {
            skipped++;
            addLog(file.name, 'skipped', 'Song already exists (Duplicate file)');
            setAutomationProgress(prev => ({ ...prev, processed: i + 1, skipped }));
            continue;
          } else {
            throw err;
          }
        }

        let { lyricsTamil, lyricsThanglish, thanglishStatus, thanglishSource } = extractRes.data.data;
        lyricsTamil = lyricsTamil || "";
        lyricsThanglish = lyricsThanglish || "";
        thanglishStatus = thanglishStatus || "needs_review";
        thanglishSource = thanglishSource || "manual";

        const { titleTamil: resolvedTamil, titleEnglish: resolvedEnglish } = await resolveSongTitles(file.name, lyricsTamil);
        titleTamil = resolvedTamil;
        titleEnglish = resolvedEnglish;

        if (!titleTamil || !titleEnglish) {
          failed++;
          addLog(file.name, 'failed', 'Could not determine both Tamil and Thanglish titles');
          setAutomationProgress(prev => ({ ...prev, processed: i + 1, failed }));
          continue;
        }

        const saveFormData = new FormData();
        saveFormData.append("titleTamil", titleTamil.trim());
        saveFormData.append("titleEnglish", titleEnglish.trim());
        saveFormData.append("lyricsText", lyricsTamil);
        saveFormData.append("lyricsThanglish", lyricsThanglish);
        saveFormData.append("thanglishStatus", thanglishStatus);
        saveFormData.append("thanglishSource", thanglishSource);
        saveFormData.append("file", file);

        try {
          await API.post("/song-lyrics", saveFormData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          uploaded++;
          setTotalSongsCount(prev => prev + 1);
          addLog(file.name, 'uploaded', 'Uploaded');
        } catch (err) {
          if (err.response?.status === 409) {
            skipped++;
            addLog(file.name, 'skipped', 'Song already exists (Duplicate title)');
          } else {
            throw err;
          }
        }
      } catch (err) {
         failed++;
         addLog(file.name, 'failed', 'Could not extract lyrics or save');
      }
      
      setAutomationProgress(prev => ({ ...prev, processed: i + 1, uploaded, skipped, failed }));
    }
    
    setIsAutomating(false);
    fetchSongs();
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
      
      const { titleTamil, titleEnglish } = await resolveSongTitles(selectedFile.name, lyricsTamil);
      setUploadTitleTamil(titleTamil);
      setUploadTitleEnglish(titleEnglish);
      setUploadTitleSource("generated");
      
      setUploadStep(2);
    } catch (err) {
      if (err.response?.status === 409) {
        setDuplicateFileError(true);
      } else {
        toast.error("File processing error. Please try again.");
      }
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
    if (isRegeneratingTitleRef.current) return;
    isRegeneratingTitleRef.current = true;
    setIsRegeneratingTitle(true);
    const ok = await confirm({
      title: "Regenerate Title",
      message: "Regenerate Thanglish title? This will replace the current Thanglish title.",
      confirmText: "Regenerate",
      cancelText: "Cancel",
      isDanger: false,
    });
    if (!ok) {
      isRegeneratingTitleRef.current = false;
      setIsRegeneratingTitle(false);
      return;
    }

    try {
      const res = await API.post('/song-lyrics/regenerate-thanglish', { lyricsTamil: uploadTitleTamil });
      setUploadTitleEnglish(res.data.data.lyricsThanglish);
      setUploadTitleSource("generated");
      toast.success("Title regenerated successfully!");
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to generate title.");
    } finally {
      isRegeneratingTitleRef.current = false;
      setIsRegeneratingTitle(false);
    }
  };

  const handleRegenerateUploadLyrics = async () => {
    if (isRegeneratingRef.current) return;
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    const ok = await confirm({
      title: "Regenerate Lyrics",
      message: "Regenerate Thanglish lyrics? This will replace the current Thanglish lyrics.",
      confirmText: "Regenerate",
      cancelText: "Cancel",
      isDanger: false,
    });
    if (!ok) {
      isRegeneratingRef.current = false;
      setIsRegenerating(false);
      return;
    }

    try {
      const res = await API.post('/song-lyrics/regenerate-thanglish', { lyricsTamil: uploadLyricsTamil });
      setUploadLyricsThanglish(res.data.data.lyricsThanglish);
      setUploadThanglishStatus("available");
      setUploadThanglishSource("generated");
      toast.success("Lyrics regenerated successfully!");
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to generate lyrics.");
    } finally {
      isRegeneratingRef.current = false;
      setIsRegenerating(false);
    }
  };

  // Step 2: Final Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitleTamil.trim() || !uploadTitleEnglish.trim()) {
      return toast.error("Both Tamil and English titles are required");
    }

    if (isManualUpload && !uploadLyricsTamil.trim()) {
      return toast.error("Tamil lyrics are required for manual entry");
    }

    let submitFile = selectedFile;
    if (isManualUpload) {
      const blob = new Blob([uploadLyricsTamil], { type: "text/plain" });
      submitFile = new File([blob], `${uploadTitleTamil.trim() || 'manual-lyrics'}.txt`, { type: "text/plain" });
    }

    if (!submitFile) {
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
    formData.append("file", submitFile);

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
    setIsManualUpload(false);
    setUploadTitleTamil("");
    setUploadTitleEnglish("");
    setUploadTitleSource("generated");
    setUploadLyricsTamil("");
    setUploadLyricsThanglish("");
    setUploadThanglishStatus("needs_review");
    setUploadThanglishStatus("needs_review");
    setUploadThanglishSource("manual");
  };

  const handleManualEntryClick = () => {
    resetUploadState();
    setIsManualUpload(true);
    setUploadStep(2);
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
    if (isRegeneratingTitleRef.current) return;
    isRegeneratingTitleRef.current = true;
    setIsRegeneratingTitle(true);
    const ok = await confirm({
      title: "Regenerate Title",
      message: "Regenerate Thanglish title? This will replace the current Thanglish title.",
      confirmText: "Regenerate",
      cancelText: "Cancel",
      isDanger: false,
    });
    if (!ok) {
      isRegeneratingTitleRef.current = false;
      setIsRegeneratingTitle(false);
      return;
    }

    try {
      const res = await API.post('/song-lyrics/regenerate-thanglish', { songId: editingSong._id, lyricsTamil: editTitleTamil });
      setEditTitleEnglish(res.data.data.lyricsThanglish);
      setEditTitleSource("generated");
      
      // Update the local list so the table updates without refresh
      setSongs(prev => prev.map(s => s._id === editingSong._id ? { ...s, titleEnglish: res.data.data.lyricsThanglish } : s));
      toast.success("Title regenerated and saved successfully!");
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to generate title.");
    } finally {
      isRegeneratingTitleRef.current = false;
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
    if (isRegeneratingRef.current) return;
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    const ok = await confirm({
      title: "Regenerate Lyrics",
      message: "Regenerate Thanglish? This will replace the current Thanglish lyrics.",
      confirmText: "Regenerate",
      cancelText: "Cancel",
      isDanger: false,
    });
    if (!ok) {
      isRegeneratingRef.current = false;
      setIsRegenerating(false);
      return;
    }

    try {
       const res = await API.post('/song-lyrics/regenerate-thanglish', { songId: editingSong._id, lyricsTamil: editLyricsTamil });
       setEditLyricsThanglish(res.data.data.lyricsThanglish);
       setEditThanglishStatus("available");
       setEditThanglishSource("generated");
       
       // Update local list silently
       setSongs(prev => prev.map(s => s._id === editingSong._id ? { ...s, lyricsThanglish: res.data.data.lyricsThanglish, thanglishStatus: "available", thanglishSource: "generated" } : s));
       
       toast.success("Thanglish lyrics generated and saved successfully!");
    } catch(e) {
       toast.error(e.response?.data?.message || "Failed to generate lyrics.");
    } finally {
       isRegeneratingRef.current = false;
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
    const ok = await confirm({
      title: "Delete Song",
      message: "Are you sure you want to delete this song?",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });
    
    if (ok) {
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
      <div className="flex-none bg-white px-4 sm:px-6 py-4 shadow-sm md:px-8 flex flex-col sm:flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#531B24] flex items-center gap-2">
            <Music className="w-6 h-6 shrink-0" />
            <span className="truncate">Song Lyrics</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 break-words">
            Manage your church song lyrics, titles, and presentations.
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right w-full sm:w-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Songs</p>
          <p className="text-2xl font-black text-[#531B24] leading-none mt-1">{totalSongsCount}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto admin-scrollbar relative">
        
        {/* STICKY AREA */}
        <div className="sticky top-0 z-30 bg-[#F4EFE7] px-4 sm:px-6 md:px-8 pt-6 pb-4 shadow-sm border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <div className="flex flex-row flex-wrap sm:flex-nowrap items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm w-full sm:w-max overflow-x-auto">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === "upload" 
                      ? "bg-[#531B24] text-white shadow-md" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
                  }`}
                >
                  <UploadCloud className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">Upload Song</span>
                </button>
                <button
                  onClick={() => { setActiveTab("list"); resetUploadState(); }}
                  className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === "list" 
                      ? "bg-[#531B24] text-white shadow-md" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
                  }`}
                >
                  <Music className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">Song List</span>
                </button>
                <button
                  onClick={() => setActiveTab("automation")}
                  className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === "automation" 
                      ? "bg-[#531B24] text-white shadow-md" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
                  }`}
                >
                  <ListPlus className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">Automation</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("requests");
                    fetchSongRequests();
                  }}
                  className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === "requests" 
                      ? "bg-[#531B24] text-white shadow-md" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
                  }`}
                >
                  <ListPlus className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">Song request</span>
                  {pendingRequestsCount > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'requests' ? 'bg-white text-[#531B24]' : 'bg-[#531B24] text-white'}`}>
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* List Controls */}
            {activeTab === "list" && (
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Tamil, English or Thanglish titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-11 pr-4 text-sm focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24]"
                  />
                </div>
                <div className="relative w-full sm:w-auto shrink-0">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 focus:border-[#531B24] focus:outline-none focus:ring-1 focus:ring-[#531B24]"
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
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto">
          
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
                  
                  <div className="relative flex items-center py-5">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-semibold">OR</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center">
                    <button
                      type="button"
                      onClick={handleManualEntryClick}
                      className="w-full rounded-xl bg-slate-800 px-8 py-4 text-base font-bold text-white shadow-md hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Enter Lyrics Manually
                    </button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200 animate-fade-in">
                    <div className="flex items-start gap-3 sm:gap-4 overflow-hidden w-full sm:w-auto min-w-0 flex-1">
                      <FileText className="w-8 h-8 text-[#531B24] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 break-words whitespace-normal leading-snug">{selectedFile.name}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        {duplicateFileError && (
                          <p className="text-sm font-bold text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                            This song file already exists. Please choose a different file.
                          </p>
                        )}
                      </div>
                    </div>
                    {!duplicateFileError && (
                      <button
                        type="button"
                        onClick={handleExtractPreview}
                        disabled={isExtracting}
                        className="w-full sm:w-auto shrink-0 justify-center rounded-xl bg-[#531B24] px-5 py-2.5 sm:py-2 text-sm font-bold text-white transition-all hover:bg-[#6c232f] disabled:opacity-50 disabled:cursor-wait flex items-center gap-2 shadow-sm"
                      >
                        {isExtracting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Checking file...
                          </>
                        ) : (
                          <>
                            <FileOutput className="w-4 h-4" /> Next Step
                          </>
                        )}
                      </button>
                    )}
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
                    &larr; {isManualUpload ? "Back to File Upload" : "Back to File Selection"}
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
                      placeholder={isManualUpload ? "Type or paste the Tamil song lyrics here..." : "Tamil lyrics will appear here..."}
                      required={isManualUpload}
                    />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                       <label className="block text-sm font-semibold text-slate-700">
                         Thanglish Lyrics
                       </label>
                       <div className="flex items-center gap-2">
                         <button
                           type="button"
                           onClick={handleRegenerateUploadLyrics}
                           disabled={isRegenerating || !uploadLyricsTamil.trim()}
                           className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-2 py-1 rounded transition-colors disabled:opacity-50"
                           title="Regenerate Thanglish Lyrics"
                         >
                           <RefreshCcw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                           Regenerate
                         </button>
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
            AUTOMATION TAB
        ========================= */}
        {activeTab === "automation" && (
          <div className="max-w-4xl bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-800">Automation: Bulk Upload Songs</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl mx-auto">
                Select multiple song files and let the system automatically extract the lyrics, generate Tamil/Thanglish titles, skip existing songs, and save only new songs.
              </p>
            </div>

            {!isAutomating && !automationProgress && (
              <div>
                <div 
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-12 transition-colors ${
                    dragActive ? "border-[#531B24] bg-[#531B24]/5" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      setAutomationFiles(Array.from(e.dataTransfer.files).filter(validateFileType));
                    }
                  }}
                >
                  <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mb-4" />
                  <p className="text-sm sm:text-base text-slate-700 font-medium mb-1 text-center">Drag & drop multiple files here</p>
                  <button
                    type="button"
                    onClick={() => automationInputRef.current?.click()}
                    className="rounded-xl bg-[#531B24] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#6c232f] transition-colors mt-4 w-full sm:w-auto"
                  >
                    Choose Files
                  </button>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-6 font-semibold uppercase tracking-wider text-center leading-relaxed">
                    TXT • PPT • PPTX<br/>Multiple files supported
                  </p>
                  <input
                    ref={automationInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".txt,.ppt,.pptx,text/plain,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setAutomationFiles(Array.from(e.target.files).filter(validateFileType));
                      }
                    }}
                  />
                </div>

                {automationFiles.length > 0 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#531B24]/10 p-2 rounded-lg">
                        <FileText className="w-6 h-6 text-[#531B24]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{automationFiles.length} files selected</p>
                        <p className="text-xs text-slate-500">Ready for processing</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                       <button
                         type="button"
                         onClick={() => setAutomationFiles([])}
                         className="w-full sm:w-auto justify-center rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                       >
                         Clear
                       </button>
                       <button
                         type="button"
                         onClick={runAutomation}
                         className="w-full sm:w-auto justify-center rounded-xl bg-[#531B24] px-6 py-2 text-sm font-bold text-white transition-all hover:bg-[#6c232f] flex items-center gap-2 shadow-sm"
                       >
                         <Zap className="w-4 h-4" /> Start Bulk Upload
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(isAutomating || automationProgress) && (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                   <h3 className="font-bold text-slate-800 mb-4">
                     {isAutomating ? `Processing files...` : "Bulk Upload Complete"}
                   </h3>
                   
                   <div className="flex items-center justify-between text-sm mb-2">
                     <span className="font-medium text-slate-600">Progress</span>
                     <span className="font-bold text-slate-800">{automationProgress.processed} / {automationProgress.total}</span>
                   </div>
                   <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6 overflow-hidden">
                     <div className="bg-[#531B24] h-2.5 rounded-full transition-all duration-300" style={{ width: `${(automationProgress.processed / automationProgress.total) * 100}%` }}></div>
                   </div>

                   <div className="grid grid-cols-3 gap-4 mb-6">
                     <div className="bg-white p-3 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-center">
                       <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Uploaded</p>
                       <p className="text-xl font-black text-green-600">{automationProgress.uploaded}</p>
                     </div>
                     <div className="bg-white p-3 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-center">
                       <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Skipped</p>
                       <p className="text-xl font-black text-amber-500">{automationProgress.skipped}</p>
                     </div>
                     <div className="bg-white p-3 rounded-lg border border-slate-200 text-center flex flex-col items-center justify-center">
                       <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Failed</p>
                       <p className="text-xl font-black text-red-600">{automationProgress.failed}</p>
                     </div>
                   </div>
                   
                   {!isAutomating && automationProgress.uploaded === 0 && automationProgress.total > 0 && (
                     <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-sm font-medium text-center mb-6">
                       No new songs were added. All files were duplicates or failed.
                     </div>
                   )}

                   <div className="bg-white border border-slate-200 rounded-lg max-h-60 overflow-y-auto admin-scrollbar">
                     {automationProgress.logs.map((log, idx) => (
                       <div key={idx} className={`p-3 border-b border-slate-100 last:border-0 flex items-start gap-3 text-sm ${log.status === 'failed' ? 'bg-red-50' : log.status === 'skipped' ? 'bg-slate-50' : ''}`}>
                         <div className="mt-0.5 shrink-0">
                           {log.status === 'uploaded' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                           {log.status === 'skipped' && <SkipForward className="w-4 h-4 text-amber-500" />}
                           {log.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                         </div>
                         <div className="min-w-0 flex-1">
                           <p className={`font-medium truncate ${log.status === 'skipped' ? 'text-slate-500' : 'text-slate-700'}`}>{log.filename}</p>
                           <p className={`text-xs ${log.status === 'failed' ? 'text-red-600' : 'text-slate-500'}`}>
                             {log.status === 'uploaded' ? 'Uploaded' : log.status === 'skipped' ? `Skipped — ${log.message}` : `Failed — ${log.message}`}
                           </p>
                         </div>
                       </div>
                     ))}
                     {automationProgress.logs.length === 0 && (
                       <div className="p-4 text-center text-slate-400 text-sm font-medium">No logs yet</div>
                     )}
                   </div>
                </div>

                {!isAutomating && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setAutomationFiles([]);
                        setAutomationProgress(null);
                      }}
                      className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                      Start New Bulk Upload
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================
            REQUESTS TAB
        ========================= */}
        {activeTab === "requests" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="font-bold text-slate-800 text-lg">Song Requests</h2>
              <div className="flex flex-wrap gap-2">
                {["All", "Pending", "Added", "Rejected"].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setRequestFilter(filter)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      requestFilter === filter
                        ? "bg-[#531B24] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
                <button
                  onClick={() => fetchSongRequests(true)}
                  disabled={requestsLoading}
                  title="Refresh song requests"
                  aria-label="Refresh song requests"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
                >
                  <RefreshCcw className={`w-4 h-4 ${requestsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {requestsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#531B24]/20 border-t-[#531B24]" />
              </div>
            ) : songRequests.filter(r => requestFilter === "All" || r.status.toLowerCase() === requestFilter.toLowerCase()).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                <Music className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium text-lg">No {requestFilter !== "All" ? requestFilter.toLowerCase() : ""} song requests.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {songRequests
                  .filter(r => requestFilter === "All" || r.status.toLowerCase() === requestFilter.toLowerCase())
                  .map(request => (
                    <div key={request._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                      <div className="flex-1">
                        <h3 className="font-bold text-[#531B24] text-lg leading-tight break-words">{request.songName}</h3>
                        {request.details && (
                          <p className="text-sm text-slate-600 mt-2 break-words bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {request.details}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span className="text-xs font-semibold text-slate-500">
                            Requested: {new Date(request.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                            request.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            request.status === 'added' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  await API.put(`/song-requests/${request._id}`, { status: 'added' });
                                  toast.success("Request marked as added!");
                                  fetchSongRequests();
                                } catch(e) {
                                  toast.error("Failed to update status.");
                                }
                              }}
                              className="px-3 py-1.5 bg-green-100 text-green-700 font-bold text-sm rounded-lg hover:bg-green-200 transition-colors"
                            >
                              Mark Added
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await API.put(`/song-requests/${request._id}`, { status: 'rejected' });
                                  toast.success("Request rejected!");
                                  fetchSongRequests();
                                } catch(e) {
                                  toast.error("Failed to update status.");
                                }
                              }}
                              className="px-3 py-1.5 bg-red-100 text-red-700 font-bold text-sm rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={async () => {
                            const ok = await confirm({ title: "Delete Request", message: "Permanently delete this song request?", isDanger: true });
                            if (ok) {
                              try {
                                await API.delete(`/song-requests/${request._id}`);
                                toast.success("Request deleted.");
                                fetchSongRequests();
                              } catch(e) {
                                toast.error("Failed to delete request.");
                              }
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================
            LIST TAB
        ========================= */}
        {activeTab === "list" && (
          <div className="space-y-6 animate-fade-in">

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
                    
                    <div className="flex flex-col min-[412px]:flex-row items-stretch min-[412px]:items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => openEdit(song)}
                        className="flex-1 min-[412px]:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 sm:px-4 sm:py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors border border-slate-200"
                      >
                        <Edit2 className="w-4 h-4 shrink-0" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(song._id)}
                        className="flex-1 min-[412px]:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 sm:px-4 sm:py-2 text-sm font-bold text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" /> Delete
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
                
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((pageNum, index, array) => (
                      <React.Fragment key={pageNum}>
                        {index > 0 && pageNum - array[index - 1] > 1 && (
                          <span className="text-slate-400 px-1 sm:px-2">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                            currentPage === pageNum 
                              ? 'bg-[#531B24] text-white shadow-sm' 
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
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
