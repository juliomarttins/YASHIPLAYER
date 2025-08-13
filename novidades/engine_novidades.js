// /NOVIDADES/engine_novidades.js
// Motor Específico para o Módulo de Novidades

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) {
        window.location.href = '../index.html';
        return;
    }

    const mainContent = document.getElementById('main-content');

    const changelogData = [
        {
            version: "v1.4 - O Refinamento da Experiência",
            date: "13 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-star-half-stroke", text: "<strong class='changelog-highlight-green'>Novo Sistema de Avaliação:</strong> Implementado um sistema de notas de 0 a 10 com incrementos de meio ponto (ex: 8,5). As avaliações agora usam um ícone de estrela dourada para melhor clareza visual." },
                { icon: "fa-solid fa-medal", text: "<strong class='changelog-highlight'>Nova Página 'Meus Votos':</strong> Uma nova seção foi criada para listar todos os filmes e séries que você avaliou, convenientemente organizados da maior para a menor nota." },
                { icon: "fa-solid fa-wand-magic-sparkles", text: "<strong class='changelog-highlight'>Interface Dinâmica:</strong> Ao alterar ou remover a nota de um item na página 'Meus Votos', a lista agora se atualiza automaticamente, sem a necessidade de recarregar a página." },
                { icon: "fa-solid fa-ruler-combined", text: "<strong class='changelog-highlight'>Calibração e Polimento:</strong> O controle deslizante de notas foi redesenhado para ser mais elegante e preciso, com uma régua numérica perfeitamente calibrada com a posição do seletor." },
                { icon: "fa-solid fa-bug-slash", text: "<strong class='changelog-highlight-blue'>Correções Gerais:</strong> Resolvido um bug que impedia os filmes de aparecerem na página de avaliados e removidos botões redundantes para uma interface mais limpa." }
            ]
        },
        {
            version: "v1.3 - A Organização Definitiva",
            date: "12 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-sitemap", text: "<strong class='changelog-highlight-green'>Motor de Sincronização Aprimorado:</strong> A lógica que classifica o conteúdo foi completamente reescrita. O sistema agora usa uma análise hierárquica para separar canais, filmes e séries com muito mais precisão, resolvendo os bugs de conteúdo misturado nas páginas." },
                { icon: "fa-solid fa-list-check", text: "<strong class='changelog-highlight'>Ordenação Inteligente de Categorias:</strong> As prateleiras nas páginas de Séries e Canais agora são organizadas por prioridade, exibindo os grupos mais relevantes (como Lançamentos, PPV ou plataformas) no topo para uma navegação mais intuitiva." },
                { icon: "fa-solid fa-dice", text: "<strong class='changelog-highlight'>Sorteio de Favoritos:</strong> Adicionada a função 'Sortear' na página de Favoritos, uma ferramenta para ajudar casais e pessoas indecisas a escolher o que assistir." },
                { icon: "fa-solid fa-bug-slash", text: "<strong class='changelog-highlight'>Correções Estruturais:</strong> Resolvido um bug visual que fazia o modal de sinopse aparecer desconfigurado em várias páginas. O código foi centralizado no `base.css` para garantir estabilidade e evitar futuras regressões." },
                { icon: "fa-solid fa-ruler-combined", text: "<strong class='changelog-highlight-blue'>Ajustes Finos de UI/UX:</strong> Realizados múltiplos ajustes de layout, como a formatação do botão 'Sincronizar', a cor dos botões 'Ver Todos' e o texto do rodapé, para uma experiência mais coesa e profissional." }
            ]
        },
        {
            version: "v1.2 - Qualidade de Vida",
            date: "09 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-circle-info", text: "<strong class='changelog-highlight-green'>Sinopse e Notas Integradas:</strong> Agora você pode clicar em um ícone em qualquer filme ou série para ver a sinopse, ano e nota do TMDb em uma janela detalhada, com botões para assistir ou favoritar diretamente." },
                { icon: "fa-solid fa-clock-rotate-left", text: "<strong class='changelog-highlight'>Feedback de Sincronização:</strong> O botão 'Sincronizar' na tela inicial agora exibe a data e hora da última atualização bem-sucedida, mantendo você sempre informado." },
                { icon: "fa-solid fa-eye", text: "<strong class='changelog-highlight'>Interface Mais Limpa:</strong> As informações de 'Sinopse e Notas' foram simplificadas na visualização principal, aparecendo de forma elegante ao passar o mouse sobre a capa do conteúdo." },
                { icon: "fa-solid fa-paint-brush", text: "<strong class='changelog-highlight-blue'>Próximos Passos:</strong> O botão 'Sincronizar' passará por uma reestilização visual em breve para ficar mais moderno e apresentável." },
                { icon: "fa-solid fa-wand-magic-sparkles", text: "<strong class='changelog-highlight-blue'>Evolução Contínua:</strong> A funcionalidade de sinopse é a primeira de muitas melhorias. Mais ajustes e novidades estão a caminho!" }
            ]
        },
        {
            version: "v1.0 - Lançamento Estável",
            date: "05 de Agosto, 2025",
            notes: [
                { icon: "fas fa-rocket", text: "<strong class='changelog-highlight-green'>Bem-vindo à Versão Estável!</strong> O Yashi Player atinge sua maturidade. Agradecemos a todos que participaram da fase Beta. Esta versão consolida as melhores funcionalidades e corrige bugs para uma experiência robusta e fluida." },
                { icon: "fa-solid fa-search", text: "<strong class='changelog-highlight'>Sistema de Busca Inteligente:</strong> Pesquise em todo o seu conteúdo com uma busca que ignora acentos e capitalização. A nova página de Pesquisa agora é um hub de descoberta com seu histórico e sugestões de filmes." },
                { icon: "fa-solid fa-layer-group", text: "<strong class='changelog-highlight'>Interface Otimizada:</strong> A navegação foi aprimorada. A página de Favoritos agora é mais direta, e as categorias de Filmes são ordenadas de forma inteligente para destacar os lançamentos." },
                { icon: "fa-solid fa-play-circle", text: "<strong class='changelog-highlight'>Player e Histórico Aprimorados:</strong> O 'Continue Assistindo' agora trata canais ao vivo corretamente, exibindo um selo 'AO VIVO'. O player avança automaticamente para o próximo episódio em séries." },
                { icon: "fa-solid fa-table-cells-large", text: "<strong class='changelog-highlight'>Controle Total da Visualização:</strong> Personalize o tamanho das capas em todas as galerias e ajuste o formato da tela (aspect ratio) diretamente no player de vídeo." },
                { icon: "fa-solid fa-shield-halved", text: "<strong class='changelog-highlight'>Estabilidade e Confiança:</strong> Todos os módulos principais, incluindo Backup/Restauração e gerenciamento de Histórico, foram testados e estabilizados para este lançamento." }
            ]
        },
        {
            version: "v11.5B",
            date: "05 de Agosto, 2025",
            notes: [
                { icon: "fas fa-rocket", text: "<strong class='changelog-highlight-green'>A Fase Beta Está Chegando ao Fim!</strong> O Yashi Player se prepara para o lançamento de sua primeira versão estável. Agradecemos a todos que testaram e reportaram erros. A evolução está apenas começando!" },
                { icon: "fa-solid fa-search-location", text: "<strong class='changelog-highlight'>Pesquisa Local Inteligente:</strong> Agora você pode pesquisar filmes, séries e canais diretamente em suas respectivas páginas, com um novo botão para limpar a busca facilmente." },
                { icon: "fa-solid fa-wand-magic-sparkles", text: "<strong class='changelog-highlight'>Nova Página de Pesquisa:</strong> A tela de busca foi reimaginada como um hub de descoberta, exibindo seu histórico e um gerador de sugestões aleatórias de filmes por gênero." },
                { icon: "fa-solid fa-table-cells-large", text: "<strong class='changelog-highlight'>Controle de Tamanho:</strong> Adicionados novos botões de 'Tamanho' em todas as galerias para personalizar a visualização das capas (Micro, Pequena, Média e Grande)." },
                { icon: "fa-solid fa-circle-check", text: "<strong class='changelog-highlight'>Módulos Ativos:</strong> As seções 'Continue Assistindo', 'Favoritos' e 'Backup & Restauração' estão ativas e funcionando de forma estável." },
                { icon: "fa-solid fa-bug", text: "<strong class='changelog-highlight'>Correções Gerais:</strong> Resolvidos múltiplos bugs de navegação e interface, como o botão 'Voltar' e a exibição de elementos em telas incorretas, para uma experiência mais fluida." }
            ]
        },
        {
            version: "v10.5B",
            date: "04 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-brain", text: "<strong class='changelog-highlight'>Pesquisa Inteligente:</strong> A busca agora é inteligente, ignorando acentos e diferenças entre maiúsculas e minúsculas para encontrar resultados de forma muito mais eficaz (ex: 'dragao' encontra 'Dragão')." },
                { icon: "fa-solid fa-compass-drafting", text: "<strong class='changelog-highlight'>Hub de Descoberta na Busca:</strong> A tela de pesquisa, antes vazia, agora é um hub para descobrir conteúdo. Ela exibe seu histórico de itens visualizados e botões de gênero para sugestões aleatórias." },
                { icon: "fa-solid fa-shield-halved", text: "<strong class='changelog-highlight'>Correção de Estabilidade:</strong> Resolvido um erro crítico que causava uma tela em branco na página de pesquisa, garantindo que a funcionalidade esteja sempre acessível." }
            ]
        },
        {
            version: "v9.9B",
            date: "02 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-wand-magic-sparkles", text: "<strong class='changelog-highlight'>Interface Geral:</strong> Realizamos uma correção estrutural que restaura a barra superior em todas as telas e remove componentes visuais que apareciam fora do lugar, garantindo uma navegação estável e consistente." },
                { icon: "fa-solid fa-tv", text: "<strong class='changelog-highlight'>Player de Vídeo:</strong> O player foi refinado para evitar que o título e o botão 'Voltar' fiquem sobrepostos em vídeos com formatos de tela diferentes. O botão 'Voltar' também foi redesenhado para se alinhar à identidade visual do aplicativo." },
                { icon: "fa-solid fa-sliders", text: "<strong class='changelog-highlight'>Melhorias de Usabilidade:</strong> Os botões de modo de visualização agora possuem um novo efeito ao passar o mouse e indicam claramente qual modo está selecionado. Além disso, o aviso de retomada automática de vídeo foi aprimorado para maior clareza." },
                { icon: "fa-solid fa-bug", text: "<strong class='changelog-highlight'>Correções de Bugs:</strong> O botão para remover itens do 'Continue Assistindo' foi corrigido e agora funciona de forma confiável." }
            ]
        },
        {
            version: "v9.8B",
            date: "02 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-image", text: "<strong class='changelog-highlight'>Identidade Visual:</strong> O aplicativo agora possui um ícone oficial, garantindo uma identidade visual consistente nas abas e favoritos do seu navegador." }
            ]
        },
        {
            version: "v9.7B",
            date: "02 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-layer-group", text: "<strong class='changelog-highlight'>Navegação Unificada:</strong> A navegação entre as telas de séries e episódios foi aprimorada para ser mais fluida e intuitiva, eliminando recarregamentos desnecessários." },
                { icon: "fa-solid fa-forward", text: "<strong class='changelog-highlight'>Player Aprimorado:</strong> A reprodução agora avança automaticamente para o próximo episódio. Além disso, a funcionalidade dos botões de controle foi restaurada e aprimorada." },
                { icon: "fa-solid fa-file-import", text: "<strong class='changelog-highlight'>Backup e Restauração:</strong> O sistema de importação de dados foi corrigido e fortalecido, garantindo que seus backups possam ser restaurados com segurança." },
                { icon: "fa-solid fa-pen-ruler", text: "<strong class='changelog-highlight'>Ajustes de Interface:</strong> Realizamos um ajuste fino no alinhamento de componentes na tela inicial para uma maior consistência visual." }
            ]
        },
        {
            version: "v9.0B",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-rocket", text: "<strong class='changelog-highlight'>Otimização de Performance:</strong> A arquitetura interna foi reestruturada para um carregamento mais rápido e uma experiência de uso mais ágil." },
                { icon: "fa-solid fa-broom", text: "<strong class='changelog-highlight'>Estabilidade Geral:</strong> Melhorias internas foram realizadas na base de código para garantir maior estabilidade e preparar o sistema para futuras atualizações." },
                { icon: "fa-solid fa-shield-halved", text: "<strong class='changelog-highlight'>Segurança:</strong> Foram implementadas novas diretrizes de proteção na estrutura do aplicativo." },
                { icon: "fa-solid fa-bug", text: "<strong class='changelog-highlight'>Correção de Bugs:</strong> Foram resolvidos erros críticos que poderiam causar instabilidade ou tela branca durante o uso, tornando o sistema mais robusto." }
            ]
        },
        {
            version: "v8.0B",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-tags", text: "<strong class='changelog-highlight'>Versão Beta:</strong> O aplicativo foi oficialmente consolidado como uma versão Beta, com identificação visual aprimorada." },
                { icon: "fa-solid fa-hand-holding-dollar", text: "<strong class='changelog-highlight'>Apoio ao Projeto:</strong> A seção de contribuição foi atualizada para maior clareza." },
                { icon: "fa-solid fa-text-height", text: "<strong class='changelog-highlight'>Ajustes de Layout:</strong> Realizados ajustes finos na interface para uma apresentação mais limpa e organizada." }
            ]
        },
        {
            version: "v7.5.1B",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-database", text: "<strong class='changelog-highlight'>Listas Maiores:</strong> Aumentamos significativamente a capacidade do sistema para processar listas de conteúdo de qualquer tamanho sem travamentos." },
                { icon: "fa-solid fa-layer-group", text: "<strong class='changelog-highlight'>Carregamento Otimizado:</strong> O processo inicial de carregamento de dados foi refeito para ser mais rápido e confiável." },
                { icon: "fa-solid fa-trash-can", text: "<strong class='changelog-highlight'>Gerenciar Histórico:</strong> Agora é possível remover itens individualmente da sua lista de 'Continue Assistindo'." }
            ]
        }
    ];

    let currentPage = 1;
    const itemsPerPage = 3; 

    const renderPage = async (page) => {
        currentPage = page;
        mainContent.innerHTML = `<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>`;

        try {
            const [movieCount, channelCount, seriesCount] = await Promise.all([
                db.items.where('type').equals('movie').count(),
                db.items.where('type').equals('channel').count(),
                db.series.count()
            ]);

            const totalPages = Math.ceil(changelogData.length / itemsPerPage);
            const paginatedItems = changelogData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            const changelogHTML = paginatedItems.map(item => `
                <div class="changelog-item">
                    <div class="changelog-header">
                        <span class="changelog-version">${item.version}</span>
                        <span class="changelog-date">${item.date}</span>
                    </div>
                    <div class="changelog-body">
                        <ul>
                            ${item.notes.map(note => `<li><i class="${note.icon}"></i> ${note.text}</li>`).join('')}
                        </ul>
                    </div>
                </div>`).join('');
            
            let paginationHTML = '';
            if (totalPages > 1) {
                paginationHTML = `
                    <div class="pagination-container">
                        <button class="page-button" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-left"></i> Anterior
                        </button>
                        <span class="page-info">Página ${currentPage} de ${totalPages}</span>
                        <button class="page-button" id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>
                            Próxima <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>`;
            }

            const pageHTML = `
                <div class="top-bar">
                    <div class="top-bar-left">
                        <img src="../logo.png" alt="Logo" class="top-bar-logo" onclick="window.location.href='../home.html'">
                        <button class="home-button" onclick="window.location.href='../home.html'" title="Voltar para Home">
                            <i class="fas fa-home"></i>
                        </button>
                    </div>
                </div>
                <div class="novidades-container">
                    <div class="stats-container">
                        <div class="stat-card">
                            <i class="fa-solid fa-film"></i>
                            <div class="count">${movieCount}</div>
                            <div class="label">Filmes</div>
                        </div>
                        <div class="stat-card">
                            <i class="fa-solid fa-video"></i>
                            <div class="count">${seriesCount}</div>
                            <div class="label">Séries</div>
                        </div>
                        <div class="stat-card">
                            <i class="fa-solid fa-tv"></i>
                            <div class="count">${channelCount}</div>
                            <div class="label">Canais</div>
                        </div>
                    </div>
                    <div class="changelog-container">
                        <div class="changelog-title-container">
                            <h2>Histórico de Atualizações</h2>
                            <button id="report-error-btn" class="report-error-button"><i class="fas fa-bug"></i> Reportar Erro</button>
                        </div>
                        ${changelogHTML}
                        ${paginationHTML}
                    </div>
                </div>
                <div id="report-modal-overlay" class="report-modal-overlay">
                    <div class="report-modal-content">
                        <div class="report-modal-header">
                            <h3>Relatar um Problema</h3>
                            <button id="close-modal-btn" class="report-modal-close">&times;</button>
                        </div>
                        <form id="report-form">
                            <div class="form-group">
                                <label for="reporter-name">Seu Nome:</label>
                                <input type="text" id="reporter-name" required>
                            </div>
                            <div class="form-group">
                                <label for="reporter-email">Seu Email (opcional):</label>
                                <input type="email" id="reporter-email">
                            </div>
                            <div class="form-group">
                                <label for="report-date">Data:</label>
                                <input type="text" id="report-date" disabled>
                            </div>
                            <div class="form-group">
                                <label for="report-description">Erro que gostaria de relatar:</label>
                                <textarea id="report-description" rows="4" required></textarea>
                            </div>
                            <button type="submit" class="submit-report-btn">Enviar Relatório</button>
                        </form>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = pageHTML;
            addEventListeners();

        } catch (error) {
            mainContent.innerHTML = `<p id="no-results">Erro ao carregar novidades. Tente recarregar a página.</p>`;
            console.error("Erro ao renderizar página de novidades:", error);
        }
    };

    const addEventListeners = () => {
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        if (prevButton) prevButton.addEventListener('click', () => { if (currentPage > 1) renderPage(currentPage - 1); });
        if (nextButton) nextButton.addEventListener('click', () => { if (currentPage < Math.ceil(changelogData.length / itemsPerPage)) renderPage(currentPage + 1); });

        const reportBtn = document.getElementById('report-error-btn');
        const modalOverlay = document.getElementById('report-modal-overlay');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const reportForm = document.getElementById('report-form');

        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                const today = new Date();
                const dateField = document.getElementById('report-date');
                dateField.value = today.toLocaleDateString('pt-BR');
                modalOverlay.style.display = 'flex';
            });
        }

        const closeModal = () => {
            if (modalOverlay) modalOverlay.style.display = 'none';
        };

        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (modalOverlay) modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });

        if (reportForm) reportForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = document.getElementById('reporter-name').value;
            const email = document.getElementById('reporter-email').value;
            const date = document.getElementById('report-date').value;
            const description = document.getElementById('report-description').value;

            const subject = encodeURIComponent(`YASHI PLAYER v1.0 - Relatório de Erro de ${name}`);
            const body = encodeURIComponent(
                `Relatório de Erro - YASHI PLAYER\n\n` +
                `Nome: ${name}\n` +
                `Email: ${email || 'Não informado'}\n` +
                `Data: ${date}\n\n` +
                `---------------------------------------\n` +
                `Descrição do Problema:\n` +
                `${description}`
            );

            window.location.href = `mailto:maretins10@gmail.com?subject=${subject}&body=${body}`;
            closeModal();
        });
    };

    renderPage(1);
});