// js/canais.js
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }
    
    const PAGE_TYPE = 'canais';
    Yashi.initCommon(PAGE_TYPE);
    
    // Elementos injetados por Yashi.initCommon
    const gridContainer = Yashi.elements.gridContainer;
    const searchInput = Yashi.elements.searchInput;
    const searchButton = Yashi.elements.searchButton;
    const clearSearchButton = Yashi.elements.clearSearchButton;
    const topBarBackButton = Yashi.elements.topBarBackButton; // Pega o botão de voltar da barra superior

    let allChannels = []; // Armazenará todos os canais carregados
    let currentFilteredChannels = []; // Armazenará os canais filtrados pela subcategoria
    let channelSubCategories = new Set(); // Para armazenar subcategorias únicas
    let currentActiveSubCategory = 'Todos'; // Categoria ativa, padrão para "Todos"

    // Novo elemento para os filtros de categoria de canais
    const categoryFiltersContainer = document.createElement('div');
    categoryFiltersContainer.id = 'channel-category-filters';
    categoryFiltersContainer.className = 'category-filters'; // Reutilizamos a classe de estilo

    // Adiciona o container de filtros logo abaixo da top-bar
    Yashi.elements.mainContent.insertBefore(categoryFiltersContainer, gridContainer);

    const loadChannels = async () => {
        try {
            allChannels = await db.items.where('type').equals('channel').toArray();
            
            // Extrai subcategorias únicas
            channelSubCategories.clear();
            channelSubCategories.add('Todos'); // Adiciona a opção "Todos"
            allChannels.forEach(channel => {
                if (channel.groupTitle) { // Usamos groupTitle como subcategoria para canais
                    channelSubCategories.add(channel.groupTitle);
                }
            });

            // Ordena as subcategorias alfabeticamente
            const sortedSubCategories = Array.from(channelSubCategories).sort((a, b) => {
                if (a === 'Todos') return -1; // "Todos" sempre primeiro
                if (b === 'Todos') return 1;
                return a.localeCompare(b);
            });

            renderCategoryFilters(sortedSubCategories); // Renderiza os botões de filtro
            filterChannelsByCategory(currentActiveSubCategory); // Filtra e exibe os canais
            
            // Armazena o estado inicial para re-renderização
            Yashi.navigationStack = [{ type: 'subCategory', data: allChannels, title: 'Canais' }];

        } catch (e) {
            gridContainer.innerHTML = '<p id="no-results">Falha ao carregar canais do banco de dados.</p>';
            console.error('Erro ao carregar canais:', e);
        }
    };

    const renderCategoryFilters = (categories) => {
        categoryFiltersContainer.innerHTML = ''; // Limpa os filtros existentes
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.textContent = category;
            button.dataset.category = category;
            if (category === currentActiveSubCategory) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                document.querySelectorAll('#channel-category-filters .filter-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentActiveSubCategory = category;
                filterChannelsByCategory(category);
                // Limpa a busca ao mudar de categoria
                searchInput.value = '';
                clearSearchButton.classList.add('hidden');
            });
            categoryFiltersContainer.appendChild(button);
        });
    };

    const filterChannelsByCategory = (category) => {
        if (category === 'Todos') {
            currentFilteredChannels = [...allChannels];
        } else {
            currentFilteredChannels = allChannels.filter(channel => channel.groupTitle === category);
        }
        Yashi.renderGrid(currentFilteredChannels, gridContainer);
    };

    const performSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            filterChannelsByCategory(currentActiveSubCategory); // Retorna à categoria ativa
            clearSearchButton.classList.add('hidden');
            return;
        }
        const results = currentFilteredChannels.filter(item => item.name.toLowerCase().includes(query));
        Yashi.renderGrid(results, gridContainer, true); // O 'true' indica que é um resultado de busca
        clearSearchButton.classList.remove('hidden');
    };

    const clearSearch = () => {
        searchInput.value = '';
        performSearch(); // Isso chamará filterChannelsByCategory(currentActiveSubCategory)
    };

    // --- Event Listeners ---
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', e => { 
        if (e.key === 'Enter') performSearch(); 
        clearSearchButton.classList.toggle('hidden', searchInput.value.length === 0);
    });
    clearSearchButton.addEventListener('click', clearSearch);

    // Sobrescreve reRenderCurrentContent para canais
    Yashi.reRenderCurrentContent = () => {
        // Para canais, sempre recarrega do banco de dados ou do cache local
        loadChannels();
    };

    // Lógica do botão de voltar da barra superior (agora gerenciada pelo Yashi.common.js)
    // Para canais, o botão de voltar não terá função de pilha interna,
    // ele sempre volta para a Home.
    topBarBackButton.style.display = 'none'; // Esconde o botão de voltar na página de canais

    await loadChannels();
});
