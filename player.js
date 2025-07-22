document.addEventListener('DOMContentLoaded', () => {
    // 1. SETUP INICIAL
    if (!localStorage.getItem('m3uSourceType')) {
        window.location.href = 'index.html';
        return;
    }

    const channelCategories = {
        'CANAIS 24H': {
            'REALITY SHOWS': ['BBB', 'FAZENDA', 'BIG BROTHER'],
        },
        'CANAIS AO VIVO': {
            'ESPORTES': ['SPORTV', 'ESPN', 'BANDSPORTS', 'PREMIERE', 'COMBATE', 'CONMEBOL', 'CAZETV', 'GOAT', 'DAZN', 'TNT SPORTS', 'NOSSO FUTEBOL'],
            'NOTÍCIAS': ['GLOBONEWS', 'CNN BRASIL', 'BANDNEWS', 'JOVEM PAN NEWS', 'RECORD NEWS'],
            'CANAIS ABERTOS': ['GLOBO', 'SBT', 'BAND', 'RECORD', 'REDETV!', 'CULTURA', 'GAZETA', 'CNT', 'TV BRASIL'],
            'FILMES E SÉRIES TV': ['TELECINE', 'HBO', 'MAX', 'CINEMAX', 'MEGAPIX', 'PARAMOUNT', 'STAR CHANNEL', 'FX', 'SPACE', 'TNT', 'AMC', 'UNIVERSAL', 'STUDIO UNIVERSAL', 'A&E', 'WARNER', 'SONY', 'AXN', 'SYFY', 'COMEDY CENTRAL', 'ID', 'INVESTIGAÇÃO DISCOVERY'],
            'INFANTIL': ['CARTOON', 'NICKELODEON', 'NICK JR', 'DISNEY', 'GLOOB', 'DISCOVERY KIDS', 'BOOMERANG', 'TOONCAST', 'BABY TV'],
            'DOCUMENTÁRIOS E VARIEDADES': ['DISCOVERY', 'HISTORY', 'NAT GEO', 'NATIONAL GEOGRAPHIC', 'ANIMAL PLANET', 'GNT', 'MULTISHOW', 'VIVA', 'OFF', 'CANAL BRASIL', 'LIFETIME', 'E!', 'FOOD NETWORK', 'HGTV', 'TLC'],
            'RELIGIOSOS': ['REDE VIDA', 'APARECIDA', 'CANÇÃO NOVA', 'NOVO TEMPO', 'RIT', 'BOAS NOVAS'],
            'MÚSICA': ['BIS', 'MTV', 'TRACE', 'MUSIC BOX', 'VH1'],
        }
    };

    const dom = {
        sidebar: document.getElementById('sidebar'), // Referência direta à sidebar para o menu hambúrguer
        sidebarContent: document.getElementById('sidebar-content'),
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
        viewLarge: document.getElementById('viewLarge'),
        viewMedium: document.getElementById('viewMedium'),
        viewSmall: document.getElementById('viewSmall'),
        viewList: document.getElementById('viewList'),
        viewDetails: document.getElementById('viewDetails'),
        // Novos elementos para pesquisa
        searchInput: document.getElementById('search-input'),
        searchButton: document.getElementById('search-button'),
        clearSearchButton: document.getElementById('clear-search-button'),
        searchResultsView: document.getElementById('search-results-view'),
        searchResultsContent: document.getElementById('search-results-content'),
        searchQueryDisplay: document.getElementById('search-query-display'),
        noSearchResults: document.getElementById('no-search-results'),
        // Novos elementos para o modal da equipe
        teamButton: document.getElementById('team-button'),
        teamModal: document.getElementById('team-modal'),
        closeTeamModal: document.getElementById('close-team-modal'),
        // Novo elemento para o menu hambúrguer
        hamburgerMenu: document.getElementById('hamburger-menu'),
    };

    let allItems = [];
    let parsedCategories = {};
    let seriesData = {};
    let navigationStack = [];
    let currentViewMode = localStorage.getItem('viewMode') || 'view-large';
    let currentSearchQuery = ''; // Para armazenar a query de pesquisa atual
    let currentSearchResults = {}; // Para armazenar os resultados da pesquisa categorizados

    const player = new Plyr(dom.playerElement);
    let hls = new Hls();

    // Event Listeners
    dom.syncButton.addEventListener('click', () => initializePlayer(true));

    // Event listener para o menu hambúrguer
    if (dom.hamburgerMenu) {
        dom.hamburgerMenu.addEventListener('click', () => {
            dom.sidebar.classList.toggle('active');
        });
    }

    // Fechar sidebar ao clicar fora dela em mobile
    document.addEventListener('click', (event) => {
        if (dom.sidebar.classList.contains('active') && !dom.sidebar.contains(event.target) && !dom.hamburgerMenu.contains(event.target)) {
            dom.sidebar.classList.remove('active');
        }
    });


    dom.playerBackButton.addEventListener('click', () => {
        if (dom.playerView.classList.contains('active')) {
            player.stop();
            hls.destroy();
            dom.playerView.classList.remove('active');
            // Se houver uma pesquisa ativa, volta para os resultados da pesquisa
            if (currentSearchQuery) {
                dom.searchResultsView.classList.add('active');
            } else {
                dom.mainGrid.classList.add('active');
            }
            if (dom.audioTrackSelector) {
                dom.audioTrackSelector.classList.add('hidden');
            }
            hidePlayerError();
        } else {
            // Se estiver em uma visualização de pesquisa, volta para a grade principal
            if (dom.searchResultsView.classList.contains('active')) {
                dom.searchResultsView.classList.remove('active');
                dom.mainGrid.classList.add('active');
                dom.searchInput.value = ''; // Limpa a pesquisa
                currentSearchQuery = '';
                dom.clearSearchButton.classList.add('hidden');
                // Re-renderiza a última categoria ativa na sidebar
                const lastActiveSidebarItem = dom.sidebarContent.querySelector('.sub-category-item.active');
                if (lastActiveSidebarItem) {
                    lastActiveSidebarItem.click();
                } else { // Se não houver, renderiza o primeiro item
                    const firstSubItem = dom.sidebarContent.querySelector('.sub-category-item');
                    if (firstSubItem) firstSubItem.click();
                }
            } else if (navigationStack.length > 1) {
                navigationStack.pop();
                const prevState = navigationStack[navigationStack.length - 1];

                if (prevState.type === 'subCategory') {
                    renderGridForGroup(prevState.mainCategory, prevState.subCategory);
                } else if (prevState.type === 'series') {
                    renderSeriesList(prevState.mainCategory, prevState.subCategory);
                } else if (prevState.type === 'season') {
                    renderSeasonList(prevState.seriesName, prevState.mainCategory, prevState.subCategory);
                } else if (prevState.type === 'episode') { // Para re-renderizar episódios com nova visualização
                    renderEpisodeList(prevState.seriesName, prevState.seasonName, prevState.mainCategory, prevState.subCategory);
                }
            } else {
                renderSidebar();
                const firstSubItem = dom.sidebarContent.querySelector('.sub-category-item.active');
                if (firstSubItem) {
                    firstSubItem.click();
                } else {
                    const firstSubItemDefault = dom.sidebarContent.querySelector('.sub-category-item');
                    if (firstSubItemDefault) firstSubItemDefault.click();
                }
            }
        }
    });

    player.on('playing', () => dom.playerLoader.classList.remove('active'));

    function showPlayerError(message) {
        if (dom.playerErrorText && dom.playerErrorMessage) {
            dom.playerErrorText.textContent = `Erro: ${message}`;
            dom.playerErrorMessage.classList.remove('hidden');
            dom.playerLoader.classList.remove('active');
        }
    }

    function hidePlayerError() {
        if (dom.playerErrorMessage) {
            dom.playerErrorMessage.classList.add('hidden');
        }
    }

    if (dom.playerErrorCloseButton) {
        dom.playerErrorCloseButton.addEventListener('click', hidePlayerError);
    }

    hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
            switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    showPlayerError('Erro de rede ao carregar o vídeo. Verifique sua conexão.');
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    showPlayerError('Erro de mídia. O vídeo pode estar corrompido ou não suportado.');
                    break;
                default:
                    showPlayerError(`Um erro fatal ocorreu: ${data.details}. Tente novamente.`);
                    break;
            }
            player.stop();
            hls.destroy();
            dom.playerView.classList.remove('active');
            if (currentSearchQuery) {
                dom.searchResultsView.classList.add('active');
            } else {
                dom.mainGrid.classList.add('active');
            }
        }
    });

    player.on('error', (event) => {
        showPlayerError('Erro no player. O vídeo não pode ser reproduzido.');
        player.stop();
        dom.playerView.classList.remove('active');
        if (currentSearchQuery) {
            dom.searchResultsView.classList.add('active');
        } else {
            dom.mainGrid.classList.add('active');
        }
    });

    function populateAudioTracks(plyrInstance) {
        if (!dom.audioTracksSelect) return;

        dom.audioTracksSelect.innerHTML = '';

        if (plyrInstance.audioTracks && plyrInstance.audioTracks.length > 1) {
            dom.audioTrackSelector.classList.remove('hidden');
            plyrInstance.audioTracks.forEach(track => {
                const option = document.createElement('option');
                option.value = track.id;
                option.textContent = track.label || track.language || `Faixa ${track.id}`;
                option.selected = track.enabled;
                dom.audioTracksSelect.appendChild(option);
            });

            dom.audioTracksSelect.onchange = (event) => {
                plyrInstance.currentAudioTrack = parseInt(event.target.value);
            };
        } else {
            dom.audioTrackSelector.classList.add('hidden');
        }
    }

    player.on('ready', () => {
        populateAudioTracks(player);
    });

    player.on('loadeddata', () => {
        populateAudioTracks(player);
    });

    function getChannelCategory(name, originalGroup) {
        const upperName = name.toUpperCase();
        const upperOriginalGroup = originalGroup.toUpperCase();

        if (upperOriginalGroup.includes('PPV') || upperName.includes('PPV')) {
            const mainCat = 'PAY-PER-VIEW';
            let subCat = upperOriginalGroup.replace('PPV', '').trim();
            if (!subCat) {
                subCat = 'GERAL';
            }
            return [mainCat, subCat];
        }

        if (upperOriginalGroup.includes('24H') || upperName.includes('24H')) {
            const mainCat = 'CANAIS 24H';
            let subCat = '';

            if (upperOriginalGroup.includes('REALITY SHOWS') || upperName.includes('BBB') || upperName.includes('FAZENDA') || upperName.includes('BIG BROTHER')) {
                subCat = 'REALITY SHOWS';
            } else if (upperOriginalGroup.includes('SÉRIES') || upperName.includes('SÉRIES') || upperName.includes('SERIES')) {
                subCat = 'SÉRIES';
            } else if (upperOriginalGroup.includes('NOTÍCIAS') || upperName.includes('NOTÍCIAS') || upperName.includes('NEWS')) {
                subCat = 'NOTÍCIAS';
            } else if (upperOriginalGroup.includes('ESPORTES') || upperName.includes('ESPORTES') || upperName.includes('SPORTS')) {
                subCat = 'ESPORTES';
            }
            else {
                subCat = 'GERAL';
            }
            
            if (subCat.includes('TV')) {
                subCat = subCat.replace('TV', '').trim() || 'GERAL';
            }

            return [mainCat, subCat || 'GERAL'];
        }

        for (const mainCategory in channelCategories) {
            for (const subCategory in channelCategories[mainCategory]) {
                if (channelCategories[mainCategory][subCategory].some(keyword => upperName.includes(keyword))) {
                    return [mainCategory, subCategory];
                }
            }
        }

        return null;
    }

    // Função para aplicar a visualização atual
    function applyViewMode() {
        dom.mainGrid.className = `view active grid-container ${currentViewMode}`;
        dom.searchResultsContent.className = `grid-container ${currentViewMode}`; // Aplica também aos resultados da pesquisa
        dom.viewButtons.forEach(button => {
            if (button.id === currentViewMode.replace('view-', 'view')) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    // Event listeners para os botões de visualização
    dom.viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentViewMode = `view-${button.id.replace('view', '').toLowerCase()}`;
            localStorage.setItem('viewMode', currentViewMode);
            applyViewMode();
            // Re-renderiza o conteúdo atual para aplicar a nova visualização
            const lastState = navigationStack[navigationStack.length - 1];
            if (currentSearchQuery) {
                renderSearchCategories(currentSearchResults); // Volta para a tela de categorias de pesquisa
            } else if (lastState) {
                if (lastState.type === 'subCategory') {
                    renderGridForGroup(lastState.mainCategory, lastState.subCategory);
                } else if (lastState.type === 'series') {
                    renderSeriesList(lastState.mainCategory, lastState.subCategory);
                } else if (lastState.type === 'season') {
                    renderSeasonList(lastState.seriesName, lastState.mainCategory, lastState.subCategory);
                } else if (lastState.type === 'episode') {
                    renderEpisodeList(lastState.seriesName, lastState.seasonName, lastState.mainCategory, lastState.subCategory);
                }
            }
        });
    });

    function renderGridForGroup(mainCategory, subCategory, targetElement = dom.mainGrid) {
        targetElement.innerHTML = '';
        if (targetElement === dom.mainGrid) { // Apenas para a navegação principal
            dom.searchResultsView.classList.remove('active');
            dom.mainGrid.classList.add('active');
            const lastState = navigationStack[navigationStack.length - 1];
            if (!lastState || !(lastState.type === 'subCategory' && lastState.mainCategory === mainCategory && lastState.subCategory === subCategory)) {
                navigationStack.push({ type: 'subCategory', mainCategory, subCategory });
            }
        }


        let itemsToDisplay = allItems.filter(item =>
            item.mainCategory === mainCategory && item.subCategory === subCategory && item.type !== 'episode'
        );

        if (mainCategory === 'SÉRIES (VOD)' && targetElement === dom.mainGrid) { // Apenas para a navegação principal
            renderSeriesList(mainCategory, subCategory);
            return;
        }

        if (itemsToDisplay.length === 0) {
            targetElement.innerHTML = `<p style="padding: 20px;">Nenhum item encontrado nesta categoria.</p>`;
            return;
        }

        try {
            const gridContainer = document.createElement('div');
            gridContainer.className = `grid-container ${currentViewMode}`;
            itemsToDisplay.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                let cardContent = `
                    <img loading="lazy" src="${item.logo}" class="card-img" alt="${item.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa';">
                    <div class="card-title">${item.name}</div>
                `;
                if (currentViewMode === 'view-details') {
                    cardContent = `
                        <img loading="lazy" src="${item.logo}" class="card-img" alt="${item.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa';">
                        <div class="card-content">
                            <div class="card-title">${item.name}</div>
                            <div class="card-description">Tipo: ${item.type === 'movie' ? 'Filme' : 'Canal'}<br>Categoria: ${item.mainCategory} > ${item.subCategory}</div>
                        </div>
                    `;
                }
                card.innerHTML = cardContent;
                card.addEventListener('click', () => playContent(item));
                gridContainer.appendChild(card);
            });
            targetElement.appendChild(gridContainer);
        } catch (error) {
            console.error("Erro ao renderizar a grade:", error);
            targetElement.innerHTML = `<p style="padding: 20px; color: red;">Erro ao exibir o conteúdo: ${error.message}.</p>`;
        }
    }

    function renderSeriesList(mainCategory, subCategory, targetElement = dom.mainGrid) {
        targetElement.innerHTML = '';
        if (targetElement === dom.mainGrid) { // Apenas para a navegação principal
            dom.searchResultsView.classList.remove('active');
            dom.mainGrid.classList.add('active');
            const lastState = navigationStack[navigationStack.length - 1];
            if (!lastState || !(lastState.type === 'series' && lastState.mainCategory === mainCategory && lastState.subCategory === subCategory)) {
                navigationStack.push({ type: 'series', mainCategory, subCategory });
            }
        }

        const seriesInSubCategory = seriesData[mainCategory]?.[subCategory] || {};
        const seriesNames = Object.keys(seriesInSubCategory).sort();

        if (seriesNames.length === 0) {
            targetElement.innerHTML = `<p style="padding: 20px;">Nenhuma série encontrada nesta subcategoria.</p>`;
            return;
        }

        const gridContainer = document.createElement('div');
        gridContainer.className = `grid-container ${currentViewMode}`;

        seriesNames.forEach(seriesName => {
            const series = seriesInSubCategory[seriesName];
            const card = document.createElement('div');
            card.className = 'card';
            let cardContent = `
                <img loading="lazy" src="${series.logo || 'https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa'}" class="card-img" alt="${seriesName}">
                <div class="card-title">${seriesName}</div>
            `;
            if (currentViewMode === 'view-details') {
                cardContent = `
                    <img loading="lazy" src="${series.logo || 'https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa'}" class="card-img" alt="${seriesName}">
                    <div class="card-content">
                        <div class="card-title">${seriesName}</div>
                        <div class="card-description">Total de Temporadas: ${Object.keys(series.seasons).length}</div>
                    </div>
                `;
            }
            card.innerHTML = cardContent;
            card.addEventListener('click', () => renderSeasonList(seriesName, mainCategory, subCategory));
            gridContainer.appendChild(card);
        });
        targetElement.appendChild(gridContainer);
    }

    function renderSeasonList(seriesName, mainCategory, subCategory, targetElement = dom.mainGrid) {
        targetElement.innerHTML = '';
        if (targetElement === dom.mainGrid) { // Apenas para a navegação principal
            dom.searchResultsView.classList.remove('active');
            dom.mainGrid.classList.add('active');
            const lastState = navigationStack[navigationStack.length - 1];
            if (!lastState || !(lastState.type === 'season' && lastState.seriesName === seriesName && lastState.mainCategory === mainCategory && lastState.subCategory === subCategory)) {
                navigationStack.push({ type: 'season', seriesName, mainCategory, subCategory });
            }
        }

        const series = seriesData[mainCategory]?.[subCategory]?.[seriesName];
        if (!series || Object.keys(series.seasons).length === 0) {
            targetElement.innerHTML = `<p style="padding: 20px;">Nenhuma temporada encontrada para esta série.</p>`;
            return;
        }

        // Adiciona botão de voltar apenas se não for uma pesquisa
        if (targetElement === dom.mainGrid) {
            const backToSeriesButton = document.createElement('button');
            backToSeriesButton.className = 'back-button-series';
            backToSeriesButton.textContent = `← Voltar para ${seriesName}`;
            backToSeriesButton.addEventListener('click', () => {
                navigationStack.pop();
                renderSeriesList(mainCategory, subCategory);
            });
            targetElement.appendChild(backToSeriesButton);
        }

        const seasonNames = Object.keys(series.seasons).sort((a, b) => {
            const numA = parseInt(a.replace('S', ''));
            const numB = parseInt(b.replace('S', ''));
            return numA - numB;
        });

        const gridContainer = document.createElement('div');
        gridContainer.className = `grid-container ${currentViewMode}`;

        seasonNames.forEach(seasonName => {
            const seasonButton = document.createElement('button');
            seasonButton.className = 'card season-card';
            let cardContent = `<div class="card-title">${seasonName}</div>`;
            if (currentViewMode === 'view-details') {
                const episodesCount = series.seasons[seasonName].episodes.length;
                cardContent = `
                    <div class="card-content">
                        <div class="card-title">${seasonName}</div>
                        <div class="card-description">Episódios: ${episodesCount}</div>
                    </div>
                `;
            }
            seasonButton.innerHTML = cardContent;
            seasonButton.addEventListener('click', () => renderEpisodeList(seriesName, seasonName, mainCategory, subCategory));
            gridContainer.appendChild(seasonButton);
        });
        targetElement.appendChild(gridContainer);
    }

    function renderEpisodeList(seriesName, seasonName, mainCategory, subCategory, targetElement = dom.mainGrid) {
        targetElement.innerHTML = '';
        if (targetElement === dom.mainGrid) { // Apenas para a navegação principal
            dom.searchResultsView.classList.remove('active');
            dom.mainGrid.classList.add('active');
            const lastState = navigationStack[navigationStack.length - 1];
            if (!lastState || !(lastState.type === 'episode' && lastState.seriesName === seriesName && lastState.seasonName === seasonName && lastState.mainCategory === mainCategory && lastState.subCategory === subCategory)) {
                navigationStack.push({ type: 'episode', seriesName, seasonName, mainCategory, subCategory });
            }
        }

        const episodes = seriesData[mainCategory]?.[subCategory]?.[seriesName]?.seasons?.[seasonName]?.episodes || [];

        if (episodes.length === 0) {
            targetElement.innerHTML = `<p style="padding: 20px;">Nenhum episódio encontrado para esta temporada.</p>`;
            return;
        }

        // Adiciona botão de voltar apenas se não for uma pesquisa
        if (targetElement === dom.mainGrid) {
            const backToSeasonsButton = document.createElement('button');
            backToSeasonsButton.className = 'back-button-season';
            backToSeasonsButton.textContent = `← Voltar para ${seriesName} - Temporadas`;
            backToSeasonsButton.addEventListener('click', () => {
                navigationStack.pop();
                renderSeasonList(seriesName, mainCategory, subCategory);
            });
            targetElement.appendChild(backToSeasonsButton);
        }

        const gridContainer = document.createElement('div');
        gridContainer.className = `grid-container ${currentViewMode}`;
        episodes.sort((a, b) => {
            const numA = parseInt(a.episodeNumber);
            const numB = parseInt(b.episodeNumber);
            return numA - numB;
        }).forEach(episode => {
            const card = document.createElement('div');
            card.className = 'card';
            let cardContent = `
                <img loading="lazy" src="${episode.logo || 'https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa'}" class="card-img" alt="${episode.name}">
                <div class="card-title">${episode.name}</div>
            `;
            if (currentViewMode === 'view-details') {
                cardContent = `
                    <img loading="lazy" src="${episode.logo}" class="card-img" alt="${episode.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa';">
                    <div class="card-content">
                        <div class="card-title">${episode.name}</div>
                        <div class="card-description">Temporada: ${episode.seasonNumber}<br>Episódio: ${episode.episodeNumber}</div>
                    </div>
                `;
            }
            card.innerHTML = cardContent;
            card.addEventListener('click', () => playContent(episode));
            gridContainer.appendChild(card);
        });
        targetElement.appendChild(gridContainer);
    }


    function playContent(item) {
        hidePlayerError();
        dom.mainGrid.classList.remove('active');
        dom.searchResultsView.classList.remove('active'); // Esconde resultados da pesquisa
        dom.playerView.classList.add('active');
        dom.playerLoader.classList.add('active');
        player.stop();

        try {
            if (Hls.isSupported() && item.url.includes('.m3u8')) {
                hls.destroy();
                hls = new Hls();
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch(data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                showPlayerError('Erro de rede ao carregar o vídeo. Verifique sua conexão.');
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                showPlayerError('Erro de mídia. O vídeo pode estar corrompido ou não suportado.');
                                break;
                            default:
                                showPlayerError(`Um erro fatal ocorreu: ${data.details}. Tente novamente.`);
                                break;
                        }
                        player.stop();
                        hls.destroy();
                        dom.playerView.classList.remove('active');
                        if (currentSearchQuery) {
                            dom.searchResultsView.classList.add('active');
                        } else {
                            dom.mainGrid.classList.add('active');
                        }
                    }
                });
                hls.loadSource(item.url);
                hls.attachMedia(dom.playerElement);
            } else {
                hls.destroy();
                dom.playerElement.src = item.url;
            }
            player.play();
            populateAudioTracks(player);
        } catch (error) {
            showPlayerError(`Não foi possível carregar o vídeo: ${error.message}.`);
            player.stop();
            dom.playerView.classList.remove('active');
            if (currentSearchQuery) {
                dom.searchResultsView.classList.add('active');
            } else {
                dom.mainGrid.classList.add('active');
            }
        }
    }

    function renderSidebar() {
        dom.sidebarContent.innerHTML = '';
        const categoryOrder = ['PAY-PER-VIEW', 'CANAIS 24H', 'CANAIS AO VIVO', 'FILMES (VOD)', 'SÉRIES (VOD)'];

        const sortedMainCategories = Object.keys(parsedCategories).sort((a, b) => {
            const indexA = categoryOrder.indexOf(a);
            const indexB = categoryOrder.indexOf(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        for (const mainCategory of sortedMainCategories) {
            const subCategories = parsedCategories[mainCategory];
            const details = document.createElement('details');
            details.className = 'sidebar-category main-category';
            details.open = false;

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
                    if (dom.playerView.classList.contains('active')) dom.playerBackButton.click();
                    dom.searchResultsView.classList.remove('active'); // Esconde resultados da pesquisa
                    dom.mainGrid.classList.add('active'); // Mostra a grade principal
                    dom.searchInput.value = ''; // Limpa a pesquisa
                    currentSearchQuery = '';
                    dom.clearSearchButton.classList.add('hidden');
                    document.querySelectorAll('#sidebar-content .sub-category-item').forEach(b => b.classList.remove('active'));
                    btnEl.classList.add('active');
                    renderGridForGroup(mainCategory, subCategory);
                    // Fechar sidebar em mobile após seleção de categoria
                    if (window.innerWidth <= 768) { // Ajuste o breakpoint conforme necessário
                        dom.sidebar.classList.remove('active');
                    }
                };
                subList.appendChild(btnEl);
            });
            details.appendChild(subList);
            dom.sidebarContent.appendChild(details);
        }
    }

    function parseM3U(m3uText) {
        allItems = [];
        parsedCategories = {};
        seriesData = {};

        const vodKeywords = ['FILME', 'SÉRIE', 'MOVIE', 'SERIES', 'VOD', 'LANÇAMENTO', 'NOVELAS'];

        const movieSubcategoryKeywords = {
            'AÇÃO': ['AÇÃO', 'ACTION', 'AVENTURA'],
            'COMÉDIA': ['COMÉDIA', 'COMEDY', 'HUMOR', 'ENGRAÇADO', 'COMEDIA ROMANTICA'],
            'TERROR': ['TERROR', 'HORROR', 'MEDO'],
            'FICÇÃO CIENTÍFICA': ['FICÇÃO CIENTÍFICA', 'SCI-FI', 'FICCAO'],
            'DRAMA': ['DRAMA'],
            'ANIMAÇÃO': ['ANIMAÇÃO', 'ANIMATION', 'DESENHO', 'INFANTIL', 'ANIME', 'KIDS'],
            'DOCUMENTÁRIO': ['DOCUMENTÁRIO', 'DOCUMENTARY'],
            'ROMANCE': ['ROMANCE', 'ROMANTIC'],
            'SUSPENSE': ['SUSPENSE', 'THRILLER'],
            'GUERRA': ['GUERRA', 'WAR'],
            'FAROESTE': ['FAROESTE', 'WESTERN'],
            'CRIME': ['CRIME', 'POLICIAL'],
            'FANTASIA': ['FANTASIA', 'FANTASY'],
            'MUSICAL': ['MUSICAL'],
            'FAMÍLIA': ['FAMÍLIA', 'FAMILY', 'INFANTIL', 'CRIANÇAS'],
            'NACIONAL': ['NACIONAL', 'BRAZIL'],
            'RELIGIOSO': ['RELIGIOSO', 'RELIGIOUS'],
            'ANIME': ['ANIME'],
            'ARTES MARCIAIS': ['ARTES MARCIAIS', 'MARTIAL ARTS'],
            'THRILLER': ['THRILLER'],
            'AVENTURA': ['AVENTURA'],
            'BIOGRAFIA': ['BIOGRAFIA'],
            'HISTÓRIA': ['HISTÓRIA', 'HISTORY'],
            'MISTÉRIO': ['MISTÉRIO', 'MYSTERY'],
            'ESPORTES': ['ESPORTES', 'SPORTS'],
            'GUERRA': ['GUERRA', 'WAR'],
            'MUSICAL': ['MUSICAL'],
            'WESTERN': ['WESTERN'],
            'CURTAS': ['CURTAS', 'SHORT FILMS'],
            'ERÓTICO': ['ERÓTICO', 'EROTIC'],
            'SHOWS': ['SHOWS'],
            'STAND-UP': ['STAND-UP'],
            'CONCERTOS': ['CONCERTOS'],
            'TEATRO': ['TEATRO'],
            'VARIEDADES': ['VARIEDADES'],
            'NOVO': ['NOVO', 'LANÇAMENTO', 'NEW'],
            'DUBLADO': ['DUBLADO', 'DUBBED'],
            'LEGENDADO': ['LEGENDADO', 'SUBTITLED'],
            '4K': ['4K'],
            'HD': ['HD'],
            'FULL HD': ['FULL HD'],
        };

        const seriesSubcategoryKeywords = {
            'NOVELAS | ATUAIS': ['NOVELAS | ATUAIS', 'NOVELAS ATUAIS'],
            'NOVELAS | BRASILEIRAS': ['NOVELAS | BRASILEIRAS', 'NOVELAS BRASILEIRAS'],
            'NOVELAS | GERAIS': ['NOVELAS | GERAIS', 'NOVELAS GERAIS'],
            'NOVELAS | GLOBO': ['NOVELAS | GLOBO', 'NOVELAS GLOBO'],
            'NOVELAS | RECORD': ['NOVELAS | RECORD', 'NOVELAS RECORD'],
            'NOVELAS | SBT': ['NOVELAS | SBT', 'NOVELAS SBT'],
            'SÉRIES | +SBT': ['SÉRIES | +SBT', '+SBT'],
            'SÉRIES | AMAZON PRIME VÍDEO': ['SÉRIES | AMAZON PRIME VÍDEO', 'AMAZON PRIME VIDEO', 'PRIME VIDEO'],
            'SÉRIES | ANIMES': ['SÉRIES | ANIMES', 'ANIMES'],
            'SÉRIES | APPLE TV PLUS': ['SÉRIES | APPLE TV PLUS', 'APPLE TV PLUS'],
            'SÉRIES | BRASIL PARALELO': ['SÉRIES | BRASIL PARALELO', 'BRASIL PARALELO'],
            'SÉRIES | CLARO VIDEO': ['SÉRIES | CLARO VIDEO', 'CLARO VIDEO'],
            'SÉRIES | CRUNCHYROLL': ['SÉRIES | CRUNCHYROLL', 'CRUNCHYROLL'],
            'SÉRIES | DIRECTV': ['SÉRIES | DIRECTV', 'DIRECTV'],
            'SÉRIES | DISCOVERY PLUS': ['SÉRIES | DISCOVERY PLUS', 'DISCOVERY PLUS'],
            'SÉRIES | DISNEY PLUS': ['SÉRIES | DISNEY PLUS', 'DISNEY PLUS'],
            'SÉRIES | DIVERSAS': ['SÉRIES | DIVERSAS', 'DIVERSAS'],
            'SÉRIES | DORAMAS': ['SÉRIES | DORAMAS', 'DORAMAS', 'K-DRAMA', 'C-DRAMA'],
            'SÉRIES | FUNIMATION NOW': ['SÉRIES | FUNIMATION NOW', 'FUNIMATION NOW'],
            'SÉRIES | GLOBOPLAY': ['SÉRIES | GLOBOPLAY', 'GLOBOPLAY'],
            'SÉRIES | INFANTIL / DESENHO': ['SÉRIES | INFANTIL / DESENHO', 'INFANTIL', 'DESENHO', 'KIDS', 'CARTOON'],
            'SÉRIES | LEGENDADAS': ['SÉRIES | LEGENDADAS', 'LEGENDADAS', 'SUBTITLED'],
            'SÉRIES | MAX': ['SÉRIES | MAX', 'MAX', 'HBO MAX'],
            'SÉRIES | NETFLIX': ['SÉRIES | NETFLIX', 'NETFLIX'],
            'SÉRIES | OUTROS STREAMS': ['SÉRIES | OUTROS STREAMS', 'OUTROS STREAMS', 'OUTRAS PLATAFORMAS'],
            'SÉRIES | PARAMOUNT': ['SÉRIES | PARAMOUNT', 'PARAMOUNT', 'PARAMOUNT+'],
            'SÉRIES | REALITY SHOWS': ['SÉRIES | REALITY SHOWS', 'REALITY SHOWS', 'REALITY'],
            'SÉRIES | STAR PLUS': ['SÉRIES | STAR PLUS', 'STAR PLUS'],
            'SÉRIES | TOKUSATSU': ['SÉRIES | TOKUSATSU', 'TOKUSATSU'],
            'SÉRIES | TURCAS': ['SÉRIES | TURCAS', 'TURCAS'],
            'SÉRIES | UNIVERSAL+': ['SÉRIES | UNIVERSAL+', 'UNIVERSAL+'],
            'AÇÃO': ['AÇÃO', 'ACTION', 'AVENTURA'],
            'COMÉDIA': ['COMÉDIA', 'COMEDY', 'HUMOR', 'ENGRAÇADO', 'COMEDIA ROMANTICA'],
            'DRAMA': ['DRAMA'],
            'FICÇÃO CIENTÍFICA': ['FICÇÃO CIENTÍFICA', 'SCI-FI', 'FICCAO'],
            'TERROR': ['TERROR', 'HORROR'],
            'CRIME': ['CRIME', 'POLICIAL'],
            'FANTASIA': ['FANTASIA', 'FANTASY'],
            'ROMANCE': ['ROMANCE', 'ROMANTIC'],
            'SUSPENSE': ['SUSPENSE', 'THRILLER'],
            'GUERRA': ['GUERRA', 'WAR'],
            'NACIONAL': ['NACIONAL', 'BRAZIL'],
            'DOCUMENTÁRIO': ['DOCUMENTÁRIO', 'DOCUMENTARY'],
            'MISTÉRIO': ['MISTÉRIO', 'MYSTERY'],
            'ANIMATION': ['ANIMATION'],
        };


        const lines = m3uText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].startsWith('#EXTINF:')) continue;

            const info = lines[i];
            const name = info.split(',').pop().trim();
            const logo = info.match(/tvg-logo="([^"]*)"/)?.[1] || '';
            const originalGroup = info.match(/group-title="([^"]*)"/)?.[1] || '';
            const url = lines[++i] ? lines[i].trim() : null;

            if (!name || !url) continue;

            let mainCategory, subCategory;
            const channelCat = getChannelCategory(name, originalGroup);

            if (channelCat) {
                [mainCategory, subCategory] = channelCat;
                allItems.push({ name, logo, url, mainCategory, subCategory, type: 'channel' });
            } else {
                const upperOriginalGroup = originalGroup.toUpperCase();
                const upperName = name.toUpperCase();

                let isSeries = false;
                if (upperOriginalGroup.includes('SÉRIE') || upperOriginalGroup.includes('SERIES') || upperName.includes('SÉRIE') || upperName.includes('SERIES') || upperOriginalGroup.includes('NOVELAS') || upperName.includes('NOVELAS')) {
                    isSeries = true;
                } else {
                    if (vodKeywords.some(keyword => upperName.includes(keyword)) && (upperName.includes('SÉRIE') || upperName.includes('SERIES') || upperName.includes('NOVELAS'))) {
                        isSeries = true;
                    }
                }

                if (isSeries) {
                    mainCategory = 'SÉRIES (VOD)';
                    let foundSubCategory = false;
                    for (const catName in seriesSubcategoryKeywords) {
                        if (upperOriginalGroup.includes(catName.toUpperCase()) || upperName.includes(catName.toUpperCase())) {
                            subCategory = catName;
                            foundSubCategory = true;
                            break;
                        }
                        if (seriesSubcategoryKeywords[catName].some(keyword => upperOriginalGroup.includes(keyword.toUpperCase()) || upperName.includes(keyword.toUpperCase()))) {
                            subCategory = catName;
                            foundSubCategory = true;
                            break;
                        }
                    }

                    if (!foundSubCategory) {
                        if (originalGroup && originalGroup !== 'Default' && !vodKeywords.some(keyword => originalGroup.toUpperCase().includes(keyword))) {
                            subCategory = originalGroup;
                        } else {
                            subCategory = 'GERAL';
                        }
                    }

                    const seriesMatch = name.match(/(.*?)(?:[SsTt](\d+))?(?:[Ee](\d+))?$/i);
                    let seriesName = name.trim();
                    let seasonNumber = 'N/A';
                    let episodeNumber = 'N/A';

                    if (seriesMatch) {
                        seriesName = seriesMatch[1] ? seriesMatch[1].trim() : name.trim();
                        seasonNumber = seriesMatch[2] ? `S${String(parseInt(seriesMatch[2])).padStart(2, '0')}` : 'N/A';
                        episodeNumber = seriesMatch[3] ? `E${String(parseInt(seriesMatch[3])).padStart(2, '0')}` : 'N/A';
                    }

                    if (!seriesData[mainCategory]) seriesData[mainCategory] = {};
                    if (!seriesData[mainCategory][subCategory]) seriesData[mainCategory][subCategory] = {};
                    if (!seriesData[mainCategory][subCategory][seriesName]) {
                        seriesData[mainCategory][subCategory][seriesName] = {
                            name: seriesName,
                            logo: logo,
                            seasons: {}
                        };
                    }
                    if (!seriesData[mainCategory][subCategory][seriesName].seasons[seasonNumber]) {
                        seriesData[mainCategory][subCategory][seriesName].seasons[seasonNumber] = {
                            name: seasonNumber,
                            episodes: []
                        };
                    }

                    seriesData[mainCategory][subCategory][seriesName].seasons[seasonNumber].episodes.push({
                        name: name,
                        logo: logo,
                        url: url,
                        mainCategory: mainCategory,
                        subCategory: subCategory,
                        seriesName: seriesName,
                        seasonNumber: seasonNumber,
                        episodeNumber: episodeNumber,
                        type: 'episode'
                    });

                    allItems.push({ name, logo, url, mainCategory, subCategory, type: 'series_episode_raw' });

                } else if (vodKeywords.some(keyword => upperOriginalGroup.includes(keyword) || upperName.includes(keyword))) {
                    mainCategory = 'FILMES (VOD)';
                    let foundSubCategory = false;
                    for (const catName in movieSubcategoryKeywords) {
                        if (upperOriginalGroup.includes(catName.toUpperCase()) || upperName.includes(catName.toUpperCase())) {
                            subCategory = catName;
                            foundSubCategory = true;
                            break;
                        }
                        if (movieSubcategoryKeywords[catName].some(keyword => upperOriginalGroup.includes(keyword.toUpperCase()) || upperName.includes(keyword.toUpperCase()))) {
                            subCategory = catName;
                            foundSubCategory = true;
                            break;
                        }
                    }
                    if (!foundSubCategory) {
                        const groupParts = originalGroup.split(/[:;-]/).map(s => s.trim()).filter(Boolean);
                        const potentialSub = groupParts[1] || groupParts[0];

                        if (potentialSub && !potentialSub.toUpperCase().includes('FILME') && !potentialSub.toUpperCase().includes('MOVIE') && !potentialSub.toUpperCase().includes('VOD') && !potentialSub.toUpperCase().includes('SÉRIE') && !potentialSub.toUpperCase().includes('SERIES') && !potentialSub.toUpperCase().includes('NOVELAS')) {
                            subCategory = potentialSub;
                        } else {
                            subCategory = 'GERAL';
                        }
                    }
                    allItems.push({ name, logo, url, mainCategory, subCategory, type: 'movie' });
                } else {
                    mainCategory = 'CANAIS AO VIVO';
                    subCategory = originalGroup && originalGroup !== 'Default' ? originalGroup : 'OUTROS';
                    allItems.push({ name, logo, url, mainCategory, subCategory, type: 'channel' });
                }
            }

            if (!parsedCategories[mainCategory]) parsedCategories[mainCategory] = {};
            if (!parsedCategories[mainCategory][subCategory]) parsedCategories[mainCategory][subCategory] = true;
        }
    }

    async function initializePlayer(isSync = false) {
        if (isSync) {
            dom.sidebarContent.innerHTML = `<div class="sidebar-loader"><div class="loading-yashi-small"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div><span>Sincronizando...</span></div>`;
        }
        try {
            const sourceType = localStorage.getItem('m3uSourceType');
            const m3uText = sourceType === 'url'
                ? await (await fetch(localStorage.getItem('m3uUrl'), { cache: 'reload' })).text()
                : localStorage.getItem('m3uContent');

            if (!m3uText) throw new Error('Conteúdo M3U não pôde ser carregado.');

            parseM3U(m3uText);
            renderSidebar();

            navigationStack = [];
            applyViewMode(); // Aplica a visualização salva ao iniciar

            const firstSubItem = dom.sidebarContent.querySelector('.sub-category-item');
            if (firstSubItem) {
                firstSubItem.click();
            } else {
                dom.mainGrid.innerHTML = `<p style="padding: 20px;">Nenhum conteúdo para exibir. Verifique sua lista M3U.</p>`;
            }

        } catch (error) {
            console.error(`Falha ao inicializar. Erro: ${error.message}`);
            showPlayerError(`Falha ao carregar a lista: ${error.message}. Verifique a URL ou o arquivo.`);
            localStorage.clear();
        }
    }

    // ========================================
    // FUNÇÕES DE PESQUISA
    // ========================================
    dom.searchButton.addEventListener('click', () => {
        const query = dom.searchInput.value.trim();
        if (query) {
            performSearch(query);
        } else {
            clearSearch();
        }
    });

    dom.searchInput.addEventListener('keyup', (event) => {
        const query = dom.searchInput.value.trim();
        if (event.key === 'Enter' && query) {
            performSearch(query);
        } else if (query === '') {
            clearSearch();
        }
    });

    dom.clearSearchButton.addEventListener('click', clearSearch);

    function performSearch(query) {
        currentSearchQuery = query;
        dom.searchQueryDisplay.textContent = query;
        dom.clearSearchButton.classList.remove('hidden');

        dom.mainGrid.classList.remove('active');
        dom.searchResultsView.classList.add('active');
        dom.searchResultsContent.innerHTML = '';
        dom.noSearchResults.classList.add('hidden');

        const lowerCaseQuery = query.toLowerCase();
        let resultsFound = false;

        // Categorias principais para exibir na pesquisa
        const searchCategories = {
            'FILMES': [],
            'SÉRIES': [],
            'CANAIS / OUTROS': []
        };

        // Pesquisar em allItems (canais e filmes)
        allItems.forEach(item => {
            if (item.name.toLowerCase().includes(lowerCaseQuery) || item.mainCategory.toLowerCase().includes(lowerCaseQuery) || item.subCategory.toLowerCase().includes(lowerCaseQuery)) {
                if (item.type === 'movie') {
                    searchCategories['FILMES'].push(item);
                } else if (item.type === 'channel') {
                    searchCategories['CANAIS / OUTROS'].push(item);
                }
                resultsFound = true;
            }
        });

        // Pesquisar em seriesData (séries e episódios)
        for (const mainCat in seriesData) {
            for (const subCat in seriesData[mainCat]) {
                for (const seriesName in seriesData[mainCat][subCat]) {
                    const series = seriesData[mainCat][subCat][seriesName];
                    const lowerCaseSeriesName = seriesName.toLowerCase();

                    // Se o nome da série ou sua categoria/subcategoria corresponder
                    if (lowerCaseSeriesName.includes(lowerCaseQuery) || mainCat.toLowerCase().includes(lowerCaseQuery) || subCat.toLowerCase().includes(lowerCaseQuery)) {
                        searchCategories['SÉRIES'].push({
                            name: seriesName,
                            logo: series.logo,
                            type: 'series_group', // Tipo especial para indicar que é um grupo de séries
                            mainCategory: mainCat,
                            subCategory: subCat,
                            seriesName: seriesName // Para facilitar a navegação
                        });
                        resultsFound = true;
                    } else {
                        // Se a série não corresponder, verifica os episódios
                        for (const seasonName in series.seasons) {
                            series.seasons[seasonName].episodes.forEach(episode => {
                                if (episode.name.toLowerCase().includes(lowerCaseQuery) || episode.seasonNumber.toLowerCase().includes(lowerCaseQuery) || episode.episodeNumber.toLowerCase().includes(lowerCaseQuery)) {
                                    searchCategories['SÉRIES'].push(episode); // Adiciona o episódio diretamente
                                    resultsFound = true;
                                }
                            });
                        }
                    }
                }
            }
        }

        currentSearchResults = searchCategories; // Armazena os resultados para renderização posterior

        if (!resultsFound) {
            dom.noSearchResults.classList.remove('hidden');
            return;
        }

        // Renderiza as categorias de resultados da pesquisa como botões clicáveis
        renderSearchCategories(searchCategories);
    }

    // Nova função para renderizar as categorias de pesquisa como botões
    function renderSearchCategories(categorizedResults) {
        dom.searchResultsContent.innerHTML = ''; // Limpa o conteúdo anterior
        dom.noSearchResults.classList.add('hidden'); // Esconde a mensagem de "nenhum resultado"

        let categoriesPresent = false;
        for (const category in categorizedResults) {
            if (categorizedResults[category].length > 0) {
                categoriesPresent = true;
                const categoryButton = document.createElement('button');
                categoryButton.className = 'card season-card search-category-button'; // Reutiliza estilo de season-card
                categoryButton.textContent = category;
                categoryButton.addEventListener('click', () => {
                    renderSpecificSearchResults(category, categorizedResults[category]);
                });
                dom.searchResultsContent.appendChild(categoryButton);
            }
        }

        if (!categoriesPresent) {
            dom.noSearchResults.classList.remove('hidden');
        }
    }

    // Nova função para renderizar os resultados de uma categoria específica da pesquisa
    function renderSpecificSearchResults(categoryName, items) {
        dom.searchResultsContent.innerHTML = ''; // Limpa o conteúdo anterior
        dom.noSearchResults.classList.add('hidden');

        const backButton = document.createElement('button');
        backButton.className = 'back-button-series'; // Reutiliza o estilo do botão de voltar
        backButton.textContent = `← Voltar para Categorias da Pesquisa`;
        backButton.addEventListener('click', () => {
            renderSearchCategories(currentSearchResults); // Volta para a tela de categorias
        });
        dom.searchResultsContent.appendChild(backButton);

        const categoryTitle = document.createElement('h4');
        categoryTitle.className = 'search-results-title';
        categoryTitle.textContent = `Resultados em "${categoryName}" para "${currentSearchQuery}"`;
        dom.searchResultsContent.appendChild(categoryTitle);

        if (items.length === 0) {
            dom.searchResultsContent.innerHTML += `<p style="padding: 20px;">Nenhum item encontrado nesta categoria para sua pesquisa.</p>`;
            return;
        }

        const gridContainer = document.createElement('div');
        gridContainer.className = `grid-container ${currentViewMode}`; // Aplica a visualização atual

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            let cardContent;

            if (item.type === 'series_group') {
                // Renderiza o card para o grupo da série
                cardContent = `
                    <img loading="lazy" src="${item.logo || 'https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa'}" class="card-img" alt="${item.name}">
                    <div class="card-title">${item.name}</div>
                `;
                if (currentViewMode === 'view-details') {
                    const seriesObj = seriesData[item.mainCategory][item.subCategory][item.seriesName];
                    const totalSeasons = seriesObj ? Object.keys(seriesObj.seasons).length : 0;
                    cardContent = `
                        <img loading="lazy" src="${item.logo || 'https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa'}" class="card-img" alt="${item.name}">
                        <div class="card-content">
                            <div class="card-title">${item.name}</div>
                            <div class="card-description">Total de Temporadas: ${totalSeasons}</div>
                        </div>
                    `;
                }
                // Ao clicar em uma série na pesquisa, mostra as temporadas dela
                card.addEventListener('click', () => renderSeasonList(item.seriesName, item.mainCategory, item.subCategory, dom.searchResultsContent));
            } else {
                // Renderiza o card para canais, filmes ou episódios
                cardContent = `
                    <img loading="lazy" src="${item.logo}" class="card-img" alt="${item.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa';">
                    <div class="card-title">${item.name}</div>
                `;
                if (currentViewMode === 'view-details') {
                    cardContent = `
                        <img loading="lazy" src="${item.logo}" class="card-img" alt="${item.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/160x240/0D1117/8B949E?text=Sem+Capa';">
                        <div class="card-content">
                            <div class="card-title">${item.name}</div>
                            <div class="card-description">Tipo: ${item.type === 'movie' ? 'Filme' : (item.type === 'channel' ? 'Canal' : `Série: ${item.seriesName} - Temp: ${item.seasonNumber} - Ep: ${item.episodeNumber}`)}<br>Categoria: ${item.mainCategory} > ${item.subCategory}</div>
                        </div>
                    `;
                }
                card.addEventListener('click', () => playContent(item));
            }
            card.innerHTML = cardContent;
            gridContainer.appendChild(card);
        });
        dom.searchResultsContent.appendChild(gridContainer);
    }


    function clearSearch() {
        dom.searchInput.value = '';
        currentSearchQuery = '';
        currentSearchResults = {}; // Limpa os resultados armazenados
        dom.clearSearchButton.classList.add('hidden');
        dom.searchResultsView.classList.remove('active');
        dom.mainGrid.classList.add('active'); // Volta para a grade principal
        // Re-renderiza a última categoria ativa na sidebar
        const lastActiveSidebarItem = dom.sidebarContent.querySelector('.sub-category-item.active');
        if (lastActiveSidebarItem) {
            lastActiveSidebarItem.click();
        } else { // Se não houver, renderiza o primeiro item
            const firstSubItem = dom.sidebarContent.querySelector('.sub-category-item');
            if (firstSubItem) firstSubItem.click();
        }
    }

    // ========================================
    // FUNÇÕES DO MODAL DA EQUIPE
    // ========================================
    dom.teamButton.addEventListener('click', () => {
        dom.teamModal.classList.remove('hidden');
    });

    dom.closeTeamModal.addEventListener('click', () => {
        dom.teamModal.classList.add('hidden');
    });

    // Fechar o modal ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === dom.teamModal) {
            dom.teamModal.classList.add('hidden');
        }
    });

    initializePlayer();
});
