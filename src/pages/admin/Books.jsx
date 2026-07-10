import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaBook, FaUpload, FaImage, FaTimes, FaFilePdf, FaBookOpen, FaEye } from "react-icons/fa";
import { useConfirm } from "../../context/ConfirmContext";
import CompressionBadge from "../../components/CompressionBadge";
import { useDropzone } from "react-dropzone";
import PdfViewerModal from "../../components/PdfViewerModal";

function normalizePdfUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("/raw/upload/") && !url.toLowerCase().endsWith(".pdf")) {
    return url + ".pdf";
  }
  return url;
}

// Helper to format file size
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function Books() {
  const confirm = useConfirm();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState("add"); // "add" or "shelf"

  // Data State
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [author, setAuthor] = useState("");
  
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  
  const [editItem, setEditItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [localPdfUrl, setLocalPdfUrl] = useState(null);
  
  const pdfInputRef = useRef(null);
  
  // File Dropzone for Cover Image
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "mtc-padikuppam/books/covers");

        const res = await API.post("/upload/image", formData);
        const data = res.data;

        setCoverFile(data.url);
        setCoverPreview(data.url);
        setUploadStats(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to upload cover image");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"]
    },
    multiple: false
  });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/books");
      setBooks(res.data.books || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    return () => {
      if (coverPreview && typeof coverPreview === 'string' && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    }
  }, []);

  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setLocalPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLocalPdfUrl(null);
    }
  }, [pdfFile]);

  const resetForm = () => {
    setTitle("");
    setDate("");
    setAuthor("");
    setCoverFile(null);
    if (coverPreview && typeof coverPreview === 'string' && coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(null);
    setUploadStats(null);
    setPdfFile(null);
    setEditItem(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const openEdit = (book) => {
    resetForm();
    setEditItem(book);
    setTitle(book.title || "");
    setDate(book.date || "");
    setAuthor(book.author || "");
    setCoverPreview(book.coverImageUrl || null);
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      return toast.error("Title is required");
    }
    
    if (!editItem) {
      if (!coverFile) return toast.error("Cover image is required for new book");
      if (!pdfFile) return toast.error("PDF file is required for new book");
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("date", date);
      formData.append("author", author);
      
      if (coverFile) {
        formData.append("coverImageUrl", coverFile);
      }
      if (pdfFile) {
        formData.append("pdfFile", pdfFile);
      }

      if (editItem) {
        await API.put(`/books/${editItem._id}`, formData);
        toast.success("Book updated successfully");
      } else {
        await API.post("/books", formData);
        toast.success("Book added successfully");
      }
      
      resetForm();
      fetchBooks();
      setUploadStats(null);
      setActiveTab("shelf");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save book");
    } finally {
      setUploading(false);
    }
  };

  const deleteBook = async (id) => {
    const ok = await confirm({
      title: "Delete Book",
      message: "Are you sure you want to delete this book? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });

    if (!ok) return;

    try {
      await API.delete(`/books/${id}`);
      setBooks((prev) => prev.filter((book) => book._id !== id));
      toast.success("Book deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete book");
    }
  };

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [books]);

  const filteredBooks = useMemo(() => {
    return sortedBooks.filter(book => book.title?.toLowerCase().includes(search.toLowerCase()));
  }, [sortedBooks, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header section */}
      <div className="admin-header-container">
        <div>
          <h1 className="admin-header-title">
            <FaBook className="admin-header-icon" />
            Books & Pamphlets
          </h1>
          <p className="admin-header-desc">Manage your library of PDFs and visual covers.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm w-max border border-slate-100">
        <button
          onClick={() => setActiveTab("add")}
          className={activeTab === "add" ? "admin-tab-active" : "admin-tab-inactive"}
        >
          {editItem ? <FaEdit /> : <FaUpload />}
          {editItem ? "Edit Book" : "Add Book"}
        </button>
        <button
          onClick={() => setActiveTab("shelf")}
          className={activeTab === "shelf" ? "admin-tab-active" : "admin-tab-inactive"}
        >
          <FaBookOpen />
          Book Shelf
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full">
        {/* ADD BOOK TAB */}
        {activeTab === "add" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="admin-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-[#531B24]">
                    {editItem ? "Edit Book Details" : "Upload New Book"}
                  </h2>
                  <p className="text-sm text-[#651D32]/70 mt-1">Fill in the details below to publish a book.</p>
                </div>
                {editItem && (
                  <button 
                    onClick={() => { resetForm(); setActiveTab("shelf"); }}
                    className="admin-btn-secondary"
                  >
                    <FaTimes /> Cancel Edit
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="admin-label">Book Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The History of the Methodist Church"
                      className="admin-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="admin-label">Publication Date (Optional)</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="admin-input text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="admin-label">Author / Subtitle (Optional)</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="e.g. Rev. John Doe"
                        className="admin-input text-slate-700"
                      />
                    </div>
                  </div>
                  
                  {/* Upload Zones Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    
                    {/* Cover Image Dropzone */}
                    <div className="space-y-2">
                       <label className="admin-label">
                          Book Cover Image {editItem ? "(Optional)" : "*"}
                        </label>
                        <div 
                          {...getRootProps()} 
                          className={`admin-upload-box group ${
                            isDragActive 
                              ? 'border-[#531B24] bg-[#531B24]/5' 
                              : coverPreview ? 'border-emerald-400 bg-emerald-50' : ''
                          }`}
                        >
                          <input {...getInputProps()} />
                          
                          {coverPreview ? (
                            <>
                              <div className="absolute inset-0 z-0 opacity-20 blur-xl">
                                <img src={coverPreview} alt="Blur bg" className="w-full h-full object-cover" />
                              </div>
                              <div className="relative z-10 w-full flex flex-col items-center">
                                <div className="relative">
                                  <CompressionBadge stats={uploadStats} />
                                  <img 
                                    src={coverPreview} 
                                    alt="Cover Preview" 
                                    className="h-28 object-contain rounded-lg shadow-md mb-3"
                                  />
                                </div>
                                <span className="text-xs font-bold text-emerald-700 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm">Image Selected</span>
                              </div>
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity z-20">
                                 <p className="text-white text-sm font-bold bg-black/50 px-4 py-2 rounded-full">Change Cover</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="admin-upload-icon">
                                <FaImage className="text-2xl text-slate-400 group-hover:text-[#531B24]" />
                              </div>
                              <p className="text-slate-700 font-bold">Drag & Drop Image</p>
                              <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-2">Accepted formats: <span className="font-bold text-slate-700">JPG, PNG, WEBP</span></p>
                    </div>

                    {/* PDF File Upload */}
                    <div className="space-y-2">
                      <label className="admin-label">
                        Book PDF File {editItem ? "(Optional)" : "*"}
                      </label>
                      
                      {(pdfFile || editItem?.pdfUrl) ? (
                        <div className="border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col relative h-[400px] shadow-sm bg-white">
                           {/* File Info Header */}
                           <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between z-10 shrink-0">
                             <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                  <FaFilePdf size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800 truncate pr-2">
                                    {pdfFile ? pdfFile.name : "Existing PDF attached"}
                                  </p>
                                  {pdfFile && (
                                    <p className="text-xs font-medium text-slate-500">
                                      {formatBytes(pdfFile.size)}
                                    </p>
                                  )}
                                </div>
                             </div>
                             
                             <div className="relative shrink-0">
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => setPdfFile(e.target.files[0])}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                  title="Change PDF"
                                />
                                <button type="button" className="px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition pointer-events-none shadow-sm whitespace-nowrap">
                                  Change
                                </button>
                             </div>
                           </div>

                           {/* Embedded Native Preview */}
                           <div className="flex-1 w-full bg-slate-200 relative">
                             {(localPdfUrl || editItem?.pdfUrl) ? (
                               <object
                                 data={`${localPdfUrl || editItem?.pdfUrl}#page=1&view=FitH&toolbar=0&navpanes=0`}
                                 type="application/pdf"
                                 className="w-full h-full"
                               >
                                 <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-100 p-6 text-center">
                                   <FaFilePdf size={32} className="mb-3 text-slate-300" />
                                   <p className="text-sm font-bold text-slate-700 mb-1">Preview not supported</p>
                                   <p className="text-xs font-medium mb-4">Your browser doesn't support embedded PDFs.</p>
                                   <button 
                                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPdfPreview(true); }}
                                     className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-md"
                                   >
                                     Open Book Reader
                                   </button>
                                 </div>
                               </object>
                             ) : (
                               <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50">
                                 <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin mb-2"></div>
                                 <p className="text-xs font-medium">Preparing preview...</p>
                               </div>
                             )}
                           </div>
                        </div>
                      ) : (
                        <div className="admin-upload-box">
                          <input
                            type="file"
                            accept="application/pdf"
                            ref={pdfInputRef}
                            onChange={(e) => setPdfFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="admin-upload-icon">
                            <FaFilePdf className="text-2xl" />
                          </div>
                          <p className="text-slate-700 font-bold">Upload PDF File</p>
                          <p className="text-xs text-slate-400 mt-1">Click to select document</p>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 font-medium mt-2">Accepted format: <span className="font-bold text-slate-700">PDF (.pdf)</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="admin-btn-primary disabled:opacity-70"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading Book...
                      </>
                    ) : (
                      <>
                        <FaUpload />
                        {editItem ? "Save Changes" : "Publish Book"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* BOOK SHELF TAB */}
        {activeTab === "shelf" && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
            
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search books by title or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="admin-input !bg-white focus:!bg-white"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <FaTimes />
                  </button>
                )}
              </div>
              <div className="px-4 text-sm font-bold text-slate-400 whitespace-nowrap">
                {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className="bg-white rounded-3xl aspect-[2/3] animate-pulse border border-slate-100 shadow-sm" />
                ))}
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBook className="text-3xl text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No books found</h3>
                <p className="text-slate-500 mt-1">Try adjusting your search or add a new book.</p>
                <button 
                  onClick={() => setActiveTab("add")}
                  className="admin-btn-primary mt-6 mx-auto"
                >
                  Upload New Book
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredBooks.map((book, index) => (
                  <div 
                    key={book._id} 
                    className="group flex flex-col admin-card overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                    style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
                  >
                    {/* Cover Area */}
                    <div className="relative aspect-[2/3] w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                      <div className="relative">
                        <CompressionBadge stats={uploadStats} />
                        <img 
                          src={book.coverImageUrl} 
                          alt={book.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          loading="lazy" 
                        />
                      </div>
                    </div>
                    
                    {/* Info Area */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-slate-800 line-clamp-2 text-sm leading-tight" title={book.title}>{book.title}</h3>
                      {book.author && (
                        <p className="text-xs text-slate-500 mt-1 font-medium">{book.author}</p>
                      )}
                      {book.date && (
                        <p className="text-xs text-slate-400 mt-0.5">{book.date}</p>
                      )}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 px-2 py-1 rounded-md">
                          {new Date(book.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => window.open(normalizePdfUrl(book.pdfUrl), '_blank')}
                          className="admin-btn-blue flex-1 !py-2.5 !px-2 text-xs sm:text-sm"
                          title="View PDF Document"
                        >
                          <FaEye />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => openEdit(book)}
                          className="admin-btn-orange flex-1 !py-2.5 !px-2 text-xs sm:text-sm"
                          title="Edit Details"
                        >
                          <FaEdit />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => deleteBook(book._id)}
                          className="admin-btn-red flex-1 !py-2.5 !px-2 text-xs sm:text-sm"
                          title="Delete Book"
                        >
                          <FaTrash />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      <PdfViewerModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfUrl={localPdfUrl || editItem?.pdfUrl}
        title={pdfFile?.name || editItem?.title || title || "PDF Preview"}
      />
    </div>
  );
}
