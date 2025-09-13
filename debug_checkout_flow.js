// Script de debug para testar o fluxo do checkout
// Execute no console do navegador para testar

// Função para testar a função update_customer_data
async function testUpdateCustomerData() {
  try {
    const { data, error } = await supabase.rpc('update_customer_data', {
      _user_id: 'USER_ID_AQUI', // Substitua pelo ID do usuário atual
      _customer_name: 'João Silva Teste',
      _customer_phone: '85999999999',
      _customer_email: 'joao.teste@email.com',
      _customer_cpf: '12345678901',
      _emergency_contact: 'Maria Silva - 85988888888',
    });
    
    if (error) {
      console.error('Erro ao atualizar dados do cliente:', error);
      return false;
    }
    
    console.log('Dados do cliente atualizados com sucesso!');
    return true;
  } catch (err) {
    console.error('Erro na função update_customer_data:', err);
    return false;
  }
}

// Função para testar a verificação de admin
async function testAdminCheck() {
  try {
    const { data, error } = await supabase.rpc('is_verified_admin', {
      _user_id: 'USER_ID_AQUI', // Substitua pelo ID do usuário atual
    });
    
    if (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
    
    console.log('Status de admin:', data);
    return data;
  } catch (err) {
    console.error('Erro na verificação de admin:', err);
    return false;
  }
}

// Função para testar a obtenção de dados do cliente
async function testGetCustomerData() {
  try {
    const { data, error } = await supabase.rpc('get_customer_data', {
      _user_id: 'USER_ID_AQUI', // Substitua pelo ID do usuário atual
    });
    
    if (error) {
      console.error('Erro ao obter dados do cliente:', error);
      return false;
    }
    
    console.log('Dados do cliente:', data);
    return data;
  } catch (err) {
    console.error('Erro na obtenção de dados do cliente:', err);
    return false;
  }
}

// Função para executar todos os testes
async function runAllTests() {
  console.log('=== TESTANDO FLUXO DE DADOS DE CLIENTE ===');
  
  console.log('\n1. Testando verificação de admin...');
  const adminStatus = await testAdminCheck();
  
  console.log('\n2. Testando atualização de dados do cliente...');
  const updateResult = await testUpdateCustomerData();
  
  console.log('\n3. Testando obtenção de dados do cliente...');
  const getResult = await testGetCustomerData();
  
  console.log('\n=== RESULTADOS ===');
  console.log('Admin:', adminStatus);
  console.log('Update Customer Data:', updateResult);
  console.log('Get Customer Data:', getResult);
  
  return {
    admin: adminStatus,
    update: updateResult,
    get: getResult
  };
}

// Executar testes
// runAllTests();
