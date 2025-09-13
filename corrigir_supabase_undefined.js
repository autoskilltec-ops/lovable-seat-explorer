// CORREÇÃO PARA WINDOW.SUPABASE UNDEFINED
// Execute este script no console do navegador (F12)

console.log('🔧 Corrigindo problema de window.supabase undefined...');

// 1. Verificar se a página carregou completamente
function verificarPaginaCarregada() {
    console.log('📄 Verificando se a página carregou completamente...');
    
    if (document.readyState !== 'complete') {
        console.log('⏳ Página ainda carregando, aguardando...');
        return false;
    }
    
    console.log('✅ Página carregada completamente');
    return true;
}

// 2. Aguardar Supabase ser carregado
async function aguardarSupabase() {
    console.log('⏳ Aguardando Supabase ser carregado...');
    
    let tentativas = 0;
    const maxTentativas = 20;
    
    while (tentativas < maxTentativas) {
        if (typeof window.supabase !== 'undefined') {
            console.log('✅ Supabase carregado após', tentativas + 1, 'tentativas');
            return true;
        }
        
        console.log('⏳ Tentativa', tentativas + 1, 'de', maxTentativas);
        await new Promise(resolve => setTimeout(resolve, 500));
        tentativas++;
    }
    
    console.log('❌ Supabase não foi carregado após', maxTentativas, 'tentativas');
    return false;
}

// 3. Recarregar a página se necessário
function recarregarPagina() {
    console.log('🔄 Recarregando página...');
    window.location.reload();
}

// 4. Verificar se há erros no console
function verificarErrosConsole() {
    console.log('🔍 Verificando erros no console...');
    
    // Verificar se há erros de rede
    const networkErrors = performance.getEntriesByType('navigation');
    if (networkErrors.length > 0) {
        console.log('🌐 Entradas de navegação:', networkErrors);
    }
    
    // Verificar se há scripts falhando
    const scripts = document.querySelectorAll('script[src]');
    console.log('📜 Scripts carregados:', scripts.length);
    
    return true;
}

// 5. Tentar carregar Supabase manualmente
async function carregarSupabaseManualmente() {
    console.log('🔧 Tentando carregar Supabase manualmente...');
    
    try {
        // Verificar se o script do Supabase está na página
        const supabaseScript = document.querySelector('script[src*="supabase"]');
        if (supabaseScript) {
            console.log('📜 Script do Supabase encontrado:', supabaseScript.src);
        } else {
            console.log('❌ Script do Supabase não encontrado na página');
        }
        
        // Verificar se há imports do Supabase
        const imports = document.querySelectorAll('script[type="module"]');
        console.log('📦 Módulos ES6 encontrados:', imports.length);
        
        return false;
    } catch (err) {
        console.error('❌ Erro ao verificar scripts:', err);
        return false;
    }
}

// 6. Verificar se a aplicação React está carregada
function verificarReactApp() {
    console.log('⚛️ Verificando se a aplicação React está carregada...');
    
    const reactRoot = document.querySelector('#root');
    if (!reactRoot) {
        console.log('❌ Elemento #root não encontrado');
        return false;
    }
    
    console.log('✅ Elemento #root encontrado');
    
    // Verificar se há conteúdo React
    const reactContent = reactRoot.innerHTML;
    if (reactContent.length < 100) {
        console.log('⚠️ Conteúdo React muito pequeno, pode não ter carregado');
        return false;
    }
    
    console.log('✅ Conteúdo React carregado');
    return true;
}

// 7. Executar correção completa
async function executarCorrecaoCompleta() {
    console.log('🚀 Iniciando correção completa...');
    
    // 1. Verificar se a página carregou
    if (!verificarPaginaCarregada()) {
        console.log('⏳ Aguardando página carregar...');
        await new Promise(resolve => {
            window.addEventListener('load', resolve);
        });
    }
    
    // 2. Verificar aplicação React
    if (!verificarReactApp()) {
        console.log('❌ Aplicação React não carregada corretamente');
        return;
    }
    
    // 3. Verificar erros
    verificarErrosConsole();
    
    // 4. Aguardar Supabase
    const supabaseOk = await aguardarSupabase();
    
    if (!supabaseOk) {
        console.log('❌ Supabase não foi carregado automaticamente');
        
        // Tentar carregar manualmente
        const manualOk = await carregarSupabaseManualmente();
        
        if (!manualOk) {
            console.log('🔄 Recarregando página para tentar novamente...');
            recarregarPagina();
            return;
        }
    }
    
    // 5. Verificar se agora funciona
    if (typeof window.supabase !== 'undefined') {
        console.log('🎉 Supabase carregado com sucesso!');
        console.log('✅ Agora você pode usar a aplicação normalmente');
        
        // Testar autenticação
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            console.log('👤 Usuário:', user ? user.email : 'Não logado');
        } catch (err) {
            console.log('⚠️ Erro ao verificar usuário:', err);
        }
    } else {
        console.log('❌ Supabase ainda não está disponível');
        console.log('🔄 Recarregando página...');
        recarregarPagina();
    }
}

// Executar correção automaticamente
executarCorrecaoCompleta();

// Disponibilizar funções globalmente
window.corrigirSupabase = executarCorrecaoCompleta;
window.verificarSupabase = () => typeof window.supabase !== 'undefined';
