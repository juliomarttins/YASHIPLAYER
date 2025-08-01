// js/filmes.js (v17.3 - View Buttons Logic Fix)
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const PAGE_TYPE = 'filmes';
    Yashi.initCommon(PAGE_TYPE);

    const { 
        gridContainer, topBarBackButton, viewButtons,
        categoryMenuButton, categorySidebar, sidebarOverlay, 
        categoryListContainer, closeSidebarButton,
        searchInput, searchButton
    } = Yashi.elements;
    
    const renderTarget = gridContainer;
    const viewButtonsContainer = viewButtons[0].parentElement;

    let allMovies = [];
    let categoryCounts = {};
    const genreIcons = { 'Padrão': 'fa-solid fa-film', 'Ação': 'fa-solid fa-bomb', 'Comédia': 'fa-solid fa-face-laugh-beam', 'Terror': 'fa-solid fa-ghost', 'Ficção Científica': 'fa-solid fa-rocket', 'Animação': 'fa-solid fa-child', 'Aventura': 'fa-solid fa-map-signs', 'Crime': 'fa-solid fa-fingerprint', 'Documentário': 'fa-solid fa-camera-retro', 'Drama': 'fa-solid fa-masks-theater', 'Família': 'fa-solid fa-house-user', 'Fantasia': 'fa-solid fa-wand-magic-sparkles', 'Guerra': 'fa-solid fa-shield-halved', 'História': 'fa-solid fa-landmark', 'Suspense': 'fa-solid fa-user-secret', 'Romance': 'fa-solid fa-heart' };

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
        const moviesForCategory = category === 'Todos'
            ? allMovies
            : allMovies.filter(movie => (movie.groupTitle || 'Outros') === category);
        
        viewButtonsContainer.classList.remove('disabled');
        renderTarget.innerHTML = '';

        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        Yashi.navigationStack.push({ type: 'fullGrid', data: moviesForCategory, renderFunc: () => renderFullGridView(category) });
        
        Yashi.renderGrid(moviesForCategory, renderTarget);
        updateBackButton();
    };

    const handleCarouselScroll = (carousel, prevBtn, nextBtn) => {
        const scrollEnd = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = carousel.scrollLeft <= 0;
        nextBtn.disabled = carousel.scrollLeft >= scrollEnd - 1;
    };

    const renderShelvesView = () => {
        viewButtonsContainer.classList.add('disabled');
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
            const moviesForCategory = allMovies.filter(movie => (movie.groupTitle || 'Outros') === category);
            
            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';

            const iconClass = genreIcons[Object.keys(genreIcons).find(key => category.includes(key))] || genreIcons['Padrão'];

            const header = document.createElement('div');
            header.className = 'shelf-header';
            header.innerHTML = `
                <div class="shelf-title">
                    <i class="icon ${iconClass}"></i>
                    <span>${category}</span>
                    <button class="view-all-button">VER TODOS (${moviesForCategory.length})</button>
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
            
            const moviesToShow = moviesForCategory.slice(0, 20);
            moviesToShow.forEach(movie => {
                const card = Yashi.createCard(movie);
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
        if (currentState && currentState.renderFunc) {
            currentState.renderFunc();
        }
    };

    const loadAndProcessMovies = async () => {
        try {
            allMovies = await db.items.where('type').equals('movie').toArray();
            
            categoryCounts = {};
            allMovies.forEach(movie => {
                const category = movie.groupTitle && movie.groupTitle.trim() !== '' ? movie.groupTitle.trim() : 'Outros';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            categoryCounts['Todos'] = allMovies.length;

            const sortedSidebarCategories = Object.keys(categoryCounts).sort((a,b) => a.localeCompare(b));
            renderCategorySidebar(sortedSidebarCategories);

            renderShelvesView();

        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar filmes do banco de dados.</p>';
            console.error('Erro ao carregar filmes:', e);
        }
    };

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = 'search.html';
        }
    };
    
    Yashi.reRenderCurrentContent = renderCurrentState;

    categoryMenuButton.addEventListener('click', () => toggleSidebar());
    closeSidebarButton.addEventListener('click', () => toggleSidebar(true));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(true));

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    loadAndProcessMovies();
});