import React from "react";
import TextField from "../fields/TextField";
import TextareaField from "../fields/TextareaField";
import ImageField from "../fields/ImageField";
import UrlField from "../fields/UrlField";
import { FaTrash, FaArrowUp, FaArrowDown, FaPlus } from "react-icons/fa";

export default function ArrayField({ value = [], onChange, field }) {
  const items = Array.isArray(value) ? value : [];
  const itemSchema = field.itemSchema || [];

  const handleItemChange = (index, name, val) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [name]: val,
    };
    onChange(newItems);
  };

  const addItem = () => {
    const newItem = {};
    itemSchema.forEach((f) => {
      newItem[f.name] = f.defaultValue !== undefined ? f.defaultValue : "";
    });
    onChange([...items, newItem]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    onChange(newItems);
  };

  const moveDown = (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    onChange(newItems);
  };

  const renderItemField = (item, index, f) => {
    const itemVal = item?.[f.name] ?? "";

    switch (f.type) {
      case "text":
        return (
          <TextField
            value={itemVal}
            onChange={(val) => handleItemChange(index, f.name, val)}
            placeholder={f.label}
          />
        );
      case "textarea":
        return (
          <TextareaField
            value={itemVal}
            onChange={(val) => handleItemChange(index, f.name, val)}
            placeholder={f.label}
          />
        );
      case "image":
        return (
          <ImageField
            value={itemVal}
            onChange={(val) => handleItemChange(index, f.name, val)}
          />
        );
      case "url":
        return (
          <UrlField
            value={itemVal}
            onChange={(val) => handleItemChange(index, f.name, val)}
          />
        );
      default:
        return (
          <input
            type="text"
            value={itemVal}
            onChange={(e) => handleItemChange(index, f.name, e.target.value)}
            placeholder={f.label}
            className="w-full rounded-lg border p-2 text-sm focus:border-[#54091b] outline-none"
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="text-sm font-semibold text-slate-700">{field.label} ({items.length})</h4>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
        >
          <FaPlus size={10} /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-400">
          No items added yet. Click "+ Add Item" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white hover:shadow-sm"
            >
              {/* Item index and reordering controls */}
              <div className="absolute right-3 top-3 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                  title="Move Up"
                >
                  <FaArrowUp size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === items.length - 1}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                  title="Move Down"
                >
                  <FaArrowDown size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Delete Item"
                >
                  <FaTrash size={10} />
                </button>
              </div>

              <div className="mb-2 text-xs font-semibold text-slate-400">Item #{index + 1}</div>

              {/* Form fields for item */}
              <div className="grid gap-3">
                {itemSchema.map((f) => (
                  <div key={f.name} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">{f.label}</label>
                    {renderItemField(item, index, f)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
