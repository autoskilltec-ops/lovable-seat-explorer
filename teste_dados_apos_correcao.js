// TESTE DE DADOS APÓS CORREÇÃO - Execute este código no console (F12)
// Execute APÓS aplicar o script SQL de correção das políticas RLS

console.log('🧪 Testando dados após correção das políticas RLS...');

// 1. Verificar se Supabase está disponível
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
    
    // 3. Testar consulta de destinos (deve aparecer para todos)
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
                
                if (data.length > 0) {
                    console.log('🎉 DESTINOS APARECENDO! Problema resolvido!');
                } else {
                    console.log('⚠️ Nenhum destino encontrado. Verifique se há dados na tabela.');
                }
            }
        });
    
    // 4. Testar consulta de viagens (deve aparecer para todos)
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
                
                if (data.length > 0) {
                    console.log('🎉 VIAGENS APARECENDO! Problema resolvido!');
                } else {
                    console.log('⚠️ Nenhuma viagem encontrada. Verifique se há dados na tabela.');
                }
            }
        });
    
    // 5. Testar consulta de assentos (deve aparecer para todos)
    console.log('🪑 Testando consulta de assentos...');
    
    window.supabase
        .from('bus_seats')
        .select('*')
        .then(({data, error}) => {
            if (error) {
                console.log('❌ Erro na consulta de assentos:', error);
            } else {
                console.log('✅ Consulta de assentos funcionou:', data);
                console.log('📊 Total de assentos:', data.length);
            }
        });
    
    // 6. Testar consulta de reservas (deve aparecer apenas para o usuário logado)
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
    
    // 7. Testar consulta de perfil
    console.log('👤 Testando consulta de perfil...');
    
    window.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .then(({data, error}) => {
            if (error) {
                console.log('❌ Erro na consulta de perfil:', error);
            } else {
                console.log('✅ Consulta de perfil funcionou:', data);
                console.log('👑 É admin:', data[0]?.role === 'admin');
            }
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
    
    console.log('🎯 Teste concluído! Verifique os resultados acima.');
});
