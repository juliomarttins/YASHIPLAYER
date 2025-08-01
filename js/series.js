// js/series.js (v7.0 - Correção de Navegação e Reprodução de Séries)
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const PAGE_TYPE = 'series';
    Yashi.initCommon(PAGE_TYPE);

    const { 
        gridContainer, topBarBackButton, 
        categoryMenuButton, categorySidebar, sidebarOverlay, 
        categoryListContainer, closeSidebarButton 
    } = Yashi.elements;
    
    const renderTarget = gridContainer;

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
        }
    };

    const updateBackButton = () => {
        if (Yashi.navigationStack.length > 1) {
            topBarBackButton.style.display = 'flex';
            topBarBackButton.onclick = () => {
                Yashi.navigationStack.pop();
                renderCurrentState();
            };
        } else {
            topBarBackButton.style.display = 'none';
        }
    };

    const renderFullGridView = (category) => {
        const seriesForCategory = category === 'Todos'
            ? allSeries
            : allSeries.filter(serie => (serie.groupTitle || 'Outros') === category);
        
        renderTarget.className = 'grid-container'; 
        renderTarget.innerHTML = '';
        
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        Yashi.navigationStack.push({ type: 'fullGrid', data: seriesForCategory, renderFunc: () => renderFullGridView(category) });

        Yashi.renderGrid(seriesForCategory, renderTarget);
        updateBackButton();
    };
    
    const handleCarouselScroll = (carousel, prevBtn, nextBtn) => {
        const scrollEnd = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = carousel.scrollLeft <= 0;
        nextBtn.disabled = carousel.scrollLeft >= scrollEnd - 1;
    };

    const renderShelvesView = () => {
        Yashi.elements.viewButtons.forEach(btn => btn.parentElement.classList.add('disabled'));

        renderTarget.className = 'shelf-container';
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        let shelfCategories = Object.keys(categoryCounts).filter(c => c !== 'Todos' && categoryCounts[c] > 0);
        for (let i = shelfCategories.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shelfCategories[i], shelfCategories[j]] = [shelfCategories[j], shelfCategories[i]];
        }
        
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];

        const fragment = document.createDocumentFragment();

        shelfCategories.forEach(category => {
            const seriesForCategory = allSeries.filter(serie => (serie.groupTitle || 'Outros') === category);
            
            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';

            const iconClass = seriesCategoryIcons[Object.keys(seriesCategoryIcons).find(key => category.toUpperCase().includes(key.toUpperCase()))] || seriesCategoryIcons['Padrão'];

            const header = document.createElement('div');
            header.className = 'shelf-header';
            header.innerHTML = `
                <div class="shelf-title">
                    <i class="icon ${iconClass}"></i>
                    <span>${category}</span>
                    <button class="view-all-button">VER TODAS (${seriesForCategory.length})</button>
                </div>
            `;
            header.querySelector('.view-all-button').addEventListener('click', () => renderFullGridView(category));
            
            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'carousel-wrapper';

            const prevBtn = document.createElement('button');
            prevBtn.className = 'scroll-button prev';
            prevBtn.innerHTML = '&#10094;';
            prevBtn.disabled = true;

            const nextBtn = document.createElement('button');
            nextBtn.className = 'scroll-button next';
            nextBtn.innerHTML = '&#10095;';

            const carousel = document.createElement('div');
            carousel.className = 'item-carousel';
            
            const seriesToShow = seriesForCategory.slice(0, 20);
            seriesToShow.forEach(serie => {
                const card = Yashi.createCard(serie);
                carousel.appendChild(card);
            });

            prevBtn.addEventListener('click', () => carousel.scrollBy(-carousel.clientWidth * 0.8, 0));
            nextBtn.addEventListener('click', () => carousel.scrollBy(carousel.clientWidth * 0.8, 0));
            carousel.addEventListener('scroll', () => handleCarouselScroll(carousel, prevBtn, nextBtn));
            
            setTimeout(() => handleCarouselScroll(carousel, prevBtn, nextBtn), 150);

            carouselWrapper.appendChild(prevBtn);
            carouselWrapper.appendChild(carousel);
            carouselWrapper.appendChild(nextBtn);

            shelf.appendChild(header);
            shelf.appendChild(carouselWrapper);
            fragment.appendChild(shelf);
        });

        renderTarget.innerHTML = '';
        renderTarget.appendChild(fragment);
        updateBackButton();
    };

    const renderCategorySidebar = (categories) => {
        categoryListContainer.innerHTML = '';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'sidebar-category-button';
            
            const count = categoryCounts[category] || 0;
            if (count === 0) return;

            button.textContent = `${category} (${count})`;
            button.dataset.category = category;

            button.addEventListener('click', () => {
                renderFullGridView(category);
                toggleSidebar(true);
            });
            categoryListContainer.appendChild(button);
        });
    };

    const renderCurrentState = () => {
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (!currentState) return;

        const viewButtonsContainer = Yashi.elements.viewButtons[0].parentElement;
        if (currentState.type === 'shelfList') {
            viewButtonsContainer.classList.add('disabled');
        } else {
            viewButtonsContainer.classList.remove('disabled');
        }

        if (currentState.renderFunc) {
            renderTarget.className = 'grid-container'; 
            currentState.renderFunc();
        } else if (currentState.data) {
            Yashi.renderGrid(currentState.data, renderTarget);
        }
        updateBackButton(); 
    };

    const performSearch = () => {
        const query = Yashi.elements.searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = 'search.html';
        }
    };

    const loadAndProcessSeries = async () => {
        try {
            allSeries = await db.series.orderBy('name').toArray();
            
            const seriesNameToLoad = localStorage.getItem('yashi_deep_link_series_name');
            if (seriesNameToLoad) {
                localStorage.removeItem('yashi_deep_link_series_name');
                const foundSeries = allSeries.find(s => s.name === seriesNameToLoad);
                if (foundSeries) {
                    const seasons = Object.values(foundSeries.seasons).sort((a, b) => a.number - b.number);
                    seasons.forEach(season => {
                        if (season.episodes && season.episodes.length > 0) {
                            season.episodes.sort((a, b) => a.number - b.number);
                            season.logo = season.episodes[0].logo || foundSeries.logo; 
                        } else {
                            season.logo = foundSeries.logo;
                        }
                    });
                    Yashi.navigationStack = [
                        { type: 'shelfList', renderFunc: renderShelvesView },
                        { type: 'fullGrid', data: [foundSeries], renderFunc: () => renderFullGridView(foundSeries.groupTitle) },
                        { type: 'seasonList', data: seasons, title: foundSeries.name, parentSeries: foundSeries, renderFunc: () => Yashi.renderGrid(seasons, renderTarget) }
                    ];
                    renderCurrentState(); 
                    return; 
                }
            }

            categoryCounts = {};
            allSeries.forEach(serie => {
                const category = serie.groupTitle && serie.groupTitle.trim() !== '' ? serie.groupTitle.trim() : 'Outros';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            categoryCounts['Todos'] = allSeries.length; 

            const sortedSidebarCategories = Object.keys(categoryCounts).sort((a,b) => a.localeCompare(b));
            renderCategorySidebar(sortedSidebarCategories);

            renderShelvesView(); 

        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar séries do banco de dados.</p>';
            console.error('Erro ao carregar séries:', e);
        }
    };
    
    Yashi.reRenderCurrentContent = renderCurrentState;
    
    categoryMenuButton.addEventListener('click', () => toggleSidebar());
    closeSidebarButton.addEventListener('click', () => toggleSidebar(true));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(true));

    // Ativa a funcionalidade de busca de forma segura
    if (Yashi.elements.searchButton && Yashi.elements.searchInput) {
        Yashi.elements.searchButton.addEventListener('click', performSearch);
        Yashi.elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    } else {
        console.error("YASHI PLAYER: Elementos de busca não foram encontrados na página de Séries.");
    }

    loadAndProcessSeries();
});