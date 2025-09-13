# 🚨 SOLUÇÃO DEFINITIVA - Erro de Autenticação Persistente

## 🔍 Diagnóstico do Problema

O erro "Este email já está cadastrado" pode ter várias causas:

1. **Dados órfãos** no banco (usuários sem perfil correspondente)
2. **Trigger não funcionando** corretamente
3. **Políticas RLS** bloqueando operações
4. **Configurações de autenticação** incorretas
5. **Cache** da aplicação com dados antigos

## 🛠️ SOLUÇÃO COMPLETA (Execute na Ordem)

### PASSO 1: Limpeza Completa do Banco

Execute este script no **SQL Editor do Supabase**:

```sql
-- LIMPEZA COMPLETA E RECONFIGURAÇÃO
-- ⚠️ ATENÇÃO: Este script vai limpar dados órfãos

-- 1. Remover perfis órfãos
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. Limpar todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 3. Remover trigger e função existentes
DROP TRIGGER IF EXISTS ensure_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.ensure_user_profile() CASCADE;
```

### PASSO 2: Recriar Estrutura Correta

```sql
-- RECRIAÇÃO COMPLETA DA ESTRUTURA

-- 1. Garantir constraint UNIQUE
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- 2. Recriar função com tratamento de erro
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Criar trigger
CREATE TRIGGER ensure_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- 4. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas limpas
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. Criar perfis para usuários existentes
INSERT INTO public.profiles (user_id, email, full_name, phone)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(u.raw_user_meta_data ->> 'phone', '')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
```

### PASSO 3: Configurar Autenticação

No **Dashboard do Supabase** → **Authentication** → **Settings**:

1. **Desabilitar confirmação de email** temporariamente:
   - `Enable email confirmations` = OFF

2. **Verificar configurações**:
   - `Enable phone confirmations` = OFF
   - `Enable signup` = ON

**⚠️ IMPORTANTE:** As configurações são feitas via interface, não via SQL.

### PASSO 4: Limpar Cache da Aplicação

1. **Limpar localStorage**:
   ```javascript
   // Execute no console do navegador
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Recarregar a aplicação** com cache limpo:
   - Pressione `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)

### PASSO 5: Teste com Email Novo

1. **Use um email completamente novo** (ex: `teste123@exemplo.com`)
2. **Teste o registro** primeiro
3. **Depois teste o login**

### PASSO 6: Verificação Final

Execute este script para verificar se tudo está funcionando:

```sql
-- VERIFICAÇÃO FINAL
SELECT 
    'Verificação concluída!' as status,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users u 
     LEFT JOIN public.profiles p ON u.id = p.user_id 
     WHERE p.id IS NULL) as users_without_profile;
```

## 🧪 Teste Manual no Console

Execute este código no **console do navegador** (F12):

```javascript
// Teste de registro com email único
const email = `teste_${Date.now()}@exemplo.com`;
const senha = 'Teste123456';

window.supabase.auth.signUp({
    email: email,
    password: senha,
    options: {
        data: {
            full_name: 'Usuário Teste',
            phone: '11999999999'
        }
    }
}).then(({ data, error }) => {
    if (error) {
        console.error('❌ Erro:', error);
    } else {
        console.log('✅ Sucesso:', data);
    }
});
```

## 🚨 Se Ainda Não Funcionar

1. **Verifique os logs** no console do navegador
2. **Execute o script de diagnóstico** (`diagnostico_auth.sql`)
3. **Verifique se o Supabase está online** em [status.supabase.com](https://status.supabase.com)
4. **Teste com um projeto Supabase novo** para isolar o problema

## 📞 Próximos Passos

Após executar todos os passos:

1. ✅ Teste registro com email novo
2. ✅ Teste login com credenciais válidas  
3. ✅ Verifique se o perfil é criado automaticamente
4. ✅ Teste navegação entre páginas protegidas

---

**Esta solução deve resolver definitivamente o problema de autenticação!** 🎉
