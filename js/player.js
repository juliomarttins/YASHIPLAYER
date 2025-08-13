document.addEventListener('DOMContentLoaded', () => {
    // 1. SETUP INICIAL
    if (!localStorage.getItem('m3uSourceType')) {
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const dom = {
        sidebar: document.getElementById('sidebar-content'),
        syncButton: document.getElementById('syncButton'),
        mainGrid: document.querySelector('#grid-view'),
        playerView: document.querySelector('#player-view'),
        playerElement: document.getElementById('player'),
        playerLoader: document.querySelector('.player-loader'),
        playerBackButton: document.querySelector('.back-from-player-top-bar'),
        audioTrackSelector: document.getElementById('audio-track-selector'),
        audioTracksSelect: document.getElementById('audioTracks'),
        playerErrorMessage: document.getElementById('player-error-message'),
        playerErrorText: document.querySelector('#player-error-message span'),
        playerErrorCloseButton: document.querySelector('#player-error-message .close-button'),
        viewButtons: document.querySelectorAll('.view-button'),
        // Search Elements
        searchInput: document.getElementById('search-input'),
        searchButton: document.getElementById('search-button'),
        clearSearchButton: document.getElementById('clear-search-button'),
        searchResultsView: document.getElementById('search-results-view'),
        searchResultsContent: document.getElementById('search-results-content'),
        searchQueryDisplay: document.getElementById('search-query-display'),
        noSearchResults: document.getElementById('no-search-results'),
    };

    // State Variables
    let allItems = [];
    let seriesData = {};
    let parsedCategories = {};
    let navigationStack = [];
    let currentViewMode = localStorage.getItem('viewMode') || 'view-large';
    const player = new Plyr(dom.playerElement);
    let hls = new Hls();

    // --- CORE FUNCTIONS ---

    function parseM3U(m3uText) {
        allItems = [];
        parsedCategories = {};
        seriesData = {};

        const lines = m3uText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].startsWith('#EXTINF:')) continue;

            const info = lines[i];
            const url = lines[++i] ? lines[i].trim() : null;
            if (!url) continue;

            const name = info.split(',').pop().trim();
            const logo = info.match(/tvg-logo="([^"]*)"/)?.[1] || '';
            const groupTitle = info.match(/group-title="([^"]*)"/)?.[1] || 'OUTROS';

            let mainCategory, itemType;

            if (groupTitle.toUpperCase().includes('FILME')) {
                mainCategory = 'FILMES (VOD)';
                itemType = 'movie';
            } else if (name.match(/[Ss]\d{1,2}[Ee]\d{1,3}/) || groupTitle.toUpperCase().includes('SERIE') || groupTitle.toUpperCase().includes('SÉRIE')) {
                mainCategory = 'SÉRIES (VOD)';
                itemType = 'series';
            } else {
                mainCategory = 'CANAIS AO VIVO';
                itemType = 'channel';
            }

            if (!parsedCategories[mainCategory]) {
                parsedCategories[mainCategory] = {};
            }

            const subCategory = groupTitle.replace(/^(FILMES|SÉRIES|CANAIS)[\s-:]*/i, '').trim();

            if (itemType === 'series') {
                const seriesMatch = name.match(/(.*?)[Ss](\d+)[Ee](\d+)/i);
                if (seriesMatch) {
                    const seriesName = seriesMatch[1].replace(/[-_\.]*$/, '').trim();
                    const seasonNumber = `S${String(parseInt(seriesMatch[2])).padStart(2, '0')}`;
                    const episodeNumber = `E${String(parseInt(seriesMatch[3])).padStart(2, '0')}`;
                    
                    if (!seriesData[mainCategory]) seriesData[mainCategory] = {};
                    if (!seriesData[mainCategory][subCategory]) seriesData[mainCategory][subCategory] = {};
                    if (!seriesData[mainCategory][subCategory][seriesName]) {
                        const firstLogo = (seriesData[mainCategory][subCategory][seriesName]?.logo) ? seriesData[mainCategory][subCategory][seriesName].logo : logo;
                        seriesData[mainCategory][subCategory][seriesName] = { name: seriesName, logo: firstLogo, seasons: {} };
                    }
                    if (!seriesData[mainCategory][subCategory][seriesName].seasons[seasonNumber]) {
                        seriesData[mainCategory][subCategory][seriesName].seasons[seasonNumber] = { name: seasonNumber, episodes: [] };
                    }
                    seriesData[mainCategory][subCategory][seriesName].seasons[seasonNumber].episodes.push({
                        name, logo, url, mainCategory, subCategory, seriesName, seasonNumber, episodeNumber, type: 'episode'
                    });
                    parsedCategories[mainCategory][subCategory] = true;
                }
            } else {
                allItems.push({ name, logo, url, mainCategory, subCategory, type: itemType });
                parsedCategories[mainCategory][subCategory] = true;
            }
        }
    }
    
    async function initializePlayer() {
        dom.sidebar.innerHTML = `<div class="sidebar-loader"><div class="loading-yashi-small"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div><span>Carregando...</span></div>`;
        dom.mainGrid.innerHTML = '';

        try {
            const sourceType = localStorage.getItem('m3uSourceType');
            const m3uText = sourceType === 'url' ? await (await fetch(localStorage.getItem('m3uUrl'), { cache: 'reload' })).text() : localStorage.getItem('m3uContent');

            if (!m3uText) throw new Error('Conteúdo M3U não pôde ser carregado.');

            parseM3U(m3uText);
            renderSidebar();
            navigationStack = [];
            applyViewMode();

            const firstSubItem = dom.sidebar.querySelector('.sub-category-item');
            if (firstSubItem) firstSubItem.click();
            else dom.mainGrid.innerHTML = `<p style="padding: 20px;">Nenhum conteúdo para exibir.</p>`;

        } catch (error) {
            console.error("Falha CRÍTICA:", error);
            showPlayerError(`ERRO FATAL: ${error.message}.`);
        }
    }

    // --- RENDER FUNCTIONS ---

    function renderSidebar() {
        dom.sidebar.innerHTML = '';
        const categoryOrder = ['CANAIS AO VIVO', 'FILMES (VOD)', 'SÉRIES (VOD)'];

        const sortedMainCategories = Object.keys(parsedCategories).sort((a, b) => {
            const indexA = categoryOrder.indexOf(a);
            const indexB = categoryOrder.indexOf(b);
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });

        sortedMainCategories.forEach(mainCategory => {
            const subCategories = parsedCategories[mainCategory];
            if (!subCategories || Object.keys(subCategories).length === 0) return;

            const details = document.createElement('details');
            details.className = 'sidebar-category main-category';
            details.open = mainCategory === 'CANAIS AO VIVO';

            const summary = document.createElement('summary');
            summary.textContent = mainCategory.replace(' (VOD)', '');
            details.appendChild(summary);

            const subList = document.createElement('div');
            subList.className = 'sub-category-list';

            Object.keys(subCategories).sort().forEach(subCategory => {
                const btnEl = document.createElement('button');
                btnEl.className = 'sub-category-item';
                btnEl.textContent = subCategory;
                btnEl.title = subCategory;
                btnEl.onclick = () => {
                    clearSearch();
                    document.querySelectorAll('#sidebar .sub-category-item').forEach(b => b.classList.remove('active'));
                    btnEl.classList.add('active');
                    
                    if (mainCategory === 'SÉRIES (VOD)') {
                        renderSeriesList(mainCategory, subCategory);
                    } else {
                        renderGridForGroup(mainCategory, subCategory);
                    }
                };
                subList.appendChild(btnEl);
            });
            details.appendChild(subList);
            dom.sidebar.appendChild(details);
        });
    }

    function renderGridForGroup(mainCategory, subCategory) {
        navigationStack = [{ type: 'subCategory', mainCategory, subCategory }];
        const itemsToDisplay = allItems.filter(item => item.mainCategory === mainCategory && item.subCategory === subCategory);
        renderGrid(itemsToDisplay);
    }

    function renderSeriesList(mainCategory, subCategory) {
        navigationStack = [{ type: 'series', mainCategory, subCategory }];
        const seriesInSubCategory = seriesData[mainCategory]?.[subCategory] || {};
        const seriesList = Object.values(seriesInSubCategory).sort((a,b) => a.name.localeCompare(b.name));
        renderGrid(seriesList);
    }
    
    function renderSeasonList(series, mainCategory, subCategory) {
        navigationStack.push({ type: 'season', series, mainCategory, subCategory });
        const seasonList = Object.values(series.seasons).sort((a, b) => {
            const numA = parseInt(a.name.replace(/\D/g, ''));
            const numB = parseInt(b.name.replace(/\D/g, ''));
            return numA - numB;
        });
        renderGrid(seasonList, { parent: series, mainCategory, subCategory });
    }

    function renderEpisodeList(season, series, mainCategory, subCategory) {
        navigationStack.push({ type: 'episode', season, series, mainCategory, subCategory });
        const episodeList = season.episodes.sort((a, b) => {
            const numA = parseInt(a.episodeNumber.replace(/\D/g, ''));
            const numB = parseInt(b.episodeNumber.replace(/\D/g, ''));
            return numA - numB;
        });
        renderGrid(episodeList, { parent: series, mainCategory, subCategory });
    }
    
    function renderGrid(items, context = {}) {
        const gridContainer = document.createElement('div');
        gridContainer.className = `grid-container ${currentViewMode}`;
        
        if (items.length === 0) {
            gridContainer.innerHTML = `<p style="padding: 20px;">Nenhum item encontrado.</p>`;
            dom.mainGrid.innerHTML = '';
            dom.mainGrid.appendChild(gridContainer);
            return;
        }

        items.forEach(item => {
            const card = createCard(item, context);
            gridContainer.appendChild(card);
        });

        dom.mainGrid.innerHTML = ''; // Clear previous grid
        dom.mainGrid.appendChild(gridContainer);
    }

    // --- CARD CREATION ---
    function createCard(item, context = {}) {
        const card = document.createElement('div');
        card.className = 'card';
        let title, description, image, type;
        
        // Determine item properties based on its type
        if(item.type === 'episode' || item.type === 'movie' || item.type === 'channel') { // Playable items
            title = item.name;
            image = item.logo;
            description = `Tipo: ${item.type}<br>Categoria: ${item.subCategory}`;
            type = item.type;
            card.onclick = () => playContent(item);
        } else if (item.seasons) { // Series Object
             title = item.name;
             image = item.logo;
             description = `Temporadas: ${Object.keys(item.seasons).length}`;
             type = 'series';
             card.onclick = () => renderSeasonList(item, context.mainCategory || item.mainCategory, context.subCategory || item.subCategory);
        } else if (item.episodes) { // Season Object
            title = item.name.replace('S', 'Temporada ');
            image = context.parent?.logo; // Use series logo for season
            description = `Episódios: ${item.episodes.length}`;
            type = 'season';
            card.onclick = () => renderEpisodeList(item, context.parent, context.mainCategory, context.subCategory);
        }

        let cardContent = `
            <img loading="lazy" src="${image || 'https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa'}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa';">
            <div class="card-title">${title}</div>
        `;

        if (currentViewMode === 'view-details' || dom.searchResultsView.classList.contains('active')) {
             cardContent = `
                <img loading="lazy" src="${image || 'https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa'}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa';">
                <div class="card-content">
                    <div class="card-title">${title}</div>
                    <div class="card-description">${description}</div>
                </div>
            `;
        }
         if (type === 'season' && currentViewMode !== 'view-details') {
            card.classList.add('season-card');
            cardContent = `<div class="card-title">${title}</div>`;
        }
        
        card.innerHTML = cardContent;
        return card;
    }

    // --- PLAYER FUNCTIONS ---
    function playContent(item) {
        hidePlayerError();
        dom.mainGrid.style.display = 'none';
        dom.searchResultsView.style.display = 'none';
        dom.playerView.classList.add('active');
        dom.playerLoader.classList.add('active');
        player.stop();

        try {
            if (Hls.isSupported() && item.url.includes('.m3u8')) {
                hls.destroy(); hls = new Hls();
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) { showPlayerError('Erro no HLS. Stream não pôde ser carregado.'); }
                });
                hls.loadSource(item.url); hls.attachMedia(dom.playerElement);
            } else {
                hls.destroy(); dom.playerElement.src = item.url;
            }
            player.play();
        } catch (error) {
            showPlayerError(`Não foi possível carregar o vídeo: ${error.message}.`);
        }
    }
    
    // --- SEARCH FUNCTIONS ---
    function performSearch() {
        const query = dom.searchInput.value.trim().toLowerCase();
        if (query.length < 2) return;

        let allSearchableItems = [...allItems]; // Movies and Channels
        // Flatten series data to make it searchable
        Object.values(seriesData).forEach(mainCat => {
            Object.values(mainCat).forEach(subCat => {
                Object.values(subCat).forEach(series => {
                    allSearchableItems.push(series); // Add the series itself
                    Object.values(series.seasons).forEach(season => {
                        allSearchableItems.push(...season.episodes); // Add all episodes
                    });
                });
            });
        });
        
        const results = allSearchableItems.filter(item => item.name.toLowerCase().includes(query));

        dom.mainGrid.style.display = 'none';
        dom.searchResultsView.style.display = 'block';
        dom.searchQueryDisplay.textContent = query;
        dom.searchResultsContent.innerHTML = '';
        currentViewMode = 'view-details'; // Force details view for search results

        if (results.length > 0) {
            dom.noSearchResults.classList.add('hidden');
            results.forEach(item => {
                const card = createCard(item);
                dom.searchResultsContent.appendChild(card);
            });
        } else {
            dom.noSearchResults.classList.remove('hidden');
        }
    }

    function clearSearch() {
        dom.searchInput.value = '';
        dom.mainGrid.style.display = 'block';
        dom.searchResultsView.style.display = 'none';
        dom.searchResultsView.classList.remove('active');
        dom.clearSearchButton.classList.add('hidden');
        
        // Restore last view
        const lastState = navigationStack[navigationStack.length - 1];
        if (lastState) {
            navigationStack.pop(); // Remove to re-add it in the render function
            if (lastState.type === 'subCategory') renderGridForGroup(lastState.mainCategory, lastState.subCategory);
            else if (lastState.type === 'series') renderSeriesList(lastState.mainCategory, lastState.subCategory);
            else if (lastState.type === 'season') renderSeasonList(lastState.series, lastState.mainCategory, lastState.subCategory);
            else if (lastState.type === 'episode') renderEpisodeList(lastState.season, lastState.series, lastState.mainCategory, lastState.subCategory);
        }
    }


    // --- UI & EVENT LISTENERS ---
    
    // View mode switching
    function applyViewMode() {
        dom.mainGrid.className = `view active grid-container ${currentViewMode}`;
        dom.viewButtons.forEach(button => {
            button.classList.toggle('active', `view-${button.id.replace('view', '').toLowerCase()}` === currentViewMode);
        });
    }

    dom.viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentViewMode = `view-${button.id.replace('view', '').toLowerCase()}`;
            localStorage.setItem('viewMode', currentViewMode);
            applyViewMode();
            const lastState = navigationStack[navigationStack.length - 1];
            if (lastState) { // Re-render current view with new mode
                 if (lastState.type === 'subCategory') renderGridForGroup(lastState.mainCategory, lastState.subCategory);
                 else if (lastState.type === 'series') renderSeriesList(lastState.mainCategory, lastState.subCategory);
                 else if (lastState.type === 'season') renderSeasonList(lastState.series, lastState.mainCategory, lastState.subCategory);
                 else if (lastState.type === 'episode') renderEpisodeList(lastState.season, lastState.series, lastState.mainCategory, lastState.subCategory);
            }
        });
    });

    // Player controls
    dom.syncButton.addEventListener('click', () => initializePlayer(true));
    dom.playerBackButton.addEventListener('click', () => {
        player.stop();
        hls.destroy();
        dom.playerView.classList.remove('active');
        dom.mainGrid.style.display = 'block';
        clearSearch();
    });
    player.on('playing', () => dom.playerLoader.classList.remove('active'));
    player.on('error', () => showPlayerError('Erro no player. O vídeo não pode ser reproduzido.'));
    
    // Error message controls
    function showPlayerError(message) {
        if (dom.playerErrorText && dom.playerErrorMessage) {
            dom.playerErrorText.textContent = `Erro: ${message}`;
            dom.playerErrorMessage.classList.remove('hidden');
            dom.playerLoader.classList.remove('active');
        }
    }
    function hidePlayerError() {
        if (dom.playerErrorMessage) dom.playerErrorMessage.classList.add('hidden');
    }
    dom.playerErrorCloseButton.addEventListener('click', hidePlayerError);

    // Search controls
    dom.searchButton.addEventListener('click', performSearch);
    dom.searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') performSearch();
        dom.clearSearchButton.classList.toggle('hidden', dom.searchInput.value.length === 0);
    });
    dom.clearSearchButton.addEventListener('click', clearSearch);

    // Initial Load
    initializePlayer();
});