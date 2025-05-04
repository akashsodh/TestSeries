// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Hamburger menu toggle for mobile
const hamburger = document.querySelector('.hamburger');
const sidebar = document.querySelector('.sidebar');

hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Theme toggle functionality
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('#themeIcon');
const body = document.body;

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    if (body.classList.contains('light-theme')) {
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }
});

// Add fade-in effect on scroll
const sections = document.querySelectorAll('section');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => {
    section.classList.add('fade-in');
    observer.observe(section);
});
