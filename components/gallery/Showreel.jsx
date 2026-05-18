"use client"
import React from "react";
import IMAGES from "../constants/image.js";

function Showreel() {
    const [playing, setPlaying] = React.useState(false);
    return (
        <section className="relative h-[716px] w-full overflow-hidden bg-surface">

            {!playing && (
                <>
                    <img
                        src={IMAGES.showreel}
                        alt="Luxury event space with dramatic shadows and golden lighting"
                        className="w-full h-full object-cover"
                    />
    
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                    {/*play button */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <h2 className="font-[Playfair_Display] text-6xl text-white mb-8">
                            A Night in Motion
                        </h2>
                        <div className="flex items-center gap-6">
                            <div className="h-[1px] w-32 bg-primary" />
                            <button
                                onClick={() => setPlaying(true)}
                                aria-label="Watch the reel"
                                className="flex items-center gap-4 group cursor-pointer"
                            >
                                <span
                                    className="w-16 h-16 rounded-full border border-primary
                             flex items-center justify-center
                             group-hover:bg-primary transition-all duration-300"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        className="w-6 h-6 fill-primary group-hover:fill-on-primary transition-colors duration-300"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </span>
                                <span className="font-[Playfair_Display] uppercase tracking-widest text-white text-sm">
                                    Watch the Reel
                                </span>
                            </button>
                            <div className="h-[1px] w-32 bg-primary" />
                        </div>
                    </div>
                </>
            )}

            
            {playing && (
                <>
                    <video
                        src="/videos/showreel.mp4"
                        className="w-full h-full object-cover"
                        autoPlay
                        controls
                    />
                    {/* Back button so user can return to thumbnail */}
                    <button
                        onClick={() => setPlaying(false)}
                        className="absolute top-6 right-6 flex items-center gap-2
                       text-white font-[Playfair_Display] text-xs uppercase tracking-widest
                       border border-white/40 px-4 py-2
                       hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                            <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z" />
                        </svg>
                        Back
                    </button>
                </>
            )}
        </section>
    )
}

export default Showreel;