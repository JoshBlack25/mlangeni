import IMAGES from "../constants/image.js";

function Grid() {
    return (
        <section className="bg-surface py-32 px-12">
            {/* photo 1 */}
            <div className="max-w-[1440px] mx-auto">
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 md:col-span-8 group relative overflow-hidden aspect-[16/10]">
                        <img src={IMAGES.gildedCourse}
                            className="w-full h-full object-cover grayscale hover:grayscale-0
                       transition-all duration-1000 group-hover:scale-105"/>
                    </div>

                    {/*photo 2*/}
                    <div className="col-span12 md:col-span-4 flex flex-col gap-8">
                        <div className="flex-1 group overflow-hidden min-h-[200px]">
                            <img src={IMAGES.winePouring}
                                className="w-full h-full object-cover group-hover:scale-110
                         transition-transform duration-700"
                            />
                        </div>
                    </div>

                    {/*photo 3*/}
                    <div className="col-span-12 md:col-span-4 aspect-square">
                        <img src={IMAGES.ingredients} className="w-full h-full object-cover" />
                    </div>

                    <div className="col-span-12 md:col-span-8 relative">
                        <img src={IMAGES.gardenParty} className="w-full h-[500px] object-cover" />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Grid;