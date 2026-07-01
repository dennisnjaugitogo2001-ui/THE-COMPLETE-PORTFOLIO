/*
    ============================================
    GITOGO JR - 3D INTERACTIVE DIGITAL BOOK PORTFOLIO
    ============================================
    Premium Vanilla JavaScript for the 3D book portfolio.
    No frameworks. No libraries. Pure JavaScript craftsmanship.
    
    Table of Contents:
    1. State Management
    2. DOM Element References
    3. Initialization
    4. Page Navigation Core
    5. Front Cover Opening
    6. Page Flip Animation
    7. Navigation Controls
    8. Keyboard Support
    9. Touch/Swipe Gestures
    10. Mouse Click Support
    11. Skill Bar Animation
    12. Contact Form Handler
    13. Utility Functions
    14. Event Listeners Setup
    15. Resize Handler
    16. CSS Animation Injection
    17. Public API
    ============================================
*/

// ============================================
// 1. STATE MANAGEMENT
// ============================================
/**
 * BookState - Central state object tracking the book's current condition.
 * All page navigation and animation states are managed here.
 */
const BookState = {
    /** @type {number} Current page index (0 = front cover, 1 = welcome, etc.) */
    currentPage: 0,
    
    /** @type {number} Total number of pages including covers */
    totalPages: 11,
    
    /** @type {boolean} Whether the front cover has been opened */
    isBookOpen: false,
    
    /** @type {boolean} Whether a page flip animation is currently in progress */
    isAnimating: false,
    
    /** @type {number} Animation duration in milliseconds */
    animationDuration: 700,
    
    /** @type {boolean} Whether skill bars have been animated */
    skillsAnimated: false,
    
    /** @type {number|null} Touch start X coordinate for swipe detection */
    touchStartX: null,
    
    /** @type {number|null} Touch start Y coordinate for swipe detection */
    touchStartY: null,
    
    /** @type {number} Minimum swipe distance to trigger page change */
    swipeThreshold: 50
};

// ============================================
// 2. DOM ELEMENT REFERENCES
// ============================================
/**
 * Cache all DOM elements on load for performance.
 * Avoids repeated querySelector calls during animations.
 */
const DOM = {
    /** @type {HTMLElement} Main book container */
    bookContainer: null,
    
    /** @type {HTMLElement} Front cover element */
    frontCover: null,
    
    /** @type {HTMLElement} Pages container */
    pagesContainer: null,
    
    /** @type {NodeList} All page elements */
    pages: null,
    
    /** @type {HTMLElement} Previous page button */
    prevBtn: null,
    
    /** @type {HTMLElement} Next page button */
    nextBtn: null,
    
    /** @type {HTMLElement} Current page number display */
    currentPageDisplay: null,
    
    /** @type {HTMLElement} Total pages display */
    totalPagesDisplay: null,
    
    /** @type {HTMLElement} Progress bar element */
    progressBar: null,
    
    /** @type {HTMLElement} Keyboard hint element */
    keyboardHint: null,
    
    /** @type {HTMLElement} Contact form element */
    contactForm: null
};

// ============================================
// 3. INITIALIZATION
// ============================================
/**
 * Initialize the book portfolio when DOM is fully loaded.
 * Sets up all event listeners and initial page states.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM references
    cacheDOMElements();
    
    // Set initial page states
    initializePages();
    
    // Update navigation UI
    updateNavigation();
    
    // Set up all event listeners
    setupEventListeners();
    
    // Handle window resize
    handleResize();
    
    // Log initialization
    console.log('%c Gitogo Jr Portfolio ', 'background: linear-gradient(135deg, #d4af37, #f4d03f); color: #1a1a2e; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px;');
    console.log('%c 3D Interactive Digital Book initialized successfully ', 'color: #d4af37; font-size: 14px;');
});

/**
 * Cache all DOM element references for performance.
 * Called once during initialization.
 */
function cacheDOMElements() {
    DOM.bookContainer = document.getElementById('bookContainer');
    DOM.frontCover = document.querySelector('.front-cover-outer');
    DOM.pagesContainer = document.getElementById('pagesContainer');
    DOM.pages = document.querySelectorAll('.page');
    DOM.prevBtn = document.getElementById('prevBtn');
    DOM.nextBtn = document.getElementById('nextBtn');
    DOM.currentPageDisplay = document.getElementById('currentPage');
    DOM.totalPagesDisplay = document.getElementById('totalPages');
    DOM.progressBar = document.getElementById('progressBar');
    DOM.keyboardHint = document.getElementById('keyboardHint');
    DOM.contactForm = document.getElementById('contactForm');
}

/**
 * Initialize all pages to their starting positions.
 * Pages are stacked with proper z-index for 3D effect.
 */
function initializePages() {
    // Set total pages display
    if (DOM.totalPagesDisplay) {
        DOM.totalPagesDisplay.textContent = BookState.totalPages - 1;
    }
    
    // Position each page in the stack
    DOM.pages.forEach((page, index) => {
        // Reset transforms
        page.style.transform = '';
        page.classList.remove('flipped', 'active', 'next', 'prev');
        
        // Set initial z-index (higher index = on top of stack)
        page.style.zIndex = String(DOM.pages.length - index);
        
        // Front cover page starts visible
        if (index === 0) {
            page.classList.add('active');
        }
    });
    
    // Front cover outer starts closed
    if (DOM.frontCover) {
        DOM.frontCover.classList.remove('open');
    }
}

// ============================================
// 4. PAGE NAVIGATION CORE
// ============================================
/**
 * Navigate to the next page.
 * Handles opening the front cover first, then flipping pages.
 */
function nextPage() {
    // Prevent navigation during animation
    if (BookState.isAnimating) return;
    
    // Prevent going beyond last page
    if (BookState.currentPage >= BookState.totalPages - 1) return;
    
    // If book is closed, open the front cover first
    if (!BookState.isBookOpen) {
        openFrontCover();
        return;
    }
    
    // Flip to next page
    flipPageForward();
}

/**
 * Navigate to the previous page.
 * Handles flipping pages back and closing the book at the start.
 */
function prevPage() {
    // Prevent navigation during animation
    if (BookState.isAnimating) return;
    
    // Prevent going before first page
    if (BookState.currentPage <= 0) return;
    
    // If on first inner page, close the book
    if (BookState.currentPage === 1) {
        closeFrontCover();
        return;
    }
    
    // Flip to previous page
    flipPageBackward();
}

/**
 * Go to a specific page by index.
 * @param {number} pageIndex - The target page index
 */
function goToPage(pageIndex) {
    // Validate page index
    if (pageIndex < 0 || pageIndex >= BookState.totalPages) return;
    if (pageIndex === BookState.currentPage) return;
    if (BookState.isAnimating) return;
    
    // Determine direction
    const direction = pageIndex > BookState.currentPage ? 'forward' : 'backward';
    const steps = Math.abs(pageIndex - BookState.currentPage);
    
    // If book is closed and going forward, open it first
    if (!BookState.isBookOpen && direction === 'forward') {
        openFrontCover(() => {
            if (steps > 1) {
                flipMultiplePages(pageIndex);
            }
        });
        return;
    }
    
    // Flip multiple pages if needed
    if (steps > 1) {
        flipMultiplePages(pageIndex);
        return;
    }
    
    // Single page flip
    if (direction === 'forward') {
        flipPageForward();
    } else {
        flipPageBackward();
    }
}

// ============================================
// 5. FRONT COVER OPENING
// ============================================
/**
 * Open the front cover of the book.
 * Triggers the 3D rotation animation on the outer cover.
 * @param {Function} [callback] - Optional callback after animation completes
 */
function openFrontCover(callback) {
    if (BookState.isAnimating || BookState.isBookOpen) return;
    
    BookState.isAnimating = true;
    
    // Add open class to trigger CSS transition
    if (DOM.frontCover) {
        DOM.frontCover.classList.add('open');
    }
    
    // Update state after animation
    setTimeout(() => {
        BookState.isBookOpen = true;
        BookState.currentPage = 1;
        BookState.isAnimating = false;
        
        // Update page classes
        updatePageClasses();
        updateNavigation();
        
        // Animate skill bars if on skills page
        animateSkillBars();
        
        // Execute callback if provided
        if (typeof callback === 'function') {
            callback();
        }
    }, BookState.animationDuration);
}

/**
 * Close the front cover of the book.
 * Returns the book to its closed state.
 */
function closeFrontCover() {
    if (BookState.isAnimating || !BookState.isBookOpen) return;
    
    BookState.isAnimating = true;
    
    // Remove open class to trigger CSS transition
    if (DOM.frontCover) {
        DOM.frontCover.classList.remove('open');
    }
    
    // Update state after animation
    setTimeout(() => {
        BookState.isBookOpen = false;
        BookState.currentPage = 0;
        BookState.isAnimating = false;
        
        // Reset page classes
        updatePageClasses();
        updateNavigation();
        
        // Reset skill bars
        resetSkillBars();
    }, BookState.animationDuration);
}

// ============================================
// 6. PAGE FLIP ANIMATION
// ============================================
/**
 * Flip a page forward (turn to next page).
 * Uses CSS 3D transforms for realistic page turning.
 */
function flipPageForward() {
    if (BookState.isAnimating) return;
    if (BookState.currentPage >= BookState.totalPages - 1) return;
    
    BookState.isAnimating = true;
    
    const currentPageEl = DOM.pages[BookState.currentPage];
    const nextPageEl = DOM.pages[BookState.currentPage + 1];
    
    if (!currentPageEl || !nextPageEl) {
        BookState.isAnimating = false;
        return;
    }
    
    // Apply flip animation to current page
    currentPageEl.classList.add('flipped');
    currentPageEl.classList.remove('active');
    currentPageEl.style.zIndex = String(BookState.currentPage);
    
    // Activate next page
    nextPageEl.classList.add('active');
    nextPageEl.classList.remove('flipped');
    nextPageEl.style.zIndex = String(DOM.pages.length + BookState.currentPage);
    
    // Update state after animation
    setTimeout(() => {
        BookState.currentPage++;
        BookState.isAnimating = false;
        
        updatePageClasses();
        updateNavigation();
        animateSkillBars();
    }, BookState.animationDuration);
}

/**
 * Flip a page backward (turn to previous page).
 * Reverses the 3D flip animation.
 */
function flipPageBackward() {
    if (BookState.isAnimating) return;
    if (BookState.currentPage <= 0) return;
    
    BookState.isAnimating = true;
    
    const currentPageEl = DOM.pages[BookState.currentPage];
    const prevPageEl = DOM.pages[BookState.currentPage - 1];
    
    if (!currentPageEl || !prevPageEl) {
        BookState.isAnimating = false;
        return;
    }
    
    // Remove flip from previous page to bring it back
    prevPageEl.classList.remove('flipped');
    prevPageEl.classList.add('active');
    prevPageEl.style.zIndex = String(DOM.pages.length - (BookState.currentPage - 1));
    
    // Deactivate current page
    currentPageEl.classList.remove('active');
    currentPageEl.style.zIndex = String(BookState.currentPage);
    
    // Update state after animation
    setTimeout(() => {
        BookState.currentPage--;
        BookState.isAnimating = false;
        
        updatePageClasses();
        updateNavigation();
        animateSkillBars();
    }, BookState.animationDuration);
}

/**
 * Flip multiple pages in sequence to reach a target page.
 * @param {number} targetPage - The destination page index
 */
function flipMultiplePages(targetPage) {
    const direction = targetPage > BookState.currentPage ? 'forward' : 'backward';
    const steps = Math.abs(targetPage - BookState.currentPage);
    let currentStep = 0;
    
    function step() {
        if (currentStep >= steps) return;
        
        if (direction === 'forward') {
            flipPageForward();
        } else {
            flipPageBackward();
        }
        
        currentStep++;
        
        // Schedule next step after current animation completes
        if (currentStep < steps) {
            setTimeout(step, BookState.animationDuration + 100);
        }
    }
    
    step();
}

/**
 * Update CSS classes for all pages based on current state.
 * Ensures proper z-index stacking and visibility.
 */
function updatePageClasses() {
    DOM.pages.forEach((page, index) => {
        page.classList.remove('active', 'next', 'prev');
        
        if (index < BookState.currentPage) {
            // Pages before current are flipped
            page.classList.add('flipped');
            page.style.zIndex = String(index);
        } else if (index === BookState.currentPage) {
            // Current page is active
            page.classList.remove('flipped');
            page.classList.add('active');
            page.style.zIndex = String(DOM.pages.length);
        } else {
            // Pages after current are in stack
            page.classList.remove('flipped');
            page.style.zIndex = String(DOM.pages.length - index);
        }
    });
}

// ============================================
// 7. NAVIGATION CONTROLS
// ============================================
/**
 * Update the navigation UI elements.
 * Enables/disables buttons and updates page counter/progress bar.
 */
function updateNavigation() {
    // Update page counter display
    if (DOM.currentPageDisplay) {
        const displayPage = BookState.isBookOpen ? BookState.currentPage : 0;
        DOM.currentPageDisplay.textContent = displayPage;
    }
    
    // Update previous button state
    if (DOM.prevBtn) {
        DOM.prevBtn.disabled = BookState.currentPage <= 0;
    }
    
    // Update next button state
    if (DOM.nextBtn) {
        DOM.nextBtn.disabled = BookState.currentPage >= BookState.totalPages - 1;
    }
    
    // Update progress bar
    updateProgressBar();
}

/**
 * Update the progress bar width based on current page.
 */
function updateProgressBar() {
    if (!DOM.progressBar) return;
    
    const progress = (BookState.currentPage / (BookState.totalPages - 1)) * 100;
    DOM.progressBar.style.width = progress + '%';
}

// ============================================
// 8. KEYBOARD SUPPORT
// ============================================
/**
 * Handle keyboard navigation.
 * Left/Right arrows flip pages. Home/End jump to start/end.
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyboard(event) {
    // Ignore if user is typing in a form input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
            event.preventDefault();
            nextPage();
            break;
            
        case 'ArrowLeft':
        case 'PageUp':
            event.preventDefault();
            prevPage();
            break;
            
        case 'Home':
            event.preventDefault();
            if (BookState.isBookOpen) {
                goToPage(1);
            }
            break;
            
        case 'End':
            event.preventDefault();
            goToPage(BookState.totalPages - 1);
            break;
            
        case 'Escape':
            // Close keyboard hint on escape
            if (DOM.keyboardHint) {
                DOM.keyboardHint.style.display = 'none';
            }
            break;
    }
}

// ============================================
// 9. TOUCH/SWIPE GESTURES
// ============================================
/**
 * Handle touch start event for swipe detection.
 * Records the starting touch coordinates.
 * @param {TouchEvent} event - The touch event
 */
function handleTouchStart(event) {
    // Only handle single finger touches
    if (event.touches.length !== 1) return;
    
    BookState.touchStartX = event.touches[0].clientX;
    BookState.touchStartY = event.touches[0].clientY;
}

/**
 * Handle touch end event for swipe detection.
 * Calculates swipe direction and distance.
 * @param {TouchEvent} event - The touch event
 */
function handleTouchEnd(event) {
    // Only handle if we have a start position
    if (BookState.touchStartX === null || BookState.touchStartY === null) return;
    
    // Only handle single finger touches
    if (event.changedTouches.length !== 1) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = touchEndX - BookState.touchStartX;
    const deltaY = touchEndY - BookState.touchStartY;
    
    // Determine if horizontal swipe (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Check if swipe distance exceeds threshold
        if (Math.abs(deltaX) > BookState.swipeThreshold) {
            if (deltaX > 0) {
                // Swipe right -> previous page
                prevPage();
            } else {
                // Swipe left -> next page
                nextPage();
            }
        }
    }
    
    // Reset touch coordinates
    BookState.touchStartX = null;
    BookState.touchStartY = null;
}

/**
 * Handle touch move to prevent page scroll during horizontal swipes.
 * @param {TouchEvent} event - The touch event
 */
function handleTouchMove(event) {
    if (BookState.touchStartX === null) return;
    
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const deltaX = touchX - BookState.touchStartX;
    const deltaY = touchY - BookState.touchStartY;
    
    // Prevent default scrolling for horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        event.preventDefault();
    }
}

// ============================================
// 10. MOUSE CLICK SUPPORT
// ============================================
/**
 * Handle clicks on the book pages.
 * Clicking on the right side of a page goes forward,
 * clicking on the left side goes backward.
 * @param {MouseEvent} event - The click event
 */
function handlePageClick(event) {
    // Ignore clicks on interactive elements
    if (event.target.closest('button') || 
        event.target.closest('a') || 
        event.target.closest('input') ||
        event.target.closest('textarea')) {
        return;
    }
    
    // Get click position relative to viewport
    const clickX = event.clientX;
    const windowWidth = window.innerWidth;
    
    // Divide screen into left and right zones
    const zoneThreshold = windowWidth * 0.5;
    
    if (clickX > zoneThreshold) {
        // Click on right side -> next page
        nextPage();
    } else {
        // Click on left side -> previous page
        prevPage();
    }
}

/**
 * Handle front cover click to open the book.
 * @param {MouseEvent} event - The click event
 */
function handleFrontCoverClick(event) {
    // Prevent double-firing if already handled
    if (BookState.isBookOpen || BookState.isAnimating) return;
    
    event.stopPropagation();
    openFrontCover();
}

// ============================================
// 11. SKILL BAR ANIMATION
// ============================================
/**
 * Animate skill progress bars when the skills page is visible.
 * Bars fill from 0% to their target width with smooth easing.
 */
function animateSkillBars() {
    // Only animate on the skills page (index 3)
    if (BookState.currentPage !== 3) return;
    
    // Prevent re-animation
    if (BookState.skillsAnimated) return;
    BookState.skillsAnimated = true;
    
    const skillBars = document.querySelectorAll('.skill-progress');
    
    skillBars.forEach((bar, index) => {
        const targetWidth = bar.getAttribute('data-width');
        if (!targetWidth) return;
        
        // Stagger animations for visual effect
        setTimeout(() => {
            bar.style.width = targetWidth + '%';
        }, index * 150);
    });
}

/**
 * Reset skill bars to 0% width.
 * Called when leaving the skills page.
 */
function resetSkillBars() {
    BookState.skillsAnimated = false;
    
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach(bar => {
        bar.style.width = '0%';
    });
}

// ============================================
// 12. CONTACT FORM HANDLER
// ============================================
/**
 * Handle contact form submission.
 * Prevents default submission and shows a success message.
 * @param {Event} event - The form submit event
 */
function handleContactSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Get form values
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const message = formData.get('message');
    
    // Basic validation
    if (!name || !email || !message) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    // Simulate form submission
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Sending...</span>';
    submitBtn.disabled = true;
    
    // Simulate network delay
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showNotification('Thank you! Your message has been sent successfully.', 'success');
        form.reset();
    }, 1500);
}

/**
 * Show a temporary notification message.
 * @param {string} message - The message to display
 * @param {string} type - The notification type ('success' or 'error')
 */
function showNotification(message, type) {
    // Remove existing notifications
    const existing = document.querySelector('.book-notification');
    if (existing) existing.remove();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'book-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 10px;
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: fadeInUp 0.3s ease-out;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        ${type === 'success' 
            ? 'background: rgba(46, 204, 113, 0.9); color: #fff;' 
            : 'background: rgba(231, 76, 60, 0.9); color: #fff;'
        }
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// 13. UTILITY FUNCTIONS
// ============================================
/**
 * Debounce function to limit how often a function can fire.
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution rate.
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} The throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// 14. EVENT LISTENERS SETUP
// ============================================
/**
 * Set up all event listeners for the book.
 * Called once during initialization.
 */
function setupEventListeners() {
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);
    
    // Touch/swipe gestures
    const bookWrapper = document.querySelector('.book-wrapper');
    if (bookWrapper) {
        bookWrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
        bookWrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
        bookWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    
    // Front cover click to open
    if (DOM.frontCover) {
        DOM.frontCover.addEventListener('click', handleFrontCoverClick);
    }
    
    // Page click zones (only when book is open)
    DOM.pages.forEach((page, index) => {
        if (index > 0) { // Skip front cover page
            page.addEventListener('click', function(event) {
                if (!BookState.isBookOpen) return;
                if (BookState.currentPage !== index) return;
                handlePageClick(event);
            });
        }
    });
    
    // Contact form submission
    if (DOM.contactForm) {
        DOM.contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Hide keyboard hint on first interaction
    const hideHint = () => {
        if (DOM.keyboardHint) {
            DOM.keyboardHint.style.display = 'none';
        }
        document.removeEventListener('keydown', hideHint);
        document.removeEventListener('touchstart', hideHint);
    };
    document.addEventListener('keydown', hideHint, { once: true });
    document.addEventListener('touchstart', hideHint, { once: true });
}

// ============================================
// 15. RESIZE HANDLER
// ============================================
/**
 * Handle window resize events.
 * Adjusts book scale for different screen sizes.
 */
function handleResize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate optimal book scale
    let scale = 1;
    
    if (windowWidth < 360) {
        scale = 0.75;
    } else if (windowWidth < 480) {
        scale = 0.85;
    } else if (windowWidth < 768) {
        scale = 0.9;
    } else if (windowHeight < 700) {
        scale = 0.85;
    }
    
    // Apply scale to book container
    if (DOM.bookContainer) {
        DOM.bookContainer.style.transform = `scale(${scale})`;
    }
}

// Debounced resize handler
const debouncedResize = debounce(handleResize, 200);
window.addEventListener('resize', debouncedResize);
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
});

// ============================================
// 16. ADDITIONAL KEYFRAME ANIMATIONS (JS-injected)
// ============================================
/**
 * Inject additional CSS keyframe animations that are needed
 * for JavaScript-triggered effects.
 */
(function injectAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
        
        .book-notification {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// 17. PUBLIC API
// ============================================
/**
 * Expose key functions to the global scope for HTML onclick handlers
 * and external access.
 */
window.nextPage = nextPage;
window.prevPage = prevPage;
window.goToPage = goToPage;
window.handleContactSubmit = handleContactSubmit;
// ============================================
// WHATSAPP CLICK TRACKING
// ============================================
document.querySelectorAll('.whatsapp-btn, .whatsapp-btn-small').forEach(btn => {
    btn.addEventListener('click', function() {
        console.log('%c WhatsApp clicked! ', 'background: #25D366; color: #fff; padding: 4px 12px; border-radius: 4px;');
    });
});