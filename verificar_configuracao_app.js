// VERIFICAR CONFIGURAÇÃO DA APLICAÇÃO
// Execute este script no console do navegador (F12)

console.log('🔍 Verificando configuração da aplicação...');

// 1. Verificar se a aplicação está rodando
function verificarAppRodando() {
    console.log('📱 Verificando se a aplicação está rodando...');
    
    const reactRoot = document.querySelector('#root');
    if (!reactRoot) {
        console.log('❌ Elemento #root não encontrado');
        return false;
    }
    
    console.log('✅ Elemento #root encontrado');
    
    // Verificar se há conteúdo
    const content = reactRoot.innerHTML;
    if (content.length < 50) {
        console.log('⚠️ Conteúdo muito pequeno, aplicação pode não ter carregado');
        return false;
    }
    
    console.log('✅ Conteúdo da aplicação carregado');
    return true;
}

// 2. Verificar scripts carregados
function verificarScripts() {
    console.log('📜 Verificando scripts carregados...');
    
    const scripts = document.querySelectorAll('script[src]');
    console.log('📊 Total de scripts:', scripts.length);
    
    const supabaseScripts = Array.from(scripts).filter(script => 
        script.src.includes('supabase') || script.src.includes('supabase-js')
    );
    
    if (supabaseScripts.length > 0) {
        console.log('✅ Scripts do Supabase encontrados:', supabaseScripts.length);
        supabaseScripts.forEach(script => {
            console.log('  -', script.src);
        });
    } else {
        console.log('❌ Nenhum script do Supabase encontrado');
    }
    
    return supabaseScripts.length > 0;
}

// 3. Verificar módulos ES6
function verificarModulos() {
    console.log('📦 Verificando módulos ES6...');
    
    const modules = document.querySelectorAll('script[type="module"]');
    console.log('📊 Total de módulos:', modules.length);
    
    modules.forEach(module => {
        console.log('  -', module.src || 'inline');
    });
    
    return modules.length > 0;
}

// 4. Verificar erros de rede
function verificarErrosRede() {
    console.log('🌐 Verificando erros de rede...');
    
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        console.log('📊 Tempo de carregamento:', nav.loadEventEnd - nav.loadEventStart, 'ms');
        console.log('📊 Status:', nav.responseStatus);
    }
    
    // Verificar recursos que falharam
    const resourceEntries = performance.getEntriesByType('resource');
    const failedResources = resourceEntries.filter(resource => 
        resource.transferSize === 0 && resource.decodedBodySize === 0
    );
    
    if (failedResources.length > 0) {
        console.log('❌ Recursos que falharam:', failedResources.length);
        failedResources.forEach(resource => {
            console.log('  -', resource.name);
        });
    } else {
        console.log('✅ Todos os recursos carregaram com sucesso');
    }
    
    return failedResources.length === 0;
}

// 5. Verificar se há erros JavaScript
function verificarErrosJS() {
    console.log('🐛 Verificando erros JavaScript...');
    
    // Interceptar erros
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
    };
    
    // Restaurar após um tempo
    setTimeout(() => {
        console.error = originalError;
        
        if (errors.length > 0) {
            console.log('❌ Erros JavaScript encontrados:', errors.length);
            errors.forEach(error => {
                console.log('  -', error);
            });
        } else {
            console.log('✅ Nenhum erro JavaScript detectado');
        }
    }, 1000);
    
    return true;
}

// 6. Verificar variáveis globais
function verificarVariaveisGlobais() {
    console.log('🌍 Verificando variáveis globais...');
    
    const variaveis = [
        'window.React',
        'window.ReactDOM',
        'window.supabase',
        'window.__REACT_DEVTOOLS_GLOBAL_HOOK__'
    ];
    
    variaveis.forEach(variavel => {
        const valor = eval(variavel);
        console.log(`${variavel}:`, typeof valor !== 'undefined' ? '✅' : '❌');
    });
    
    return true;
}

// 7. Verificar se a aplicação está em modo de desenvolvimento
function verificarModoDesenvolvimento() {
    console.log('🔧 Verificando modo de desenvolvimento...');
    
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port !== '';
    
    console.log('📊 Modo de desenvolvimento:', isDev ? 'Sim' : 'Não');
    console.log('📊 URL:', window.location.href);
    
    return isDev;
}

// 8. Executar todas as verificações
function executarTodasVerificacoes() {
    console.log('🚀 Executando todas as verificações...');
    
    const resultados = {
        app: verificarAppRodando(),
        scripts: verificarScripts(),
        modulos: verificarModulos(),
        rede: verificarErrosRede(),
        js: verificarErrosJS(),
        globais: verificarVariaveisGlobais(),
        dev: verificarModoDesenvolvimento()
    };
    
    console.log('📊 Resultados das verificações:', resultados);
    
    const problemas = Object.entries(resultados).filter(([key, value]) => !value);
    
    if (problemas.length > 0) {
        console.log('⚠️ Problemas encontrados:', problemas.map(([key]) => key));
    } else {
        console.log('✅ Todas as verificações passaram');
    }
    
    return resultados;
}

// Executar verificações automaticamente
executarTodasVerificacoes();

// Disponibilizar funções globalmente
window.verificarApp = executarTodasVerificacoes;
