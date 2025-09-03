-- Corrigir erro de tipo - remover e recriar coluna payment_method_preference

-- Primeiro remover a coluna problemática
ALTER TABLE payments DROP COLUMN IF EXISTS payment_method_preference;

-- Recriar com o tipo correto
ALTER TABLE payments 
ADD COLUMN payment_method_preference payment_preference NOT NULL DEFAULT 'pix';