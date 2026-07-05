export default {
  label: "Hero Section",
  fields: [
    {
      name: "heading",
      label: "Heading",
      type: "text",
    },
    {
      name: "subheading",
      label: "Subheading",
      type: "text",
    },
  ],
  styles: [
    { name: "backgroundColor", label: "Background Color", type: "color", default: "#000000", group: "Section" },
    { name: "sectionTitleColor", label: "Section Title Color", type: "color", default: "#FFFFFF", group: "Typography" },
    { name: "sectionTitleFontSize", label: "Section Title Font Size", type: "select", options: ["text-2xl", "text-3xl", "text-4xl", "text-5xl"], default: "text-3xl", group: "Typography" },
    { name: "sectionTitleFontWeight", label: "Section Title Font Weight", type: "select", options: ["font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold"], default: "font-bold", group: "Typography" },
    { name: "subtitleColor", label: "Subtitle Color", type: "color", default: "#F4EFE7", group: "Typography" },
    { name: "subtitleFontSize", label: "Subtitle Font Size", type: "select", options: ["text-sm", "text-base", "text-lg", "text-xl"], default: "text-base", group: "Typography" },
    { name: "bodyTextColor", label: "Body Text Color", type: "color", default: "#F4EFE7", group: "Typography" },
    { name: "bodyFontSize", label: "Body Font Size", type: "select", options: ["text-xs", "text-sm", "text-base", "text-lg"], default: "text-base", group: "Typography" },
    { name: "buttonBackground", label: "Button Background Color", type: "color", default: "#54091b", group: "Buttons" },
    { name: "buttonTextColor", label: "Button Text Color", type: "color", default: "#FFFFFF", group: "Buttons" }
  ]
};
