import TextField from "../fields/TextField";
import TextareaField from "../fields/TextareaField";
import UrlField from "../fields/UrlField";
import ImageField from "../fields/ImageField";

export default function DynamicRenderer({ schema }) {
  return (
    <div>
      {schema.fields.map((field) => {
        switch (field.type) {
          case "text":
            return (
              <TextField
                key={field.name}
                field={field}
              />
            );

          case "textarea":
            return (
              <TextareaField
                key={field.name}
                field={field}
              />
            );

          case "url":
            return (
              <UrlField
                key={field.name}
                field={field}
              />
            );

          case "image":
            return (
              <ImageField
                key={field.name}
                field={field}
              />
            );

          default:
            return (
              <p
                key={field.name}
                className="text-red-500"
              >
                Unsupported field: {field.type}
              </p>
            );
        }
      })}
    </div>
  );
}