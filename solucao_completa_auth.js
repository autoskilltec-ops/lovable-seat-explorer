// SOLUÇÃO COMPLETA PARA PROBLEMA DE AUTENTICAÇÃO
// Execute este script no console do navegador (F12)

console.log('🚀 Iniciando solução completa de autenticação...');

// 1. Verificar se o Supabase está disponível
function verificarSupabaseDisponivel() {
    console.log('🔍 Verificando disponibilidade do Supabase...');
    
    if (typeof window.supabase === 'undefined') {
        console.log('❌ window.supabase não encontrado');
        return false;
    }
    
    if (!window.supabase.auth) {
        console.log('❌ window.supabase.auth não encontrado');
        return false;
    }
    
    console.log('✅ Supabase disponível');
    return true;
}

// 2. Recarregar a página para reinicializar o Supabase
function recarregarPagina() {
    console.log('🔄 Recarregando página para reinicializar Supabase...');
    window.location.reload();
}

// 3. Aguardar o Supabase estar disponível
async function aguardarSupabase() {
    console.log('⏳ Aguardando Supabase estar disponível...');
    
    let tentativas = 0;
    const maxTentativas = 10;
    
    while (tentativas < maxTentativas) {
        if (verificarSupabaseDisponivel()) {
            console.log('✅ Supabase disponível após', tentativas + 1, 'tentativas');
            return true;
        }
        
        console.log('⏳ Tentativa', tentativas + 1, 'de', maxTentativas);
        await new Promise(resolve => setTimeout(resolve, 1000));
        tentativas++;
    }
    
    console.log('❌ Supabase não ficou disponível após', maxTentativas, 'tentativas');
    return false;
}

// 4. Verificar status de autenticação
async function verificarAuth() {
    try {
        console.log('🔐 Verificando autenticação...');
        
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        
        if (userError) {
            console.error('❌ Erro ao obter usuário:', userError);
            return { user: null, session: null };
        }
        
        if (sessionError) {
            console.error('❌ Erro ao obter sessão:', sessionError);
            return { user: null, session: null };
        }
        
        console.log('👤 Usuário:', user ? user.email : 'Não logado');
        console.log('🎫 Sessão:', session ? 'Ativa' : 'Inativa');
        
        return { user, session };
    } catch (err) {
        console.error('❌ Erro inesperado na verificação:', err);
        return { user: null, session: null };
    }
}

// 5. Fazer login
async function fazerLogin() {
    try {
        console.log('🔐 Fazendo login...');
        
        const email = prompt('Digite seu email:');
        const senha = prompt('Digite sua senha:');
        
        if (!email || !senha) {
            console.log('⚠️ Login cancelado');
            return false;
        }
        
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: senha
        });
        
        if (error) {
            console.error('❌ Erro no login:', error);
            return false;
        }
        
        console.log('✅ Login realizado:', data.user.email);
        return data;
    } catch (err) {
        console.error('❌ Erro inesperado no login:', err);
        return false;
    }
}

// 6. Testar consulta com auth.uid()
async function testarConsultaAuth() {
    try {
        console.log('📋 Testando consulta com auth.uid()...');
        
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Erro na consulta:', error);
            return false;
        }
        
        console.log('✅ Consulta funcionou:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado na consulta:', err);
        return false;
    }
}

// 7. Testar consulta de reservas
async function testarReservas() {
    try {
        console.log('📋 Testando consulta de reservas...');
        
        const { data, error } = await window.supabase
            .from('reservations')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Erro na consulta de reservas:', error);
            return false;
        }
        
        console.log('✅ Consulta de reservas funcionou:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado na consulta de reservas:', err);
        return false;
    }
}

// 8. Executar solução completa
async function executarSolucaoCompleta() {
    console.log('🚀 Iniciando solução completa...');
    
    // 1. Verificar se Supabase está disponível
    if (!verificarSupabaseDisponivel()) {
        console.log('🔄 Supabase não disponível, recarregando página...');
        recarregarPagina();
        return;
    }
    
    // 2. Aguardar Supabase estar disponível
    const supabaseOk = await aguardarSupabase();
    if (!supabaseOk) {
        console.log('❌ Não foi possível inicializar Supabase');
        return;
    }
    
    // 3. Verificar autenticação
    const { user, session } = await verificarAuth();
    
    if (!user || !session) {
        console.log('🔐 Usuário não logado, fazendo login...');
        const loginOk = await fazerLogin();
        if (!loginOk) {
            console.log('❌ Falha no login');
            return;
        }
    }
    
    // 4. Testar consultas
    const consultaOk = await testarConsultaAuth();
    const reservasOk = await testarReservas();
    
    if (consultaOk && reservasOk) {
        console.log('🎉 Solução completa executada com sucesso!');
        console.log('✅ Agora você pode usar a aplicação normalmente');
    } else {
        console.log('⚠️ Alguns testes falharam, mas a autenticação está funcionando');
    }
}

// 9. Função de teste rápido
async function testeRapido() {
    console.log('⚡ Teste rápido de autenticação...');
    
    if (!verificarSupabaseDisponivel()) {
        console.log('❌ Supabase não disponível');
        return false;
    }
    
    const { user, session } = await verificarAuth();
    
    if (!user) {
        console.log('❌ Usuário não logado');
        return false;
    }
    
    console.log('✅ Usuário logado:', user.email);
    return true;
}

// Executar solução automaticamente
executarSolucaoCompleta();

// Disponibilizar funções globalmente
window.solucaoCompleta = executarSolucaoCompleta;
window.testeRapido = testeRapido;
window.verificarAuth = verificarAuth;
window.fazerLogin = fazerLogin;
