// js/common.js (v9.6B - CORREÇÃO CRÍTICA: Botão Home Restaurado)

const Yashi = {
    elements: {},
    player: null,
    hls: null,
    navigationStack: [],
    currentViewMode: localStorage.getItem('yashi_view_mode') || 'view-medium',
    currentPlaylist: [],
    currentPlaylistIndex: -1,
    currentPlayingItem: null,

    initCommon(pageType) {
        this.elements.mainContent = document.getElementById('main-content');
        this.elements.playerView = document.getElementById('player-view');
        this.elements.playerElement = document.getElementById('player');
        this.elements.playerBackButton = document.querySelector('.back-from-player');
        this.elements.playerPrevButton = document.getElementById('player-prev-button');
        this.elements.playerNextButton = document.getElementById('player-next-button');

        if (!this.player) {
            this.player = new Plyr(this.elements.playerElement, { controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'] });
            this.hls = new Hls();
            this.player.on('timeupdate', () => this.savePlaybackProgress());
            this.player.on('ended', () => this.clearPlaybackProgress());
        }

        if (pageType !== 'search') this.injectTopBarAndSidebar();
        
        if (this.elements.playerBackButton) this.elements.playerBackButton.addEventListener('click', () => this.stopPlayer());
        if (this.elements.playerPrevButton) this.elements.playerPrevButton.addEventListener('click', () => this.playFromPlaylist('prev'));
        if (this.elements.playerNextButton) this.elements.playerNextButton.addEventListener('click', () => this.playFromPlaylist('next'));

        if (pageType !== 'search') {
            this.elements.viewButtons = document.querySelectorAll('.view-button');
            this.elements.gridContainer = document.getElementById('grid-container');
            this.elements.searchInput = document.getElementById('search-input');
            this.elements.searchButton = document.getElementById('search-button');
            this.elements.topBarBackButton = document.getElementById('top-bar-back-button');
            this.elements.categoryMenuButton = document.getElementById('category-menu-button');
            this.elements.categorySidebar = document.getElementById('category-sidebar');
            this.elements.sidebarOverlay = document.getElementById('sidebar-overlay');
            this.elements.closeSidebarButton = document.getElementById('close-sidebar-button');
            this.elements.categoryListContainer = document.getElementById('category-list-container');

            this.elements.viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.currentViewMode = button.dataset.viewMode;
                    localStorage.setItem('yashi_view_mode', this.currentViewMode);
                    this.applyViewMode();
                    this.reRenderCurrentContent();
                });
            });
        }
        
        this.initKeyboardNavigation();
    },

    injectTopBarAndSidebar() {
        const template = `
            <div class="top-bar">
                <div class="top-bar-left">
                    <img src="logo.png" alt="YASHI PLAYER Logo" class="top-bar-logo" onclick="window.location.href='home.html'" title="Ir para Home">
                    <button class="home-button" onclick="window.location.href='home.html'" title="Ir para Home" tabindex="0"><i class="fas fa-home"></i></button>
                    <button id="top-bar-back-button" class="home-button" title="Voltar" tabindex="0"><i class="fas fa-arrow-left"></i></button>
                    <button id="category-menu-button" class="home-button with-text" title="Categorias" tabindex="0"><i class="fas fa-bars"></i><span>Categorias</span></button>
                    <div class="view-buttons">
                        <button class="view-button" data-view-mode="view-list" title="Lista" tabindex="0"><i class="fas fa-list"></i></button>
                        <button class="view-button" data-view-mode="view-details" title="Detalhes" tabindex="0"><i class="fas fa-bars"></i></button>
                        <button class="view-button" data-view-mode="view-small" title="Grade Pequena" tabindex="0"><i class="fas fa-grip"></i></button>
                        <button class="view-button" data-view-mode="view-medium" title="Grade Média" tabindex="0"><i class="fas fa-table-cells"></i></button>
                        <button class="view-button" data-view-mode="view-large" title="Grade Grande" tabindex="0"><i class="fas fa-table-cells-large"></i></button>
                    </div>
                </div>
                <div class="top-bar-right">
                    <div class="search-container">
                        <input type="text" id="search-input" placeholder="Pesquisar..." class="search-input">
                        <button id="search-button" class="search-button" title="Pesquisar" tabindex="0"><i class="fas fa-search"></i></button>
                    </div>
                </div>
            </div>
            <div id="sidebar-overlay"></div>
            <nav id="category-sidebar">
                <div class="sidebar-header"><h3>Categorias</h3><button id="close-sidebar-button" title="Fechar" tabindex="0"><i class="fas fa-times"></i></button></div>
                <div id="category-list-container"></div>
            </nav>
            <div id="grid-container"></div>`;
        this.elements.mainContent.innerHTML = template;
    },

    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const { key } = e;
            const activeElement = document.activeElement;

            if (['INPUT', 'TEXTAREA'].includes(activeElement.tagName) || activeElement === document.body) return;

            const isPlayerVisible = this.elements.playerView && this.elements.playerView.style.display === 'flex';
            if (isPlayerVisible) return;
            
            if (key === 'Enter') {
                e.preventDefault();
                activeElement.click();
                return;
            }

            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
            e.preventDefault();

            const allFocusable = Array.from(document.querySelectorAll('button, [tabindex="0"]')).filter(el => el.offsetParent && !el.disabled && el.tabIndex !== -1);
            const currentIndex = allFocusable.indexOf(activeElement);
            if (currentIndex === -1) {
                allFocusable[0]?.focus();
                return;
            };

            const currentRect = activeElement.getBoundingClientRect();
            let bestCandidate = null;
            let minDistance = Infinity;

            for (let i = 0; i < allFocusable.length; i++) {
                if (i === currentIndex) continue;

                const candidateRect = allFocusable[i].getBoundingClientRect();
                const dx = (candidateRect.left + candidateRect.width / 2) - (currentRect.left + currentRect.width / 2);
                const dy = (candidateRect.top + candidateRect.height / 2) - (currentRect.top + currentRect.height / 2);
                
                let isCandidate = false;
                
                switch (key) {
                    case 'ArrowRight': if (dx > 5) isCandidate = true; break;
                    case 'ArrowLeft':  if (dx < -5) isCandidate = true; break;
                    case 'ArrowDown':  if (dy > 5) isCandidate = true; break;
                    case 'ArrowUp':    if (dy < -5) isCandidate = true; break;
                }

                if (isCandidate) {
                    const primaryAxisDistance = (key === 'ArrowLeft' || key === 'ArrowRight') ? Math.abs(dx) : Math.abs(dy);
                    const secondaryAxisDistance = (key === 'ArrowLeft' || key === 'ArrowRight') ? Math.abs(dy) : Math.abs(dx);
                    const distance = primaryAxisDistance + (secondaryAxisDistance * 2.5);

                    if (distance < minDistance) {
                        minDistance = distance;
                        bestCandidate = allFocusable[i];
                    }
                }
            }
            
            if (bestCandidate) {
                bestCandidate.focus();
            }
        });
    },

    applyViewMode() {
        if (!this.elements.gridContainer) return;
        this.elements.gridContainer.className = `grid-container ${this.currentViewMode}`;
        this.elements.viewButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.viewMode === this.currentViewMode);
        });
        this.reRenderCurrentContent();
    },

    reRenderCurrentContent() {
        const currentState = this.navigationStack[this.navigationStack.length - 1];
        if (currentState && currentState.renderFunc) {
            currentState.renderFunc();
        }
    },

    renderGrid(items, gridContainer, context = {}) {
        gridContainer.innerHTML = '';
        gridContainer.className = `grid-container ${this.currentViewMode}`;
        gridContainer.setAttribute('data-focus-group', ''); 
        
        if (!items || items.length === 0) {
            gridContainer.innerHTML = `<p id="no-results">Nenhum item encontrado.</p>`;
            return;
        }
        items.forEach(item => {
            gridContainer.appendChild(this.createCard(item, context));
        });
    },

    createCard(item, context = {}) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');

        const defaultImg = 'logo.png';
        const displayItem = item.playbackData || item;
        const itemType = displayItem.seasons ? 'series' : (displayItem.episodes ? 'season' : displayItem.type);

        let title = displayItem.name;
        let image = displayItem.logo || (itemType === 'season' && context.parentSeries ? context.parentSeries.logo : defaultImg);
        let description = '';

        if (itemType === 'channel') description = `Canal`;
        else if (itemType === 'movie') description = `Filme`;
        else if (itemType === 'series') description = `Série`;
        else if (itemType === 'season') {
            card.classList.add('season-card');
            title = `Temporada ${displayItem.number || ''}`;
            description = `Episódios: ${(displayItem.episodes || []).length}`;
        } else if (itemType === 'episode') {
            title = displayItem.name;
            description = `Ep. ${displayItem.number || ''}`;
        }
        
        const favButton = document.createElement('button');
        favButton.className = 'favorite-button';
        favButton.setAttribute('tabindex', '-1');
        db.favorites.get(displayItem.name).then(fav => {
            favButton.innerHTML = fav ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
            if (fav) favButton.classList.add('active');
        });
        
        let cardContentHTML = '';
        if (this.currentViewMode === 'view-list' || this.currentViewMode === 'view-details') {
            cardContentHTML = `
                <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
                <div class="card-content">
                    <div class="card-title">${title}</div>
                    <div class="card-description">${description}</div>
                </div>`;
        } else {
             cardContentHTML = `
                <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
                <div class="card-title">${title}</div>`;
        }
        card.innerHTML = cardContentHTML;
        card.prepend(favButton);

        favButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isFavorited = favButton.classList.contains('active');
            if (isFavorited) {
                await db.favorites.delete(displayItem.name);
                favButton.innerHTML = '<i class="fa-regular fa-star"></i>';
                favButton.classList.remove('active');
            } else {
                await db.favorites.put({ name: displayItem.name, type: itemType, data: displayItem });
                favButton.innerHTML = '<i class="fa-solid fa-star"></i>';
                favButton.classList.add('active');
            }
        });

        card.addEventListener('click', () => {
            if (displayItem.url) {
                this.playContent(displayItem);
            } else if (itemType === 'series') {
                localStorage.setItem('yashi_deep_link_series_name', displayItem.name);
                window.location.href = 'series.html';
            } else if (itemType === 'season' && context.parentSeries) {
                Yashi.navigationStack.push({ type: 'episodeList', renderFunc: () => this.renderGrid(displayItem.episodes, this.elements.gridContainer, { parentSeries: context.parentSeries }) });
                this.reRenderCurrentContent();
            }
        });

        return card;
    },

    playContent(item, startTime = 0) {
        if (!this.elements.playerView) return;
        
        const lastNav = this.navigationStack.length > 0 ? this.navigationStack[this.navigationStack.length - 1] : null;
        if (lastNav && lastNav.data && Array.isArray(lastNav.data)) {
            this.currentPlaylist = lastNav.data.filter(i => i.url);
            this.currentPlaylistIndex = this.currentPlaylist.findIndex(ep => ep.url === item.url);
        } else {
            this.currentPlaylist = [item];
            this.currentPlaylistIndex = 0;
        }

        this.currentPlayingItem = { ...item, initialPlaybackTime: startTime };
        const playerTitleEl = document.getElementById('player-title');
        if (playerTitleEl) playerTitleEl.textContent = item.name;

        this.elements.playerView.style.display = 'flex';
        this.updatePlayerNavButtons();

        try {
            this.hls.destroy();
            this.hls = new Hls();
            
            if (Hls.isSupported() && item.url.includes('.m3u8')) {
                this.hls.loadSource(item.url);
                this.hls.attachMedia(this.elements.playerElement);
            } else {
                this.elements.playerElement.src = item.url;
            }
            
            this.player.once('ready', () => {
                if (this.currentPlayingItem.initialPlaybackTime > 0) {
                    this.player.currentTime = this.currentPlayingItem.initialPlaybackTime;
                }
                this.player.play();
            });
        } catch (error) {
            console.error("Erro ao carregar mídia:", error);
        }
    },

    stopPlayer() {
        if (!this.elements.playerView) return;
        this.player.stop();
        this.hls.destroy();
        this.elements.playerView.style.display = 'none';
        this.currentPlayingItem = null;
    },

    updatePlayerNavButtons() {
        if (!this.elements.playerPrevButton || !this.elements.playerNextButton) return;
        const visible = this.currentPlaylist.length > 1;
        this.elements.playerPrevButton.classList.toggle('visible', visible);
        this.elements.playerNextButton.classList.toggle('visible', visible);
        this.elements.playerPrevButton.disabled = this.currentPlaylistIndex === 0;
        this.elements.playerNextButton.disabled = this.currentPlaylistIndex >= this.currentPlaylist.length - 1;
    },
    
    playFromPlaylist(direction) {
        const newIndex = this.currentPlaylistIndex + (direction === 'next' ? 1 : -1);
        if (newIndex >= 0 && newIndex < this.currentPlaylist.length) {
            this.playContent(this.currentPlaylist[newIndex]);
        }
    },

    savePlaybackProgress: async function() {
        if (!this.currentPlayingItem || !this.player || !this.player.duration) return;
        const { currentTime, duration } = this.player;
        if (currentTime < 5 || currentTime / duration > 0.95) {
            await this.clearPlaybackProgress();
        } else {
            await db.playbackHistory.put({
                itemId: this.currentPlayingItem.name,
                progress: currentTime,
                duration: duration,
                timestamp: Date.now(),
                playbackData: this.currentPlayingItem
            });
        }
    },

    clearPlaybackProgress: async function() {
        if (this.currentPlayingItem) {
            await db.playbackHistory.delete(this.currentPlayingItem.name);
        }
    },
    
    showToast(message, type = 'success', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    },

    showConfirmationModal(message, onConfirm) { /* Lógica existente */ }
};

window.Yashi = Yashi;