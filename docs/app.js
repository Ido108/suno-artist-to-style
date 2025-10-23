document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // Typing animation for hero section
    const promptExamples = [
        { artist: "Coldplay", style: "Alternative rock, atmospheric pop, anthemic choruses, shimmering electric guitars and piano layers, emotive tenor vocals with reverb, uplifting and introspective mood, spacious and polished production, 2000s britpop-influenced sound" },
        { artist: "Daft Punk", style: "French house, Funk-infused electronic, Four-on-the-floor rhythm, Analog synths and vocoder vocals, Disco basslines and filtered loops, Robotic yet soulful mood, Polished and futuristic production, 2000s electronic dance" },
        { artist: "David Bowie", style: "Art rock, Glam rock, Experimental pop fusion, Theatrical baritone vocals, Angular guitar and synth textures, Dynamic tempo shifts, Avant-garde production, 70's art-pop" },
        { artist: "Deadmau5", style: "Progressive house, Electro-house, Driving mid-tempo 128 BPM grooves, Layered analog synths and arpeggiated leads, Minimalist melodic structures with gradual build-ups, Clean digital production with wide stereo imaging, Atmospheric and cinematic textures, 2010s electronic dance music" },
        { artist: "Diana Ross", style: "Soulful pop, Motown R&B, Smooth female lead vocals with elegant vibrato, Orchestral strings and brass arrangements, Mid-tempo groove with steady backbeat, Polished studio production with lush harmonies, Romantic and uplifting mood, 70's soul-pop" },
        { artist: "Disclosure", style: "UK house, garage-influenced electronic, syncopated basslines and chopped vocal samples, glossy synth textures, precise four-on-the-floor rhythm, soulful male and female vocal features, club-ready polished production, 2010s electronic dance" },
        { artist: "Dolly Parton", style: "Country pop, bluegrass-infused instrumentation with acoustic guitar, banjo, and fiddle, bright female soprano vocals with Appalachian twang, storytelling lyricism, moderate tempo, warm analog production, heartfelt and optimistic mood, 1970s Nashville sound" },
        { artist: "Drake", style: "Contemporary hip hop and R&B, mid-tempo trap-influenced beats, atmospheric synth pads and 808 bass, melodic rap with introspective tone, smooth autotuned vocals, minimalistic yet polished production, emotionally moody and nocturnal vibe, 2010s hip hop" },
        { artist: "Dua Lipa", style: "Dance-pop, retro-disco fusion, syncopated basslines and funk guitar, punchy electronic drums, sultry mezzo-soprano vocals with tight harmonies, polished and glossy production, confident and seductive mood, late 2010s–2020s pop" },
        { artist: "Duke Ellington", style: "Big band jazz, Swing era orchestration, Sophisticated horn and reed arrangements, Walking bass and syncopated drums, Smooth piano comping and solos, Lush harmonies with call-and-response phrasing, Elegant and cinematic mood, 1930s–1940s jazz" },
        { artist: "Ed Sheeran", style: "Acoustic pop, Folk-pop balladry, Mid-tempo rhythmic guitar strumming, Layered vocal harmonies with soulful male lead, Intimate storytelling lyrics, Warm and polished production, Subtle electronic and loop-based textures, 2010s singer-songwriter pop" },
        { artist: "Ella Fitzgerald", style: "Jazz swing, Big band orchestration, Smooth and agile female vocals with precise phrasing, Scat improvisation, Warm upright bass and brushed drums, Elegant and polished production, Sophisticated and playful mood, 1940s jazz era" }
    ];
    let currentExampleIndex = 0;
    let isAnimating = false;
    const promptTextEl = document.getElementById("prompt-text");
    const createBtn = document.getElementById("create-btn");

    function setInitialArtist() {
        gsap.to("#prompt-text", {
            duration: 1.5,
            text: promptExamples[currentExampleIndex].artist,
            ease: "none",
        });
    }

    function playAnimation() {
        if (isAnimating) return;
        isAnimating = true;

        const example = promptExamples[currentExampleIndex];
        
        const tl = gsap.timeline({
            onComplete: () => {
                isAnimating = false;
            }
        });

        // Immediately show the full style prompt
        tl.set("#prompt-text", { textContent: example.style });

        // Go to the next example
        currentExampleIndex = (currentExampleIndex + 1) % promptExamples.length;
        const nextExample = promptExamples[currentExampleIndex];

        // After a delay, type the next artist name
        tl.to("#prompt-text", {
            delay: 4, // time to read the full prompt
            duration: 1.5,
            text: nextExample.artist,
            ease: "none",
        });
    }

    setInitialArtist();

    // Auto-play animation with mouse cursor effect
    let autoPlayInterval;

    function startAutoPlay() {
        // Wait 3 seconds, then play
        autoPlayInterval = setInterval(() => {
            if (!isAnimating) {
                // Animate mouse cursor
                createBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    createBtn.style.transform = '';
                    playAnimation();
                }, 150);
            }
        }, 6000); // Play every 6 seconds
    }

    // Start auto-play after initial load
    setTimeout(startAutoPlay, 3000);

    // Also allow manual click
    createBtn.addEventListener('click', playAnimation);
    
    // Animate In
    const introTl = gsap.timeline();
    introTl.from('.logo', { y: -30, opacity: 0, duration: 0.5, ease: 'power2.out' })
           .from('.header-cta .btn', { y: -30, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, "-=0.3")
           .from('.hero-content > *', { y: 30, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' })
           .from('.hero-visual', { scale: 0.9, opacity: 0, duration: 0.7, ease: 'power3.out' }, "-=0.5");
    
    // Scroll Triggers
    const animateUp = (elem) => {
        gsap.from(elem, {
            scrollTrigger: {
                trigger: elem,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
        });
    };
    
    const animateStaggerUp = (elem) => {
        gsap.from(elem, {
            scrollTrigger: {
                trigger: elem,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power3.out',
        });
    }

    animateUp('.how-it-works .section-header');
    animateUp('.how-it-works-visual');

    animateUp('.features .section-header');
    animateStaggerUp('.feature-card');

    animateUp('.final-cta-content');

});