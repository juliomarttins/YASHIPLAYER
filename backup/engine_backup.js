// /BACKUP/engine_backup.js
// Motor Específico para o Módulo de Backup

document.addEventListener('DOMContentLoaded', () => {
    // Valida se as dependências globais (db e Yashi) existem
    if (!window.db || !window.Yashi) {
        console.error("Dependências (db.js, common.js) não carregadas.");
        alert("Erro crítico na página. Por favor, recarregue.");
        return;
    }
    
    // Esta página não precisa de Yashi.initCommon(), pois sua UI é simples e autossuficiente.

    const exportButton = document.getElementById('export-button');
    const importButton = document.getElementById('import-button');
    const importInput = document.getElementById('import-input');
    const requiredFilename = "yashi-player-backup.json";

    // --- LÓGICA DE EXPORTAÇÃO ---
    exportButton.addEventListener('click', async () => {
        try {
            const favoritesData = await db.favorites.toArray();
            const historyData = await db.playbackHistory.toArray();

            const backupData = {
                version: "yashi-v1",
                timestamp: new Date().toISOString(),
                data: {
                    favorites: favoritesData,
                    playbackHistory: historyData
                }
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = requiredFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Yashi.showToast("Backup exportado com sucesso!", "success");

        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            Yashi.showToast(`Falha ao exportar: ${error.message}`, "error");
        }
    });

    // --- LÓGICA DE IMPORTAÇÃO ---
    importButton.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            importInput.value = '';
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!importedData.version || importedData.version !== "yashi-v1" || !importedData.data || !Array.isArray(importedData.data.favorites) || !Array.isArray(importedData.data.playbackHistory)) {
                    throw new Error("O arquivo de backup é inválido ou está corrompido.");
                }

                const favCount = importedData.data.favorites.length;
                const histCount = importedData.data.playbackHistory.length;
                const confirmationMessage = `
                    <p>Você está prestes a importar:</p>
                    <ul>
                        <li><strong>${favCount}</strong> itens para Favoritos</li>
                        <li><strong>${histCount}</strong> itens para o Histórico</li>
                    </ul>
                    <p style="color: #FF8A80; font-weight: bold;">Esta ação substituirá permanentemente seus dados atuais. Deseja continuar?</p>`;

                Yashi.showConfirmationModal(confirmationMessage, async () => {
                    await performImport(importedData.data);
                }, { confirmText: 'Sim, Importar' });

            } catch (error) {
                console.error("Erro ao ler ou validar o arquivo de backup:", error);
                Yashi.showToast(`Falha na importação: ${error.message}`, "error");
            } finally {
                importInput.value = '';
            }
        };

        // ADICIONADO: Tratamento de erro para a leitura do arquivo
        reader.onerror = () => {
            console.error("FileReader: Não foi possível ler o arquivo.");
            Yashi.showToast("Erro ao tentar ler o arquivo. Verifique se o arquivo não está corrompido.", "error");
            importInput.value = ''; // Limpa o input
        };

        reader.readAsText(file);
    });

    async function performImport(data) {
        try {
            await db.transaction('rw', db.favorites, db.playbackHistory, async () => {
                await db.favorites.clear();
                await db.playbackHistory.clear();

                if (data.favorites.length > 0) {
                    await db.favorites.bulkAdd(data.favorites);
                }
                if (data.playbackHistory.length > 0) {
                    await db.playbackHistory.bulkAdd(data.playbackHistory);
                }
            });

            const successMessage = `Dados importados: ${data.favorites.length} Favoritos e ${data.playbackHistory.length} itens no Histórico.`;
            Yashi.showToast(successMessage, "success", 5000);

        } catch (error) {
            console.error("Erro ao gravar dados no banco de dados:", error);
            Yashi.showToast(`Falha grave ao importar: ${error.message}`, "error");
        }
    }
});