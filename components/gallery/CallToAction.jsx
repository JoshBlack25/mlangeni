function CallToAction() {
    return (
        <section className="bg-surface-container-lowest py-48 text-center">
            <div className="max-w-[1440px] mx-auto px-12">
                <h2 className="font-[Playfair_Display] text-7xl text-on-surface mb-8">
                    Host Your Own Masterpiece
                </h2>
                <p className="font-[Playfair_Display] max-w-xl mx-auto mb-16 text-lg">
                    Inquire today to begin curating an unforgettable culinary experience
                    for your next premier event.
                </p>
                <div className="flex flex-col md:flex-row justify-center gap-8">
                    <button className="bg-[#d4af37]
                                  text-[#3c2f00]
                                  px-16 py-6 font-[Playfair_Display]
                                  tracking-widest test-lg uppercase font-bold
                                  hover:bg-[#f2ca50] transition-all">
                        COMMISSION AN EVENT
                    </button>
                    <button
                        className="border border-[#d4af37] text-[#d4af37] px-16 py-6
                     font-[Playfair_Display] tracking-widest text-lg uppercase
                     hover:bg-[#d4af37]/10 transition-all"
                    >
                        LOOK AT OUR MENU
                    </button>
                </div>
            </div>
        </section>
    )
}

export default CallToAction;