// TESTE DE ADMIN ROLE - Execute este código no console (F12)
// Este script testa se o role do usuário está sendo carregado corretamente

console.log('🧪 Testando verificação de admin role...');

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
    console.log('🆔 User ID:', user.id);
    
    // 3. Testar consulta de perfil
    console.log('👤 Testando consulta de perfil...');
    
    window.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .then(({data, error}) => {
            if (error) {
                console.log('❌ Erro na consulta de perfil:', error);
                return;
            }
            
            console.log('✅ Perfil carregado:', data);
            
            if (data && data.length > 0) {
                const profile = data[0];
                console.log('📊 Dados do perfil:');
                console.log('  - ID:', profile.id);
                console.log('  - User ID:', profile.user_id);
                console.log('  - Email:', profile.email);
                console.log('  - Full Name:', profile.full_name);
                console.log('  - Role:', profile.role);
                console.log('  - Created At:', profile.created_at);
                console.log('  - Updated At:', profile.updated_at);
                
                // 4. Verificar se é admin
                const isAdmin = profile.role === 'admin';
                console.log('👑 É admin:', isAdmin);
                
                if (isAdmin) {
                    console.log('🎉 USUÁRIO É ADMIN! A aba Admin deve aparecer!');
                } else {
                    console.log('⚠️ Usuário não é admin. Role atual:', profile.role);
                }
            } else {
                console.log('❌ Nenhum perfil encontrado para este usuário!');
                console.log('🔧 Isso pode ser o problema. O perfil não foi criado automaticamente.');
            }
        });
    
    // 5. Testar consulta específica de role (como no useAdmin)
    console.log('🔍 Testando consulta específica de role...');
    
    window.supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()
        .then(({data, error}) => {
            if (error) {
                console.log('❌ Erro na consulta de role:', error);
                console.log('🔍 Detalhes do erro:', error);
            } else {
                console.log('✅ Role carregado:', data);
                console.log('👑 Role específico:', data?.role);
                console.log('🔍 É admin (verificação):', data?.role === 'admin');
            }
        });
    
    // 6. Verificar se há dados na tabela profiles
    console.log('📊 Verificando dados na tabela profiles...');
    
    window.supabase
        .from('profiles')
        .select('*')
        .then(({data, error}) => {
            if (error) {
                console.log('❌ Erro ao verificar tabela profiles:', error);
            } else {
                console.log('✅ Total de perfis na tabela:', data.length);
                console.log('📋 Perfis encontrados:');
                data.forEach((profile, index) => {
                    console.log(`  ${index + 1}. ${profile.email} - Role: ${profile.role}`);
                });
            }
        });
    
    console.log('🎯 Teste concluído! Verifique os resultados acima.');
});
