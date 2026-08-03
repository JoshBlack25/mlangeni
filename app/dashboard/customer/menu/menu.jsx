"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, UtensilsCrossed, Clock3, Users, Info } from "lucide-react";

const categories = ["All", "Starters", "Mains", "Desserts", "Refreshments"];

const menuItems = [
  {
    id: 1,
    name: "Chicken Wings",
    category: "Starters",
    description:
      "Tender chicken wings marinated in our signature herbs and spices, then grilled to perfection.",
    image: "/images/menu/chicken-wings.jpg",
    serves: "4 - 6 people",
    preparation: "30 - 40 minutes",
    dietary: "Contains poultry",
  },
  {
    id: 2,
    name: "Beef Kebabs",
    category: "Starters",
    description:
      "Succulent beef pieces seasoned with aromatic herbs and grilled with fresh vegetables.",
    image: "/images/menu/beef-kebabs.jpg",
    serves: "4 - 6 people",
    preparation: "30 - 40 minutes",
    dietary: "Contains beef",
  },
  {
    id: 3,
    name: "Creamy Chicken Pasta",
    category: "Mains",
    description:
      "A rich and creamy pasta dish prepared with tender chicken, herbs and our signature sauce.",
    image: "/images/menu/chicken-pasta.jpg",
    serves: "6 - 8 people",
    preparation: "45 - 60 minutes",
    dietary: "Contains dairy and poultry",
  },
  {
    id: 4,
    name: "Beef Lasagne",
    category: "Mains",
    description:
      "Layers of pasta, seasoned beef, rich tomato sauce and creamy cheese baked until golden.",
    image: "/images/menu/beef-lasagne.jpg",
    serves: "6 - 8 people",
    preparation: "60 - 75 minutes",
    dietary: "Contains dairy and beef",
  },
  {
    id: 5,
    name: "Roast Chicken",
    category: "Mains",
    description:
      "Slow-roasted chicken seasoned with herbs and spices, served tender and full of flavour.",
    image: "/images/menu/roast-chicken.jpg",
    serves: "8 - 10 people",
    preparation: "75 - 90 minutes",
    dietary: "Contains poultry",
  },
  {
    id: 6,
    name: "Chocolate Cake",
    category: "Desserts",
    description:
      "A rich and moist chocolate cake finished with a smooth chocolate topping.",
    image: "/images/menu/chocolate-cake.jpg",
    serves: "8 - 12 people",
    preparation: "45 - 60 minutes",
    dietary: "Contains dairy and gluten",
  },
  {
    id: 7,
    name: "Fresh Fruit Platter",
    category: "Desserts",
    description:
      "A colourful selection of fresh seasonal fruits prepared and presented for your event.",
    image: "/images/menu/fruit-platter.jpg",
    serves: "8 - 12 people",
    preparation: "20 - 30 minutes",
    dietary: "Vegetarian",
  },
  {
    id: 8,
    name: "Fresh Fruit Juice",
    category: "Refreshments",
    description:
      "Refreshing fruit juice prepared using a selection of fresh seasonal fruits.",
    image: "/images/menu/fruit-juice.jpg",
    serves: "8 - 10 people",
    preparation: "15 - 20 minutes",
    dietary: "Non-alcoholic",
  },
  {
    id: 9,
    name: "Sparkling Refreshments",
    category: "Refreshments",
    description:
      "A selection of chilled sparkling refreshments perfect for weddings, celebrations and corporate events.",
    image: "/images/menu/refreshments.jpg",
    serves: "8 - 10 people",
    preparation: "10 - 15 minutes",
    dietary: "Non-alcoholic",
  },
];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      {/* HEADER */}

      <section className="mx-auto max-w-[1500px]">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
            <UtensilsCrossed size={17} />
            <span>Mlangeni Grand Hospitality</span>
          </div>

          <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl">
            Our Menu
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#A0A0A0] md:text-lg">
            Explore our selection of carefully prepared dishes and refreshments,
            created to bring something special to your event.
          </p>
        </div>

        {/* CATEGORY TABS */}

        <div className="mb-10 overflow-x-auto border-b border-[#262626]">
          <div className="flex min-w-max items-center gap-8">
            {categories.map((category) => {
              const active = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`relative pb-4 text-sm font-medium tracking-wide transition-colors duration-300 ${
                    active
                      ? "text-[#D4AF37]"
                      : "text-[#8A8A8A] hover:text-white"
                  }`}
                >
                  {category}

                  {active && (
                    <motion.span
                      layoutId="menu-category-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4AF37]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MENU GRID */}

        <motion.div
          layout
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="group overflow-hidden border border-[#252525] bg-[#111111]"
              >
                {/* IMAGE */}

                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="relative block aspect-[4/3] w-full overflow-hidden text-left"
                  aria-label={`View details for ${item.name}`}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* IMAGE OVERLAY */}

                  <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/50" />

                  {/* CATEGORY */}

                  <span className="absolute left-4 top-4 border border-white/20 bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                    {item.category}
                  </span>

                  {/* HOVER VIEW */}

                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/80 px-5 py-4 backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        View Details
                      </span>

                      <Info size={16} className="text-[#D4AF37]" />
                    </div>
                  </div>
                </button>

                {/* CARD CONTENT */}

                <div className="p-5">
                  <h2 className="text-lg font-medium text-white">
                    {item.name}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#858585]">
                    {item.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="mt-5 text-sm font-medium text-[#D4AF37] transition-colors hover:text-white"
                  >
                    Explore item →
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* EMPTY STATE */}

        {filteredItems.length === 0 && (
          <div className="border border-[#252525] bg-[#111111] px-6 py-16 text-center">
            <UtensilsCrossed size={28} className="mx-auto text-[#D4AF37]" />

            <h2 className="mt-4 text-lg font-medium text-white">
              No menu items available
            </h2>

            <p className="mt-2 text-sm text-[#858585]">
              There are currently no items listed in this category.
            </p>
          </div>
        )}
      </section>

      {/* MENU ITEM MODAL */}

      <AnimatePresence>
        {selectedItem && (
          <>
            {/* MODAL BACKDROP */}

            <motion.div
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
            />

            {/* MODAL */}

            <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-5 md:p-10">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="menu-item-title"
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.97 }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={(event) => event.stopPropagation()}
                className="relative my-auto grid w-full max-w-4xl overflow-hidden border border-[#292929] bg-[#111111] lg:grid-cols-2"
              >
                {/* CLOSE BUTTON */}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                  aria-label="Close menu item details"
                >
                  <X size={19} />
                </button>

                {/* MODAL IMAGE */}

                <div className="relative min-h-[280px] lg:min-h-[520px]">
                  <Image
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <span className="absolute bottom-5 left-5 border border-white/20 bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                    {selectedItem.category}
                  </span>
                </div>

                {/* MODAL CONTENT */}

                <div className="flex flex-col justify-center p-7 md:p-10">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                    Mlangeni Menu
                  </p>

                  <h2
                    id="menu-item-title"
                    className="mt-3 font-serif text-3xl text-white md:text-4xl"
                  >
                    {selectedItem.name}
                  </h2>

                  <div className="mt-6 h-px w-16 bg-[#D4AF37]" />

                  <p className="mt-6 text-sm leading-7 text-[#A0A0A0] md:text-base">
                    {selectedItem.description}
                  </p>

                  {/* ITEM INFORMATION */}

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-[#D4AF37]" />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#666666]">
                          Serving Size
                        </p>

                        <p className="mt-1 text-sm text-white">
                          {selectedItem.serves}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock3 size={18} className="text-[#D4AF37]" />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#666666]">
                          Preparation
                        </p>

                        <p className="mt-1 text-sm text-white">
                          {selectedItem.preparation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Info size={18} className="text-[#D4AF37]" />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#666666]">
                          Dietary Information
                        </p>

                        <p className="mt-1 text-sm text-white">
                          {selectedItem.dietary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACTION */}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                    }}
                    className="mt-9 w-full border border-[#D4AF37] bg-[#D4AF37] px-5 py-3 text-sm font-semibold tracking-wide text-black transition-all duration-300 hover:bg-transparent hover:text-[#D4AF37]"
                  >
                    Add to Booking
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
