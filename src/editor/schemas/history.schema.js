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
      label: "History Description",
      type: "textarea",
      description: "Main body text describing the church history",
    },
    {
      name: "imageUrl",
      label: "Section Image",
      type: "image",
      description: "Optional image displayed alongside the history text",
    },
  ],
  styles: [
    { name: "backgroundColor", label: "Background Color", type: "color", default: "#F4EFE7" },
    { name: "textColor",       label: "Text Color",       type: "color", default: "#54091b" },
    { name: "headingColor",    label: "Heading Color",    type: "color", default: "#54091b" },
  ],
};