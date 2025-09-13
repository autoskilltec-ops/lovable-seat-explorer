// TESTE APÓS CORREÇÃO - Execute este código no console (F12)
// Execute APÓS aplicar o script SQL de correção

console.log('🧪 Testando aplicação após correção...');

// 1. Verificar se Supabase está funcionando
if (typeof window.supabase === 'undefined') {
    console.log('❌ Supabase não encontrado! Recarregue a página.');
    return;
}

console.log('✅ Supabase encontrado!');

// 2. Testar autenticação
console.log('🔐 Testando autenticação...');

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
    
    // 3. Testar consulta de perfil (que estava causando recursão)
    console.log('👤 Testando consulta de perfil...');
    
    window.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .then(({data, error}) => {
            if (error) {
                console.log('❌ Erro na consulta de perfil:', error);
                if (error.message.includes('infinite recursion')) {
                    console.log('🔄 Ainda há recursão infinita! Aplique o script SQL novamente.');
                }
            } else {
                console.log('✅ Consulta de perfil funcionou:', data);
            }
        });
    
    // 4. Testar consulta de viagens
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
    
    // 5. Testar consulta de destinos
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
    
    // 6. Testar consulta de reservas
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
    
    // 7. Testar verificação de admin
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

// 8. Verificar se há erros no console
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
    }, 2000);
}, 1000);
