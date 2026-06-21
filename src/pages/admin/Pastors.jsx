import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
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
} from "react-icons/fa";
import API from "../../api/axios";
import { ToastContainer, toast } from "react-toastify";
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

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const getCompressionOptions = (sizeInBytes) => {
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB <= 1) {
    return {
      maxSizeMB: 0.9,
      maxWidthOrHeight: 1800,
      initialQuality: 0.95,
      useWebWorker: true,
    };
  }

  if (sizeInMB <= 5) {
    return {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2200,
      initialQuality: 0.92,
      useWebWorker: true,
    };
  }

  return {
    maxSizeMB: 2.5,
    maxWidthOrHeight: 2600,
    initialQuality: 0.9,
    useWebWorker: true,
  };
};

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

export default function Pastors() {
  const [pastors, setPastors] = useState([]);
const [view, setView] = useState("add");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPastor, setSelectedPastor] = useState(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      setUploadingImage(true);

      const compressed = await imageCompression(
        selected,
        getCompressionOptions(selected.size || 0)
      );

      const finalFile =
        compressed instanceof File
          ? compressed
          : new File([compressed], selected.name, {
              type: compressed.type || selected.type,
            });

      const blobUrl = URL.createObjectURL(finalFile);
      setFile(finalFile);
      setPreview(blobUrl);
      setImageInfo({
        name: finalFile.name || selected.name,
        originalSize: selected.size || 0,
        compressedSize: finalFile.size || selected.size || 0,
      });

      if ((finalFile.size || 0) < (selected.size || 0)) {
        toast.success("Image compressed before upload");
      } else {
        toast.info("Image ready for upload");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process image");
    } finally {
      setUploadingImage(false);
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
    if (!file) return "";

    const data = new FormData();
    data.append("file", file);

    const res = await API.post("/upload/image", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

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
    setImageInfo(null);
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
      };

      if (image?.url) {
        payload.image = image;
      }

      if (editId) {
        await API.put(`/pastors/${editId}`, payload);
        toast.success("Pastor updated successfully");
      } else {
        await API.post("/pastors", payload);
        toast.success("Pastor added successfully");
      }

      resetForm();
      fetchPastors();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Operation failed");
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
    setFile(null);
    setImageInfo(null);
    setPreview(p?.image?.url || null);
    toast.info("Editing pastor");
    setView("add");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this pastor?")) return;

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
    if (!window.confirm("Set this pastor as the current pastor?")) return;

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
    setImageInfo(null);
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-3 py-4 sm:px-6">
      <ToastContainer
        position="top-right"
        autoClose={1800}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-lg sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Pastors Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Search, edit, pin, and update pastors with a responsive admin flow.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Search pastor, role, or year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setView("add")}
       className={`rounded-2xl px-4 py-2.5 font-semibold transition-colors ${
  view === "add"
    ? "bg-green-600 text-white shadow"
    : "bg-white text-slate-700 hover:bg-slate-100"
}`}
        >
          Add Pastors
        </button>

        <button
          onClick={() => setView("list")}
         className={`rounded-2xl px-4 py-2.5 font-semibold transition-colors ${
  view === "list"
    ? "bg-slate-800 text-white shadow"
    : "bg-white text-slate-700 hover:bg-slate-100"
}`}
        >
          Pastor&apos;s List
        </button>
      </div>

     <div
  className={`overflow-hidden transition-all duration-500 ${
    view === "add"
      ? "max-h-[5000px] opacity-100 mb-6"
      : "max-h-0 opacity-0 mb-0"
  }`}
>
  <form
    onSubmit={handleSubmit}
    className="rounded-3xl border border-slate-100 bg-white p-4 shadow-lg sm:p-6"
  >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            required
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option>Pastor</option>
            <option>Senior Pastor</option>
            <option>Associate Pastor</option>
            <option>Youth Pastor</option>
            <option>Worship Pastor</option>
            <option>Other</option>
          </select>

          <div className="lg:col-span-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FaCalendarAlt className="text-blue-600" />
              Service Period
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <FaCalendarAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="joinedYear"
                  placeholder="Joined Year"
                  value={form.joinedYear}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-11 text-base shadow-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="relative">
                <FaCalendarAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="endYear"
                  placeholder="End Year"
                  value={form.endYear}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-11 text-base shadow-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block font-semibold text-slate-800">
              Educational Qualifications
            </label>

            <div className="space-y-3">
              {educations.map((edu, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={edu}
                    onChange={(e) => {
                      const updated = [...educations];
                      updated[index] = e.target.value;
                      setEducations(updated);
                    }}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                      onClick={() =>
                        setEducations(educations.filter((_, i) => i !== index))
                      }
                      className="rounded-2xl bg-red-500 px-3 text-white transition-colors hover:bg-red-600"
                    >
                      ×
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              )}

              <button
                type="button"
                onClick={() => setEducations([...educations, ""])}
                className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-green-700"
              >
                <FaPlus />
                Add Additional Education
              </button>
            </div>
          </div>

          <textarea
            name="bio"
            placeholder="Bio"
            value={form.bio}
            onChange={handleChange}
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div
              {...getRootProps()}
              className={`rounded-3xl border-2 border-dashed p-4 sm:p-5 transition-all duration-300 ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <input {...getInputProps()} />

              <div className="flex min-h-28 flex-col items-center justify-center py-1 text-center sm:min-h-32 sm:py-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                  <FaCloudUploadAlt className="text-xl" />
                </div>

                <h3 className="mt-2 text-base font-semibold text-slate-800 sm:text-lg">
                  {isDragActive ? "Drop pastor image here" : "Upload Pastor Image"}
                </h3>

                <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  Drag and drop a JPG, PNG, or WEBP image here, or choose a file.
                  Images are compressed automatically before upload.
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={open}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <FaImage />
                    Choose File
                  </button>
                </div>

                {uploadingImage && (
                  <p className="mt-2 text-sm text-blue-700 animate-pulse">
                    Compressing image...
                  </p>
                )}

                {imageInfo && (
                  <div className="mt-3 max-w-sm rounded-2xl bg-white/90 px-4 py-3 text-left text-sm text-slate-600 shadow-sm">
                    <p className="font-semibold text-slate-800">{imageInfo.name}</p>
                    <p className="mt-1">
                      {formatBytes(imageInfo.originalSize)} →{" "}
                      {formatBytes(imageInfo.compressedSize)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 sm:text-base">
                  Image Preview
                </h3>

                {preview && (
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-xs text-white transition-colors hover:bg-red-600 sm:text-sm"
                  >
                    <FaTimes />
                    Remove
                  </button>
                )}
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl bg-slate-100">
                {preview ? (
                  <img
                    src={preview}
                    alt="Pastor preview"
                    className="h-40 w-full object-cover sm:h-44"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-slate-400 sm:h-44">
                    <div className="text-center">
                      <FaCamera className="mx-auto text-2xl sm:text-3xl" />
                      <p className="mt-2 text-xs sm:text-sm">No image selected yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`mt-6 w-full rounded-2xl px-5 py-3 font-semibold text-white transition-colors sm:w-auto ${
            editId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {editId ? "Update Pastor" : "Add Pastor"}
        </button>
      </form>
       </div>

     {view === "list" && (
  loading ? (
    <p className="text-center text-slate-500">Loading...</p>
  ) : (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPastors.map((p, index) => (
            <div
              key={p?._id}
              className={`animate-admin-card-in overflow-hidden rounded-3xl border-2 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                p?.isCurrent ? "border-green-500" : "border-transparent"
              }`}
              style={{
                animationDelay: `${Math.min(index, 10) * 70}ms`,
              }}
            >
              <div className="relative">
                <img
                  src={p?.image?.url || "/default.png"}
                  alt={p?.name}
                  className="h-52 w-full object-cover"
                />

                {p?.isCurrent && (
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-green-600/25">
                    <FaStar />
                    Current
                  </span>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{p?.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{p?.role}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">Years:</span>{" "}
                  {p?.joinedYear} - {p?.leftYear ?? p?.endYear ?? "Present"}
                </p>

                <p className="line-clamp-2 text-sm text-slate-600">
                  {p?.bio || "No biography available"}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => setSelectedPastor(p)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                  >
                    <FaEye />
                    View
                  </button>

                  <button
                    onClick={() => handleEdit(p)}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-600"
                  >
                    <FaEdit />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(p._id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                  >
                    <FaTrashAlt />
                    Delete
                  </button>

                  {!p?.isCurrent && (
                    <button
                      onClick={() => setCurrentPastor(p._id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700"
                    >
                      <FaStar />
                      Pastor Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
           )
)}
      {selectedPastor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="relative">
              <img
                src={selectedPastor?.image?.url || "/default.png"}
                alt={selectedPastor?.name}
                className="h-72 w-full object-cover sm:h-80"
              />

              <button
                onClick={() => setSelectedPastor(null)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
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
  );
}
