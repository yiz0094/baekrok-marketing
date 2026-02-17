/* ========================================
   SELFISH AI LAB - JavaScript
   All interactions and animations
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initNavigation();
    initScrollAnimations();
    initPortfolioFilter();
    initTestimonialSlider();
    initContactForm();
    // initHeroParticles(); // SVG 배경으로 대체됨

    console.log('%c🚀 백록마케팅', 'font-size: 20px; font-weight: bold; color: #51B498;');
});

/* ========================================
   Navigation
   ======================================== */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        updateActiveLink();
    });
    
    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            const icon = this.querySelector('i');
            if (mobileMenu.classList.contains('hidden')) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            } else {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            }
        });
        
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 768) {
                    mobileMenu.classList.add('hidden');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }
    
    // Smooth scroll
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 110;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

/* ========================================
   Scroll Animations
   ======================================== */
function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.scroll-animate');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);
    
    animateElements.forEach(element => {
        observer.observe(element);
    });
}

/* ========================================
   Portfolio Filter
   ======================================== */
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items
            portfolioItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (category === 'all' || itemCategory === category) {
                    item.classList.remove('hide');
                    item.classList.add('show');
                    item.style.display = 'block';
                } else {
                    item.classList.add('hide');
                    item.classList.remove('show');
                    setTimeout(() => {
                        if (item.classList.contains('hide')) {
                            item.style.display = 'none';
                        }
                    }, 400);
                }
            });
        });
    });
}

/* ========================================
   Testimonial Slider
   ======================================== */
function initTestimonialSlider() {
    const slider = document.getElementById('testimonialSlider');
    if (!slider) return;
    
    // Sample testimonials
    const testimonials = [
        {
            stars: 5,
            text: "단순히 영상만 제작하는 게 아니라, 우리 브랜드의 전환 목표를 정확히 이해하고 전략적으로 접근해주셨어요. 결과적으로 전환율이 30% 이상 증가했습니다.",
            author: "A사 마케팅 팀장",
            company: "커머스 업종"
        },
        {
            stars: 5,
            text: "AI 도구를 활용한 워크플로우를 구축해주셔서, 이제 우리 팀도 자체적으로 고퀄리티 콘텐츠를 빠르게 제작할 수 있게 되었습니다.",
            author: "B사 콘텐츠 디렉터",
            company: "교육 서비스"
        },
        {
            stars: 5,
            text: "10년 이상의 마케팅 경험이 느껴지는 전략적 접근이 인상적이었습니다. 우리 산업군에 최적화된 크리에이티브를 제안해주셔서 성과가 바로 나타났어요.",
            author: "C사 대표",
            company: "SaaS 업종"
        },
        {
            stars: 5,
            text: "프로젝트 진행 과정에서 재현 가능한 프로세스를 문서화해주셔서, 이후에도 같은 퀄리티의 결과물을 계속 만들어낼 수 있게 되었습니다.",
            author: "D사 마케팅 담당자",
            company: "브랜드 커머스"
        }
    ];
    
    // Create testimonial cards (duplicate for infinite loop)
    const allTestimonials = [...testimonials, ...testimonials];
    
    slider.innerHTML = allTestimonials.map(t => `
        <div class="testimonial-card flex-shrink-0 w-full md:w-[calc(50%-12px)] dark-card p-8 rounded-2xl border border-primary/20">
            <div class="flex items-center gap-1 mb-4">
                ${Array(t.stars).fill('<i class="fas fa-star text-primary"></i>').join('')}
            </div>
            <p class="text-gray-300 text-lg leading-relaxed mb-6">
                "${t.text}"
            </p>
            <div class="border-t border-primary/20 pt-4">
                <p class="text-gray-100 font-semibold">${t.author}</p>
                <p class="text-gray-400 text-sm">${t.company}</p>
            </div>
        </div>
    `).join('');
    
    // Auto scroll
    let scrollPosition = 0;
    const cardWidth = slider.querySelector('.testimonial-card').offsetWidth + 24; // width + gap
    const totalWidth = cardWidth * testimonials.length;
    
    setInterval(() => {
        scrollPosition += 1;
        if (scrollPosition >= totalWidth) {
            scrollPosition = 0;
            slider.style.transition = 'none';
            slider.style.transform = `translateX(0px)`;
            setTimeout(() => {
                slider.style.transition = 'transform 0.7s ease-linear';
            }, 50);
        } else {
            slider.style.transform = `translateX(-${scrollPosition}px)`;
        }
    }, 30);
}

/* ========================================
   Contact Form
   ======================================== */
function initContactForm() {
    // 실제 폼 제출은 contact-form.js에서 처리
}

/* ========================================
   Notification System
   ======================================== */
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

/* ========================================
   Utility Functions
   ======================================== */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/* ========================================
   Hero Particles Animation
   ======================================== */
function initHeroParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrame;
    
    // Canvas 크기 설정
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', debounce(resizeCanvas, 250));
    
    // 파티클 클래스
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // 화면 밖으로 나가면 리셋
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        
        draw() {
            ctx.fillStyle = `rgba(81, 180, 152, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 파티클 생성
    function createParticles() {
        const particleCount = Math.min(Math.floor(canvas.width / 10), 100);
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    createParticles();
    
    // 파티클 간 연결선 그리기
    function connectParticles() {
        const maxDistance = 120;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    ctx.strokeStyle = `rgba(81, 180, 152, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // 애니메이션 루프
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        connectParticles();
        
        animationFrame = requestAnimationFrame(animate);
    }
    
    animate();
    
    // 페이지를 떠날 때 애니메이션 정리
    window.addEventListener('beforeunload', () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });
}

function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = new Date().getTime();
        if (now - lastCall < delay) return;
        lastCall = now;
        return func(...args);
    };
}

/* ========================================
   Window Events
   ======================================== */
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

window.addEventListener('resize', debounce(function() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (window.innerWidth > 768 && mobileMenu) {
        mobileMenu.classList.add('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}, 250));