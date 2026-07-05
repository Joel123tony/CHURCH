export default {
  label: "Church History",
  fields: [
    {
      name: "title",
      label: "Section Title",
      type: "text",
      description: "Heading displayed at the top of the Church History section",
    },
    {
      name: "content",
      label: "Church History",
      type: "textarea",
      description: "Full church history text. Use blank lines to separate paragraphs.",
    },
    {
      name: "imageUrl",
      label: "Section Image",
      type: "image",
      description: "Optional image displayed alongside the history text",
    },
  ],
  styles: [
    { name: "backgroundColor", label: "Background Color", type: "color", default: "#F4EFE7", group: "Section" },
    { name: "sectionTitleColor", label: "Section Title Color", type: "color", default: "#54091b", group: "Typography" },
    { name: "sectionTitleFontSize", label: "Section Title Font Size", type: "select", options: ["text-2xl", "text-3xl", "text-4xl", "text-5xl"], default: "text-3xl", group: "Typography" },
    { name: "sectionTitleFontWeight", label: "Section Title Font Weight", type: "select", options: ["font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold"], default: "font-bold", group: "Typography" },
    { name: "subtitleColor", label: "Subtitle Color", type: "color", default: "#1E293B", group: "Typography" },
    { name: "subtitleFontSize", label: "Subtitle Font Size", type: "select", options: ["text-sm", "text-base", "text-lg", "text-xl"], default: "text-base", group: "Typography" },
    { name: "bodyTextColor", label: "Body Text Color", type: "color", default: "#1E293B", group: "Typography" },
    { name: "bodyFontSize", label: "Body Font Size", type: "select", options: ["text-xs", "text-sm", "text-base", "text-lg"], default: "text-base", group: "Typography" }
  ]
};
