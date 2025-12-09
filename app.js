// Configuration
const API_URL = '/api';
const UPDATE_INTERVAL = 300000; // Update every 5 minutes
const MAX_VISIBLE_DONATIONS = 8; // Max cards to show at once (4 left, 4 right)
const ROTATION_INTERVAL = 10000; // Rotate one card every 3 seconds

// DOM Elements
const elements = {
    currentAmount: document.getElementById('current-amount'),
    targetAmount: document.getElementById('target-amount'),
    progressBar: document.getElementById('progress-bar'),
    progressPercentage: document.getElementById('progress-percentage'),
    donationsListLeft: document.getElementById('donations-list-left'),
    donationsListRight: document.getElementById('donations-list-right')
};

// State
let previousAmount = 0;
let visibleDonationsOffset = 0;
let allDonations = []; // Store all available donations
let visibleDonations = []; // Store currently visible donations with their positions
let rotationInterval = null;

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
    amount.innerHTML = `<span class="currency">€</span> ${formatNumber(donation.amount)}`;

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
    elements.donationsListLeft.innerHTML = '';
    elements.donationsListRight.innerHTML = '';

    if (!donations || donations.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'loading';
        emptyState.textContent = 'Nog geen donaties';
        elements.donationsListLeft.appendChild(emptyState);
        allDonations = [];
        visibleDonations = [];
        if (rotationInterval) {
            clearInterval(rotationInterval);
            rotationInterval = null;
        }
        return;
    }

    // Filter out anonymous donations without a message
    allDonations = donations.filter(d => {
        const isAnonymous = d.name === 'Anoniem' || !d.name;
        const hasNoMessage = !d.message || d.message.trim() === '';
        return !(isAnonymous && hasNoMessage);
    });

    // Sort by amount (highest first)
    allDonations.sort((a, b) => b.amount - a.amount);

    // If there are not many donations, just show all of them
    if (allDonations.length <= MAX_VISIBLE_DONATIONS) {
        visibleDonations = allDonations.map((donation, index) => ({
            donation,
            side: index % 2 === 0 ? 'left' : 'right',
            position: Math.floor(index / 2)
        }));

        visibleDonations.forEach(({ donation, side, position }) => {
            const card = createDonationCard(donation, position);
            if (side === 'left') {
                elements.donationsListLeft.appendChild(card);
            } else {
                elements.donationsListRight.appendChild(card);
            }
        });

        // Start rotation if we have more donations than visible
        if (allDonations.length > MAX_VISIBLE_DONATIONS) {
            startRotation();
        } else if (rotationInterval) {
            clearInterval(rotationInterval);
            rotationInterval = null;
        }
        return;
    }

    // Initialize with first MAX_VISIBLE_DONATIONS
    visibleDonations = [];
    for (let i = 0; i < MAX_VISIBLE_DONATIONS; i++) {
        visibleDonations.push({
            donation: allDonations[i],
            side: i % 2 === 0 ? 'left' : 'right',
            position: Math.floor(i / 2)
        });
    }

    // Render initial cards
    visibleDonations.forEach(({ donation, side, position }) => {
        const card = createDonationCard(donation, position);
        if (side === 'left') {
            elements.donationsListLeft.appendChild(card);
        } else {
            elements.donationsListRight.appendChild(card);
        }
    });

    // Start rotation
    startRotation();
}

/**
 * Rotate one donation card with a new one from allDonations
 */
function rotateDonation() {
    if (allDonations.length <= MAX_VISIBLE_DONATIONS) {
        return; // Not enough donations to rotate
    }

    // Get all donations that are not currently visible
    const visibleDonationIndices = visibleDonations.map(v => allDonations.indexOf(v.donation));
    const availableDonations = allDonations
        .map((donation, index) => ({ donation, index }))
        .filter(({ index }) => !visibleDonationIndices.includes(index));

    if (availableDonations.length === 0) {
        return; // No new donations to show
    }

    // Pick a random visible card to replace
    const randomVisibleIndex = Math.floor(Math.random() * visibleDonations.length);
    const { side, position } = visibleDonations[randomVisibleIndex];

    // Pick a random new donation
    const randomNewDonation = availableDonations[Math.floor(Math.random() * availableDonations.length)];

    // Update the visible donations array
    visibleDonations[randomVisibleIndex] = {
        donation: randomNewDonation.donation,
        side,
        position
    };

    // Replace the card in the DOM
    const targetList = side === 'left' ? elements.donationsListLeft : elements.donationsListRight;
    const oldCard = targetList.children[position];
    const newCard = createDonationCard(randomNewDonation.donation, position);

    if (oldCard) {
        targetList.replaceChild(newCard, oldCard);
    }
}

/**
 * Start the rotation interval
 */
function startRotation() {
    if (rotationInterval) {
        clearInterval(rotationInterval);
    }
    rotationInterval = setInterval(rotateDonation, ROTATION_INTERVAL);
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
        if (elements.donationsListLeft.children.length === 0) {
            elements.donationsListLeft.innerHTML = `
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
            if (allDonations.length > MAX_VISIBLE_DONATIONS) {
                startRotation();
            }
        } else {
            // Pause rotation when tab is hidden
            if (rotationInterval) {
                clearInterval(rotationInterval);
                rotationInterval = null;
            }
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
