// js/common.js (v7.51.5 - Estável com título de temporada normalizado)

const Yashi = {
    elements: {
        mainContent: null,
        playerView: null,
        playerElement: null,
        playerBackButton: null,
        playerPrevButton: null,
        playerNextButton: null,
        viewButtons: null,
        gridContainer: null,
        searchInput: null,
        searchButton: null,
        clearSearchButton: null,
        topBarBackButton: null,
        categoryMenuButton: null,
        categorySidebar: null,
        sidebarOverlay: null,
        closeSidebarButton: null,
        categoryListContainer: null,
    },
    player: null,
    hls: null,
    navigationStack: [],
    currentViewMode: localStorage.getItem('yashi_view_mode') || 'view-medium',
    currentPlaylist: [],
    currentPlaylistIndex: -1,
    currentPlayingItem: null,

    // --- INICIALIZAÇÃO ---
    initCommon(pageType) {
        this.elements.mainContent = document.getElementById('main-content');
        this.elements.playerView = document.getElementById('player-view');
        this.elements.playerElement = document.getElementById('player');
        this.elements.playerBackButton = document.querySelector('.back-from-player');
        this.elements.playerPrevButton = document.getElementById('player-prev-button');
        this.elements.playerNextButton = document.getElementById('player-next-button');

        if (!this.player) {
            this.player = new Plyr(this.elements.playerElement, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen']
            });
            this.hls = new Hls();

            this.player.on('timeupdate', this.savePlaybackProgress.bind(this));
            this.player.on('ended', this.clearPlaybackProgress.bind(this));
            this.player.on('pause', this.savePlaybackProgress.bind(this));
            this.player.on('seeking', this.savePlaybackProgress.bind(this));
        }

        if (pageType !== 'search') {
            this.injectTopBarAndSidebar(pageType);
        }
        
        if(this.elements.playerBackButton) this.elements.playerBackButton.addEventListener('click', () => this.stopPlayer());
        if (this.elements.playerPrevButton) this.elements.playerPrevButton.addEventListener('click', () => this.playFromPlaylist('prev'));
        if (this.elements.playerNextButton) this.elements.playerNextButton.addEventListener('click', () => this.playFromPlaylist('next'));

        if (pageType !== 'search') {
            this.elements.viewButtons = document.querySelectorAll('.view-button');
            this.elements.gridContainer = document.getElementById('grid-container');
            this.elements.searchInput = document.getElementById('search-input');
            this.elements.searchButton = document.getElementById('search-button');
            this.elements.clearSearchButton = document.getElementById('clear-search-button');
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
                    
                    if (typeof this.reRenderCurrentContent === 'function') {
                        this.reRenderCurrentContent();
                    } else {
                        const currentState = this.navigationStack[this.navigationStack.length - 1];
                        if (currentState && currentState.data) {
                           this.renderGrid(currentState.data, this.elements.gridContainer);
                        }
                    }
                });
            });
            this.applyViewMode();
        }
    },

    injectTopBarAndSidebar(pageType) {
        const topBarAndSidebarHTML = `
            <div class="top-bar">
                <div class="top-bar-left">
                    <img src="logo.png" alt="Logo" class="top-bar-logo" onclick="window.location.href='home.html'">
                    <button class="home-button" onclick="window.location.href='home.html'" title="Voltar para Home">
                        <i class="fas fa-home"></i>
                    </button>
                    <button id="top-bar-back-button" class="home-button" title="Voltar">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button id="category-menu-button" class="home-button with-text" title="Categorias">
                        <i class="fas fa-bars"></i>
                        <span>Categorias</span>
                    </button>
                    <div class="view-buttons">
                        <button class="view-button" data-view-mode="view-list" title="Lista"><i class="fas fa-list"></i></button>
                        <button class="view-button" data-view-mode="view-details" title="Detalhes"><i class="fas fa-bars"></i></button>
                        <button class="view-button" data-view-mode="view-small" title="Grade Pequena"><i class="fas fa-grip"></i></button>
                        <button class="view-button" data-view-mode="view-medium" title="Grade Média"><i class="fas fa-table-cells"></i></button>
                        <button class="view-button" data-view-mode="view-large" title="Grade Grande"><i class="fas fa-table-cells-large"></i></button>
                    </div>
                </div>
                <div class="top-bar-right">
                    <div class="search-container">
                        <input type="text" id="search-input" placeholder="Pesquisar..." class="search-input">
                        <button id="search-button" class="search-button" title="Pesquisar"><i class="fas fa-search"></i></button>
                        <button id="clear-search-button" class="clear-search-button hidden" title="Limpar"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            </div>
            <div id="sidebar-overlay"></div>
            <nav id="category-sidebar">
                <div class="sidebar-header">
                    <h3>Categorias</h3>
                    <button id="close-sidebar-button" title="Fechar"><i class="fas fa-times"></i></button>
                </div>
                <div id="category-list-container"></div>
            </nav>
            <div id="grid-container" class="grid-container">
                 <div class="content-loader">
                    <div class="loading-yashi" style="font-size: 40px;">
                        <span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span>
                    </div>
                 </div>
            </div>`;
        this.elements.mainContent.innerHTML = topBarAndSidebarHTML;
    },

    applyViewMode() {
        const grid = this.elements.gridContainer || document.getElementById('results-container');
        if (grid) {
            grid.classList.remove('view-small', 'view-medium', 'view-large', 'view-details', 'view-list', 'shelf-container'); 
            grid.classList.add('grid-container'); 
            grid.classList.add(this.currentViewMode);
        }
        const viewButtons = document.querySelectorAll('.view-button');
        if (viewButtons) {
            viewButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.viewMode === this.currentViewMode);
            });
        }
    },

    reRenderCurrentContent() {
        const currentState = this.navigationStack[this.navigationStack.length - 1];
        if (!currentState) return;
        
        const viewButtonsContainer = this.elements.viewButtons && this.elements.viewButtons.length > 0 ? this.elements.viewButtons[0].parentElement : null;

        if (viewButtonsContainer) {
            if (currentState.type === 'shelfList') {
                viewButtonsContainer.classList.add('disabled');
            } else {
                viewButtonsContainer.classList.remove('disabled');
                this.applyViewMode(); 
            }
        }

        if (currentState.renderFunc) {
            currentState.renderFunc();
        } else if (currentState.data) {
            this.renderGrid(currentState.data, this.elements.gridContainer);
        }
    },

    renderGrid(items, gridContainer, context = {}) {
        gridContainer.innerHTML = '';
        gridContainer.classList.remove('shelf-container');
        gridContainer.classList.add('grid-container'); 
        this.applyViewMode();

        if (!items || items.length === 0) {
            gridContainer.innerHTML = `<p id="no-results">${context.isSearch ? 'Nenhum resultado encontrado.' : 'Nenhum item disponível nesta categoria.'}</p>`;
            return;
        }
        items.forEach(item => {
            const card = this.createCard(item, context);
            gridContainer.appendChild(card);
        });
    },

    createCard(item, context = {}) {
        const card = document.createElement('div');
        card.className = 'card';
        const defaultImg = 'logo.png';
        
        let itemType;
        if (item.type) {
            itemType = item.type;
        } else if (item.seasons) {
            itemType = 'series';
        } else if (item.episodes) {
            itemType = 'season';
        } else if (item.playbackData) {
            itemType = item.playbackData.type;
        } else {
            itemType = 'unknown';
        }

        const favoriteName = item.playbackData ? item.playbackData.name : item.name;
        const favoriteType = item.playbackData ? item.playbackData.type : itemType;
        if (favoriteType === 'movie' || favoriteType === 'channel' || favoriteType === 'series') {
            const favButton = document.createElement('button');
            favButton.className = 'favorite-button';
            favButton.innerHTML = '<i class="fa-regular fa-star"></i>';
            favButton.title = 'Adicionar aos Favoritos';
            db.favorites.get(favoriteName).then(fav => {
                if (fav) {
                    favButton.classList.add('active');
                    favButton.innerHTML = '<i class="fa-solid fa-star"></i>';
                    favButton.title = 'Remover dos Favoritos';
                }
            });
            favButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                const isFavorited = favButton.classList.contains('active');
                if (isFavorited) {
                    await db.favorites.delete(favoriteName);
                    favButton.classList.remove('active');
                    favButton.innerHTML = '<i class="fa-regular fa-star"></i>';
                    favButton.title = 'Adicionar aos Favoritos';
                } else {
                    await db.favorites.put({ name: favoriteName, type: favoriteType, data: item.playbackData || item });
                    favButton.classList.add('active');
                    favButton.innerHTML = '<i class="fa-solid fa-star"></i>';
                    favButton.title = 'Remover dos Favoritos';
                }
                if (window.location.pathname.includes('favoritos.html') && typeof window.renderFavorites === 'function') {
                    window.renderFavorites();
                }
            });
            card.appendChild(favButton);
        }
        
        if (context.page === 'history') {
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-history-button';
            removeButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            removeButton.title = 'Remover do Histórico';
            
            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemToRemove = item.playbackData || item;
                const message = `<p>Tem certeza que deseja remover o item<br><strong>${itemToRemove.name}</strong><br>do seu histórico?</p>`;
                
                this.showConfirmationModal(message, async () => {
                    await db.playbackHistory.delete(itemToRemove.name);
                    this.showToast('Item removido do histórico.', 'success');
                    if (typeof window.renderPlaybackHistory === 'function') {
                        window.renderPlaybackHistory();
                    }
                });
            });
            card.appendChild(removeButton);
        }

        let title = item.name;
        let image = item.logo || defaultImg;
        let description = '';
        let progressOverlay = '';

        const displayItem = item.playbackData || item;

        if (displayItem.type === 'channel') {
            description = `Categoria: ${displayItem.groupTitle || 'N/A'}`;
            title = displayItem.name;
            image = displayItem.logo || defaultImg;
        } else if (displayItem.type === 'movie') {
            description = `Categoria: ${displayItem.groupTitle || 'N/A'}`;
            title = displayItem.name;
            image = displayItem.logo || defaultImg;
        } else if (displayItem.type === 'series') {
            description = `Temporadas: ${Object.keys(displayItem.seasons || {}).length}`; 
            title = displayItem.name;
            image = displayItem.logo || defaultImg;
        } else if (displayItem.type === 'season') {
            image = displayItem.logo || defaultImg; 
            card.classList.add('season-card');
            title = `Temporada ${displayItem.number || 'N/A'}`;
            description = `Episódios: ${(displayItem.episodes || []).length}`;
        } else if (displayItem.type === 'episode') {
            const parentSeriesLogo = displayItem.seriesName && Yashi.allSeriesData && Yashi.allSeriesData[displayItem.seriesName] ? 
                                     Yashi.allSeriesData[displayItem.seriesName].logo : 
                                     defaultImg;
            image = displayItem.logo || parentSeriesLogo; 
            description = `Temp: ${displayItem.groupTitle || 'N/A'} | Ep: ${displayItem.number || 'N/A'}`; 
            title = displayItem.name;
        }

        if (item.playbackProgress && item.duration) {
            const percentage = (item.playbackProgress / item.duration) * 100;
            if (percentage > 2 && percentage < 98) {
                 progressOverlay = `
                    <div class="progress-overlay">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                `;
            }
        }

        const cardContentDiv = document.createElement('div');
        cardContentDiv.className = 'card-clickable-area';
        const altTitle = item.name;

        if (this.currentViewMode === 'view-list' || this.currentViewMode === 'view-details' || card.classList.contains('season-card')) {
            cardContentDiv.innerHTML = `
                <img loading="lazy" src="${image}" class="card-img" alt="${altTitle}" onerror="this.onerror=null;this.src='${defaultImg}';">
                <div class="card-content">
                    <div class="card-title">${title}</div>
                    <div class="card-description">${description}</div>
                </div>
                ${progressOverlay}
            `;
        } else {
             cardContentDiv.innerHTML = `
                <img loading="lazy" src="${image}" class="card-img" alt="${altTitle}" onerror="this.onerror=null;this.src='${defaultImg}';">
                <div class="card-title">${title}</div>
                ${progressOverlay}
            `;
        }
        
        cardContentDiv.addEventListener('click', () => {
            const itemToProcess = item.playbackData || item; 

            if (itemToProcess.url) {
                this.playContent(itemToProcess, item.playbackProgress);
            } else if (itemToProcess.type === 'series') {
                localStorage.setItem('yashi_deep_link_series_name', itemToProcess.name);
                window.location.href = 'series.html';
            } else if (itemToProcess.seasons) {
                const seasons = Object.values(itemToProcess.seasons).sort((a, b) => (a.number || 0) - (b.number || 0));
                seasons.forEach(season => {
                    if (season.episodes && season.episodes.length > 0) {
                        season.episodes.sort((a, b) => (a.number || 0) - (b.number || 0));
                        season.logo = season.episodes[0].logo || itemToProcess.logo;
                    } else {
                        season.logo = itemToProcess.logo;
                    }
                });
                this.navigationStack.push({ type: 'seasonList', data: seasons, title: itemToProcess.name, parentSeries: itemToProcess, renderFunc: () => this.renderGrid(seasons, this.elements.gridContainer) });
                this.reRenderCurrentContent();
            } else if (itemToProcess.episodes) {
                const episodes = Object.values(itemToProcess.episodes).sort((a, b) => (a.number || 0) - (b.number || 0));
                const parentSeries = this.navigationStack.find(nav => nav.type === 'seasonList' || nav.parentSeries)?.parentSeries || null;
                this.navigationStack.push({ type: 'episodeList', data: episodes, title: `Temporada ${itemToProcess.number}`, parentSeason: itemToProcess, parentSeries: parentSeries, renderFunc: () => this.renderGrid(episodes, this.elements.gridContainer) });
                this.reRenderCurrentContent();
            }
        });
        
        card.appendChild(cardContentDiv);
        return card;
    },
    
    updatePlayerNavButtons() {
        if (!this.elements.playerPrevButton || !this.elements.playerNextButton) return;

        if (this.currentPlaylist.length > 1 && this.currentPlaylistIndex !== -1) {
            this.elements.playerPrevButton.classList.add('visible');
            this.elements.playerNextButton.classList.add('visible');
            this.elements.playerPrevButton.disabled = this.currentPlaylistIndex === 0;
            this.elements.playerNextButton.disabled = this.currentPlaylistIndex === this.currentPlaylist.length - 1;
        } else {
            this.elements.playerPrevButton.classList.remove('visible');
            this.elements.playerNextButton.classList.remove('visible');
        }
    },

    playFromPlaylist(direction) {
        let newIndex = this.currentPlaylistIndex;
        if (direction === 'next') newIndex++;
        else if (direction === 'prev') newIndex--;
        
        if (newIndex >= 0 && newIndex < this.currentPlaylist.length) {
            this.playContent(this.currentPlaylist[newIndex]);
        }
    },

    playContent(item, startTime = 0) {
        const lastNav = this.navigationStack[this.navigationStack.length - 1];
        if (lastNav && lastNav.type === 'episodeList') {
            this.currentPlaylist = lastNav.data; 
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
            if (this.hls) {
                this.hls.destroy();
            }

            const videoElement = this.elements.playerElement;
            const sourceUrl = item.url;
            const isHls = sourceUrl.includes('.m3u8');

            if (Hls.isSupported() && isHls) {
                this.hls = new Hls();
                this.hls.loadSource(sourceUrl);
                this.hls.attachMedia(videoElement);
            } else {
                this.player.source = {
                    type: 'video',
                    sources: [{
                        src: sourceUrl,
                        type: `video/${sourceUrl.split('.').pop() === 'mkv' ? 'webm' : 'mp4'}`,
                    }],
                };
            }
            
            this.player.once('ready', () => {
                if (this.currentPlayingItem && this.currentPlayingItem.initialPlaybackTime > 0) {
                    this.player.currentTime = this.currentPlayingItem.initialPlaybackTime;
                    this.currentPlayingItem.initialPlaybackTime = 0;
                }
                
                this.player.muted = true;
                this.player.play().catch(error => {
                    console.warn("Autoplay foi prevenido pelo navegador:", error);
                });
            });

            this.player.elements.container.addEventListener('click', () => {
                if(this.player.muted) this.player.muted = false;
            }, { once: true });


        } catch (error) { 
            console.error("Erro ao configurar a fonte do vídeo:", error);
            this.showToast(`Erro ao carregar mídia: ${error.message}`, 'error');
        }
    },
    
    stopPlayer() {
        this.savePlaybackProgress();

        this.player.stop();
        if (this.hls) {
            this.hls.destroy();
            this.hls = null; 
        }
        this.elements.playerView.style.display = 'none';
        
        this.currentPlaylist = [];
        this.currentPlaylistIndex = -1;
        this.currentPlayingItem = null; 
        this.updatePlayerNavButtons(); 

        const playerTitleEl = document.getElementById('player-title');
        if (playerTitleEl) playerTitleEl.textContent = '';
    },

    savePlaybackProgress: async function() {
        if (!this.currentPlayingItem || !this.player || !this.elements.playerElement) return;

        const currentTime = this.player.currentTime;
        const duration = this.player.duration;

        if (isNaN(duration) || duration === 0 || currentTime < 5) return; 

        const playbackThreshold = 0.98; 
        const isCompleted = currentTime / duration >= playbackThreshold;

        const item = this.currentPlayingItem;
        const itemId = item.name; 
        let itemType = item.type;
        let seriesName = null;

        let dataToSave = {
            name: item.name,
            logo: item.logo,
            url: item.url,
            groupTitle: item.groupTitle,
            type: item.type,
            seriesName: item.seriesName
        };

        if (item.type === 'episode') {
            itemType = 'series_episode';
            seriesName = item.seriesName || item.groupTitle; 
            
            if (seriesName && Yashi.allSeriesData[seriesName]) {
                dataToSave.logo = Yashi.allSeriesData[seriesName].logo || item.logo; 
                dataToSave.seriesName = seriesName; 
                dataToSave.parentSeriesName = seriesName; 
            }

        } else if (item.type === 'movie' || item.type === 'channel' || item.type === 'series') { 
            seriesName = item.name; 
            if (item.type === 'series') {
                dataToSave = item; 
            }
        }

        try {
            if (isCompleted) {
                await db.playbackHistory.delete(itemId);
            } else {
                await db.playbackHistory.put({
                    itemId: itemId,
                    type: itemType,
                    seriesName: seriesName, 
                    timestamp: Date.now(),
                    progress: currentTime,
                    duration: duration,
                    playbackData: dataToSave 
                });
            }
        } catch (error) {
            console.error('Erro ao salvar progresso de reprodução:', error);
        }
    },

    clearPlaybackProgress: async function() {
        if (!this.currentPlayingItem) return;

        const item = this.currentPlayingItem;
        const itemId = item.name;
        
        try {
            await db.playbackHistory.delete(itemId);
        } catch (error) {
            console.error('Erro ao limpar progresso de reprodução:', error);
        }
    },

    getRecentPlaybackHistory: async function(limit = 5) {
        try {
            const allHistory = await db.playbackHistory.orderBy('timestamp').reverse().toArray();
            const uniqueHistoryItems = [];
            const processedSeries = new Set();
            const processedItems = new Set();
    
            for (const entry of allHistory) {
                let uniqueId;
                let isSeries = entry.type === 'series_episode';
    
                if (isSeries) {
                    uniqueId = entry.seriesName;
                    if (processedSeries.has(uniqueId)) continue;
                    processedSeries.add(uniqueId);
                } else {
                    uniqueId = entry.itemId;
                    if (processedItems.has(uniqueId)) continue;
                    processedItems.add(uniqueId);
                }
    
                const playbackItem = {
                    ...entry.playbackData,
                    playbackProgress: entry.progress,
                    duration: entry.duration
                };
    
                uniqueHistoryItems.push(playbackItem);
    
                if (uniqueHistoryItems.length >= limit) break;
            }
            return uniqueHistoryItems;
        } catch (error) {
            console.error('Erro ao buscar histórico de reprodução:', error);
            return [];
        }
    },    
    
    allSeriesData: {},

    showToast: function(message, type = 'success', duration = 4000) {
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

    showConfirmationModal: function(message, onConfirm) {
        let modalOverlay = document.getElementById('confirmation-modal-overlay');
        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'confirmation-modal-overlay';
            modalOverlay.innerHTML = `
                <div class="confirmation-modal">
                    <div class="confirmation-modal-content"></div>
                    <div class="confirmation-modal-buttons">
                        <button class="modal-button cancel-button">Cancelar</button>
                        <button class="modal-button confirm-button">Remover</button>
                    </div>
                </div>`;
            document.body.appendChild(modalOverlay);
        }

        const content = modalOverlay.querySelector('.confirmation-modal-content');
        const confirmBtn = modalOverlay.querySelector('.confirm-button');
        const cancelBtn = modalOverlay.querySelector('.cancel-button');

        content.innerHTML = message;

        const close = () => modalOverlay.classList.remove('active');

        const confirmAction = () => {
            onConfirm();
            close();
        };

        confirmBtn.onclick = confirmAction;
        cancelBtn.onclick = close;
        modalOverlay.onclick = (e) => {
            if (e.target.id === 'confirmation-modal-overlay') {
                close();
            }
        };

        modalOverlay.classList.add('active');
    }
};

window.Yashi = Yashi;

// Adiciona um "quebra-molas" contra a cópia casual
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (window.db) {
            const allSeries = await db.series.toArray();
            allSeries.forEach(s => {
                Yashi.allSeriesData[s.name] = s;
            });
        }
    } catch (error) {
        console.error("Erro ao pré-carregar dados de séries:", error);
    }
});