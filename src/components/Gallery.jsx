export default function Gallery() {
  return (
    <section className="bg-cream py-16">

      <div className="max-w-7xl mx-auto px-6">

        <div className="flex justify-between mb-10">
          <h2 className="text-3xl font-bold text-primary">
            Gallery
          </h2>

          <button className="bg-primary text-white px-5 py-2 rounded-full">
            All Images
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="h-96 bg-gray-200 rounded-3xl"></div>

          <div className="h-96 bg-gray-200 rounded-3xl"></div>

          <div className="h-96 bg-gray-200 rounded-3xl"></div>

        </div>

      </div>

    </section>
  );
}