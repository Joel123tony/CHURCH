import React, { useEffect, useState } from "react";
import { FaArrowUp, FaArrowDown, FaTrash, FaGripVertical, FaSync, FaLock } from "react-icons/fa";
import { getBlock, saveBlock } from "../../services/api";
import { useConfirm } from "../../context/ConfirmContext";

export default function DragDropSections({ onOrderChange }) {
  const confirm = useConfirm();
  const [sections, setSections] = useState(["hero", "history", "events", "gallery", "pastor", "prayer", "testimonials", "youtube", "books", "contact", "footer"]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);

  const labels = {
    hero: "Hero Section",
    history: "Church History",
    events: "Events",
    gallery: "Gallery",
    pastor: "Pastor",
    prayer: "Prayer Requests",
    testimonials: "Pastor's Message",
    youtube: "YouTube",
    books: "Books & Pamphlets",
    contact: "Contact",
    footer: "Footer"
  };

  const sanitizeOrder = (loadedArray) => {
    const defaultMiddle = ["history", "events", "gallery", "pastor", "prayer", "testimonials", "youtube", "books", "contact"];
    
    // Extract middle sections from loaded array, keeping only valid ones
    const loadedMiddle = Array.isArray(loadedArray)
      ? loadedArray.filter(sec => defaultMiddle.includes(sec))
      : [];
      
    // Append any missing middle sections
    const missingMiddle = defaultMiddle.filter(sec => !loadedMiddle.includes(sec));
    const finalMiddle = [...loadedMiddle, ...missingMiddle];
    
    // Assemble with hero at index 0 and footer at the end
    return ["hero", ...finalMiddle, "footer"];
  };

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      try {
        const res = await getBlock("section-order");
        const orderData = res?.data || [];
        const sanitized = sanitizeOrder(Array.isArray(orderData) ? orderData : orderData.order);
        setSections(sanitized);
        if (onOrderChange) onOrderChange(sanitized);
      } catch (err) {
        console.warn("Failed to load section order, falling back to default.", err);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, []);

  const handleSave = async (newOrder) => {
    // Double check constraints on saving
    const finalizedOrder = sanitizeOrder(newOrder);
    setStatus("Saving order...");
    try {
      await saveBlock("section-order", finalizedOrder);
      setStatus("Order saved successfully!");
      if (onOrderChange) onOrderChange(finalizedOrder);
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      console.error(err);
      setStatus("Failed to save order");
    }
  };

  const moveUp = (index) => {
    // Only allow middle sections to move, and they cannot swap with hero (index 0)
    if (index <= 1 || index === sections.length - 1) return;
    const nextOrder = [...sections];
    const temp = nextOrder[index];
    nextOrder[index] = nextOrder[index - 1];
    nextOrder[index - 1] = temp;
    setSections(nextOrder);
    handleSave(nextOrder);
  };

  const moveDown = (index) => {
    // Only allow middle sections to move, and they cannot swap with footer (index length-1)
    if (index === 0 || index >= sections.length - 2) return;
    const nextOrder = [...sections];
    const temp = nextOrder[index];
    nextOrder[index] = nextOrder[index + 1];
    nextOrder[index + 1] = temp;
    setSections(nextOrder);
    handleSave(nextOrder);
  };

  const deleteSection = async (index) => {
    // Hero and Footer cannot be deleted
    if (index === 0 || index === sections.length - 1) return;
    const sectionName = sections[index];
    const ok = await confirm({
      title: "Remove Section",
      message: `Are you sure you want to remove the ${labels[sectionName] || sectionName} section from the page layout?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      isDanger: true,
    });
    if (!ok) return;

    const nextOrder = sections.filter((_, i) => i !== index);
    setSections(nextOrder);
    handleSave(nextOrder);
  };

  const resetDefault = () => {
    const defaultOrder = ["hero", "history", "events", "gallery", "pastor", "prayer", "testimonials", "youtube", "books", "contact", "footer"];
    setSections(defaultOrder);
    handleSave(defaultOrder);
  };

  // Drag and Drop handlers restricted to middle sections
  const handleDragStart = (e, index) => {
    // Locked items cannot be dragged
    if (index === 0 || index === sections.length - 1) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Cannot drag over or swap with hero or footer
    if (index === 0 || index === sections.length - 1) return;
    if (draggedIndex === 0 || draggedIndex === sections.length - 1) return;
    
    const nextOrder = [...sections];
    const item = nextOrder[draggedIndex];
    nextOrder.splice(draggedIndex, 1);
    nextOrder.splice(index, 0, item);
    
    setDraggedIndex(index);
    setSections(nextOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    handleSave(sections);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Visual Reordering</h3>
          <p className="text-xs text-slate-400">Drag items or use arrow keys to change section order.</p>
        </div>
        <button
          type="button"
          onClick={resetDefault}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition"
          title="Reset to default order"
        >
          <FaSync size={10} /> Reset
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-slate-500">Loading order...</div>
      ) : (
        <div className="mt-4 space-y-2">
          {sections.map((sec, index) => {
            const isLocked = index === 0 || index === sections.length - 1;
            return (
              <div
                key={sec}
                draggable={!isLocked}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all ${
                  isLocked
                    ? "bg-slate-50 border-slate-100 cursor-not-allowed select-none opacity-70"
                    : draggedIndex === index
                    ? "opacity-40 border-dashed border-[#54091b] bg-white"
                    : "bg-white border-slate-200 hover:border-[#54091b]/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isLocked ? (
                    <span className="text-slate-400" title="Fixed position">
                      <FaLock size={12} />
                    </span>
                  ) : (
                    <span className="cursor-grab text-slate-300 hover:text-slate-600 transition active:cursor-grabbing">
                      <FaGripVertical size={14} />
                    </span>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      {labels[sec] || sec.toUpperCase()}
                      {isLocked && (
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          Fixed
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400">ID: {sec}</p>
                  </div>
                </div>

                {!isLocked && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index <= 1}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Move Up"
                    >
                      <FaArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index >= sections.length - 2}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Move Down"
                    >
                      <FaArrowDown size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSection(index)}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete Section"
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {status && (
        <div className={`mt-4 rounded-lg px-3 py-2 text-center text-xs font-semibold ${
          status.includes("successfully") ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
