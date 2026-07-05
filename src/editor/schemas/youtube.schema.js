export default {
  label: "YouTube Section",
  fields: [],
  styles: [
    { name: "backgroundColor", label: "Background Color", type: "color", default: "#F4EFE7", group: "Section" },
    { name: "sectionTitleColor", label: "Section Title Color", type: "color", default: "#54091b", group: "Typography" },
    { name: "sectionTitleFontSize", label: "Section Title Font Size", type: "select", options: ["text-2xl", "text-3xl", "text-4xl", "text-5xl"], default: "text-3xl", group: "Typography" },
    { name: "sectionTitleFontWeight", label: "Section Title Font Weight", type: "select", options: ["font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold"], default: "font-bold", group: "Typography" },
    { name: "subtitleColor", label: "Subtitle Color", type: "color", default: "#1E293B", group: "Typography" },
    { name: "subtitleFontSize", label: "Subtitle Font Size", type: "select", options: ["text-sm", "text-base", "text-lg", "text-xl"], default: "text-base", group: "Typography" },
    { name: "cardTitleColor", label: "Video Title Color", type: "color", default: "#F4EFE7", group: "Typography" },
    { name: "cardTitleFontSize", label: "Card Title Font Size", type: "select", options: ["text-base", "text-lg", "text-xl", "text-2xl"], default: "text-lg", group: "Typography" },
    { name: "cardTitleFontWeight", label: "Card Title Font Weight", type: "select", options: ["font-medium", "font-semibold", "font-bold"], default: "font-bold", group: "Typography" },
    { name: "metadataColor", label: "Date Color", type: "color", default: "#F4EFE7", group: "Typography" },
    { name: "metadataFontSize", label: "Metadata Font Size", type: "select", options: ["text-xs", "text-sm", "text-base"], default: "text-sm", group: "Typography" },
    { name: "cardBackground", label: "Card Background Color", type: "color", default: "#FFFFFF", group: "Cards" },
    { name: "buttonBackground", label: "Button Background Color", type: "color", default: "#54091b", group: "Buttons" },
    { name: "buttonTextColor", label: "Button Text Color", type: "color", default: "#FFFFFF", group: "Buttons" }
  ]
};
