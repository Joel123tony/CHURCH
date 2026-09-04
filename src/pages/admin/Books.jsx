import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  const [category, setCategory] = useState("Book");
  
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

  const onPdfDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setPdfFile(file);
    }
  }, []);

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive, open: openPdfDropzone } = useDropzone({
    onDrop: onPdfDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    noClick: (localPdfUrl || editItem?.pdfUrl) ? true : false
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
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview && typeof coverPreview === 'string' && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

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
    setCategory("Book");
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
    setCategory(book.category || "Pamphlet");
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
      formData.append("category", category);
      
      if (coverFile) {
        formData.append("coverImageUrl", coverFile);
        if (uploadStats && uploadStats.public_id) {
          formData.append("cover_public_id", uploadStats.public_id);
        }
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
      console.error("Upload Book Error:", err);
      const errorMessage = err?.response?.data?.message || err.message || "Failed to save book";
      toast.error(errorMessage);
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
    <div className="p-3 sm:p-4 lg:p-6 bg-slate-50 min-h-screen">
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
      <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-2xl shadow-sm w-max border border-slate-100">
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            <div className="admin-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-[#531B24]">
                    {editItem ? "Edit Book Details" : "Upload New Book"}
                  </h2>
                  <p className="text-sm text-[#651D32]/70 mt-1">Fill in the details below to publish a book.</p>
                </div>
                {editItem && (
                  <button 
                    onClick={() => { resetForm(); setActiveTab("shelf"); }}
                    className="admin-btn-secondary !py-1.5"
                  >
                    <FaTimes /> Cancel Edit
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  
                  {/* LEFT COLUMN: FILE PREVIEW */}
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                        File Preview
                      </h3>
                      
                      <div className="flex flex-col gap-6 mb-2">
                        
                        {/* Cover Preview Mini */}
                        <div className="flex flex-col space-y-1.5 w-full">
                          <label className="text-xs font-bold text-slate-500 text-center">Cover Image {editItem ? "(Optional)" : "*"}</label>
                          <div 
                            {...getRootProps()}
                            className={`relative w-full max-w-[160px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group ${isDragActive ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                          >
                            <input {...getInputProps()} />
                            {coverPreview ? (
                              <>
                                <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity z-20">
                                   <p className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 shadow-sm"><FaImage /> Change Cover</p>
                                   <button 
                                      type="button" 
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(coverPreview, '_blank'); }} 
                                      className="text-white text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 transition shadow-sm"
                                    ><FaEye /> View Full Image</button>
                                </div>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors p-4">
                                <FaImage className="text-3xl mb-2 opacity-50 group-hover:opacity-100" />
                                <span className="text-[11px] font-bold text-center leading-tight">Drag & Drop Cover Image<br/><span className="text-slate-400 font-medium mt-1 inline-block">or Click to Browse</span></span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PDF Preview Responsive Viewer */}
                        <div className="flex flex-col space-y-1.5 w-full">
                          <label className="text-xs font-bold text-slate-500 text-center">PDF File {editItem ? "(Optional)" : "*"}</label>
                          <div 
                            {...getPdfRootProps()}
                            className={`relative w-full h-[250px] md:h-[450px] rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed shadow-sm transition-all duration-300 group ${isPdfDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300'} ${!(localPdfUrl || editItem?.pdfUrl) ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer aspect-[3/4] mx-auto max-w-[160px]' : ''}`}
                          >
                            <input {...getPdfInputProps()} />
                            {(localPdfUrl || editItem?.pdfUrl) ? (
                               <>
                                 <iframe
                                   src={`${localPdfUrl || editItem?.pdfUrl}#toolbar=0&navpanes=0`}
                                   title="PDF Preview"
                                   className="w-full h-full border-none pointer-events-auto block"
                                 />
                                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 pointer-events-none">
                                   <div className="flex flex-col gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-auto mt-auto mb-6">
                                     <button 
                                       type="button"
                                       className="text-white text-xs font-bold bg-black/80 hover:bg-black px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg transition transform hover:scale-105"
                                       onClick={(e) => {
                                         e.preventDefault();
                                         e.stopPropagation();
                                         openPdfDropzone();
                                       }}
                                     ><FaFilePdf /> Change PDF</button>
                                     <button 
                                        type="button" 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPdfPreview(true); }} 
                                        className="text-white text-xs font-bold bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 transition shadow-lg transform hover:scale-105"
                                      ><FaEye /> Preview Fullscreen</button>
                                   </div>
                                   {pdfFile && <span className="absolute top-2 right-2 text-[10px] text-white/90 font-medium bg-black/40 px-2 py-0.5 rounded pointer-events-none">{formatBytes(pdfFile.size)}</span>}
                                 </div>
                               </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors p-4">
                                <FaFilePdf className="text-3xl mb-2 opacity-50 group-hover:opacity-100" />
                                <span className="text-[11px] font-bold text-center leading-tight">Drag & Drop PDF<br/><span className="text-slate-400 font-medium mt-1 inline-block">or Click to Browse</span></span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: BOOK INFORMATION */}
                  <div className="lg:col-span-7 flex flex-col">
                    <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                      Book Information
                    </h3>
                    
                    <div className="space-y-3 sm:space-y-4 flex-grow">
                      <div>
                        <label className="admin-label !mb-1">Book Title *</label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. The History of the Methodist Church"
                          className="admin-input !py-2"
                        />
                      </div>

                      <div>
                        <label className="admin-label !mb-1">Author / Subtitle (Optional)</label>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="e.g. Rev. John Doe"
                          className="admin-input !py-2"
                        />
                      </div>

                      <div>
                        <label className="admin-label !mb-2">Publication Type *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              value="Book"
                              checked={category === "Book"}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-4 h-4 text-[#54091b] focus:ring-[#54091b] border-slate-300"
                            />
                            <span className="text-sm font-bold text-slate-700">Book</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              value="Pamphlet"
                              checked={category === "Pamphlet"}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-4 h-4 text-[#54091b] focus:ring-[#54091b] border-slate-300"
                            />
                            <span className="text-sm font-bold text-slate-700">Pamphlet</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="admin-label !mb-1">Publication Date (Optional)</label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="admin-input !py-2"
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="admin-btn-primary disabled:opacity-70 px-8 py-2.5 w-full sm:w-auto text-[15px]"
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
                  </div>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredBooks.map((book, index) => (
                  <div 
                    key={book._id} 
                    className="group bg-white flex flex-col h-full rounded-[20px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-[6px]"
                    style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
                  >
                    {/* Cover Area */}
                    <div className="relative w-full aspect-[3/4] bg-slate-50 overflow-hidden border-b border-slate-100 shrink-0">
                      <CompressionBadge stats={uploadStats} />
                      {book.coverImageUrl ? (
                        <img 
                          src={book.coverImageUrl} 
                          alt={book.title} 
                          className="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          loading="lazy" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300">
                          <FaBook className="w-16 h-16 opacity-40 mb-2" />
                          <span className="text-xs font-medium text-slate-400">No Cover Image</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Info Area */}
                    <div className="p-4 sm:p-5 flex flex-col flex-grow">
                      <h3 className="text-[18px] font-bold leading-[1.3] text-[#531B24] line-clamp-2 mb-[12px]" title={book.title}>
                        {book.title}
                      </h3>
                      
                      {book.author && (
                        <p className="text-[14px] text-slate-600 font-medium mb-1 line-clamp-1">{book.author}</p>
                      )}
                      
                      <p className="text-[13px] text-slate-500 opacity-80">
                        {book.date || `Uploaded ${new Date(book.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="mt-auto pt-[18px] flex gap-[8px] sm:gap-[10px]">
                        <button
                          onClick={() => window.open(normalizePdfUrl(book.pdfUrl), '_blank')}
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 hover:-translate-y-[2px] text-[13px] font-bold shadow-sm"
                          title="View PDF Document"
                        >
                          <FaEye size={14} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openEdit(book)}
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-500 hover:text-white transition-all duration-300 hover:-translate-y-[2px] text-[13px] font-bold shadow-sm"
                          title="Edit Details"
                        >
                          <FaEdit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => deleteBook(book._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 hover:-translate-y-[2px] text-[13px] font-bold shadow-sm"
                          title="Delete Book"
                        >
                          <FaTrash size={14} />
                          <span>Delete</span>
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
