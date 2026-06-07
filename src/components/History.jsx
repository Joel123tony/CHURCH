export default function History() {
  return (
<section id="history" className="bg-cream py-12 overflow-hidden">
  <div className="max-w-7xl mx-auto px-6">

    <h2 className="text-3xl font-bold text-primary mb-6">
      Church History
    </h2>

    <div className="grid lg:grid-cols-2 gap-8 items-center">

      <div>
        <p className="text-gray-700 leading-7">
          From 1975 to 1983 the work of Rev. Y. Moses Selvaraj
          was seen as remarkable in terms of church growth
          and ministry. Ministries grew with vision.
        </p>

        <p className="text-gray-700 leading-7 mt-3">
          Ministry at Padikuppam was started and the church
          wanted to make its footprints in major districts
          and surrounding regions.
        </p>
      </div>

      <div className="flex justify-center">
        <img
          src="/public/history/church.png"
          alt="Church History"
          className="w-full max-w-lg object-contain"
        />
      </div>

    </div>

  </div>
</section>
  );
}