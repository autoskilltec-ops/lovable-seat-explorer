import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReservationData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  tripDestination: string;
  departureDate: string;
  returnDate: string;
  totalAmount: number;
  passengers: number;
  planType: string;
  seatNumbers: string[];
  confirmationCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservationData }: { reservationData: ReservationData } = await req.json();
    
    console.log("Sending confirmation email for reservation:", reservationData.reservationId);

    const emailHtml = generateEmailTemplate(reservationData);

    const emailResponse = await resend.emails.send({
      from: "Confirmação de Reserva <onboarding@resend.dev>",
      to: [reservationData.customerEmail],
      subject: `Reserva Confirmada - ${reservationData.tripDestination} - Código: ${reservationData.confirmationCode}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailTemplate(data: ReservationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmação de Reserva</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: white;
          padding: 30px;
          border: 1px solid #e1e5e9;
          border-top: none;
        }
        .confirmation-code {
          background: #f8f9fa;
          border: 2px dashed #28a745;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
          border-radius: 8px;
        }
        .confirmation-code h2 {
          color: #28a745;
          margin: 0;
          font-size: 24px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        .info-item {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }
        .info-item h3 {
          margin: 0 0 5px 0;
          color: #495057;
          font-size: 14px;
          font-weight: 600;
        }
        .info-item p {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }
        .seats {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #2196f3;
        }
        .seats h3 {
          margin: 0 0 10px 0;
          color: #1976d2;
        }
        .seat-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .seat-number {
          background: #2196f3;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 0 0 8px 8px;
          text-align: center;
          color: #6c757d;
          border: 1px solid #e1e5e9;
          border-top: none;
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #28a745;
        }
        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Reserva Confirmada!</h1>
        <p>Sua viagem foi confirmada com sucesso</p>
      </div>

      <div class="content">
        <div class="confirmation-code">
          <h2>${data.confirmationCode}</h2>
          <p>Guarde este código de confirmação</p>
        </div>

        <h2>Detalhes da Reserva</h2>
        
        <div class="info-grid">
          <div class="info-item">
            <h3>Passageiro</h3>
            <p>${data.customerName}</p>
          </div>
          <div class="info-item">
            <h3>Destino</h3>
            <p>${data.tripDestination}</p>
          </div>
          <div class="info-item">
            <h3>Data de Ida</h3>
            <p>${formatDate(data.departureDate)}</p>
          </div>
          <div class="info-item">
            <h3>Data de Volta</h3>
            <p>${formatDate(data.returnDate)}</p>
          </div>
          <div class="info-item">
            <h3>Passageiros</h3>
            <p>${data.passengers} pessoa(s)</p>
          </div>
          <div class="info-item">
            <h3>Tipo de Pacote</h3>
            <p>${data.planType}</p>
          </div>
        </div>

        <div class="seats">
          <h3>Assentos Reservados</h3>
          <div class="seat-list">
            ${data.seatNumbers.map(seat => `<span class="seat-number">${seat}</span>`).join('')}
          </div>
        </div>

        <div class="info-item" style="text-align: center; margin: 30px 0;">
          <h3>Valor Total</h3>
          <div class="amount">R$ ${formatCurrency(data.totalAmount)}</div>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">📋 Informações Importantes</h3>
          <ul style="margin: 0; padding-left: 20px; color: #856404;">
            <li>Chegue ao local de embarque 30 minutos antes do horário</li>
            <li>Leve um documento com foto para identificação</li>
            <li>Guarde o código de confirmação para apresentar no embarque</li>
            <li>Em caso de dúvidas, entre em contato conosco</li>
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Obrigado por escolher nossos serviços!</p>
        <p>Este e-mail foi enviado automaticamente, não responda.</p>
      </div>
    </body>
    </html>
  `;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCurrency(value: number): string {
  return (value / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

serve(handler);