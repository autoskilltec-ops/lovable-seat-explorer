// TESTE ESPECÍFICO PARA PROBLEMA DE RESERVAS
// Execute este script no console do navegador (F12)

console.log('🔍 Testando problema específico de reservas...');

// 1. Teste de autenticação
async function testarAutenticacao() {
    try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error) {
            console.error('❌ Erro de autenticação:', error);
            return false;
        }
        
        if (!user) {
            console.log('⚠️ Usuário não logado - faça login primeiro');
            return false;
        }
        
        console.log('✅ Usuário logado:', user.email);
        return user;
    } catch (err) {
        console.error('❌ Erro inesperado na autenticação:', err);
        return false;
    }
}

// 2. Teste de consulta de reservas
async function testarConsultaReservas(user) {
    try {
        console.log('📋 Testando consulta de reservas...');
        
        const { data, error } = await window.supabase
            .from('reservations')
            .select(`
                id,
                plan_type,
                passengers,
                total_amount,
                status,
                codigo_confirmacao,
                created_at,
                trip:trips (
                    id,
                    departure_date,
                    return_date,
                    destination:destinations (
                        name,
                        state
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('❌ Erro ao buscar reservas:', error);
            console.error('Detalhes do erro:', error.message);
            return false;
        }
        
        console.log('✅ Reservas carregadas:', data);
        console.log('📊 Total de reservas:', data.length);
        return data;
    } catch (err) {
        console.error('❌ Erro inesperado ao buscar reservas:', err);
        return false;
    }
}

// 3. Teste de consulta simples de reservas
async function testarConsultaSimples(user) {
    try {
        console.log('📋 Testando consulta simples de reservas...');
        
        const { data, error } = await window.supabase
            .from('reservations')
            .select('*')
            .eq('user_id', user.id);
            
        if (error) {
            console.error('❌ Erro na consulta simples:', error);
            return false;
        }
        
        console.log('✅ Consulta simples funcionou:', data);
        return data;
    } catch (err) {
        console.error('❌ Erro inesperado na consulta simples:', err);
        return false;
    }
}

// 4. Teste de permissões RLS
async function testarPermissoesRLS(user) {
    try {
        console.log('🔐 Testando permissões RLS...');
        
        // Testar se consegue ver suas próprias reservas
        const { data, error } = await window.supabase
            .from('reservations')
            .select('id, user_id, status')
            .eq('user_id', user.id)
            .limit(1);
            
        if (error) {
            console.error('❌ Erro de permissão RLS:', error);
            return false;
        }
        
        console.log('✅ Permissões RLS funcionando:', data);
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado nas permissões RLS:', err);
        return false;
    }
}

// 5. Teste de criação de reserva de teste
async function criarReservaTeste(user) {
    try {
        console.log('➕ Criando reserva de teste...');
        
        // Buscar uma viagem disponível
        const { data: trips, error: tripsError } = await window.supabase
            .from('trips')
            .select('id, destination_id')
            .limit(1);
            
        if (tripsError || !trips || trips.length === 0) {
            console.error('❌ Nenhuma viagem disponível:', tripsError);
            return false;
        }
        
        const trip = trips[0];
        
        // Criar reserva de teste
        const { data, error } = await window.supabase
            .from('reservations')
            .insert({
                user_id: user.id,
                trip_id: trip.id,
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
            console.error('❌ Erro ao criar reserva de teste:', error);
            return false;
        }
        
        console.log('✅ Reserva de teste criada:', data);
        return data;
    } catch (err) {
        console.error('❌ Erro inesperado ao criar reserva de teste:', err);
        return false;
    }
}

// 6. Executar todos os testes
async function executarTestesReservas() {
    console.log('🚀 Iniciando testes específicos de reservas...');
    
    // 1. Testar autenticação
    const user = await testarAutenticacao();
    if (!user) {
        console.log('❌ Teste interrompido - usuário não logado');
        return;
    }
    
    // 2. Testar permissões RLS
    const permissoesOk = await testarPermissoesRLS(user);
    if (!permissoesOk) {
        console.log('❌ Problema com permissões RLS');
        return;
    }
    
    // 3. Testar consulta simples
    const consultaSimplesOk = await testarConsultaSimples(user);
    if (!consultaSimplesOk) {
        console.log('❌ Problema na consulta simples');
        return;
    }
    
    // 4. Testar consulta complexa
    const consultaComplexaOk = await testarConsultaReservas(user);
    if (!consultaComplexaOk) {
        console.log('❌ Problema na consulta complexa');
        return;
    }
    
    // 5. Se não há reservas, criar uma de teste
    if (consultaComplexaOk && consultaComplexaOk.length === 0) {
        console.log('⚠️ Nenhuma reserva encontrada, criando uma de teste...');
        await criarReservaTeste(user);
    }
    
    console.log('🎉 Testes de reservas concluídos!');
}

// Executar testes automaticamente
executarTestesReservas();

// Disponibilizar funções globalmente
window.testarReservas = executarTestesReservas;
window.criarReservaTeste = criarReservaTeste;
