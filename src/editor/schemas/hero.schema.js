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
    { name: "backgroundColor", label: "Background Color", type: "color", default: "#54091b" },
    { name: "headingColor", label: "Heading Color", type: "color", default: "#F4EFE7" },
    { name: "subheadingColor", label: "Subheading Color", type: "color", default: "#F4EFE7" },
    { name: "buttonBackground", label: "Button Background", type: "color", default: "#54091b" },
    { name: "buttonTextColor", label: "Button Text Color", type: "color", default: "#FFFFFF" }
  ]
};