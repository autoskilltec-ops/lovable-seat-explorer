// CORREÇÃO DIRETA - Execute este código no console (F12)

console.log('🔧 Iniciando correção direta...');

// 1. Verificar status atual
console.log('📊 Status atual:');
console.log('  - Supabase:', typeof window.supabase !== 'undefined');
console.log('  - Auth:', typeof window.supabase?.auth !== 'undefined');
console.log('  - Página carregada:', document.readyState === 'complete');

// 2. Se Supabase não estiver disponível, recarregar
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
    
    // Limpar localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Recarregar página
    window.location.reload();
} else {
    console.log('✅ Supabase encontrado!');
    
    // 3. Testar autenticação
    console.log('🔐 Testando autenticação...');
    
    window.supabase.auth.getUser().then(({data: {user}, error}) => {
        if (error) {
            console.log('❌ Erro na autenticação:', error);
            return;
        }
        
        if (user) {
            console.log('✅ Usuário logado:', user.email);
            
            // 4. Testar consulta de reservas
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
        } else {
            console.log('⚠️ Usuário não logado');
            console.log('🔐 Faça login na aplicação e teste novamente');
        }
    });
}

console.log('🎯 Correção direta concluída!');
