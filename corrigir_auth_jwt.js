// CORREÇÃO DO PROBLEMA DE JWT DE AUTENTICAÇÃO
// Execute este script no console do navegador (F12)

console.log('🔧 Corrigindo problema de JWT de autenticação...');

// 1. Limpar e recriar sessão de autenticação
async function limparERecriarSessao() {
    try {
        console.log('🧹 Limpando sessão atual...');
        
        // Fazer logout completo
        await window.supabase.auth.signOut();
        
        // Limpar localStorage e sessionStorage
        Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
                localStorage.removeItem(key);
            }
        });
        
        Object.keys(sessionStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
                sessionStorage.removeItem(key);
            }
        });
        
        console.log('✅ Sessão limpa');
        return true;
    } catch (err) {
        console.error('❌ Erro ao limpar sessão:', err);
        return false;
    }
}

// 2. Fazer login novamente
async function fazerLoginNovamente() {
    try {
        console.log('🔐 Fazendo login novamente...');
        
        // Usar um email de teste ou pedir para o usuário fazer login
        const email = prompt('Digite seu email para fazer login:');
        const senha = prompt('Digite sua senha:');
        
        if (!email || !senha) {
            console.log('⚠️ Login cancelado pelo usuário');
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
        
        console.log('✅ Login realizado com sucesso:', data);
        return data;
    } catch (err) {
        console.error('❌ Erro inesperado no login:', err);
        return false;
    }
}

// 3. Verificar se a sessão está funcionando
async function verificarSessaoFuncionando() {
    try {
        console.log('🔍 Verificando se a sessão está funcionando...');
        
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        
        if (userError || sessionError) {
            console.error('❌ Erro na verificação:', userError || sessionError);
            return false;
        }
        
        if (!user || !session) {
            console.log('⚠️ Usuário ou sessão não encontrados');
            return false;
        }
        
        console.log('✅ Sessão funcionando:', {
            user: user.email,
            session: !!session.access_token,
            expires: new Date(session.expires_at * 1000).toLocaleString()
        });
        
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado na verificação:', err);
        return false;
    }
}

// 4. Testar consulta que depende de auth.uid()
async function testarConsultaComAuth() {
    try {
        console.log('📋 Testando consulta que depende de auth.uid()...');
        
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('user_id', (await window.supabase.auth.getUser()).data.user?.id);
            
        if (error) {
            console.error('❌ Erro na consulta:', error);
            return false;
        }
        
        console.log('✅ Consulta com auth.uid() funcionou:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado na consulta:', err);
        return false;
    }
}

// 5. Forçar refresh do token
async function forcarRefreshToken() {
    try {
        console.log('🔄 Forçando refresh do token...');
        
        const { data, error } = await window.supabase.auth.refreshSession();
        
        if (error) {
            console.error('❌ Erro no refresh:', error);
            return false;
        }
        
        console.log('✅ Token refreshado:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado no refresh:', err);
        return false;
    }
}

// 6. Recriar cliente Supabase com configuração otimizada
function recriarClienteSupabase() {
    try {
        console.log('🔧 Recriando cliente Supabase...');
        
        // Limpar cliente atual
        delete window.supabase;
        
        // Recriar com configuração otimizada
        const { createClient } = window.supabase || {};
        if (!createClient) {
            console.error('❌ createClient não disponível');
            return false;
        }
        
        const newClient = createClient(
            "https://eurojbezpyvkvejtzzxd.supabase.co",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cm9qYmV6cHl2a3ZlanR6enhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjQ3MDMsImV4cCI6MjA3MjQwMDcwM30.33t8r5l5o0DwTbisdw15cr2W5opXDmbe4Wwy_oFWQ1E",
            {
                auth: {
                    storage: localStorage,
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
        
        window.supabase = newClient;
        console.log('✅ Cliente Supabase recriado');
        return true;
    } catch (err) {
        console.error('❌ Erro ao recriar cliente:', err);
        return false;
    }
}

// 7. Executar correção completa
async function executarCorrecaoCompleta() {
    console.log('🚀 Iniciando correção completa de JWT...');
    
    // 1. Limpar sessão
    const limpezaOk = await limparERecriarSessao();
    if (!limpezaOk) {
        console.log('❌ Falha na limpeza da sessão');
        return;
    }
    
    // 2. Recriar cliente
    const clienteOk = recriarClienteSupabase();
    if (!clienteOk) {
        console.log('❌ Falha ao recriar cliente');
        return;
    }
    
    // 3. Fazer login
    const loginOk = await fazerLoginNovamente();
    if (!loginOk) {
        console.log('❌ Falha no login');
        return;
    }
    
    // 4. Verificar sessão
    const sessaoOk = await verificarSessaoFuncionando();
    if (!sessaoOk) {
        console.log('❌ Sessão não está funcionando');
        return;
    }
    
    // 5. Testar consulta
    const consultaOk = await testarConsultaComAuth();
    if (!consultaOk) {
        console.log('❌ Consulta com auth.uid() não funciona');
        return;
    }
    
    console.log('🎉 Correção completa realizada com sucesso!');
    console.log('✅ Agora você pode testar a aplicação normalmente');
}

// Executar correção automaticamente
executarCorrecaoCompleta();

// Disponibilizar funções globalmente
window.corrigirAuth = executarCorrecaoCompleta;
window.limparSessao = limparERecriarSessao;
window.fazerLogin = fazerLoginNovamente;
window.verificarSessao = verificarSessaoFuncionando;
