export default function Events() {
  return (
    <section className="bg-primary py-16">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-3xl font-bold text-white mb-10">
          Events
        </h2>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="bg-cream p-6 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">
              Latest Event
            </h3>

            <div className="h-64 bg-gray-200 rounded-2xl mb-5"></div>

            <p>Title:</p>
            <p>Date:</p>
            <p>Location:</p>
          </div>

          <div className="bg-cream p-6 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">
              Upcoming Event
            </h3>

            <div className="h-64 bg-gray-200 rounded-2xl mb-5"></div>

            <p>Title:</p>
            <p>Date:</p>
            <p>Location:</p>
          </div>

        </div>

      </div>

    </section>
  );
}