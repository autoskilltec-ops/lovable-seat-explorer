// CORREÇÃO DO ADMIN ROLE - Execute este código no console (F12)
// Este script corrige o problema do role de admin não ser reconhecido

console.log('🔧 Corrigindo problema do admin role...');

// 1. Verificar se Supabase está disponível
if (typeof window.supabase === 'undefined') {
    console.log('❌ Supabase não encontrado! Recarregue a página.');
    return;
}

console.log('✅ Supabase encontrado!');

// 2. Testar autenticação
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
    
    // 3. Verificar se o perfil existe
    window.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .then(({data, error}) => {
            if (error) {
                console.log('❌ Erro na consulta de perfil:', error);
                return;
            }
            
            if (!data || data.length === 0) {
                console.log('❌ Perfil não encontrado! Criando perfil...');
                
                // Criar perfil se não existir
                window.supabase
                    .from('profiles')
                    .insert({
                        user_id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || user.email,
                        role: 'user',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .then(({data, error}) => {
                        if (error) {
                            console.log('❌ Erro ao criar perfil:', error);
                        } else {
                            console.log('✅ Perfil criado com sucesso!');
                        }
                    });
            } else {
                console.log('✅ Perfil encontrado:', data[0]);
                
                // 4. Verificar se o usuário é admin
                const profile = data[0];
                const isAdmin = profile.role === 'admin';
                
                console.log('👑 Role atual:', profile.role);
                console.log('👑 É admin:', isAdmin);
                
                if (!isAdmin) {
                    console.log('⚠️ Usuário não é admin. Para tornar admin, execute:');
                    console.log(`
                        // Cole este código no console para tornar admin:
                        window.supabase
                            .from('profiles')
                            .update({ role: 'admin' })
                            .eq('user_id', '${user.id}')
                            .then(({data, error}) => {
                                if (error) {
                                    console.log('❌ Erro ao tornar admin:', error);
                                } else {
                                    console.log('✅ Usuário tornado admin! Recarregue a página.');
                                }
                            });
                    `);
                } else {
                    console.log('🎉 Usuário já é admin!');
                    
                    // 5. Testar se o hook useAdmin funcionaria
                    console.log('🔍 Testando consulta como no useAdmin...');
                    
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
                                console.log('✅ Consulta de role funcionou:', data);
                                console.log('👑 Role retornado:', data?.role);
                                console.log('🔍 É admin (verificação):', data?.role === 'admin');
                                
                                if (data?.role === 'admin') {
                                    console.log('🎉 TUDO FUNCIONANDO! A aba Admin deve aparecer!');
                                    console.log('🔄 Recarregue a página para ver a aba Admin.');
                                }
                            }
                        });
                }
            }
        });
    
    console.log('🎯 Correção concluída! Verifique os resultados acima.');
});
