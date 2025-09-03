-- Simplificar sistema para pré-cadastro e WhatsApp
-- Remover campos desnecessários das tabelas de pagamento e reserva

-- Simplificar tabela payments para apenas registrar intenção
ALTER TABLE payments 
DROP COLUMN IF EXISTS stripe_session_id,
DROP COLUMN IF EXISTS installments,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS pix_payload;

-- Adicionar campos para controle via WhatsApp
ALTER TABLE payments 
ADD COLUMN whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_method_preference TEXT NOT NULL DEFAULT 'pix';

-- Simplificar status de reserva
ALTER TABLE reservations
DROP COLUMN IF EXISTS seat_ids;

-- Adicionar campos necessários para pré-cadastro
ALTER TABLE reservations
ADD COLUMN customer_email TEXT NOT NULL DEFAULT '',
ADD COLUMN customer_cpf TEXT,
ADD COLUMN emergency_contact TEXT;

-- Remover tabela bus_seats pois não teremos seleção específica de assentos
DROP TABLE IF EXISTS bus_seats CASCADE;

-- Criar enum simplificado para método de pagamento preferido
CREATE TYPE payment_preference AS ENUM ('pix', 'cartao_credito', 'cartao_debito');

ALTER TABLE payments 
ALTER COLUMN payment_method_preference TYPE payment_preference USING payment_method_preference::payment_preference;