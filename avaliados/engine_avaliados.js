// /AVALIADOS/engine_avaliados.js
// Motor Específico para o Módulo de Itens Avaliados

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        alert("Erro crítico. Recarregue a página.");
        return;
    }

    const PAGE_TYPE = 'avaliados';
    Yashi.initCommon(PAGE_TYPE);

    const { gridContainer, topBarBackButton } = Yashi.elements;
    
    // Esconde elementos não utilizados nesta página
    if (Yashi.elements.searchButton) Yashi.elements.searchButton.parentElement.style.display = 'none';
    if (Yashi.elements.categoryMenuButton) Yashi.elements.categoryMenuButton.style.display = 'none';
    
    const renderTarget = gridContainer;

    function createCard(ratedItem) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');

        const displayItem = ratedItem.data;
        if (!displayItem) {
             return document.createComment(' Objeto de item avaliado inválido ');
        }
        
        const defaultImg = '../capa.png';
        const title = displayItem.name;
        let image = displayItem.logo || defaultImg;

        // Adiciona o selo com a nota do usuário
        const ratingBadge = document.createElement('div');
        ratingBadge.className = 'rating-badge';
        ratingBadge.innerHTML = `<i class="fa-solid fa-star"></i> ${ratedItem.userRating}`;
        
        card.innerHTML = `
            <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
            <div class="card-title">${title}</div>`;
        card.prepend(ratingBadge);

        card.addEventListener('click', () => {
            Yashi.showSynopsisModal(
                displayItem, 
                () => { // onContinueCallback
                    sessionStorage.setItem('yashi_nav_origin', 'avaliados');
                    localStorage.setItem('yashi_deep_link_series_name', displayItem.name);
                    window.location.href = '../series/series.html';
                },
                (newRating) => { // onRatingChangeCallback
                    Yashi.closeSynopsisModal();
                    setTimeout(() => {
                        loadAndRenderRatedItems();
                    }, 350);
                }
            );
        });

        return card;
    }
    
    const loadAndRenderRatedItems = async () => {
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        try {
            const allRatings = await db.movieRatings.orderBy('rating').reverse().toArray();
            
            const ratedMovies = [];
            const ratedSeries = [];

            if (allRatings.length > 0) {
                for (const rating of allRatings) {
                    let itemData = await db.series.get(rating.itemId);
                    if (itemData) {
                        ratedSeries.push({ data: itemData, userRating: rating.rating });
                    } else {
                        itemData = await db.items.where('name').equals(rating.itemId).first();
                        if (itemData && itemData.type === 'movie') {
                            ratedMovies.push({ data: itemData, userRating: rating.rating });
                        }
                    }
                }
            }
            
            renderTarget.innerHTML = '';
            const fragment = document.createDocumentFragment();

            const categories = [
                { title: 'Filmes Avaliados', icon: 'fa-solid fa-film', items: ratedMovies },
                { title: 'Séries Avaliadas', icon: 'fa-solid fa-video', items: ratedSeries }
            ];

            let hasContent = false;
            categories.forEach(category => {
                if (category.items.length > 0) {
                    hasContent = true;
                    const categorySection = document.createElement('div');
                    categorySection.className = 'category-section';
                    categorySection.innerHTML = `
                        <h2 class="category-title">
                            <div><i class="icon ${category.icon}"></i> ${category.title} <span>(${category.items.length})</span></div>
                        </h2>`;
                    
                    const grid = document.createElement('div');
                    grid.className = 'grid-container';
                    category.items.forEach(item => grid.appendChild(createCard(item)));
                    
                    categorySection.appendChild(grid);
                    fragment.appendChild(categorySection);
                }
            });
            
            if (hasContent) {
                renderTarget.appendChild(fragment);
            } else {
                 renderTarget.innerHTML = `<p id="no-results">Você ainda não avaliou nenhum filme ou série.</p>`;
            }

        } catch(e) {
            console.error("Falha ao carregar itens avaliados:", e);
            renderTarget.innerHTML = '<p id="no-results">Ocorreu um erro ao carregar seus itens avaliados.</p>';
        }
    };
    
    if (topBarBackButton) {
        topBarBackButton.onclick = () => {
            window.location.href = '../home.html';
        };
    }

    loadAndRenderRatedItems();
});