import DynamicRenderer from "../editor/renderer/DynamicRenderer";
import heroSchema from "../editor/schemas/hero.schema";

export default function EditorTest() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">
        Dynamic CMS Test
      </h1>

      <DynamicRenderer schema={heroSchema} />
    </div>
  );
}