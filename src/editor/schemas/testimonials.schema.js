export default {
  label: "Pastor's Message",
  fields: [
    {
      name: "title",
      label: "Section Title",
      type: "text",
      description: "Heading displayed above the pastor message cards",
    },
    {
      name: "pastorMessageList",
      label: "Pastor's Message List",
      type: "array",
      itemSchema: [
        { name: "author", label: "Author Name",     type: "text"     },
        { name: "quote",  label: "Quote Message",   type: "textarea" },
        { name: "role",   label: "Role / Position", type: "text"     },
      ],
    },
  ],
  styles: [
    { name: "backgroundColor", label: "Background Color",  type: "color", default: "#F4EFE7" },
    { name: "headingColor",    label: "Heading Color",     type: "color", default: "#54091b" },
    { name: "textColor",       label: "Text Color",        type: "color", default: "#1E293B" },
    { name: "cardBackground",  label: "Card Background",   type: "color", default: "#FFFFFF" },
    { name: "cardTextColor",   label: "Card Text Color",   type: "color", default: "#5b1320" },
    { name: "quoteColor",      label: "Quote Color",       type: "color", default: "#475569" },
  ],
};
