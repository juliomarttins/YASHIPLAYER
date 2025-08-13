// /CONTATO/engine_contato.js

document.addEventListener('DOMContentLoaded', () => {

    const contactForm = document.getElementById('contact-form');
    const submitFormButton = document.getElementById('submit-form-button');
    const copyPixBtn = document.getElementById('copy-pix-btn');
    const pixKeySpan = document.getElementById('pix-key');

    // Função para mostrar notificações (toast)
    const showToast = (message, type = 'success', duration = 3000) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    };

    // Lógica do Formulário de Contato
    if (contactForm && submitFormButton) {
        submitFormButton.addEventListener('click', (event) => {
            event.preventDefault();

            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;

            if (!name || !subject || !message) {
                showToast("Por favor, preencha todos os campos obrigatórios.", "error");
                return;
            }

            const mailtoSubject = `YASHI PLAYER - Contato: ${subject} - de ${name}`;
            const mailtoBody = `Nome: ${name}\n` +
                               `Email para Retorno: ${email || 'Não informado'}\n\n` +
                               `---------------------------------------\n` +
                               `Mensagem:\n${message}`;

            const mailtoLink = `mailto:maretins10@gmail.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

            // NOVO: Código de depuração para verificar o que está acontecendo
            console.log("Tentando enviar email...");
            console.log("Link gerado: ", mailtoLink);
            
            // Usar window.open para tentar abrir em uma nova aba
            window.open(mailtoLink, '_blank');
        });
    }

    // Lógica do Botão de Copiar Chave PIX
    if (copyPixBtn && pixKeySpan) {
        copyPixBtn.addEventListener('click', () => {
            const pixKey = pixKeySpan.textContent;
            navigator.clipboard.writeText(pixKey).then(() => {
                showToast('Chave PIX copiada!', 'success');
            }).catch(err => {
                console.error('Falha ao copiar PIX:', err);
                showToast('Erro ao copiar a chave.', 'error');
            });
        });
    }

});