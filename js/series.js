// js/series.js (v9.6B - CORRIGIDO: Capas de Temporada)
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const PAGE_TYPE = 'series';
    Yashi.initCommon(PAGE_TYPE);

    const { 
        gridContainer, topBarBackButton, viewButtons,
        categoryMenuButton, categorySidebar, sidebarOverlay, 
        categoryListContainer, closeSidebarButton,
        searchInput, searchButton
    } = Yashi.elements;
    
    const renderTarget = gridContainer;
    const viewButtonsContainer = viewButtons[0].parentElement;

    let allSeries = [];
    let categoryCounts = {};
    const seriesCategoryIcons = { 'Padrão': 'fa-solid fa-layer-group', 'Animação': 'fa-solid fa-child', 'Documentário': 'fa-solid fa-book', 'Anime': 'fa-solid fa-dragon' };

    const toggleSidebar = (forceClose = false) => {
        if (forceClose || categorySidebar.classList.contains('active')) {
            categorySidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        } else {
            categorySidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            categoryListContainer.querySelector('button')?.focus();
        }
    };

    const updateBackButton = () => {
        topBarBackButton.style.display = Yashi.navigationStack.length > 1 ? 'flex' : 'none';
        topBarBackButton.onclick = () => {
            Yashi.navigationStack.pop();
            Yashi.reRenderCurrentContent();
        };
    };

    const renderFullGridView = (category) => {
        const seriesForCategory = category === 'Todos'
            ? allSeries
            : allSeries.filter(serie => (serie.groupTitle || 'Outros') === category);
        
        viewButtonsContainer.classList.remove('disabled');
        renderTarget.innerHTML = '';
        Yashi.renderGrid(seriesForCategory, renderTarget);
        updateBackButton();
        setTimeout(() => renderTarget.querySelector('.card')?.focus(), 100);
    };
    
    const handleCarouselScroll = (carousel, prevBtn, nextBtn) => {
        const scrollEnd = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = carousel.scrollLeft <= 10;
        nextBtn.disabled = carousel.scrollLeft >= scrollEnd - 10;
    };

    const renderShelvesView = () => {
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        viewButtonsContainer.classList.add('disabled');

        renderTarget.className = 'shelf-container';
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        let shelfCategories = Object.keys(categoryCounts).filter(c => c !== 'Todos' && categoryCounts[c] > 0);
        for (let i = shelfCategories.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shelfCategories[i], shelfCategories[j]] = [shelfCategories[j], shelfCategories[i]];
        }
        
        const fragment = document.createDocumentFragment();
        shelfCategories.forEach(category => {
            const seriesForCategory = allSeries.filter(serie => (serie.groupTitle || 'Outros') === category);
            if(seriesForCategory.length === 0) return;

            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';
            shelf.setAttribute('data-focus-group', '');

            const iconClass = seriesCategoryIcons[Object.keys(seriesCategoryIcons).find(key => category.toUpperCase().includes(key.toUpperCase()))] || seriesCategoryIcons['Padrão'];

            const header = document.createElement('div');
            header.className = 'shelf-header';
            header.innerHTML = `
                <div class="shelf-title"><i class="icon ${iconClass}"></i><span>${category}</span></div>
                <button class="view-all-button" tabindex="0">VER TODAS (${seriesForCategory.length})</button>
            `;
            header.querySelector('.view-all-button').addEventListener('click', () => {
                Yashi.navigationStack.push({ type: 'fullGrid', renderFunc: () => renderFullGridView(category) });
                renderFullGridView(category);
            });
            
            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'carousel-wrapper';
            const prevBtn = document.createElement('button');
            prevBtn.className = 'scroll-button prev';
            prevBtn.innerHTML = '&#10094;';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'scroll-button next';
            nextBtn.innerHTML = '&#10095;';
            const carousel = document.createElement('div');
            carousel.className = 'item-carousel';
            
            seriesForCategory.slice(0, 20).forEach(serie => {
                carousel.appendChild(Yashi.createCard(serie));
            });

            prevBtn.addEventListener('click', () => carousel.scrollBy({ left: -carousel.clientWidth * 0.8, behavior: 'smooth' }));
            nextBtn.addEventListener('click', () => carousel.scrollBy({ left: carousel.clientWidth * 0.8, behavior: 'smooth' }));
            carousel.addEventListener('scroll', () => handleCarouselScroll(carousel, prevBtn, nextBtn));
            
            carouselWrapper.append(prevBtn, carousel, nextBtn);
            shelf.append(header, carouselWrapper);
            fragment.appendChild(shelf);
            
            setTimeout(() => handleCarouselScroll(carousel, prevBtn, nextBtn), 200);
        });

        renderTarget.innerHTML = '';
        renderTarget.appendChild(fragment);
        updateBackButton();
        setTimeout(() => document.querySelector('.view-all-button, .card')?.focus(), 100);
    };

    const renderCategorySidebar = () => {
        const sortedCategories = Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b));
        categoryListContainer.innerHTML = sortedCategories.map(category => {
            const count = categoryCounts[category] || 0;
            if (count === 0) return '';
            return `<button class="sidebar-category-button" data-category="${category}" tabindex="0">${category} (${count})</button>`
        }).join('');

        document.querySelectorAll('.sidebar-category-button').forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                Yashi.navigationStack.push({ type: 'fullGrid', renderFunc: () => renderFullGridView(category) });
                renderFullGridView(category);
                toggleSidebar(true);
            });
        });
    };

    const loadAndProcessSeries = async () => {
        try {
            allSeries = await db.series.orderBy('name').toArray();
            
            const seriesNameToLoad = localStorage.getItem('yashi_deep_link_series_name');
            localStorage.removeItem('yashi_deep_link_series_name');
            
            if (seriesNameToLoad) {
                const foundSeries = allSeries.find(s => s.name === seriesNameToLoad);
                if (foundSeries) {
                    // --- LÓGICA DE CAPAS RESTAURADA AQUI ---
                    const seasons = Object.values(foundSeries.seasons).sort((a, b) => a.number - b.number);
                    seasons.forEach(season => {
                        if (season.episodes && season.episodes.length > 0) {
                            const sortedEpisodes = season.episodes.sort((epA, epB) => epA.number - epB.number);
                            season.logo = sortedEpisodes[0].logo || foundSeries.logo;
                        } else {
                            season.logo = foundSeries.logo;
                        }
                    });
                    // --- FIM DA LÓGICA DE CAPAS ---

                    Yashi.navigationStack.push({
                        type: 'seriesDetail',
                        renderFunc: () => {
                            viewButtonsContainer.classList.remove('disabled');
                            Yashi.renderGrid(seasons, renderTarget, { parentSeries: foundSeries });
                            updateBackButton();
                            setTimeout(() => renderTarget.querySelector('.card')?.focus(), 100);
                        }
                    });
                    Yashi.reRenderCurrentContent();
                    return;
                }
            }

            categoryCounts = {};
            allSeries.forEach(serie => {
                const category = serie.groupTitle || 'Outros';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            categoryCounts['Todos'] = allSeries.length;
            renderShelvesView();
            renderCategorySidebar();
        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar séries.</p>';
            console.error(e);
        }
    };
    
    Yashi.reRenderCurrentContent = () => {
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (currentState && currentState.renderFunc) {
            currentState.renderFunc();
        }
    };

    categoryMenuButton.addEventListener('click', () => toggleSidebar());
    closeSidebarButton.addEventListener('click', () => toggleSidebar(true));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(true));
    
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = 'search.html';
        }
    });
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchButton.click();
    });

    loadAndProcessSeries();
});