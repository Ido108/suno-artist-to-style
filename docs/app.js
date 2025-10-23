// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Hero animations
gsap.from('.hero-content h1', {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out'
});

gsap.from('.hero-content .subtitle', {
    duration: 1,
    y: 50,
    opacity: 0,
    delay: 0.2,
    ease: 'power3.out'
});

gsap.from('.hero-content .cta-buttons', {
    duration: 1,
    y: 50,
    opacity: 0,
    delay: 0.4,
    ease: 'power3.out'
});

gsap.from('.hero-visual', {
    duration: 1.2,
    scale: 0.8,
    opacity: 0,
    delay: 0.3,
    ease: 'power3.out'
});

// Stats animation
gsap.from('.stat-item', {
    scrollTrigger: {
        trigger: '.stats-bar',
        start: 'top 80%'
    },
    duration: 0.8,
    y: 50,
    opacity: 0,
    stagger: 0.1,
    ease: 'power3.out'
});

// Feature cards animation
gsap.from('.feature-card', {
    scrollTrigger: {
        trigger: '.feature-grid',
        start: 'top 80%'
    },
    duration: 0.8,
    y: 80,
    opacity: 0,
    stagger: 0.15,
    ease: 'power3.out'
});

// Features compact animation - DISABLED FOR VISIBILITY
// gsap.from('.feature-item-compact', {
//     scrollTrigger: {
//         trigger: '.features-compact',
//         start: 'top 90%',
//         toggleActions: 'play none none none'
//     },
//     duration: 0.6,
//     y: 30,
//     opacity: 0,
//     stagger: 0.08,
//     ease: 'power2.out'
// });

// gsap.from('.section-header-compact h2', {
//     scrollTrigger: {
//         trigger: '.features-compact',
//         start: 'top 80%'
//     },
//     duration: 1,
//     y: 60,
//     opacity: 0,
//     ease: 'power3.out'
// });

// gsap.from('.section-header-compact p', {
//     scrollTrigger: {
//         trigger: '.features-compact',
//         start: 'top 80%'
//     },
//     duration: 1,
//     y: 60,
//     opacity: 0,
//     delay: 0.2,
//     ease: 'power3.out'
// });

// Steps animation
gsap.from('.step', {
    scrollTrigger: {
        trigger: '.steps',
        start: 'top 80%'
    },
    duration: 0.8,
    y: 60,
    opacity: 0,
    stagger: 0.2,
    ease: 'power3.out'
});

// Demo sections animation
document.querySelectorAll('.demo-grid').forEach(grid => {
    gsap.from(grid.querySelector('.demo-image'), {
        scrollTrigger: {
            trigger: grid,
            start: 'top 80%'
        },
        duration: 1,
        x: -100,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from(grid.querySelector('.demo-text'), {
        scrollTrigger: {
            trigger: grid,
            start: 'top 80%'
        },
        duration: 1,
        x: 100,
        opacity: 0,
        ease: 'power3.out'
    });
});

// Final CTA animation
gsap.from('.final-cta h2', {
    scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 80%'
    },
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out'
});

gsap.from('.final-cta p', {
    scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 80%'
    },
    duration: 1,
    y: 50,
    opacity: 0,
    delay: 0.2,
    ease: 'power3.out'
});

gsap.from('.final-cta .cta-buttons', {
    scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 80%'
    },
    duration: 1,
    y: 50,
    opacity: 0,
    delay: 0.4,
    ease: 'power3.out'
});