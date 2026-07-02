export default {
  label: "Contact Section",
  fields: [
    {
      name: "email",
      label: "Email Address",
      type: "text",
      description: "Public contact email shown on the website",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "text",
      description: "Contact phone number",
    },
    {
      name: "address",
      label: "Church Address",
      type: "textarea",
      description: "Full physical address of the church",
    },
    {
      name: "description",
      label: "Contact Description",
      type: "textarea",
      description: "Short introductory text shown above the contact details",
    },
  ],
  styles: [
    { name: "backgroundColor", label: "Background Color", type: "color", default: "#54091b" },
    { name: "headingColor",    label: "Heading Color",    type: "color", default: "#F4EFE7" },
    { name: "textColor",       label: "Text Color",       type: "color", default: "#F4EFE7" },
    { name: "cardBackground",  label: "Card Background",  type: "color", default: "#F4EFE7" },
    { name: "cardTextColor",   label: "Card Text Color",  type: "color", default: "#54091b" },
    { name: "cardBorderColor", label: "Card Border Color",type: "color", default: "transparent" },
    { name: "buttonBackground",label: "Button Background",type: "color", default: "#54091b" },
    { name: "buttonTextColor", label: "Button Text Color",type: "color", default: "#F4EFE7" },
  ],
};