// /FILMES/engine_filmes.js
// Motor Específico para o Módulo de Filmes

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        alert("Erro crítico. Recarregue a página.");
        return;
    }

    const PAGE_TYPE = 'filmes';
    Yashi.initCommon(PAGE_TYPE);

    const { 
        gridContainer,
        categoryMenuButton,
        categorySidebar,
        sidebarOverlay, 
        categoryListContainer,
        closeSidebarButton,
        searchInput,
        searchButton,
        clearSearchButton 
    } = Yashi.elements;
    
    const renderTarget = gridContainer;
    const coverSizeButtonsContainer = document.querySelector('.cover-size-buttons');

    let allMovies = [];
    let categoryCounts = {};
    const genreIcons = { 'Padrão': 'fa-solid fa-film', 'Ação': 'fa-solid fa-bomb', 'Comédia': 'fa-solid fa-face-laugh-beam', 'Terror': 'fa-solid fa-ghost', 'Ficção Científica': 'fa-solid fa-rocket', 'Animação': 'fa-solid fa-child', 'Aventura': 'fa-solid fa-map-signs', 'Crime': 'fa-solid fa-fingerprint', 'Documentário': 'fa-solid fa-camera-retro', 'Drama': 'fa-solid fa-masks-theater', 'Família': 'fa-solid fa-house-user', 'Fantasia': 'fa-solid fa-wand-magic-sparkles', 'Guerra': 'fa-solid fa-shield-halved', 'História': 'fa-solid fa-landmark', 'Suspense': 'fa-solid fa-user-secret', 'Romance': 'fa-solid fa-heart' };

    function normalizeText(text) {
        if (!text) return '';
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
    
    const performLocalSearch = () => {
        const query = normalizeText(searchInput.value.trim());

        if (!query) {
            reRenderCurrentContent();
            return;
        }

        const filteredMovies = allMovies.filter(movie => normalizeText(movie.name).includes(query));
        if(coverSizeButtonsContainer) coverSizeButtonsContainer.classList.remove('disabled');
        renderGrid(filteredMovies);
    };

    function renderGrid(items, context = {}) {
        Yashi.lastRenderedData = items; 
        renderTarget.innerHTML = '';
        renderTarget.className = `grid-container`;
        
        if (!items || items.length === 0) {
            renderTarget.innerHTML = `<p id="no-results">Nenhum filme encontrado.</p>`;
            return;
        }
        items.forEach(item => {
            renderTarget.appendChild(createCard(item, context));
        });
        
        Yashi.updateBackButton();
    }

    function createCard(item, context = {}) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');
        
        const displayItem = item;
        if (!displayItem.logo) {
            card.classList.add('default-logo');
        }

        const defaultImg = '../capa.png';
        const itemType = 'movie';
        const title = displayItem.name;
        const image = displayItem.logo || defaultImg;

        card.innerHTML = `
            <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
            <div class="card-title">${title}</div>
            <div class="card-info-overlay">
                <div class="info-action">
                    <i class="fa-solid fa-info-circle"></i>
                    <span>Sinopse e Notas</span>
                </div>
            </div>
        `;

        const favButton = document.createElement('button');
        favButton.className = 'favorite-button';
        favButton.setAttribute('tabindex', '-1');
        favButton.setAttribute('data-tooltip', 'Salvar item');
        db.favorites.get(displayItem.name).then(fav => {
            favButton.innerHTML = fav ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
            if (fav) favButton.classList.add('active');
        });

        favButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isFavorited = favButton.classList.contains('active');
            try {
                if (isFavorited) {
                    await db.favorites.delete(displayItem.name);
                    favButton.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    favButton.classList.remove('active');
                } else {
                    await db.favorites.put({ name: displayItem.name, type: itemType, data: displayItem });
                    favButton.innerHTML = '<i class="fa-solid fa-heart"></i>';
                    favButton.classList.add('active');
                }
            } catch (error) { console.error("Falha ao atualizar itens salvos:", error); }
        });
        
        card.prepend(favButton);

        card.addEventListener('click', () => {
            Yashi.showSynopsisModal(displayItem);
        });

        return card;
    }
    
    window.reRenderCurrentContent = () => {
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (currentState && currentState.renderFunc) {
            currentState.renderFunc();
        }
    };

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

    const renderFullGridView = (category) => {
        const moviesForCategory = category === 'Todos'
            ? allMovies
            : allMovies.filter(movie => (movie.groupTitle || 'Outros') === category);
        
        if(coverSizeButtonsContainer) coverSizeButtonsContainer.classList.remove('disabled');
        renderGrid(moviesForCategory);
        setTimeout(() => renderTarget.querySelector('.card')?.focus(), 100);
    };

    const handleCarouselScroll = (carousel, prevBtn, nextBtn) => {
        const scrollEnd = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = carousel.scrollLeft <= 10;
        nextBtn.disabled = carousel.scrollLeft >= scrollEnd - 10;
    };

    const renderShelvesView = () => {
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        if(coverSizeButtonsContainer) coverSizeButtonsContainer.classList.add('disabled');
        
        renderTarget.className = 'shelf-container';
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        let shelfCategories = Object.keys(categoryCounts).filter(c => c !== 'Todos' && categoryCounts[c] > 0);
        
        const STANDARD_GENRES = ['AÇÃO', 'COMÉDIA', 'TERROR', 'FICÇÃO CIENTÍFICA', 'ANIMAÇÃO', 'AVENTURA', 'CRIME', 'DRAMA', 'FAMÍLIA', 'FANTASIA', 'GUERRA', 'HISTÓRIA', 'SUSPENSE', 'ROMANCE'];

        const getCategoryPriority = (category) => {
            const normalizedCategory = category.toUpperCase();
            if (normalizedCategory.includes('2025') || normalizedCategory.includes('2024') || normalizedCategory.includes('2023')) return 1;
            if (STANDARD_GENRES.some(genre => normalizedCategory.includes(genre))) return 2;
            if (normalizedCategory.includes('ADULTO')) return 4;
            return 3;
        };

        shelfCategories.sort((a, b) => {
            const priorityA = getCategoryPriority(a);
            const priorityB = getCategoryPriority(b);
            if (priorityA !== priorityB) return priorityA - priorityB;
            if (priorityA === 1) {
                const yearA = parseInt(a.match(/202\d/)?.[0] || '0');
                const yearB = parseInt(b.match(/202\d/)?.[0] || '0');
                if (yearA !== yearB) return yearB - yearA;
            }
            return a.localeCompare(b);
        });

        const fragment = document.createDocumentFragment();
        shelfCategories.forEach(category => {
            const moviesForCategory = allMovies.filter(movie => (movie.groupTitle || 'Outros') === category);
            if (moviesForCategory.length === 0) return;

            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';
            const iconClass = genreIcons[Object.keys(genreIcons).find(key => category.includes(key))] || genreIcons['Padrão'];
            const header = document.createElement('div');
            header.className = 'shelf-header';
            header.innerHTML = `
                <div class="shelf-title"><i class="icon ${iconClass}"></i><span>${category}</span></div>
                <button class="view-all-button" tabindex="0">VER TODOS (${moviesForCategory.length})</button>`;
            header.querySelector('.view-all-button').addEventListener('click', () => {
                 Yashi.navigationStack.push({ type: 'fullGrid', renderFunc: () => renderFullGridView(category) });
                 renderFullGridView(category);
            });
            
            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'carousel-wrapper';
            const prevBtn = document.createElement('button');
            prevBtn.className = 'scroll-button prev'; prevBtn.innerHTML = '&#10094;';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'scroll-button next'; nextBtn.innerHTML = '&#10095;';
            const carousel = document.createElement('div');
            carousel.className = 'item-carousel';
            
            moviesForCategory.slice(0, 20).forEach(movie => carousel.appendChild(createCard(movie)));

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
        Yashi.updateBackButton();
        setTimeout(() => document.querySelector('.view-all-button, .card')?.focus(), 100);
    };
    
    const loadAndProcessMovies = async () => {
        try {
            allMovies = await db.items.where('type').equals('movie').toArray();
            categoryCounts = {};
            allMovies.forEach(movie => {
                const category = movie.groupTitle || 'Outros';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            categoryCounts['Todos'] = allMovies.length;
            renderShelvesView();
            renderCategorySidebar();
        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar filmes do banco de dados.</p>';
        }
    };

    const renderCategorySidebar = () => {
        const sortedCategories = Object.keys(categoryCounts).sort((a,b) => a.localeCompare(b));
        categoryListContainer.innerHTML = sortedCategories.map(category => {
             const count = categoryCounts[category] || 0;
             if(count === 0) return '';
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

    categoryMenuButton.addEventListener('click', () => toggleSidebar());
    closeSidebarButton.addEventListener('click', () => toggleSidebar(true));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(true));
    searchButton.addEventListener('click', performLocalSearch);
    searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') performLocalSearch(); });
    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchButton.classList.add('hidden');
        reRenderCurrentContent();
    });
    searchInput.addEventListener('input', () => { clearSearchButton.classList.toggle('hidden', !searchInput.value); });

    loadAndProcessMovies();
});