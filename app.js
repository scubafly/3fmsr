// Configuration
const API_URL = '/api';
const UPDATE_INTERVAL = 10000; // Update every 10 seconds

// DOM Elements
const elements = {
    currentAmount: document.getElementById('current-amount'),
    targetAmount: document.getElementById('target-amount'),
    progressBar: document.getElementById('progress-bar'),
    progressPercentage: document.getElementById('progress-percentage'),
    donationsList: document.getElementById('donations-list')
};

// State
let previousAmount = 0;

/**
 * Format number with thousands separator
 */
function formatNumber(num) {
    return new Intl.NumberFormat('nl-NL').format(num);
}

/**
 * Animate number counting up
 */
function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const difference = end - start;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (difference * easeOutQuart));

        element.textContent = formatNumber(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatNumber(end);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Update the progress bar
 */
function updateProgress(current, target) {
    const percentage = Math.min((current / target) * 100, 100);
    const roundedPercentage = Math.round(percentage);

    elements.progressBar.style.width = `${percentage}%`;
    elements.progressPercentage.textContent = `${roundedPercentage}%`;

    // Add celebration effect when target is reached
    if (percentage >= 100) {
        elements.progressBar.style.animation = 'celebrate 1s ease-in-out';
    }
}

/**
 * Create a donation card element
 */
function createDonationCard(donation, index) {
    const card = document.createElement('div');
    card.className = 'donation-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const header = document.createElement('div');
    header.className = 'donation-header';

    const name = document.createElement('div');
    name.className = 'donation-name';
    name.textContent = donation.name || 'Anoniem';

    const amount = document.createElement('div');
    amount.className = 'donation-amount';
    amount.textContent = `€ ${formatNumber(donation.amount)}`;

    header.appendChild(name);
    header.appendChild(amount);
    card.appendChild(header);

    if (donation.message) {
        const message = document.createElement('div');
        message.className = 'donation-message';
        message.textContent = `"${donation.message}"`;
        card.appendChild(message);
    }

    return card;
}

/**
 * Update donations list
 */
function updateDonations(donations) {
    // Clear loading state
    elements.donationsList.innerHTML = '';

    if (!donations || donations.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'loading';
        emptyState.textContent = 'Nog geen donaties';
        elements.donationsList.appendChild(emptyState);
        return;
    }

    // Show most recent donations first (reverse order)
    const recentDonations = [...donations].reverse().slice(0, 50);

    recentDonations.forEach((donation, index) => {
        const card = createDonationCard(donation, index);
        elements.donationsList.appendChild(card);
    });
}

/**
 * Fetch and update data from API
 */
async function fetchData() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update target amount (static after first load)
        if (elements.targetAmount.textContent !== formatNumber(data.target)) {
            elements.targetAmount.textContent = formatNumber(data.target);
        }

        // Update current amount with animation
        if (data.amount !== previousAmount) {
            animateNumber(elements.currentAmount, previousAmount, data.amount);
            previousAmount = data.amount;
        }

        // Update progress bar
        updateProgress(data.amount, data.target);

        // Update donations list
        updateDonations(data.donations);

        // Log success
        console.log('✅ Data updated:', {
            amount: data.amount,
            target: data.target,
            donations: data.donations.length
        });

    } catch (error) {
        console.error('❌ Error fetching data:', error);

        // Show error state in donations list if it's empty
        if (elements.donationsList.children.length === 0) {
            elements.donationsList.innerHTML = `
                <div class="loading" style="color: var(--color-accent);">
                    Fout bij laden van data. Probeer de pagina te verversen...
                </div>
            `;
        }
    }
}

/**
 * Initialize the app
 */
function init() {
    console.log('🚀 3FM Serious Request Display gestart');

    // Initial fetch
    fetchData();

    // Set up periodic updates
    setInterval(fetchData, UPDATE_INTERVAL);

    // Add visibility change handler to pause updates when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('👀 Tab visible again, fetching fresh data');
            fetchData();
        }
    });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add celebration animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes celebrate {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.02); }
        50% { transform: scale(0.98); }
        75% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);
