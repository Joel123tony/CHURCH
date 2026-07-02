export default {
  label: "Footer Section",
  fields: [
    {
      name: "copyright",
      label: "Copyright Text",
      type: "text",
      description: "Copyright notice displayed at the bottom of the page",
    },
    {
      name: "footerText",
      label: "Footer Tagline",
      type: "text",
      description: "Optional tagline or secondary text in the footer",
    },
  ],
  styles: [
    { name: "backgroundColor", label: "Background Color", type: "color", default: "#54091b" },
    { name: "textColor",       label: "Text Color",       type: "color", default: "#F4EFE7" },
    { name: "linkColor",       label: "Link / Icon Color", type: "color", default: "#EFBF04" },
  ],
};