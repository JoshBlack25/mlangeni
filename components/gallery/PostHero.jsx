import IMAGES from "../constants/image.js";

function PostHero() {
    return (
        <section className="bg-surface-container-lowest py-48">
            <div className="max-w-[1440px] mx-auto px-12 grid grid-cols-12 items-center gap-24">
                {/*left*/}
                <div className="col-span-12 md:col-span-5">
                    <span className="font-label text-primary tracking-[0.4em] uppercase text-xs mb-8 block">The Philosophy</span>
                    <h2 className="font-headline text-6xl text-on-surface leading-tight mb-12 italic">Lorem ipsum</h2>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque bibendum ultrices ipsum vitae dignissim. Aenean odio orci, semper nec semper at, auctor at risus. Ut auctor velit rhoncus, venenatis sapien at, posuere lorem. Vestibulum hendrerit commodo sapien, vel elementum libero tincidunt id. Proin nibh erat, malesuada eget nisi nec, elementum vulputate neque. Sed pharetra mi ullamcorper dui tempus volutpat. In hac habitasse platea dictumst.
                    </p>
                </div>
                {/*right*/}
                {/*first image*/}
                <div className="col-span-12 md:col-span-7 grid grid-cols-2 gap-4">
                    <div className="mt-24">
                        <img src={IMAGES.food_8} className="w-full h-[600px] object cover" />
                    </div>

                    {/*second image*/}
                    <div>
                        <img src={IMAGES.food_7} className="w-full h-[600px] object-cover" />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PostHero;