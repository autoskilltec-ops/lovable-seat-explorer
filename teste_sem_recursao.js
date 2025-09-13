// TESTE PARA VERIFICAR SE A RECURSÃO FOI CORRIGIDA
// Execute este script no console do navegador (F12)

console.log('🔍 Testando se a recursão infinita foi corrigida...');

// 1. Teste de consulta simples de perfil
async function testarConsultaPerfil() {
    try {
        console.log('👤 Testando consulta de perfil...');
        
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('user_id', (await window.supabase.auth.getUser()).data.user?.id)
            .single();
            
        if (error) {
            console.error('❌ Erro ao buscar perfil:', error);
            return false;
        }
        
        console.log('✅ Perfil carregado com sucesso:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao buscar perfil:', err);
        return false;
    }
}

// 2. Teste de atualização de perfil
async function testarAtualizacaoPerfil() {
    try {
        console.log('✏️ Testando atualização de perfil...');
        
        const user = (await window.supabase.auth.getUser()).data.user;
        if (!user) {
            console.log('⚠️ Usuário não logado');
            return false;
        }
        
        const { data, error } = await window.supabase
            .from('profiles')
            .update({ 
                full_name: 'Teste ' + new Date().toISOString().slice(0, 10)
            })
            .eq('user_id', user.id)
            .select();
            
        if (error) {
            console.error('❌ Erro ao atualizar perfil:', error);
            return false;
        }
        
        console.log('✅ Perfil atualizado com sucesso:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao atualizar perfil:', err);
        return false;
    }
}

// 3. Teste de consulta de reservas (que pode causar recursão)
async function testarConsultaReservas() {
    try {
        console.log('📋 Testando consulta de reservas...');
        
        const user = (await window.supabase.auth.getUser()).data.user;
        if (!user) {
            console.log('⚠️ Usuário não logado');
            return false;
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
            .eq('user_id', user.id);
            
        if (error) {
            console.error('❌ Erro ao buscar reservas:', error);
            return false;
        }
        
        console.log('✅ Reservas carregadas com sucesso:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao buscar reservas:', err);
        return false;
    }
}

// 4. Teste de criação de reserva (fluxo completo)
async function testarCriacaoReserva() {
    try {
        console.log('➕ Testando criação de reserva...');
        
        const user = (await window.supabase.auth.getUser()).data.user;
        if (!user) {
            console.log('⚠️ Usuário não logado');
            return false;
        }
        
        // Buscar uma viagem disponível
        const { data: trips, error: tripsError } = await window.supabase
            .from('trips')
            .select('id')
            .limit(1);
            
        if (tripsError || !trips || trips.length === 0) {
            console.error('❌ Nenhuma viagem disponível:', tripsError);
            return false;
        }
        
        // Criar reserva de teste
        const { data, error } = await window.supabase
            .from('reservations')
            .insert({
                user_id: user.id,
                trip_id: trips[0].id,
                seat_ids: [],
                plan_type: 'individual',
                passengers: 1,
                total_amount: 980.00,
                status: 'pendente',
                codigo_confirmacao: 'TEST' + Math.random().toString(36).substr(2, 4).toUpperCase(),
                customer_name: 'Usuário Teste',
                customer_phone: '11999999999'
            })
            .select()
            .single();
            
        if (error) {
            console.error('❌ Erro ao criar reserva:', error);
            return false;
        }
        
        console.log('✅ Reserva criada com sucesso:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado ao criar reserva:', err);
        return false;
    }
}

// 5. Executar todos os testes
async function executarTestesSemRecursao() {
    console.log('🚀 Iniciando testes para verificar correção da recursão...');
    
    const resultados = {
        perfil: await testarConsultaPerfil(),
        atualizacaoPerfil: await testarAtualizacaoPerfil(),
        reservas: await testarConsultaReservas(),
        criacaoReserva: await testarCriacaoReserva()
    };
    
    console.log('📊 Resultados dos testes:', resultados);
    
    const todosPassaram = Object.values(resultados).every(resultado => resultado === true);
    
    if (todosPassaram) {
        console.log('🎉 Todos os testes passaram! A recursão foi corrigida.');
    } else {
        console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
    }
    
    return resultados;
}

// Executar testes automaticamente
executarTestesSemRecursao();

// Disponibilizar funções globalmente
window.testarSemRecursao = executarTestesSemRecursao;
