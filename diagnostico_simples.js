// DIAGNÓSTICO SIMPLES - Execute este código no console (F12)

console.log('🔍 Diagnóstico simples de Supabase...');

// 1. Verificar se Supabase está disponível
console.log('📊 Supabase disponível:', typeof window.supabase !== 'undefined');
console.log('📊 Auth disponível:', typeof window.supabase?.auth !== 'undefined');

// 2. Verificar se a aplicação carregou
console.log('📱 Aplicação carregada:', document.readyState === 'complete');
console.log('📱 Elemento #root:', document.querySelector('#root') ? 'Encontrado' : 'Não encontrado');

// 3. Verificar scripts carregados
const scripts = document.querySelectorAll('script[src]');
console.log('📜 Total de scripts:', scripts.length);

const supabaseScripts = Array.from(scripts).filter(script => 
    script.src.includes('supabase')
);
console.log('📜 Scripts do Supabase:', supabaseScripts.length);

// 4. Verificar se há erros
console.log('🐛 Verificando erros...');
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
    } else {
        console.log('✅ Nenhum erro detectado');
    }
}, 1000);

// 5. Verificar variáveis globais importantes
console.log('🌍 Variáveis globais:');
console.log('  - window.React:', typeof window.React !== 'undefined');
console.log('  - window.ReactDOM:', typeof window.ReactDOM !== 'undefined');
console.log('  - window.supabase:', typeof window.supabase !== 'undefined');

// 6. Se Supabase não estiver disponível, tentar recarregar
if (typeof window.supabase === 'undefined') {
    console.log('⚠️ Supabase não encontrado!');
    console.log('🔄 Tentando recarregar a página...');
    
    setTimeout(() => {
        window.location.reload();
    }, 2000);
} else {
    console.log('✅ Supabase encontrado!');
    
    // Testar autenticação
    window.supabase.auth.getUser().then(({data: {user}}) => {
        console.log('👤 Usuário:', user ? user.email : 'Não logado');
    }).catch(err => {
        console.log('❌ Erro na autenticação:', err);
    });
}

console.log('🎯 Diagnóstico concluído!');
