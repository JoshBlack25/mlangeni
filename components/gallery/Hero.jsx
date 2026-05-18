import IMAGES from "../constants/image";

function Hero() {
    return (
        <section className="relative h-screen">
            <img
                src={IMAGES.hero}
                alt="A beautifully set dining table"
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <h1
                className="absolute inset-0 flex items-center justify-center
                 font-[Playfair_Display] text-5xl md:text-7xl tracking-widest
                 text-primary uppercase"
            >
            <p className="text-center">Our<br />Gallery</p>
            </h1>
        </section>
    )
}

export default Hero;