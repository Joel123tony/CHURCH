export default function Hero() {
  return (
    <section className="bg-primary text-white py-16">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10">

        <div>
          <h1 className="text-4xl font-bold mb-6">
            MTC Padikuppam
          </h1>

          <p className="leading-8">
Methodist Tamil Church serves the local community through worship, prayer, biblical teaching, discipleship, fellowship, and outreach ministries. We are committed to sharing the love of Jesus Christ, strengthening families, nurturing spiritual growth, and building a welcoming church community for people of all ages.          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-8">

            <div className="bg-cream text-primary p-5 rounded-xl">
              <h3 className="font-bold">Address</h3>
              <p>No. 1, Vandiamman Koil Street,
Mogappair East,
Chennai,
Tamil Nadu 600107,
India</p>
            </div>

            <div className="bg-cream text-primary p-5 rounded-xl">
              <h3 className="font-bold">Languages</h3>
              <p>Tamil / English</p>
            </div>

          </div>
        </div>

        <div className="bg-cream rounded-3xl p-4">
          <div className="bg-white rounded-2xl h-72" />

          <div className="flex justify-between mt-4">
            <span>Live Now</span>

            <button className="bg-primary px-4 py-2 rounded-full">
              YouTube
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}