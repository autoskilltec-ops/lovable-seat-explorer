// TESTE SIMPLES DO SUPABASE - Execute este código no console (F12)

console.log('🔍 Testando Supabase...');

// 1. Verificar se Supabase está disponível
console.log('📊 Supabase disponível:', typeof window.supabase !== 'undefined');

if (typeof window.supabase === 'undefined') {
    console.log('❌ Supabase não encontrado!');
    console.log('🔄 Recarregando página...');
    
    // Limpar cache e recarregar
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
    }
    
    localStorage.clear();
    sessionStorage.clear();
    
    window.location.reload();
} else {
    console.log('✅ Supabase encontrado!');
    
    // 2. Testar autenticação
    console.log('🔐 Testando autenticação...');
    
    window.supabase.auth.getUser().then(({data: {user}, error}) => {
        if (error) {
            console.log('❌ Erro na autenticação:', error);
        } else if (!user) {
            console.log('⚠️ Usuário não logado');
        } else {
            console.log('✅ Usuário logado:', user.email);
            
            // 3. Testar consulta simples
            console.log('📋 Testando consulta de perfil...');
            
            window.supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .then(({data, error}) => {
                    if (error) {
                        console.log('❌ Erro na consulta:', error);
                    } else {
                        console.log('✅ Consulta funcionou:', data);
                    }
                });
        }
    });
}
