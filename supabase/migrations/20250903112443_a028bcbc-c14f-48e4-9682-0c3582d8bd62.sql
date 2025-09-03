-- Criar enum primeiro, depois adicionar coluna

-- Criar enum para preferência de pagamento
CREATE TYPE payment_preference AS ENUM ('pix', 'cartao_credito', 'cartao_debito');

-- Adicionar coluna com o enum
ALTER TABLE payments 
ADD COLUMN payment_method_preference payment_preference NOT NULL DEFAULT 'pix';