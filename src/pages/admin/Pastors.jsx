import { useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaCamera,
  FaCalendarAlt,
  FaCloudUploadAlt,
  FaEdit,
  FaEye,
  FaImage,
  FaPlus,
  FaStar,
  FaTimes,
  FaTrashAlt,
  FaFileExcel,
  FaUsers,
  FaCheckCircle,
  FaSpinner,
  FaInfoCircle
} from "react-icons/fa";
import API from "../../api/axios";
import { toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import { getFallbackAvatar, handleImageError } from "../../utils/avatarFallback";
import "react-toastify/dist/ReactToastify.css";

const defaultForm = {
  name: "",
  role: "Pastor",
  bio: "",
  joinedYear: "",
  endYear: "",
  education: "",
  church: "Methodist Tamil Church Padikuppam",
  email: "",
  phone: "",
};

const educationOptions = [
  "B.Th (Bachelor of Theology)",
  "B.D (Bachelor of Divinity)",
  "M.Div (Master of Divinity)",
  "M.Th (Master of Theology)",
  "D.Min (Doctor of Ministry)",
  "Ph.D Theology",
  "Dip.Th (Diploma in Theology)",
  "B.A Theology",
  "M.A Theology",
  "Other",
];

// Compression is now handled on the backend
const normalizeEducationSelection = (education) => {
  const items = Array.isArray(education)
    ? education
    : typeof education === "string" && education.trim()
      ? education.includes(",")
        ? education
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
        : [education.trim()]
      : [];

  const selected = items.filter((item) => educationOptions.includes(item));
  const custom = items.find((item) => item && !educationOptions.includes(item));

  return {
    educations: selected.length ? selected : [""],
    customEducation: custom || "",
  };
};

import CompressionBadge from "../../components/CompressionBadge";

export default function Pastors() {
  const confirm = useConfirm();
  const [pastors, setPastors] = useState([]);
  const [view, setView] = useState("add");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPastor, setSelectedPastor] = useState(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadStage, setUploadStage] = useState("idle"); // idle, processing, done, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState(null);
  const [uploadMeta, setUploadMeta] = useState(null);

  const [educations, setEducations] = useState([""]);
  const [customEducation, setCustomEducation] = useState("");

  const fetchPastors = async () => {
    try {
      setLoading(true);

      const res = await API.get("/pastors");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.pastors || [];

      setPastors(data);
    } catch (err) {
      console.error("Fetch pastors error:", err);
      toast.error("Failed to load pastors");
      setPastors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastors();
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const sortedPastors = useMemo(() => {
    return [...pastors].sort((a, b) => {
      if (a?.isCurrent && !b?.isCurrent) return -1;
      if (!a?.isCurrent && b?.isCurrent) return 1;

      const aYear = Number(a?.joinedYear || 0);
      const bYear = Number(b?.joinedYear || 0);

      return bYear - aYear;
    });
  }, [pastors]);

  const filteredPastors = useMemo(() => {
    const query = search.toLowerCase();

    return sortedPastors.filter((p) => {
      const name = (p?.name || "").toLowerCase();
      const role = (p?.role || "").toLowerCase();
      const church = (p?.church || "").toLowerCase();
      const yearText = String(p?.joinedYear || "").toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        role.includes(query) ||
        church.includes(query) ||
        yearText.includes(query);


      return matchesSearch;
    });
  }, [search, sortedPastors]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageDrop = useCallback(async (acceptedFiles) => {
    const selected = acceptedFiles?.[0];
    if (!selected) return;

    if (!selected.type?.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    try {
      // Setup meta for UI
      const originalSize = selected.size || 0;
      const ext = selected.name.split('.').pop()?.toUpperCase() || "IMAGE";
      const estimatedRatio = 0.35;
      const estimatedCompressedSize = originalSize * estimatedRatio;
      const estimatedSavings = originalSize - estimatedCompressedSize;

      setUploadMeta({ originalSize, ext, estimatedCompressedSize, estimatedSavings, name: selected.name });
      setPreview(URL.createObjectURL(selected));
      setUploadStage("processing");
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", selected);
      formData.append("folder", "mtc-padikuppam/pastors/profile-images");

      const res = await API.post("/upload/image", formData, {
        timeout: 5 * 60 * 1000,
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.min(99, Math.round((event.loaded * 100) / event.total)));
          }
        }
      });
      const data = res.data;

      setUploadProgress(100);
      setUploadStage("done");
      setFile(data.url);
      setUploadStats(data);
      
      setTimeout(() => {
        setUploadStage("idle");
        setUploadProgress(0);
      }, 3000);
    } catch (err) {
      console.error(err);
      setUploadStage("error");
      toast.error("Failed to upload image");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleImageDrop,
    multiple: false,
    accept: {
      "image/*": [],
    },
    noClick: true,
    noKeyboard: true,
  });

  const uploadImage = async () => {
    if (!file) return null;
    
    if (typeof file === "string") {
      return { url: file, public_id: "" };
    }

    const data = new FormData();
    data.append("file", file);

    const res = await API.post("/upload/image", data);

    return {
      url: res.data?.url || "",
      public_id: res.data?.public_id || "",
    };
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditId(null);
    setFile(null);
    setPreview(null);
    setUploadStats(null);
    setUploadMeta(null);
    setUploadStage("idle");
    setEducations([""]);
    setCustomEducation("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const joinedYear = Number(form.joinedYear);
      const leftYear = form.endYear ? Number(form.endYear) : null;

      if (!Number.isFinite(joinedYear)) {
        toast.error("Joined year is required");
        return;
      }

      if (form.endYear && !Number.isFinite(leftYear)) {
        toast.error("End year must be a valid number");
        return;
      }

      const image = await uploadImage();

      const payload = {
        name: form.name,
        role: form.role,
        bio: form.bio,
        joinedYear,
        leftYear,
        education: [
          ...educations.filter((value) => value && value !== "Other"),
          ...(customEducation ? [customEducation] : []),
        ],
        church: form.church,
        email: form.email,
        number: form.phone,
        image: image?.url ? { url: image.url, public_id: image.public_id || "" } : null
      };

      if (editId) {
        await API.put(`/pastors/${editId}`, payload);
        toast.success("Pastor updated successfully");
      } else {
        await API.post("/pastors", payload);
        toast.success("Pastor added successfully");
      }

      resetForm();
      fetchPastors();
      setView("list");
    } catch (err) {
      console.error("Pastor submit error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditId(p?._id);

    const { educations: nextEducations, customEducation: nextCustomEducation } =
      normalizeEducationSelection(p?.education);

    setForm({
      name: p?.name || "",
      role: p?.role || "Pastor",
      bio: p?.bio || "",
      joinedYear: p?.joinedYear || "",
      endYear: p?.leftYear ?? p?.endYear ?? "",
      church: p?.church || "",
      email: p?.email || "",
      phone: p?.number ?? p?.phone ?? "",

    });

    setEducations(nextEducations);
    setCustomEducation(nextCustomEducation);
    setFile(p?.image?.url || null);
    setUploadStats(null);
    setUploadMeta(null);
    setUploadStage("idle");
    setPreview(p?.image?.url || null);
    toast.info("Editing pastor");
    setView("add");
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete Pastor",
      message: "Are you sure you want to delete this pastor profile?",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });
    if (!ok) return;

    try {
      await API.delete(`/pastors/${id}`);
      toast.success("Pastor deleted successfully");
      fetchPastors();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const setCurrentPastor = async (id) => {
    const ok = await confirm({
      title: "Set Current Pastor",
      message: "Are you sure you want to set this pastor as the current pastor?",
      confirmText: "Set Current",
      cancelText: "Cancel",
      isDanger: false,
    });
    if (!ok) return;

    try {
      await API.put(`/pastors/current/${id}`);
      toast.success("Current pastor updated");
      fetchPastors();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Unable to update current pastor");
    }
  };

  const clearSelectedImage = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setUploadStats(null);
    setUploadMeta(null);
    setUploadStage("idle");
  };

  const handleExport = async () => {
    try {
      toast.info("Preparing Excel export...");
      const response = await API.get("/pastors/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Pastors_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export successful!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#F8F6F4] min-h-screen w-full font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#531B24] flex items-center gap-2 tracking-tight">
              Pastors Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage and update pastor profiles and assignments.</p>
          </div>
          <div className="relative w-full sm:w-72 md:w-80">
            <input
              className="w-full pl-4 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-white shadow-sm"
              placeholder="Search pastor, role, or year..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-max">
            <button
              onClick={() => setView("add")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                view === "add" 
                  ? "bg-[#531B24] text-white shadow-md" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
              }`}
            >
              {editId ? <FaEdit size={12} /> : <FaPlus size={12} />} {editId ? "Edit Pastor" : "Add Pastor"}
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                view === "list" 
                  ? "bg-[#531B24] text-white shadow-md" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#531B24]"
              }`}
            >
              <FaUsers size={12} /> Pastor's List
            </button>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm w-max"
          >
            <FaFileExcel className="text-emerald-600" size={14} /> Download Excel
          </button>
        </div>

      <div
        className={`overflow-hidden transition-all duration-500 ${view === "add"
            ? "max-h-[5000px] opacity-100 mb-4"
            : "max-h-0 opacity-0 mb-0"
          }`}
      >
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">
              {editId ? "Edit Pastor Profile" : "Add New Pastor"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details for the pastor's profile.</p>
          </div>

          <div className="p-5 space-y-6">
            {/* BASIC INFO - 2 Column */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Name</label>
                  <input
                    name="name"
                    placeholder="Pastor Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50 appearance-none"
                  >
                    <option>Pastor</option>
                    <option>Senior Pastor</option>
                    <option>Associate Pastor</option>
                    <option>Youth Pastor</option>
                    <option>Worship Pastor</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    name="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Phone</label>
                  <input
                    name="phone"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* SERVICE PERIOD */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Service Period</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Joined Year</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    <input
                      name="joinedYear"
                      placeholder="e.g. 2018"
                      value={form.joinedYear}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">End Year (Leave empty if current)</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    <input
                      name="endYear"
                      placeholder="e.g. 2022"
                      value={form.endYear}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* EDUCATION */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Education & Bio</h3>
              
              <div className="space-y-3 mb-4">
                {educations.map((edu, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={edu}
                      onChange={(e) => {
                        const updated = [...educations];
                        updated[index] = e.target.value;
                        setEducations(updated);
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50 appearance-none"
                    >
                      <option value="">Select Degree</option>
                      {educationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    {educations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEducations(educations.filter((_, i) => i !== index))}
                        className="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                      >
                        <FaTimes size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {educations.includes("Other") && (
                  <input
                    type="text"
                    placeholder="Enter custom degree"
                    value={customEducation}
                    onChange={(e) => setCustomEducation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setEducations([...educations, ""])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#531B24] bg-[#531B24]/10 rounded hover:bg-[#531B24]/20 transition-colors w-max"
                >
                  <FaPlus size={10} /> Add Additional Education
                </button>
              </div>

              <textarea
                name="bio"
                placeholder="Write a short biography..."
                value={form.bio}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24] transition-all bg-slate-50 min-h-[100px] resize-y"
              />
            </div>

            {/* IMAGE UPLOAD (Gallery Style) */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Profile Image</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                    isDragActive 
                      ? "border-[#531B24] bg-[#531B24]/5 scale-[1.01]" 
                      : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <FaCloudUploadAlt className={`text-3xl mb-2 transition-transform duration-300 ${isDragActive ? "text-[#531B24] scale-110" : "text-slate-400"}`} />
                  <p className="text-sm font-bold text-slate-700 mb-1">
                    Upload Pastor Image
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                    JPG • PNG • WEBP
                  </p>
                </div>

                {/* Preview & Stats */}
                <div className="flex flex-col gap-3">
                  {preview ? (
                    <div className="relative flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-slate-800 truncate pr-4">{uploadMeta?.name || "Pastor Image"}</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); clearSelectedImage(); }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>

                        {uploadStage === "processing" ? (
                          <>
                            <div className="flex justify-between items-end mb-1">
                              <p className="text-[10px] font-bold text-[#531B24] flex items-center gap-1">
                                <FaSpinner className="animate-spin" /> Compressing...
                              </p>
                              <span className="text-[10px] font-bold text-[#531B24]">{uploadProgress}%</span>
                            </div>
                            <div className="h-1 w-full bg-[#531B24]/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#531B24] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </>
                        ) : uploadStage === "done" && uploadStats ? (
                          <div className="text-[10px] flex items-center gap-1 font-semibold text-emerald-600">
                            <FaCheckCircle /> Compressed to {(uploadStats.compressedSize / 1024 / 1024).toFixed(1)} MB (Saved {uploadStats.savingsPercentage}%)
                          </div>
                        ) : uploadMeta ? (
                          <div className="text-[10px] flex items-center gap-1 font-semibold text-[#531B24]">
                            Will compress to ~{(uploadMeta.estimatedCompressedSize / 1024 / 1024).toFixed(1)} MB
                          </div>
                        ) : (
                          <div className="text-[10px] flex items-center gap-1 font-semibold text-slate-500">
                            Image Ready
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-6 bg-white border border-slate-200 rounded-lg text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FaCamera size={24} />
                        <span className="text-xs">No image selected</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
              type="submit"
              disabled={loading || uploadStage === "processing"}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#531B24] rounded-lg hover:bg-[#40151c] transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : null}
              {editId ? "Update Pastor" : "Add Pastor"}
            </button>
          </div>
        </form>
      </div>

      {view === "list" && (
        loading ? (
          <p className="text-center text-slate-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPastors.map((p, index) => (
              <div
                key={p?._id}
                className={`animate-admin-card-in bg-white rounded-xl shadow-sm border ${p?.isCurrent ? "border-emerald-500 shadow-emerald-500/10" : "border-slate-200"} transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col overflow-hidden`}
                style={{
                  animationDelay: `${Math.min(index, 10) * 50}ms`,
                }}
              >
                <div className="relative h-48 w-full bg-slate-100 shrink-0">
                  <img
                    src={p?.image?.url || getFallbackAvatar()}
                    alt={p?.name}
                    onError={(e) => handleImageError(e)}
                    className="h-full w-full object-cover"
                  />

                  {p?.isCurrent && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <FaStar size={10} />
                      Current
                    </span>
                  )}
                </div>

                <div className="flex flex-col flex-1 p-4">
                  <div className="mb-3">
                    <h2 className="text-base font-bold text-slate-800 line-clamp-1">{p?.name}</h2>
                    <p className="text-xs font-semibold text-[#531B24]">{p?.role}</p>
                  </div>

                  <div className="space-y-1.5 mb-4 flex-1">
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      <FaCalendarAlt className="text-slate-400 shrink-0" />
                      <span>{p?.joinedYear} - {p?.leftYear ?? p?.endYear ?? "Present"}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {p?.bio || "No biography available"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedPastor(p)}
                      className="flex-1 flex justify-center py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded text-[11px] font-semibold transition-colors"
                      title="View"
                    >
                      <FaEye size={12} />
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      className="flex-1 flex justify-center py-1.5 bg-slate-50 hover:bg-slate-100 text-amber-600 border border-slate-200 rounded text-[11px] font-semibold transition-colors"
                      title="Edit"
                    >
                      <FaEdit size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="flex-1 flex justify-center py-1.5 bg-slate-50 hover:bg-red-50 text-red-600 border border-slate-200 rounded text-[11px] font-semibold transition-colors"
                      title="Delete"
                    >
                      <FaTrashAlt size={12} />
                    </button>
                  </div>

                  {!p?.isCurrent && (
                    <button
                      onClick={() => setCurrentPastor(p._id)}
                      className="w-full mt-1.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <FaStar size={10} />
                      Set as Current
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
      {selectedPastor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="admin-card max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <div className="relative">
              <img
                src={selectedPastor?.image?.url || getFallbackAvatar()}
                alt={selectedPastor?.name}
                onError={(e) => handleImageError(e)}
                className="pastor-placeholder h-72 w-full object-cover sm:h-80"
              />

              <button
                onClick={() => setSelectedPastor(null)}
                className="admin-btn-icon absolute right-4 top-4 bg-white/90 text-slate-700 hover:bg-white"
                aria-label="Close pastor details"
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {selectedPastor?.name}
                  </h2>
                  <p className="text-lg text-slate-600">{selectedPastor?.role}</p>
                </div>

                {selectedPastor?.isCurrent && (
                  <span className="inline-flex items-center gap-2 self-start rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    <FaStar />
                    Current Pastor
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Church
                  </p>
                  <p className="mt-1 text-slate-800">{selectedPastor?.church || "-"}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Years Served
                  </p>
                  <p className="mt-1 text-slate-800">
                    {selectedPastor?.joinedYear} -{" "}
                    {selectedPastor?.leftYear ?? selectedPastor?.endYear ?? "Present"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Email
                  </p>
                  <p className="mt-1 text-slate-800">{selectedPastor?.email || "-"}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Phone
                  </p>
                  <p className="mt-1 text-slate-800">{selectedPastor?.number || "-"}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Education</h3>

                {Array.isArray(selectedPastor?.education) ? (
                  <ul className="list-disc space-y-1 pl-5 text-slate-700">
                    {selectedPastor.education.map((edu, i) => (
                      <li key={i}>{edu}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-700">{selectedPastor?.education || "-"}</p>
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Biography</h3>
                <p className="whitespace-pre-wrap text-slate-700">
                  {selectedPastor?.bio || "No biography available"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
