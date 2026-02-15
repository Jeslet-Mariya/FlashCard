// Data Storage
let decks = [];
let cards = [];
let studyProgress = {};

// Current state
let currentDeckId = null;
let currentCardIndex = 0;
let shuffledCards = [];
let isCardFlipped = false;
let editingDeckId = null;
let editingCardId = null;

// Initialize
function init() {
    loadData();
    updateHomeStats();
    renderDecks();
    updateActiveNav();
}

// Data Management
function loadData() {
    const savedDecks = localStorage.getItem('flashmind_decks');
    const savedCards = localStorage.getItem('flashmind_cards');
    const savedProgress = localStorage.getItem('flashmind_progress');
    
    decks = savedDecks ? JSON.parse(savedDecks) : [];
    cards = savedCards ? JSON.parse(savedCards) : [];
    studyProgress = savedProgress ? JSON.parse(savedProgress) : {};
}

function saveData() {
    localStorage.setItem('flashmind_decks', JSON.stringify(decks));
    localStorage.setItem('flashmind_cards', JSON.stringify(cards));
    localStorage.setItem('flashmind_progress', JSON.stringify(studyProgress));
}

// Navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const page = document.getElementById(`${pageName}-page`);
    if (page) {
        page.classList.add('active');
    }
    
    // Update nav
    updateActiveNav();
    
    // Load page-specific content
    if (pageName === 'home') {
        updateHomeStats();
        renderRecentDecks();
    } else if (pageName === 'decks') {
        renderDecks();
    } else if (pageName === 'statistics') {
        renderStatistics();
    }
}

function updateActiveNav() {
    const currentPage = document.querySelector('.page.active')?.id;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (currentPage === 'home-page' && link.dataset.page === 'home') {
            link.classList.add('active');
        } else if (currentPage === 'decks-page' && link.dataset.page === 'decks') {
            link.classList.add('active');
        } else if (currentPage === 'statistics-page' && link.dataset.page === 'statistics') {
            link.classList.add('active');
        }
    });
}

// Home Page
function updateHomeStats() {
    const totalDecks = decks.length;
    const totalCards = cards.length;
    const masteredCards = cards.filter(c => c.mastery === 'mastered').length;
    
    document.getElementById('total-decks').textContent = totalDecks;
    document.getElementById('total-cards').textContent = totalCards;
    document.getElementById('mastered-cards').textContent = masteredCards;
    
    const emptyState = document.getElementById('empty-state');
    const recentSection = document.getElementById('recent-decks-section');
    
    if (totalDecks === 0) {
        emptyState.style.display = 'block';
        recentSection.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        recentSection.style.display = 'block';
    }
}

function renderRecentDecks() {
    const container = document.getElementById('recent-decks');
    container.innerHTML = '';
    
    const recentDecks = decks.slice(0, 6);
    recentDecks.forEach(deck => {
        const deckCards = cards.filter(c => c.deckId === deck.id);
        const mastered = deckCards.filter(c => c.mastery === 'mastered').length;
        const progress = deckCards.length > 0 ? Math.round((mastered / deckCards.length) * 100) : 0;
        
        const deckEl = document.createElement('div');
        deckEl.className = 'deck-card';
        deckEl.onclick = () => showDeckDetail(deck.id);
        deckEl.innerHTML = `
            <div class="deck-header-top">
                <div>
                    <div class="deck-name">${escapeHtml(deck.name)}</div>
                    <div class="deck-description">${escapeHtml(deck.description || 'No description')}</div>
                </div>
                <div class="deck-color-dot" style="background-color: ${deck.color || '#8b5cf6'}"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
                <span style="color: var(--text-muted);">${deckCards.length} cards</span>
                ${deckCards.length > 0 ? `<span style="color: var(--green);">${progress}% mastered</span>` : ''}
            </div>
        `;
        container.appendChild(deckEl);
    });
}

// Decks Page
function renderDecks() {
    const container = document.getElementById('decks-list');
    const emptyState = document.getElementById('decks-empty-state');
    
    container.innerHTML = '';
    
    if (decks.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    decks.forEach(deck => {
        const deckEl = document.createElement('div');
        deckEl.className = 'deck-card';
        deckEl.innerHTML = `
            <div class="deck-header-top">
                <div style="flex: 1;">
                    <div class="deck-name">${escapeHtml(deck.name)}</div>
                    <div class="deck-description">${escapeHtml(deck.description || 'No description')}</div>
                </div>
                <div class="deck-color-dot" style="background-color: ${deck.color || '#8b5cf6'}"></div>
            </div>
            <div class="deck-actions">
                <button class="btn-secondary" style="flex: 1;" onclick="event.stopPropagation(); showDeckDetail('${deck.id}')">View Cards</button>
                <button class="btn-primary" onclick="event.stopPropagation(); startStudy('${deck.id}')">▶ Study</button>
                <button class="btn-secondary" onclick="event.stopPropagation(); editDeck('${deck.id}')" title="Edit">✏️</button>
                <button class="btn-secondary" onclick="event.stopPropagation(); deleteDeck('${deck.id}')" title="Delete" style="color: var(--red);">🗑️</button>
            </div>
        `;
        container.appendChild(deckEl);
    });
}

// Deck Modal
function openDeckModal(deckId = null) {
    editingDeckId = deckId;
    const modal = document.getElementById('deck-modal');
    const form = document.getElementById('deck-form');
    const title = document.getElementById('deck-modal-title');
    
    if (deckId) {
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            title.textContent = 'Edit Deck';
            document.getElementById('deck-name').value = deck.name;
            document.getElementById('deck-description').value = deck.description || '';
            document.getElementById('deck-color').value = deck.color || '#8b5cf6';
            form.querySelector('button[type="submit"]').textContent = 'Update';
        }
    } else {
        title.textContent = 'Create New Deck';
        form.reset();
        document.getElementById('deck-color').value = '#8b5cf6';
        form.querySelector('button[type="submit"]').textContent = 'Create';
    }
    
    modal.classList.add('active');
}

function closeDeckModal() {
    document.getElementById('deck-modal').classList.remove('active');
    editingDeckId = null;
    document.getElementById('deck-form').reset();
}

function saveDeck(event) {
    event.preventDefault();
    
    const name = document.getElementById('deck-name').value.trim();
    const description = document.getElementById('deck-description').value.trim();
    const color = document.getElementById('deck-color').value;
    
    if (editingDeckId) {
        const deck = decks.find(d => d.id === editingDeckId);
        if (deck) {
            deck.name = name;
            deck.description = description;
            deck.color = color;
        }
    } else {
        const newDeck = {
            id: Date.now().toString(),
            name,
            description,
            color,
            createdAt: new Date().toISOString()
        };
        decks.push(newDeck);
    }
    
    saveData();
    closeDeckModal();
    renderDecks();
    updateHomeStats();
    showPage('decks');
}

function editDeck(deckId) {
    openDeckModal(deckId);
}

function deleteDeck(deckId) {
    if (confirm('Are you sure you want to delete this deck? All cards will be deleted.')) {
        decks = decks.filter(d => d.id !== deckId);
        cards = cards.filter(c => c.deckId !== deckId);
        saveData();
        renderDecks();
        updateHomeStats();
    }
}

// Deck Detail Page
function showDeckDetail(deckId) {
    currentDeckId = deckId;
    const deck = decks.find(d => d.id === deckId);
    
    if (!deck) {
        showPage('decks');
        return;
    }
    
    const deckCards = cards.filter(c => c.deckId === deckId);
    const mastered = deckCards.filter(c => c.mastery === 'mastered').length;
    const learning = deckCards.filter(c => c.mastery === 'learning').length;
    const newCards = deckCards.filter(c => c.mastery === 'new').length;
    
    const header = document.getElementById('deck-header');
    header.innerHTML = `
        <div class="deck-header-content">
            <div>
                <div class="deck-header-title">
                    <div class="deck-color-dot" style="background-color: ${deck.color || '#8b5cf6'}"></div>
                    <h1>${escapeHtml(deck.name)}</h1>
                </div>
                <p>${escapeHtml(deck.description || 'No description')}</p>
            </div>
            ${deckCards.length > 0 ? `
                <button class="btn-primary" onclick="startStudy('${deckId}')">▶ Study Deck</button>
            ` : ''}
        </div>
        <div class="deck-stats">
            <div class="deck-stat">
                <div class="deck-stat-value">${deckCards.length}</div>
                <div class="deck-stat-label">Total Cards</div>
            </div>
            <div class="deck-stat">
                <div class="deck-stat-value">${newCards}</div>
                <div class="deck-stat-label">New</div>
            </div>
            <div class="deck-stat">
                <div class="deck-stat-value">${learning}</div>
                <div class="deck-stat-label">Learning</div>
            </div>
            <div class="deck-stat">
                <div class="deck-stat-value">${mastered}</div>
                <div class="deck-stat-label">Mastered</div>
            </div>
        </div>
    `;
    
    document.getElementById('cards-count').textContent = deckCards.length;
    renderCards();
    
    const emptyState = document.getElementById('cards-empty-state');
    if (deckCards.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('cards-list').style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        document.getElementById('cards-list').style.display = 'grid';
    }
    
    showPage('deck-detail');
}

function renderCards() {
    const container = document.getElementById('cards-list');
    const deckCards = cards.filter(c => c.deckId === currentDeckId);
    
    container.innerHTML = '';
    
    deckCards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-item';
        cardEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <span class="card-mastery ${card.mastery || 'new'}">${card.mastery || 'new'}</span>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-secondary" onclick="editCard('${card.id}')" title="Edit" style="padding: 0.5rem;">✏️</button>
                    <button class="btn-secondary" onclick="deleteCard('${card.id}')" title="Delete" style="padding: 0.5rem; color: var(--red);">🗑️</button>
                </div>
            </div>
            <div class="card-side">
                <div class="card-side-label">Front</div>
                <div class="card-side-content">${escapeHtml(card.front)}</div>
            </div>
            <div class="card-side">
                <div class="card-side-label">Back</div>
                <div class="card-side-content">${escapeHtml(card.back)}</div>
            </div>
        `;
        container.appendChild(cardEl);
    });
}

// Card Modal
function openCardModal(cardId = null) {
    editingCardId = cardId;
    const modal = document.getElementById('card-modal');
    const form = document.getElementById('card-form');
    const title = document.getElementById('card-modal-title');
    
    if (cardId) {
        const card = cards.find(c => c.id === cardId);
        if (card) {
            title.textContent = 'Edit Card';
            document.getElementById('card-front').value = card.front;
            document.getElementById('card-back').value = card.back;
            form.querySelector('button[type="submit"]').textContent = 'Update';
        }
    } else {
        title.textContent = 'Create New Card';
        form.reset();
        form.querySelector('button[type="submit"]').textContent = 'Create';
    }
    
    modal.classList.add('active');
}

function closeCardModal() {
    document.getElementById('card-modal').classList.remove('active');
    editingCardId = null;
    document.getElementById('card-form').reset();
}

function saveCard(event) {
    event.preventDefault();
    
    if (!currentDeckId) {
        alert('Please select a deck first');
        return;
    }
    
    const front = document.getElementById('card-front').value.trim();
    const back = document.getElementById('card-back').value.trim();
    
    if (editingCardId) {
        const card = cards.find(c => c.id === editingCardId);
        if (card) {
            card.front = front;
            card.back = back;
        }
    } else {
        const newCard = {
            id: Date.now().toString(),
            deckId: currentDeckId,
            front,
            back,
            mastery: 'new',
            createdAt: new Date().toISOString()
        };
        cards.push(newCard);
    }
    
    saveData();
    closeCardModal();
    showDeckDetail(currentDeckId);
}

function editCard(cardId) {
    openCardModal(cardId);
}

function deleteCard(cardId) {
    if (confirm('Are you sure you want to delete this card?')) {
        cards = cards.filter(c => c.id !== cardId);
        saveData();
        showDeckDetail(currentDeckId);
    }
}

// Study Mode
function startStudy(deckId) {
    currentDeckId = deckId;
    const deckCards = cards.filter(c => c.deckId === deckId);
    
    if (deckCards.length === 0) {
        alert('No cards in this deck. Add cards first!');
        return;
    }
    
    shuffledCards = [...deckCards].sort(() => Math.random() - 0.5);
    currentCardIndex = 0;
    isCardFlipped = false;
    
    updateStudyCard();
    showPage('study');
}

function updateStudyCard() {
    if (currentCardIndex >= shuffledCards.length) {
        document.getElementById('study-card').style.display = 'none';
        document.getElementById('answer-buttons').style.display = 'none';
        document.getElementById('study-complete').style.display = 'block';
        return;
    }
    
    document.getElementById('study-card').style.display = 'flex';
    document.getElementById('answer-buttons').style.display = 'none';
    document.getElementById('study-complete').style.display = 'none';
    
    const card = shuffledCards[currentCardIndex];
    document.getElementById('card-content').textContent = isCardFlipped ? card.back : card.front;
    document.getElementById('card-label').textContent = isCardFlipped ? 'Answer' : 'Question';
    document.getElementById('flip-btn').textContent = isCardFlipped ? '🔄 Show Question' : '🔄 Show Answer';
    
    const progress = ((currentCardIndex + 1) / shuffledCards.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('current-card-num').textContent = currentCardIndex + 1;
    document.getElementById('total-cards-num').textContent = shuffledCards.length;
    document.getElementById('remaining-cards').textContent = `${shuffledCards.length - currentCardIndex - 1} remaining`;
}

function flipCard() {
    isCardFlipped = !isCardFlipped;
    updateStudyCard();
    
    if (isCardFlipped) {
        document.getElementById('answer-buttons').style.display = 'flex';
    }
}

function answerCard(result) {
    const card = shuffledCards[currentCardIndex];
    
    // Update progress
    if (!studyProgress[card.id]) {
        studyProgress[card.id] = { reviews: 0, correct: 0 };
    }
    
    studyProgress[card.id].reviews++;
    studyProgress[card.id].lastReviewed = new Date().toISOString();
    
    if (result === 'correct') {
        studyProgress[card.id].correct++;
        const accuracy = studyProgress[card.id].correct / studyProgress[card.id].reviews;
        if (accuracy >= 0.8 && studyProgress[card.id].reviews >= 3) {
            card.mastery = 'mastered';
        } else if (accuracy >= 0.5) {
            card.mastery = 'learning';
        }
    } else {
        card.mastery = 'learning';
    }
    
    // Update card in cards array
    const cardIndex = cards.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
        cards[cardIndex].mastery = card.mastery;
    }
    
    saveData();
    
    // Move to next card
    currentCardIndex++;
    isCardFlipped = false;
    updateStudyCard();
}

function resetStudy() {
    startStudy(currentDeckId);
}

function goBackFromStudy() {
    showDeckDetail(currentDeckId);
}

// Statistics
function renderStatistics() {
    const totalCards = cards.length;
    const masteredCards = cards.filter(c => c.mastery === 'mastered').length;
    const learningCards = cards.filter(c => c.mastery === 'learning').length;
    const newCards = cards.filter(c => c.mastery === 'new').length;
    
    const totalReviews = Object.values(studyProgress).reduce((sum, p) => sum + (p.reviews || 0), 0);
    const totalCorrect = Object.values(studyProgress).reduce((sum, p) => sum + (p.correct || 0), 0);
    const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
    const masteryRate = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    
    document.getElementById('stat-total-cards').textContent = totalCards;
    document.getElementById('stat-mastery-rate').textContent = `${masteryRate}%`;
    document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
    document.getElementById('stat-total-reviews').textContent = totalReviews;
    
    // Progress breakdown
    const newPercent = totalCards > 0 ? Math.round((newCards / totalCards) * 100) : 0;
    const learningPercent = totalCards > 0 ? Math.round((learningCards / totalCards) * 100) : 0;
    const masteredPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    
    document.getElementById('new-count').textContent = `${newCards} (${newPercent}%)`;
    document.getElementById('learning-count').textContent = `${learningCards} (${learningPercent}%)`;
    document.getElementById('mastered-count').textContent = `${masteredCards} (${masteredPercent}%)`;
    
    document.getElementById('new-progress').style.width = `${newPercent}%`;
    document.getElementById('learning-progress').style.width = `${learningPercent}%`;
    document.getElementById('mastered-progress').style.width = `${masteredPercent}%`;
    
    // Deck performance
    const container = document.getElementById('deck-performance');
    if (decks.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = '<h2>Deck Performance</h2>';
    
    decks.forEach(deck => {
        const deckCards = cards.filter(c => c.deckId === deck.id);
        const deckMastered = deckCards.filter(c => c.mastery === 'mastered').length;
        const deckProgress = deckCards.length > 0 ? Math.round((deckMastered / deckCards.length) * 100) : 0;
        
        const item = document.createElement('div');
        item.className = 'deck-performance-item';
        item.innerHTML = `
            <div class="deck-performance-header">
                <div class="deck-performance-title">
                    <div class="deck-color-dot" style="background-color: ${deck.color || '#8b5cf6'}"></div>
                    <h3>${escapeHtml(deck.name)}</h3>
                </div>
                <div class="deck-performance-stats">
                    <div class="deck-performance-value">${deckProgress}%</div>
                    <div class="deck-performance-label">${deckMastered} / ${deckCards.length} mastered</div>
                </div>
            </div>
            <div class="progress-bar-small">
                <div class="progress-fill" style="width: ${deckProgress}%"></div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);


