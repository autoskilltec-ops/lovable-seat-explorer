// TESTE DE CONEXÃO E ACESSO AOS DADOS
// Execute este script no console do navegador (F12)

console.log('🔍 Testando conexão e acesso aos dados...');

// 1. Teste de conexão básica
async function testarConexao() {
    try {
        console.log('📡 Testando conexão com Supabase...');
        const { data, error } = await window.supabase
            .from('destinations')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Erro de conexão:', error);
            return false;
        }
        
        console.log('✅ Conexão com Supabase funcionando');
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado na conexão:', err);
        return false;
    }
}

// 2. Teste de acesso aos destinos
async function testarDestinos() {
    try {
        console.log('🏖️ Testando acesso aos destinos...');
        const { data, error } = await window.supabase
            .from('destinations')
            .select('*')
            .limit(5);
            
        if (error) {
            console.error('❌ Erro ao buscar destinos:', error);
            return false;
        }
        
        console.log('✅ Destinos carregados:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao buscar destinos:', err);
        return false;
    }
}

// 3. Teste de acesso às viagens
async function testarViagens() {
    try {
        console.log('🚌 Testando acesso às viagens...');
        const { data, error } = await window.supabase
            .from('trips')
            .select(`
                *,
                destination:destinations(*)
            `)
            .limit(5);
            
        if (error) {
            console.error('❌ Erro ao buscar viagens:', error);
            return false;
        }
        
        console.log('✅ Viagens carregadas:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao buscar viagens:', err);
        return false;
    }
}

// 4. Teste de acesso às reservas (se logado)
async function testarReservas() {
    try {
        console.log('📋 Testando acesso às reservas...');
        
        // Verificar se está logado
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            console.log('⚠️ Usuário não logado, pulando teste de reservas');
            return true;
        }
        
        const { data, error } = await window.supabase
            .from('reservations')
            .select(`
                *,
                trip:trips(
                    *,
                    destination:destinations(*)
                )
            `)
            .eq('user_id', user.id)
            .limit(5);
            
        if (error) {
            console.error('❌ Erro ao buscar reservas:', error);
            return false;
        }
        
        console.log('✅ Reservas carregadas:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao buscar reservas:', err);
        return false;
    }
}

// 5. Teste de status de autenticação
async function testarAutenticacao() {
    try {
        console.log('🔐 Testando status de autenticação...');
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error) {
            console.error('❌ Erro ao verificar autenticação:', error);
            return false;
        }
        
        if (user) {
            console.log('✅ Usuário logado:', user.email);
            
            // Verificar perfil
            const { data: profile, error: profileError } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
                
            if (profileError) {
                console.error('❌ Erro ao buscar perfil:', profileError);
                return false;
            }
            
            console.log('✅ Perfil encontrado:', profile);
        } else {
            console.log('⚠️ Usuário não logado');
        }
        
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado na autenticação:', err);
        return false;
    }
}

// 6. Executar todos os testes
async function executarTodosOsTestes() {
    console.log('🚀 Iniciando testes de conexão e dados...');
    
    const resultados = {
        conexao: await testarConexao(),
        autenticacao: await testarAutenticacao(),
        destinos: await testarDestinos(),
        viagens: await testarViagens(),
        reservas: await testarReservas()
    };
    
    console.log('📊 Resultados dos testes:', resultados);
    
    const todosPassaram = Object.values(resultados).every(resultado => resultado === true);
    
    if (todosPassaram) {
        console.log('🎉 Todos os testes passaram! A aplicação deve estar funcionando.');
    } else {
        console.log('⚠️ Alguns testes falharam. Verifique os logs acima para detalhes.');
    }
    
    return resultados;
}

// Executar testes automaticamente
executarTodosOsTestes();

// Disponibilizar funções globalmente para testes manuais
window.testarConexao = testarConexao;
window.testarDestinos = testarDestinos;
window.testarViagens = testarViagens;
window.testarReservas = testarReservas;
window.testarAutenticacao = testarAutenticacao;
window.executarTodosOsTestes = executarTodosOsTestes;
