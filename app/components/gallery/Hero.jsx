import IMAGES from "../constants/image";

function Hero() {
    // const image = "../images/Gallery-Image1.png";
    return (
        <section className="relative h-screen">
            <img
                src={IMAGES.hero}
                alt="A beautifully set dining table"
                className="w-full h-full object-cover"
            />
            {/* Dark scrim so the heading is always legible */}
            <div className="absolute inset-0 bg-black/40" />
            <h1
                className="absolute inset-0 flex items-center justify-center
                 font-headline text-5xl md:text-7xl tracking-widest
                 text-primary uppercase"
            >
                Our Gallery
            </h1>
        </section>
    )
}

export default Hero;