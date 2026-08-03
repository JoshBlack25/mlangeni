function Quote() {
    return (
        <section className="bg-surface py-32 border-y border-outline-variant/20">
            <div className="max-w-4xl mx-auto px-12 text-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-16 h-16 fill-primary mx-auto mb-8"
                >
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                </svg>
                <blockquote className="font-headline text-4xl md:text-5xl text-on-surface font-light leading-snug">
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                </blockquote>
            </div>
        </section>
    )
}

export default Quote;