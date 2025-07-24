// js/common.js

const Yashi = {
    // --- ELEMENTOS E ESTADO ---
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
    },
    player: null,
    hls: null,
    navigationStack: [],
    currentViewMode: localStorage.getItem('yashi_view_mode') || 'view-medium',
    currentPlaylist: [],
    currentPlaylistIndex: -1,

    // --- INICIALIZAÇÃO ---
    initCommon(pageType) {
        this.elements.mainContent = document.getElementById('main-content');
        this.elements.playerView = document.getElementById('player-view');
        this.elements.playerElement = document.getElementById('player');
        this.elements.playerBackButton = document.querySelector('.back-from-player');
        this.elements.playerPrevButton = document.getElementById('player-prev-button');
        this.elements.playerNextButton = document.getElementById('player-next-button');

        this.player = new Plyr(this.elements.playerElement, {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen']
        });
        this.hls = new Hls();

        // A injeção da top bar só ocorre se não for a página de pesquisa
        if (pageType !== 'search') {
            this.injectTopBar(pageType);
        }
        
        // Listeners dos botões do player
        if(this.elements.playerBackButton) this.elements.playerBackButton.addEventListener('click', () => this.stopPlayer());
        if (this.elements.playerPrevButton) this.elements.playerPrevButton.addEventListener('click', () => this.playFromPlaylist('prev'));
        if (this.elements.playerNextButton) this.elements.playerNextButton.addEventListener('click', () => this.playFromPlaylist('next'));

        // Configuração dos elementos da UI (só se não for a página de pesquisa)
        if (pageType !== 'search') {
            this.elements.viewButtons = document.querySelectorAll('.view-button');
            this.elements.gridContainer = document.getElementById('grid-container');
            this.elements.searchInput = document.getElementById('search-input');
            this.elements.searchButton = document.getElementById('search-button');
            this.elements.clearSearchButton = document.getElementById('clear-search-button');
            this.elements.topBarBackButton = document.getElementById('top-bar-back-button');

            this.elements.viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.currentViewMode = button.dataset.viewMode;
                    localStorage.setItem('yashi_view_mode', this.currentViewMode);
                    this.applyViewMode();
                    this.reRenderCurrentContent();
                });
            });
            this.applyViewMode();
        }
    },

    injectTopBar(pageType) {
        const topBarHTML = `
            <div class="top-bar">
                <div class="top-bar-left">
                    <img src="logo.png" alt="Logo" class="top-bar-logo" onclick="window.location.href='home.html'">
                    <button class="home-button" onclick="window.location.href='home.html'" title="Voltar para Home">
                        <i class="fas fa-home"></i>
                    </button>
                    <button id="top-bar-back-button" class="home-button" title="Voltar">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="view-buttons">
                        <button class="view-button" data-view-mode="view-small" title="Visualização Pequena"><i class="fas fa-th-list"></i></button>
                        <button class="view-button" data-view-mode="view-medium" title="Visualização Média"><i class="fas fa-th-large"></i></button>
                        <button class="view-button" data-view-mode="view-details" title="Visualização Detalhada"><i class="fas fa-bars"></i></button>
                        <button class="view-button" data-view-mode="view-list" title="Visualização em Lista"><i class="fas fa-list"></i></button>
                    </div>
                    <div class="search-container">
                        <input type="text" id="search-input" placeholder="Pesquisar..." class="search-input">
                        <button id="search-button" class="search-button" title="Pesquisar"><i class="fas fa-search"></i></button>
                        <button id="clear-search-button" class="clear-search-button hidden" title="Limpar"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            </div>
            <div id="grid-container" class="grid-container">
                 <div class="content-loader">
                    <div class="loading-yashi" style="font-size: 40px;">
                        <span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span>
                    </div>
                 </div>
            </div>`;
        this.elements.mainContent.innerHTML = topBarHTML;
    },

    applyViewMode() {
        const grid = this.elements.gridContainer || document.getElementById('results-container');
        if (grid) {
            grid.className = `grid-container ${this.currentViewMode}`;
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
        if (currentState.type === 'seriesList' || currentState.type === 'seasonList' || currentState.type === 'episodeList' || currentState.type === 'subCategory') {
            this.renderGrid(currentState.data, this.elements.gridContainer);
        }
    },

    renderGrid(items, gridContainer, isSearch = false) {
        gridContainer.innerHTML = '';
        if (!items || items.length === 0) {
            gridContainer.innerHTML = `<p id="no-results">${isSearch ? 'Nenhum resultado encontrado.' : 'Nenhum item disponível nesta categoria.'}</p>`;
            return;
        }
        items.forEach(item => {
            const card = this.createCard(item);
            gridContainer.appendChild(card);
        });
        this.applyViewMode();
    },

    createCard(item) {
        const card = document.createElement('div');
        card.className = 'card';
        const defaultImg = 'https://placehold.co/180x270/0D1117/8B949E?text=Sem+Capa';
        
        card.itemData = item;

        let title = item.name;
        let image = item.logo || defaultImg;
        let description = '';

        if (item.type === 'channel') description = `Categoria: ${item.groupTitle}`;
        else if (item.type === 'movie') description = `Categoria: ${item.groupTitle}`;
        else if (item.seasons) description = `Temporadas: ${Object.keys(item.seasons).length}`;
        else if (item.episodes) {
            title = `Temporada ${item.number}`;
            image = item.logo || defaultImg;
            description = `Episódios: ${item.episodes.length}`;
        } else if (item.url && item.groupTitle && item.number) {
            description = `Temporada: ${item.groupTitle} | Episódio: ${item.number}`;
        }

        if (this.currentViewMode === 'view-list' || this.currentViewMode === 'view-details') {
            card.innerHTML = `
                <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
                <div class="card-content">
                    <div class="card-title">${title}</div>
                    <div class="card-description">${description}</div>
                </div>`;
        } else {
             card.innerHTML = `
                <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
                <div class="card-title">${title}</div>`;
        }

        if (item.url) {
            card.addEventListener('click', () => this.playContent(item));
        } else if (item.seasons) {
            card.addEventListener('click', () => {
                const seasons = Object.values(item.seasons).sort((a, b) => a.number - b.number);
                seasons.forEach(season => {
                    if (season.episodes && season.episodes.length > 0) {
                        season.episodes.sort((a, b) => a.number - b.number);
                        season.logo = season.episodes[0].logo || item.logo;
                    } else {
                        season.logo = item.logo;
                    }
                });
                this.navigationStack.push({ type: 'seasonList', data: seasons, title: item.name, parentSeries: item });
                this.reRenderCurrentContent();
            });
        } else if (item.episodes) {
            card.addEventListener('click', () => {
                const episodes = item.episodes.sort((a, b) => a.number - b.number);
                const parentSeries = this.navigationStack[this.navigationStack.length - 1].parentSeries;
                this.navigationStack.push({ type: 'episodeList', data: episodes, title: `Temporada ${item.number}`, parentSeason: item, parentSeries: parentSeries });
                this.reRenderCurrentContent();
            });
        }
        
        return card;
    },
    
    updatePlayerNavButtons() {
        if (!this.elements.playerPrevButton || !this.elements.playerNextButton) {
            return;
        }

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

    playContent(item) {
        const lastNav = this.navigationStack[this.navigationStack.length - 1];
        if (lastNav && lastNav.type === 'episodeList') {
            this.currentPlaylist = lastNav.data;
            this.currentPlaylistIndex = this.currentPlaylist.findIndex(ep => ep.url === item.url && ep.name === item.name);
        } else {
            this.currentPlaylist = [];
            this.currentPlaylistIndex = -1;
        }

        const playerTitleEl = document.getElementById('player-title');
        if (playerTitleEl) {
            playerTitleEl.textContent = item.name;
        }

        this.elements.playerView.style.display = 'flex';
        this.updatePlayerNavButtons();

        try {
            if (Hls.isSupported() && item.url.includes('.m3u8')) {
                this.hls.destroy(); this.hls = new Hls();
                this.hls.loadSource(item.url);
                this.hls.attachMedia(this.elements.playerElement);
            } else {
                this.hls.destroy();
                this.elements.playerElement.src = item.url;
            }
            this.player.play();
        } catch (error) { console.error("Erro ao carregar vídeo:", error); }
    },
    
    stopPlayer() {
        this.player.stop();
        this.hls.destroy();
        this.elements.playerView.style.display = 'none';
        
        this.currentPlaylist = [];
        this.currentPlaylistIndex = -1;
        this.updatePlayerNavButtons();

        const playerTitleEl = document.getElementById('player-title');
        if (playerTitleEl) {
            playerTitleEl.textContent = '';
        }
    }
};
