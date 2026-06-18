export default function History() {
  return (
    <section
      id="history"
      className="bg-cream overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="pt-16 lg:pt-24">
         <h2 className="text-primary text-3xl font-bold">
                Church History
              </h2>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 xl:gap-24 items-end mt-12">

          {/* Text */}
          <div className="order-1">
            <div className="max-w-2xl">
              <p className="text-gray-700 text-base md:text-lg leading-8 md:leading-9">
                From 1975 to 1983, the ministry led by Rev. Y. Moses Selvaraj
                played a significant role in the remarkable growth and
                development of the church. Under his dedicated leadership, the
                church expanded both in strength and in spiritual vision, with
                ministries growing steadily and purposefully.
              </p>

              <p className="mt-6 text-gray-700 text-base md:text-lg leading-8 md:leading-9">
                During this period, the ministry at Padikuppam was initiated,
                marking an important step in the church’s mission outreach. The
                vision was to extend God’s work beyond the local congregation,
                establishing a strong presence across major districts and
                surrounding regions.
              </p>

              <p className="mt-6 text-gray-700 text-base md:text-lg leading-8 md:leading-9">
                This foundation helped the church grow in faith, unity, and
                outreach, shaping its mission for future generations.
              </p>
            </div>
          </div>

          {/* Church Image */}
          <div className="order-2 flex justify-center lg:justify-end self-end">
            <img
              src="https://res.cloudinary.com/dhqc0n23k/image/upload/v1781002196/church_wfthtv.png"
              alt="Methodist Tamil Church"
              className="
                block
                w-full
                max-w-[300px]
                sm:max-w-[360px]
                md:max-w-[430px]
                lg:max-w-[520px]
                xl:max-w-[600px]
                h-auto
                object-contain
                drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]
                lg:translate-y-10
              "
            />
          </div>

        </div>
      </div>
    </section>
  );
}