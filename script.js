document.addEventListener('DOMContentLoaded', function() {

    // Uppdaterar årtalet i footern
    const currentYearSpan = document.getElementById('currentYear');
    if(currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Intersection Observer för fade-in-animationer
    const sections = document.querySelectorAll('.content-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Startar när 10% av sektionen är synlig
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Sluta observera när den är synlig
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Header-effekt vid scrollning
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            // Gör bakgrunden mer solid och ändrar kantlinjen när man scrollar
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
            header.style.borderColor = 'rgba(0,0,0,0.1)';
        } else {
            // Återställer till den mer genomskinliga initiala stilen
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            header.style.borderColor = 'rgba(0,0,0,0.07)';
        }
    });
});
