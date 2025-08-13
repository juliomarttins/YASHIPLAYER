// /CONTINUE-ASSISTINDO/engine_continue_assistindo.js
// Motor Específico para o Módulo Continue Assistindo

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        alert("Erro crítico. Recarregue a página.");
        return;
    }

    const PAGE_TYPE = 'continue-watching';
    Yashi.initCommon(PAGE_TYPE);

    const { gridContainer, topBarBackButton, searchInput, searchButton } = Yashi.elements;
    
    if (Yashi.elements.categoryMenuButton) {
        Yashi.elements.categoryMenuButton.remove();
    }
    if (Yashi.elements.categorySidebar) {
        Yashi.elements.categorySidebar.remove();
    }
    if (Yashi.elements.sidebarOverlay) {
        Yashi.elements.sidebarOverlay.remove();
    }
    
    const renderTarget = gridContainer;
    let allPlaybackHistory = [];

    function renderGrid(items, gridElement) {
        Yashi.lastRenderedData = items;
        gridElement.innerHTML = '';
        
        if (!items || items.length === 0) {
            gridElement.innerHTML = '<p id="no-results">Você não possui nenhum item no histórico de reprodução.</p>';
            return;
        }
        items.forEach(item => {
            gridElement.appendChild(createCard(item));
        });
        
        Yashi.updateBackButton();
    }

    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');

        const displayItem = item.playbackData;
        if (!displayItem) {
            return document.createComment(' Item de histórico inválido ');
        }
        
        if (!displayItem.logo) {
            card.classList.add('default-logo');
        }

        const defaultImg = '../capa.png';
        const itemType = item.type || (displayItem.seasons ? 'series' : displayItem.type); 
        const title = displayItem.name;
        const image = displayItem.logo || defaultImg;
        
        const imgElement = document.createElement('img');
        imgElement.loading = 'lazy';
        imgElement.src = image;
        imgElement.className = 'card-img';
        imgElement.alt = title;
        imgElement.onerror = function() { this.onerror=null; this.src=defaultImg; };

        const titleElement = document.createElement('div');
        titleElement.className = 'card-title';
        titleElement.textContent = title;

        card.append(imgElement, titleElement);

        const favButton = document.createElement('button');
        favButton.className = 'favorite-button';
        favButton.setAttribute('tabindex', '-1');
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

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-history-button';
        removeButton.setAttribute('tabindex', '-1');
        removeButton.title = 'Remover do Histórico';
        removeButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemIdToDelete = item.itemId;
            const confirmationMessage = `<p>Tem certeza que deseja remover "<strong>${title}</strong>" do seu histórico?</p>`;
            
            Yashi.showConfirmationModal(confirmationMessage, async () => {
                await db.playbackHistory.delete(itemIdToDelete);
                card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                card.style.transform = 'scale(0.9)';
                card.style.opacity = '0';
                setTimeout(async () => {
                    await renderPlaybackHistory(); // Re-render the whole view to update count and state
                }, 300);
            }, { confirmText: 'Sim, Remover' });
        });
        card.appendChild(removeButton);

        if (itemType === 'channel') {
            const liveBadge = document.createElement('div');
            liveBadge.className = 'live-badge';
            liveBadge.textContent = 'AO VIVO';
            card.appendChild(liveBadge);
        } else if (item.progress && item.duration) {
            const progressOverlay = document.createElement('div');
            progressOverlay.className = 'progress-overlay';
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.width = `${(item.progress / item.duration) * 100}%`;
            progressOverlay.appendChild(progressBar);
            card.appendChild(progressOverlay);
        }

        card.addEventListener('click', () => {
            Yashi.playContent(displayItem, item.progress);
        });

        return card;
    }

    const renderPlaybackHistory = async () => {
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        try {
            allPlaybackHistory = await db.playbackHistory.orderBy('timestamp').reverse().toArray();
            
            renderTarget.innerHTML = '';
            renderTarget.className = '';

            const historyHeader = document.createElement('div');
            historyHeader.className = 'history-header';

            const titleElement = document.createElement('h2');
            titleElement.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> Continue Assistindo <span>(${allPlaybackHistory.length})</span>`;
            historyHeader.appendChild(titleElement);
            
            if (allPlaybackHistory.length > 0) {
                const clearButton = document.createElement('button');
                clearButton.className = 'clear-history-button';
                clearButton.innerHTML = `<i class="fa-solid fa-trash-can"></i> Limpar Tudo`;
                clearButton.addEventListener('click', () => {
                    Yashi.showConfirmationModal(
                        `<p>Tem certeza que deseja apagar <strong>todo</strong> o seu histórico?</p><p style="color: #dc3545;">Esta ação não pode ser desfeita.</p>`,
                        async () => {
                            await db.playbackHistory.clear();
                            await renderPlaybackHistory();
                            Yashi.showToast('Histórico limpo com sucesso.', 'success');
                        },
                        { confirmText: 'Sim, Limpar' }
                    );
                });
                historyHeader.appendChild(clearButton);
            }
            
            renderTarget.appendChild(historyHeader);
            
            const gridWrapper = document.createElement('div');
            gridWrapper.className = 'grid-container';
            renderTarget.appendChild(gridWrapper);

            renderGrid(allPlaybackHistory, gridWrapper);

        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar histórico de reprodução.</p>';
        }
    };

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = '../PESQUISA/search.html';
        }
    };

    if (topBarBackButton) {
        topBarBackButton.style.display = 'flex';
        topBarBackButton.onclick = () => {
            window.location.href = '../home.html';
        };
    }

    if (searchButton) searchButton.addEventListener('click', performSearch);
    if (searchInput) searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    renderPlaybackHistory();
});