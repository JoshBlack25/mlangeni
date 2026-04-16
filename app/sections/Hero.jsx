"use client";

export default function Hero() {
  return (
    <div className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden">
      {/* LEFT SIDE */}
      <div className="group relative w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
        {/* IMAGE */}
        <img
          src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2070&auto=format&fit=crop"
          alt="Wedding Event"
          className="w-full h-full object-cover scale-105 brightness-75 group-hover:brightness-50 transition duration-700"
        />

        {/* OVERLAY CONTENT */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-md">
            {/* ALWAYS VISIBLE HEADER */}
            <h1 className="text-4xl md:text-5xl font-light font-[Playfair_Display] mb-4">
              MLANGENI Events
            </h1>

            {/* HIDDEN CONTENT */}
            <div className="opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition duration-500">
              <p className="text-sm opacity-80 mb-6">
                Creating the world’s most memorable events with precision, style
                and imagination.
              </p>
              <button className="border border-white px-6 py-2 text-xs tracking-[0.2em] hover:bg-white hover:text-black transition">
                START PLANNING
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="group relative w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
        {/* IMAGE */}
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop"
          alt="Catering"
          className="w-full h-full object-cover scale-105 brightness-75 group-hover:brightness-50 transition duration-700"
        />

        {/* OVERLAY CONTENT */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6">
            {/* ALWAYS VISIBLE HEADER */}
            <h1 className="text-4xl md:text-5xl font-light font-[Playfair_Display]">
              Hospitality Collection
            </h1>

            {/* (Optional future hover content placeholder) */}
            <div className="opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition duration-500">
              {/* add content later if needed */}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER LOGO */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <img src="/logo.png" alt="Logo" className="w-24 md:w-40 opacity-90" />
      </div>
    </div>
  );
}
