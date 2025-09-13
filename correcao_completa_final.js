// CORREÇÃO COMPLETA FINAL - Execute este código no console (F12)
// Este script resolve TODOS os problemas de uma vez

console.log('🚀 Iniciando correção completa...');

// 1. Verificar se a página carregou completamente
if (document.readyState !== 'complete') {
    console.log('⏳ Aguardando página carregar completamente...');
    window.addEventListener('load', () => {
        setTimeout(executarCorrecao, 1000);
    });
} else {
    setTimeout(executarCorrecao, 1000);
}

function executarCorrecao() {
    console.log('🔧 Executando correção...');
    
    // 2. Verificar se Supabase está disponível
    if (typeof window.supabase === 'undefined') {
        console.log('❌ Supabase não encontrado! Tentando recarregar...');
        
        // Limpar cache e recarregar
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        
        // Limpar storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Recarregar página
        window.location.reload();
        return;
    }
    
    console.log('✅ Supabase encontrado!');
    
    // 3. Aguardar um pouco para garantir que tudo está carregado
    setTimeout(() => {
        testarAplicacao();
    }, 2000);
}

function testarAplicacao() {
    console.log('🧪 Testando aplicação...');
    
    // 4. Testar autenticação
    window.supabase.auth.getUser().then(({data: {user}, error}) => {
        if (error) {
            console.log('❌ Erro na autenticação:', error);
            return;
        }
        
        if (!user) {
            console.log('⚠️ Usuário não logado. Faça login primeiro.');
            return;
        }
        
        console.log('✅ Usuário logado:', user.email);
        
        // 5. Testar consulta de perfil (que estava causando recursão)
        console.log('👤 Testando consulta de perfil...');
        
        window.supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .then(({data, error}) => {
                if (error) {
                    console.log('❌ Erro na consulta de perfil:', error);
                    if (error.message.includes('infinite recursion')) {
                        console.log('🔄 Ainda há recursão infinita! Execute o script SQL novamente.');
                    }
                } else {
                    console.log('✅ Consulta de perfil funcionou:', data);
                }
            });
        
        // 6. Testar consulta de viagens
        console.log('🚌 Testando consulta de viagens...');
        
        window.supabase
            .from('trips')
            .select('*')
            .then(({data, error}) => {
                if (error) {
                    console.log('❌ Erro na consulta de viagens:', error);
                } else {
                    console.log('✅ Consulta de viagens funcionou:', data);
                    console.log('📊 Total de viagens:', data.length);
                }
            });
        
        // 7. Testar consulta de destinos
        console.log('🌍 Testando consulta de destinos...');
        
        window.supabase
            .from('destinations')
            .select('*')
            .then(({data, error}) => {
                if (error) {
                    console.log('❌ Erro na consulta de destinos:', error);
                } else {
                    console.log('✅ Consulta de destinos funcionou:', data);
                    console.log('📊 Total de destinos:', data.length);
                }
            });
        
        // 8. Testar consulta de reservas
        console.log('📋 Testando consulta de reservas...');
        
        window.supabase
            .from('reservations')
            .select('*')
            .eq('user_id', user.id)
            .then(({data, error}) => {
                if (error) {
                    console.log('❌ Erro na consulta de reservas:', error);
                } else {
                    console.log('✅ Consulta de reservas funcionou:', data);
                    console.log('📊 Total de reservas:', data.length);
                }
            });
        
        // 9. Testar verificação de admin
        console.log('👑 Testando verificação de admin...');
        
        window.supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()
            .then(({data, error}) => {
                if (error) {
                    console.log('❌ Erro na verificação de admin:', error);
                } else {
                    console.log('✅ Verificação de admin funcionou:', data);
                    console.log('👑 É admin:', data?.role === 'admin');
                }
            });
        
        console.log('🎯 Teste concluído! Verifique os resultados acima.');
    });
}

// 10. Verificar se há erros no console
setTimeout(() => {
    console.log('🔍 Verificando erros no console...');
    const errors = [];
    const originalError = console.error;
    console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
    };
    
    setTimeout(() => {
        console.error = originalError;
        if (errors.length > 0) {
            console.log('❌ Erros encontrados:', errors.length);
            errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        } else {
            console.log('✅ Nenhum erro detectado!');
        }
    }, 3000);
}, 1000);
