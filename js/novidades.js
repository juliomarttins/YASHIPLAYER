// js/novidades.js (Finalizado em 30/07/2025)
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const mainContent = document.getElementById('main-content');

    const changelogData = [
        {
            version: "v9.0",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-rocket", text: "<strong>Otimização de Performance:</strong> O carregamento do site foi aprimorado para uma experiência mais rápida, com a otimização de fontes e a unificação de arquivos de estilo." },
                { icon: "fa-solid fa-broom", text: "<strong>Código Mais Enxuto e Eficiente:</strong> Arquivos de estilo redundantes foram eliminados, resultando em um código mais limpo, leve e fácil de manter." },
                { icon: "fa-solid fa-shield-halved", text: "<strong>Camadas de Proteção Adicionais:</strong> Medidas foram implementadas para proteger o código-fonte contra cópias e replicações casuais." },
                { icon: "fa-solid fa-bug", text: "<strong>Correções de Estabilidade:</strong> Resolução de bugs críticos que causavam tela branca e falhas de sincronização, garantindo uma base de código robusta para futuras atualizações." }
            ]
        },
        {
            version: "v8.0B",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-tags", text: "<strong>Consolidação da Versão Beta:</strong> Oficializada a versão como Beta, com identificação visual na página inicial e de novidades." },
                { icon: "fa-solid fa-hand-holding-dollar", text: "<strong>Melhoria no Modal de Doação:</strong> O texto e a chave PIX foram atualizados para maior clareza e apelo." },
                { icon: "fa-solid fa-text-height", text: "<strong>Ajuste Fino de Layout:</strong> Corrigida a quebra de linha em títulos de temporada e o alinhamento na página de novidades para uma interface mais limpa." }
            ]
        },
        {
            version: "v7.5.1",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-database", text: "<strong>Correção de Arquivos Grandes:</strong> Migração do armazenamento de listas M3U do `localStorage` para o `IndexedDB`, permitindo o uso de listas de qualquer tamanho." },
                { icon: "fa-solid fa-layer-group", text: "<strong>Estabilização do Login:</strong> Refatorada a lógica de carregamento para garantir um login mais robusto." },
                { icon: "fa-solid fa-trash-can", text: "<strong>Remover do Histórico:</strong> Adicionado um botão de remoção com pop-up de confirmação na tela 'Continue Assistindo'." }
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
                        <img src="logo.png" alt="Logo" class="top-bar-logo" onclick="window.location.href='home.html'">
                        <button class="home-button" onclick="window.location.href='home.html'" title="Voltar para Home">
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

            const subject = encodeURIComponent(`YASHI PLAYER v9.0 - Relatório de Erro de ${name}`);
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

    await renderPage(1);
});