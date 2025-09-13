// TESTE DIRETO DE AUTENTICAÇÃO
// Execute este script no console do navegador para testar a autenticação

// 1. Teste de conexão com Supabase
console.log('🔍 Testando conexão com Supabase...');
console.log('URL:', window.supabase?.supabaseUrl);
console.log('Key:', window.supabase?.supabaseKey ? 'Presente' : 'Ausente');

// 2. Teste de registro com email único
async function testarRegistro() {
    const email = `teste_${Date.now()}@exemplo.com`;
    const senha = 'Teste123456';
    
    console.log(`📝 Testando registro com email: ${email}`);
    
    try {
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: senha,
            options: {
                data: {
                    full_name: 'Usuário Teste',
                    phone: '11999999999'
                }
            }
        });
        
        if (error) {
            console.error('❌ Erro no registro:', error);
            return false;
        }
        
        console.log('✅ Registro bem-sucedido:', data);
        
        // Verificar se o perfil foi criado
        const { data: profile, error: profileError } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user?.id)
            .single();
            
        if (profileError) {
            console.error('❌ Erro ao buscar perfil:', profileError);
            return false;
        }
        
        console.log('✅ Perfil criado automaticamente:', profile);
        return true;
        
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
        return false;
    }
}

// 3. Teste de login
async function testarLogin(email, senha) {
    console.log(`🔑 Testando login com email: ${email}`);
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: senha
        });
        
        if (error) {
            console.error('❌ Erro no login:', error);
            return false;
        }
        
        console.log('✅ Login bem-sucedido:', data);
        return true;
        
    } catch (err) {
        console.error('❌ Erro inesperado no login:', err);
        return false;
    }
}

// 4. Verificar usuários existentes
async function verificarUsuarios() {
    console.log('👥 Verificando usuários existentes...');
    
    try {
        const { data: users, error } = await window.supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (error) {
            console.error('❌ Erro ao buscar usuários:', error);
            return;
        }
        
        console.log('📋 Últimos 5 perfis:', users);
        
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
    }
}

// 5. Executar todos os testes
async function executarTestes() {
    console.log('🚀 Iniciando testes de autenticação...');
    
    // Verificar usuários existentes
    await verificarUsuarios();
    
    // Testar registro
    const registroOk = await testarRegistro();
    
    if (registroOk) {
        console.log('🎉 Todos os testes passaram! A autenticação está funcionando.');
    } else {
        console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
    }
}

// Executar testes automaticamente
executarTestes();

// Disponibilizar funções globalmente para testes manuais
window.testarRegistro = testarRegistro;
window.testarLogin = testarLogin;
window.verificarUsuarios = verificarUsuarios;
