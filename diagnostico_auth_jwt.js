// DIAGNÓSTICO DO PROBLEMA DE JWT DE AUTENTICAÇÃO
// Execute este script no console do navegador (F12)

console.log('🔍 Diagnosticando problema de JWT de autenticação...');

// 1. Verificar se o cliente Supabase está configurado corretamente
function verificarConfiguracaoSupabase() {
    console.log('📡 Verificando configuração do Supabase...');
    
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Cliente Supabase não encontrado!');
        return false;
    }
    
    console.log('✅ Cliente Supabase encontrado');
    console.log('URL:', window.supabase.supabaseUrl);
    console.log('Key presente:', !!window.supabase.supabaseKey);
    
    return true;
}

// 2. Verificar status de autenticação
async function verificarStatusAuth() {
    try {
        console.log('🔐 Verificando status de autenticação...');
        
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        
        if (userError) {
            console.error('❌ Erro ao obter usuário:', userError);
            return false;
        }
        
        if (sessionError) {
            console.error('❌ Erro ao obter sessão:', sessionError);
            return false;
        }
        
        console.log('👤 Usuário:', user ? user.email : 'Não logado');
        console.log('🎫 Sessão:', session ? 'Ativa' : 'Inativa');
        console.log('🔑 JWT Token:', session?.access_token ? 'Presente' : 'Ausente');
        
        if (session?.access_token) {
            console.log('📏 Tamanho do token:', session.access_token.length);
            console.log('⏰ Expira em:', new Date(session.expires_at * 1000).toLocaleString());
        }
        
        return { user, session };
    } catch (err) {
        console.error('❌ Erro inesperado na autenticação:', err);
        return false;
    }
}

// 3. Testar consulta com debug de headers
async function testarConsultaComDebug() {
    try {
        console.log('🔍 Testando consulta com debug de headers...');
        
        // Interceptar requisições para ver headers
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            console.log('🌐 Requisição interceptada:', args[0]);
            if (args[1]?.headers) {
                console.log('📋 Headers:', args[1].headers);
            }
            return originalFetch.apply(this, args);
        };
        
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .limit(1);
            
        // Restaurar fetch original
        window.fetch = originalFetch;
        
        if (error) {
            console.error('❌ Erro na consulta:', error);
            return false;
        }
        
        console.log('✅ Consulta executada com sucesso:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado na consulta:', err);
        return false;
    }
}

// 4. Testar auth.uid() diretamente no banco
async function testarAuthUidNoBanco() {
    try {
        console.log('🗄️ Testando auth.uid() diretamente no banco...');
        
        const { data, error } = await window.supabase
            .rpc('auth_uid_test', {});
            
        if (error) {
            console.log('⚠️ Função auth_uid_test não existe, testando com SQL direto...');
            
            // Testar com uma consulta que usa auth.uid()
            const { data: testData, error: testError } = await window.supabase
                .from('profiles')
                .select('user_id')
                .limit(1);
                
            if (testError) {
                console.error('❌ Erro ao testar auth.uid():', testError);
                return false;
            }
            
            console.log('✅ Consulta com auth.uid() executada:', testData);
            return true;
        }
        
        console.log('✅ auth.uid() no banco:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao testar auth.uid():', err);
        return false;
    }
}

// 5. Verificar localStorage e sessionStorage
function verificarStorage() {
    console.log('💾 Verificando storage local...');
    
    const supabaseAuth = localStorage.getItem('sb-eurojbezpyvkvejtzzxd-auth-token');
    const supabaseSession = sessionStorage.getItem('sb-eurojbezpyvkvejtzzxd-auth-token');
    
    console.log('🏠 localStorage auth:', supabaseAuth ? 'Presente' : 'Ausente');
    console.log('🌐 sessionStorage auth:', supabaseSession ? 'Presente' : 'Ausente');
    
    if (supabaseAuth) {
        try {
            const authData = JSON.parse(supabaseAuth);
            console.log('📊 Dados de auth no localStorage:', authData);
        } catch (e) {
            console.log('⚠️ Erro ao parsear dados de auth do localStorage');
        }
    }
    
    return { supabaseAuth, supabaseSession };
}

// 6. Forçar refresh da sessão
async function forcarRefreshSessao() {
    try {
        console.log('🔄 Forçando refresh da sessão...');
        
        const { data, error } = await window.supabase.auth.refreshSession();
        
        if (error) {
            console.error('❌ Erro ao refresh da sessão:', error);
            return false;
        }
        
        console.log('✅ Sessão refreshada:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao refresh da sessão:', err);
        return false;
    }
}

// 7. Executar todos os diagnósticos
async function executarDiagnosticoCompleto() {
    console.log('🚀 Iniciando diagnóstico completo de JWT...');
    
    const resultados = {
        configuracao: verificarConfiguracaoSupabase(),
        storage: verificarStorage(),
        auth: await verificarStatusAuth(),
        consulta: await testarConsultaComDebug(),
        authUid: await testarAuthUidNoBanco()
    };
    
    // Se há problemas de autenticação, tentar refresh
    if (resultados.auth && !resultados.auth.session) {
        console.log('🔄 Tentando refresh da sessão...');
        resultados.refresh = await forcarRefreshSessao();
    }
    
    console.log('📊 Resultados do diagnóstico:', resultados);
    
    // Análise dos resultados
    if (!resultados.configuracao) {
        console.log('❌ PROBLEMA: Cliente Supabase não configurado');
    } else if (!resultados.auth || !resultados.auth.user) {
        console.log('❌ PROBLEMA: Usuário não logado');
    } else if (!resultados.auth.session) {
        console.log('❌ PROBLEMA: Sessão inválida ou expirada');
    } else if (!resultados.consulta) {
        console.log('❌ PROBLEMA: Consultas não funcionam');
    } else {
        console.log('✅ DIAGNÓSTICO: Tudo parece estar funcionando');
    }
    
    return resultados;
}

// Executar diagnóstico automaticamente
executarDiagnosticoCompleto();

// Disponibilizar funções globalmente
window.diagnosticarAuth = executarDiagnosticoCompleto;
window.verificarStatusAuth = verificarStatusAuth;
window.forcarRefreshSessao = forcarRefreshSessao;
