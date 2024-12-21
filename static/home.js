document.addEventListener('DOMContentLoaded', () => {
    // Animate logo on scroll
    const handleScroll = () => {
        const logo = document.querySelector('.logo');
        const scrolled = window.scrollY;
        if (scrolled > 50) {
            logo.style.fontSize = '2rem';
            logo.style.transition = 'font-size 0.3s ease';
        } else {
            logo.style.fontSize = '2.5rem';
        }
    };

    window.addEventListener('scroll', handleScroll);

    // Animate feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            }
        });
    }, { threshold: 0.1 });

    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        observer.observe(card);
    });

    // Add hover effect to example images
    const exampleImages = document.querySelectorAll('.example-image');
    exampleImages.forEach(image => {
        image.addEventListener('mouseover', () => {
            image.style.transform = 'scale(1.05) translateY(-10px)';
            image.style.transition = 'transform 0.3s ease';
        });
        image.addEventListener('mouseout', () => {
            image.style.transform = 'scale(1) translateY(0)';
        });
    });

    // Mobile-specific adjustments
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Adjust logo size for mobile
        const logo = document.querySelector('.logo');
        logo.style.fontSize = '2rem';
        
        // Disable certain animations on mobile
        window.removeEventListener('scroll', handleScroll);
    }
});
