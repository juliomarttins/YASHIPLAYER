<<<<<<< HEAD
// js/common.js - v1.5.0 - Refinamento UI: Favoritos -> Salvos
=======
// js/common.js (v9.6B - CORREÇÃO CRÍTICA: Botão Home Restaurado)

>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
const Yashi = {
    elements: {},
    player: null,
    hls: null,
    navigationStack: [],
<<<<<<< HEAD
    lastRenderedData: [], 
    currentCoverSize: localStorage.getItem('yashi_cover_size') || 'medium',
    currentPlaylist: [],
    currentPlaylistIndex: -1,
    currentPlayingItem: null,
    countdownInterval: null,
    tmdbApiKey: 'f98c1fbdb195ab6e914a3a1a8e184b4b', // Sua chave de API TMDb
=======
    currentViewMode: localStorage.getItem('yashi_view_mode') || 'view-medium',
    currentPlaylist: [],
    currentPlaylistIndex: -1,
    currentPlayingItem: null,
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1

    initCommon(pageType) {
        this.elements.mainContent = document.getElementById('main-content');
        this.elements.playerView = document.getElementById('player-view');
        this.elements.playerElement = document.getElementById('player');
        this.elements.playerBackButton = document.querySelector('.back-from-player');
<<<<<<< HEAD
        this.elements.playerTitle = document.getElementById('player-title');
=======
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
        this.elements.playerPrevButton = document.getElementById('player-prev-button');
        this.elements.playerNextButton = document.getElementById('player-next-button');

        if (!this.player) {
<<<<<<< HEAD
            const aspectRatioMenuButton = `
            <button class="plyr__control" id="aspect-ratio-menu-btn" title="Formato da Tela">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <path d="M3 9h18M9 21V9"></path>
                </svg>
            </button>`;

            this.player = new Plyr(this.elements.playerElement, {
                controls: [
                    'play-large', 'rewind', 'play', 'fast-forward', 'progress', 
                    'current-time', 'mute', 'volume', 'captions', 'settings', 
                    aspectRatioMenuButton, 'pip', 'airplay', 'fullscreen'
                ],
                seekTime: 30
            });
            
            this.player.on('ready', event => {
                const playerInstance = event.detail.plyr;
                const playerContainer = playerInstance.elements.container;
                const menuButton = document.getElementById('aspect-ratio-menu-btn');
                
                if (menuButton) {
                    const savedRatio = localStorage.getItem('yashi_aspect_ratio') || 'padrão';
                    playerContainer.setAttribute('data-aspect-ratio', savedRatio);

                    const menu = document.createElement('div');
                    menu.id = 'aspect-ratio-menu';
                    menu.classList.add('hidden');
                    
                    const ratios = {
                        'padrão': 'Padrão (Original)',
                        'preencher': 'Preencher Tela',
                        'esticado': 'Forçar Esticado'
                    };

                    Object.keys(ratios).forEach(key => {
                        const optionButton = document.createElement('button');
                        optionButton.dataset.ratio = key;
                        optionButton.textContent = ratios[key];
                        if (key === savedRatio) {
                            optionButton.classList.add('active');
                        }
                        optionButton.addEventListener('click', () => {
                            playerContainer.setAttribute('data-aspect-ratio', key);
                            localStorage.setItem('yashi_aspect_ratio', key);
                            menu.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                            optionButton.classList.add('active');
                            menu.classList.add('hidden');
                        });
                        menu.appendChild(optionButton);
                    });
                    
                    playerContainer.appendChild(menu);

                    menuButton.addEventListener('click', () => {
                        menu.classList.toggle('hidden');
                    });
                }
            });

            this.hls = new Hls();
            
            this.player.on('timeupdate', () => this.savePlaybackProgress());
            this.player.on('pause', () => this.savePlaybackProgress());
            window.addEventListener('beforeunload', () => this.savePlaybackProgress());

            this.player.on('ended', () => {
                const isLastItem = this.currentPlaylistIndex >= this.currentPlaylist.length - 1;
                if (!isLastItem) {
                    this.playFromPlaylist('next');
                } else {
                    this.clearPlaybackProgress();
                }
            });
        }

        if (this.elements.playerBackButton) {
            this.elements.playerBackButton.addEventListener('click', () => this.stopPlayer());
        }

        if (pageType && !['search', 'backup', 'novidades', 'contato'].includes(pageType)) this.injectTopBarAndSidebar();
        
        this.injectConfirmationModal();
        this.injectSynopsisModal(); 
        
        if (this.elements.playerPrevButton) this.elements.playerPrevButton.addEventListener('click', () => this.playFromPlaylist('prev'));
        if (this.elements.playerNextButton) this.elements.playerNextButton.addEventListener('click', () => this.playFromPlaylist('next'));

        if (pageType && !['search', 'backup', 'novidades', 'contato'].includes(pageType)) {
            this.elements.gridContainer = document.getElementById('grid-container');
            this.elements.searchInput = document.getElementById('search-input');
            this.elements.searchButton = document.getElementById('search-button');
            this.elements.clearSearchButton = document.getElementById('clear-search-button');
=======
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
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
            this.elements.topBarBackButton = document.getElementById('top-bar-back-button');
            this.elements.categoryMenuButton = document.getElementById('category-menu-button');
            this.elements.categorySidebar = document.getElementById('category-sidebar');
            this.elements.sidebarOverlay = document.getElementById('sidebar-overlay');
            this.elements.closeSidebarButton = document.getElementById('close-sidebar-button');
            this.elements.categoryListContainer = document.getElementById('category-list-container');
<<<<<<< HEAD
            
            this.elements.coverSizeButtons = document.querySelectorAll('.size-button');
            this.elements.coverSizeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.updateCoverSize(button.dataset.size);
=======

            this.elements.viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.currentViewMode = button.dataset.viewMode;
                    localStorage.setItem('yashi_view_mode', this.currentViewMode);
                    this.applyViewMode();
                    this.reRenderCurrentContent();
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
                });
            });
        }
        
<<<<<<< HEAD
        this.updateCoverSize(this.currentCoverSize);
        this.initKeyboardNavigation();
    },
    
    updateCoverSize(size) {
        if (!size) return;
        this.currentCoverSize = size;
        localStorage.setItem('yashi_cover_size', this.currentCoverSize);

        const mainElement = this.elements.mainContent || document.querySelector('main');
        if (mainElement) {
            mainElement.setAttribute('data-cover-size', this.currentCoverSize);
        }
        
        const buttons = this.elements.coverSizeButtons || document.querySelectorAll('.size-button');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === this.currentCoverSize);
        });
    },

    updateBackButton() {
        if (!this.elements.topBarBackButton) return;
        this.elements.topBarBackButton.style.display = this.navigationStack.length > 1 ? 'flex' : 'none';
        
        const newBackButton = this.elements.topBarBackButton.cloneNode(true);
        this.elements.topBarBackButton.parentNode.replaceChild(newBackButton, this.elements.topBarBackButton);
        this.elements.topBarBackButton = newBackButton;
    
        this.elements.topBarBackButton.onclick = () => {
            if (Yashi.navigationStack.length > 1) {
                Yashi.navigationStack.pop();
                const lastState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
    
                if (lastState && lastState.type === 'external') {
                    const origin = sessionStorage.getItem('yashi_nav_origin');
                    sessionStorage.removeItem('yashi_nav_origin');
                    if (origin === 'pesquisa') {
                        window.location.href = '../pesquisa/search.html';
                    } else if (origin === 'favoritos') {
                        window.location.href = '../favoritos/favoritos.html';
                    } else {
                        window.location.href = '../home.html';
                    }
                } else if (lastState && typeof lastState.renderFunc === 'function') {
                    lastState.renderFunc();
                } else {
                    window.location.href = '../home.html';
                }
            } else {
                 window.location.href = '../home.html';
            }
        };
    },
    
=======
        this.initKeyboardNavigation();
    },

>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
    injectTopBarAndSidebar() {
        const template = `
            <div class="top-bar">
                <div class="top-bar-left">
<<<<<<< HEAD
                    <img src="../logo.png" alt="YASHI PLAYER Logo" class="top-bar-logo" onclick="window.location.href='../home.html'" title="Ir para Home">
                    <button class="home-button" onclick="window.location.href='../home.html'" title="Ir para Home" tabindex="0"><i class="fas fa-home"></i></button>
                    <button id="top-bar-back-button" class="home-button" title="Voltar" tabindex="0" style="display: none;"><i class="fas fa-arrow-left"></i></button>
                    <button id="category-menu-button" class="home-button with-text" title="Categorias" tabindex="0"><i class="fas fa-bars"></i><span>Categorias</span></button>
                    <div class="cover-size-buttons">
                        <span class="size-label">Tamanho:</span>
                        <button class="size-button" data-size="micro" title="Capas Micro"><i class="fa-solid fa-table-list"></i></button>
                        <button class="size-button" data-size="small" title="Capas Pequenas"><i class="fa-solid fa-grip"></i></button>
                        <button class="size-button" data-size="medium" title="Capas Médias"><i class="fa-solid fa-table-cells"></i></button>
                        <button class="size-button" data-size="large" title="Capas Grandes"><i class="fa-solid fa-table-cells-large"></i></button>
=======
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
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
                    </div>
                </div>
                <div class="top-bar-right">
                    <div class="search-container">
                        <input type="text" id="search-input" placeholder="Pesquisar..." class="search-input">
<<<<<<< HEAD
                        <button id="clear-search-button" class="clear-search-button hidden" title="Limpar"><i class="fas fa-times"></i></button>
=======
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
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

<<<<<<< HEAD
    injectConfirmationModal() {
        if (document.getElementById('confirmation-modal-overlay')) return;
        const modalHTML = `
            <div id="confirmation-modal-overlay">
                <div class="confirmation-modal">
                    <div class="confirmation-modal-content"></div>
                    <div class="confirmation-modal-buttons">
                        <button class="modal-button cancel-button">Cancelar</button>
                        <button class="modal-button confirm-button">Confirmar</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    injectSynopsisModal() {
        if (document.getElementById('synopsis-modal-overlay')) return;
        const modalHTML = `
            <div id="synopsis-modal-overlay">
                <div class="synopsis-modal">
                    <button class="synopsis-close-button">&times;</button>
                    <div class="synopsis-poster">
                        <img id="synopsis-poster-img" src="../capa.png" alt="Pôster">
                    </div>
                    <div id="synopsis-details-content" class="synopsis-details"></div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const overlay = document.getElementById('synopsis-modal-overlay');
        const closeBtn = overlay.querySelector('.synopsis-close-button');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeSynopsisModal();
        });
        closeBtn.addEventListener('click', () => this.closeSynopsisModal());
    },

    initKeyboardNavigation() { /* ...código sem alterações... */ },
    
    hideNotice() {
        const notice = document.getElementById('autoplay-notice');
        if (notice) notice.classList.remove('visible');
    },

    async playContent(item, startTime = 0) {
        if (!item || !item.url) {
            this.showToast("Conteúdo ou URL inválido.", "error");
            return;
        }

        const lastPlayed = await db.playbackHistory.get(item.name);
        this.currentPlaylist = this.lastRenderedData || [item];
        this.currentPlaylistIndex = this.currentPlaylist.findIndex(p => p.name === item.name);
        this.currentPlayingItem = item;

        this.elements.playerView.style.display = 'flex';
        document.body.classList.add('player-active');
        if (this.elements.playerTitle) this.elements.playerTitle.textContent = item.name;

        const videoElement = this.elements.playerElement;
        const sourceUrl = item.url;
        
        this.player.stop();
        if (this.hls && this.hls.destroy) {
            this.hls.destroy();
        }

        if (sourceUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                this.hls = new Hls();
                this.hls.loadSource(sourceUrl);
                this.hls.attachMedia(videoElement);
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    this.player.play();
                });
            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                videoElement.src = sourceUrl;
            } else {
                this.showToast("Seu navegador não suporta a reprodução deste conteúdo HLS.", "error");
            }
        } else {
            videoElement.src = sourceUrl;
        }

        this.player.once('canplay', () => {
            const timeToSeek = startTime || (lastPlayed ? lastPlayed.progress : 0);
            if (timeToSeek > 0 && timeToSeek < this.player.duration - 10) {
                this.player.currentTime = timeToSeek;
                 const notice = document.getElementById('autoplay-notice');
                if (notice) {
                    notice.classList.add('visible');
                    setTimeout(() => this.hideNotice(), 3000);
                }
            }
            this.player.play();
        });

        this.updatePlayerNavButtons();
    },

    stopPlayer() {
        this.savePlaybackProgress();
        if (this.player) {
            this.player.stop();
            this.elements.playerElement.src = '';
        }
        if (this.hls) {
            this.hls.destroy();
        }
        this.elements.playerView.style.display = 'none';
        document.body.classList.remove('player-active');
        this.currentPlayingItem = null;
        this.currentPlaylist = [];
        this.currentPlaylistIndex = -1;
    },
    
    updatePlayerNavButtons() {
        if (!this.elements.playerPrevButton || !this.elements.playerNextButton) return;

        const hasPrev = this.currentPlaylistIndex > 0;
        const hasNext = this.currentPlaylistIndex < this.currentPlaylist.length - 1;

        this.elements.playerPrevButton.disabled = !hasPrev;
        this.elements.playerPrevButton.classList.toggle('visible', hasPrev);
        
        this.elements.playerNextButton.disabled = !hasNext;
        this.elements.playerNextButton.classList.toggle('visible', hasNext);
    },

    playFromPlaylist(direction) {
        let nextIndex = this.currentPlaylistIndex;
        if (direction === 'next' && this.currentPlaylistIndex < this.currentPlaylist.length - 1) {
            nextIndex++;
        } else if (direction === 'prev' && this.currentPlaylistIndex > 0) {
            nextIndex--;
        }

        if (nextIndex !== this.currentPlaylistIndex) {
            this.currentPlaylistIndex = nextIndex;
            const nextItem = this.currentPlaylist[this.currentPlaylistIndex];
            if (nextItem) {
                this.playContent(nextItem, 0);
            }
        }
    },
    
    savePlaybackProgress: async function() {
        if (!this.currentPlayingItem || !this.player) return;

        const itemId = this.currentPlayingItem.name;
        const itemType = this.currentPlayingItem.type;
        const progress = this.player.currentTime;
        const duration = this.player.duration;

        if (itemType === 'channel') {
            await db.playbackHistory.put({
                itemId: itemId, progress: null, duration: null, timestamp: Date.now(),
                playbackData: this.currentPlayingItem, type: 'channel'
            });
            return;
        }

        if (progress > 5 && duration > 0 && progress / duration < 0.95) {
            await db.playbackHistory.put({
                itemId: itemId, progress: progress, duration: duration, timestamp: Date.now(),
                playbackData: this.currentPlayingItem, type: this.currentPlayingItem.seasons ? 'series' : (this.currentPlayingItem.type || 'movie')
            });
        } else if (duration > 0 && progress / duration >= 0.95) {
            await this.clearPlaybackProgress();
        }
    },
    
=======
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

>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
    clearPlaybackProgress: async function() {
        if (this.currentPlayingItem) {
            await db.playbackHistory.delete(this.currentPlayingItem.name);
        }
    },
<<<<<<< HEAD

    showToast(message, type = 'success', duration = 3000) {
        if (!document.getElementById('toast-container')) {
            document.body.insertAdjacentHTML('beforeend', '<div id="toast-container"></div>');
        }
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

=======
    
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
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    },

<<<<<<< HEAD
    showConfirmationModal(message, onConfirm, options = {}) {
        const { confirmText = 'Confirmar', cancelText = 'Cancelar' } = options;
        const overlay = document.getElementById('confirmation-modal-overlay');
        const content = overlay.querySelector('.confirmation-modal-content');
        const confirmBtn = overlay.querySelector('.confirm-button');
        const cancelBtn = overlay.querySelector('.cancel-button');

        content.innerHTML = message;
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        overlay.classList.add('active');

        const confirmHandler = () => { onConfirm(); closeHandler(); };
        const closeHandler = () => {
            overlay.classList.remove('active');
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', closeHandler);
            overlay.removeEventListener('click', overlayCloseHandler);
        };
        const overlayCloseHandler = (e) => { if (e.target === overlay) closeHandler(); };

        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', closeHandler);
        overlay.addEventListener('click', overlayCloseHandler);
    },
    
    closeSynopsisModal() {
        const overlay = document.getElementById('synopsis-modal-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    async showSynopsisModal(item, onContinueCallback, onRatingChangeCallback) {
        const overlay = document.getElementById('synopsis-modal-overlay');
        if (!overlay) return;

        const posterImg = document.getElementById('synopsis-poster-img');
        const detailsContainer = document.getElementById('synopsis-details-content');
        
        overlay.classList.add('active');
        detailsContainer.innerHTML = `
            <div class="synopsis-loading">
                <div class="loading-yashi" style="font-size: 30px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div>
                <p>Buscando informações...</p>
            </div>`;
        posterImg.src = item.logo || '../capa.png';

        try {
            if (!item || !item.name) throw new Error("Dados do item são inválidos.");
            
            const cached = await db.metadataCache.get(item.name);
            if (cached) {
                this.renderSynopsisContent(detailsContainer, cached, item, onContinueCallback, false, onRatingChangeCallback);
                posterImg.src = cached.posterUrl || item.logo || '../capa.png';
                return;
            }

            const itemType = item.seasons ? 'tv' : 'movie';
            const cleanName = item.name.replace(/\(\d{4}\)/, '').trim();
            const url = `https://api.themoviedb.org/3/search/${itemType}?api_key=${this.tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanName)}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha na comunicação com o servidor de metadados.');
            
            const data = await response.json();
            if (!data.results || data.results.length === 0) throw new Error('Nenhuma informação encontrada para este título.');
            
            const result = data.results[0];
            const posterUrl = result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : (item.logo || '../capa.png');
            const year = result.release_date || result.first_air_date ? new Date(result.release_date || result.first_air_date).getFullYear() : 'N/A';
            const rating = result.vote_average ? result.vote_average.toFixed(1) : 'N/A';
            
            const metadata = {
                name: item.name,
                title: result.title || result.name,
                synopsis: result.overview || 'Sinopse não disponível.',
                posterUrl: posterUrl,
                year: year,
                rating: rating
            };

            await db.metadataCache.put(metadata);
            this.renderSynopsisContent(detailsContainer, metadata, item, onContinueCallback, false, onRatingChangeCallback);
            posterImg.src = metadata.posterUrl;

        } catch (error) {
            detailsContainer.innerHTML = `
                <div class="synopsis-error">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p><strong>Erro!</strong></p>
                    <p>${error.message}</p>
                    <div class="synopsis-actions"></div>
                </div>`;
            this.renderSynopsisContent(detailsContainer, null, item, onContinueCallback, true, onRatingChangeCallback);
        }
    },

    renderSynopsisContent(container, data, originalItem, onContinueCallback, isError = false, onRatingChangeCallback) {
        let actionButtonHTML = '';

        if (originalItem.seasons && typeof onContinueCallback === 'function') {
            actionButtonHTML = `<button id="synopsis-action-btn" class="modal-action-button play"><i class="fas fa-list-ul"></i><span>Ver Episódios</span></button>`;
        } else if (originalItem.url) {
            actionButtonHTML = `<button id="synopsis-action-btn" class="modal-action-button play"><i class="fas fa-play"></i><span>Assistir</span></button>`;
        }

        const favButtonHTML = `<button id="synopsis-fav-btn" class="modal-action-button favorite"><i class="far fa-heart"></i><span>Salvar</span></button>`;

        const ratingSectionHTML = `
            <div class="synopsis-rating-container">
                <div class="rating-display-slider">
                    <span>Sua Nota:</span>
                    <span id="user-rating-value">Nenhuma</span>
                </div>
                <div class="rating-slider-wrapper">
                    <input type="range" id="rating-slider" min="0" max="10" step="0.5" value="0">
                </div>
                <div class="rating-labels">
                    <span class="label-item"><i class="tick">|</i>1</span>
                    <span class="label-item"><i class="tick">|</i>2</span>
                    <span class="label-item"><i class="tick">|</i>3</span>
                    <span class="label-item"><i class="tick">|</i>4</span>
                    <span class="label-item"><i class="tick">|</i>5</span>
                    <span class="label-item"><i class="tick">|</i>6</span>
                    <span class="label-item"><i class="tick">|</i>7</span>
                    <span class="label-item"><i class="tick">|</i>8</span>
                    <span class="label-item"><i class="tick">|</i>9</span>
                    <span class="label-item"><i class="tick">|</i>10</span>
                </div>
            </div>`;

        if (isError) {
            container.innerHTML = `
                <div class="synopsis-actions">${actionButtonHTML}${favButtonHTML}</div>
                ${ratingSectionHTML}`;
        } else {
            container.innerHTML = `
                <h2 class="synopsis-title">${data.title}</h2>
                <div class="synopsis-meta">
                    <span>${data.year}</span> &bull; 
                    <span><i class="fas fa-star"></i> <span class="rating">${data.rating}</span>/10</span>
                </div>
                <h3 class="synopsis-overview-title">Sinopse</h3>
                <p class="synopsis-overview">${data.synopsis || 'Sinopse não disponível.'}</p>
                <div class="synopsis-actions">
                    ${actionButtonHTML}
                    ${favButtonHTML}
                </div>
                ${ratingSectionHTML}`;
        }
        
        const actionBtn = container.querySelector('#synopsis-action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                this.closeSynopsisModal();
                if (originalItem.seasons && typeof onContinueCallback === 'function') { onContinueCallback(); } 
                else if (originalItem.url) { this.playContent(originalItem); }
            });
        }

        const favBtn = container.querySelector('#synopsis-fav-btn');
        if (favBtn) {
            const favIcon = favBtn.querySelector('i');
            const favText = favBtn.querySelector('span');
            const updateFavButtonState = (isFavorited) => {
                favIcon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
                favText.textContent = isFavorited ? 'Salvo' : 'Salvar';
                favBtn.classList.toggle('active', isFavorited);
            };
            db.favorites.get(originalItem.name).then(fav => updateFavButtonState(!!fav));
            favBtn.addEventListener('click', async () => {
                const isFavorited = isFavorited;
                const itemType = originalItem.seasons ? 'series' : (originalItem.type || 'movie');
                try {
                    if (isFavorited) { await db.favorites.delete(originalItem.name); } 
                    else { await db.favorites.put({ name: originalItem.name, type: itemType, data: originalItem }); }
                    updateFavButtonState(!isFavorited);
                } catch (error) { this.showToast('Erro ao atualizar itens salvos.', 'error'); }
            });
        }

        const ratingSlider = container.querySelector('#rating-slider');
        const ratingValueDisplay = container.querySelector('#user-rating-value');
        
        // Botão de limpar foi removido do HTML, então não precisamos mais dele no JS.
        // const clearRatingBtn = container.querySelector('#clear-rating-btn'); 
        
        const updateSliderVisuals = (value) => {
            const numValue = Number(value);
            if (numValue === 0) {
                ratingValueDisplay.textContent = 'Nenhuma';
            } else {
                ratingValueDisplay.innerHTML = `${numValue.toLocaleString('pt-BR')} <i class="fa-solid fa-star"></i>`;
            }
            ratingSlider.value = numValue;
            ratingSlider.style.setProperty('--slider-progress', `${(numValue / 10) * 100}%`);
        };

        db.movieRatings.get(originalItem.name).then(rating => {
            updateSliderVisuals(rating ? rating.rating : 0);
        });

        ratingSlider.addEventListener('input', () => {
            updateSliderVisuals(ratingSlider.value);
        });

        ratingSlider.addEventListener('change', async () => {
            const ratingValue = Number(ratingSlider.value);
            try {
                // Se o usuário deslizar para 0, tratamos como "limpar"
                if (ratingValue === 0) {
                    await db.movieRatings.delete(originalItem.name);
                    Yashi.showToast('Avaliação removida.', 'success');
                } else {
                    await db.movieRatings.put({ itemId: originalItem.name, rating: ratingValue, timestamp: Date.now() });
                    Yashi.showToast(`Item avaliado com nota ${ratingValue}!`, 'success');
                }
                if (typeof onRatingChangeCallback === 'function') {
                    onRatingChangeCallback(ratingValue);
                }
            } catch (error) {
                Yashi.showToast('Erro ao salvar sua avaliação.', 'error');
            }
        });
    }
};

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && window.Yashi) {
        Yashi.savePlaybackProgress();
    }
});

=======
    showConfirmationModal(message, onConfirm) { /* Lógica existente */ }
};

>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
window.Yashi = Yashi;