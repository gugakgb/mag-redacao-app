
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com a chave de ADMIN (Service Role)
// ATENÇÃO: Essa chave permite escrever no banco sem restrições.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(request, response) {
  // 1. Verifica se o método é POST (Kiwify envia POST)
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = request.body;
    
    // Log para você ver no painel da Vercel o que está chegando (útil para debug)
    console.log("Webhook Kiwify Recebido:", JSON.stringify(payload));

    // 2. Verifica se o pagamento foi APROVADO
    // A Kiwify manda "order_status": "paid"
    if (payload.order_status !== 'paid') {
      return response.status(200).json({ message: 'Pedido não está pago, ignorando.' });
    }

    // 3. Identifica o Aluno e o Produto
    // A Kiwify envia o email em payload.customer.email ou payload.email dependendo da versão
    const emailAluno = payload.customer?.email || payload.email;
    
    // Vamos pegar o Product ID (Você deve pegar isso na URL do seu produto na Kiwify)
    // Exemplo: https://dashboard.kiwify.com.br/products/edit/EsteCodigoAqui
    const productId = payload.product_id; 

    if (!emailAluno) {
      return response.status(400).json({ error: 'Email do aluno não encontrado no payload.' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas no Backend.");
      return response.status(500).json({ error: 'Erro interno de configuração.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Define os créditos baseados no produto comprado
    // VOCÊ PRECISA SUBSTITUIR OS IDs ABAIXO PELOS SEUS IDs REAIS DA KIWIFY
    let tier = 'GRATUITO';
    let creditsToAdd = 0;

    // Lógica de mapeamento (Ajuste os IDs conforme seus produtos na Kiwify)
    // Se não souber o ID agora, o código vai tentar adivinhar pelo nome do produto se vier no payload
    const productName = payload.product_name ? payload.product_name.toUpperCase() : '';

    if (productId === 't5Ap7Mg' || productName.includes('IRON')) {
        tier = 'IRON';
        creditsToAdd = 10;
    } else if (productId === 'MlhtpJj' || productName.includes('PLATINUM')) {
        tier = 'PLATINUM';
        creditsToAdd = 20;
    } else if (productId === 'yUzcFtx' || productName.includes('GOLD')) {
        tier = 'GOLD';
        creditsToAdd = 40;
    } else {
        // Caso genérico ou erro de mapeamento
        console.log("Produto não mapeado explicitamente, verificando nome:", productName);
        if (productName.includes('GOLD')) { tier = 'GOLD'; creditsToAdd = 40; }
        else if (productName.includes('PLATINUM')) { tier = 'PLATINUM'; creditsToAdd = 20; }
        else if (productName.includes('IRON')) { tier = 'IRON'; creditsToAdd = 10; }
    }

    if (creditsToAdd === 0) {
        return response.status(200).json({ message: 'Produto não reconhecido para atualização de créditos.' });
    }

    // 5. Atualiza o Usuário no Supabase
    // Primeiro, buscamos o usuário pelo email
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', emailAluno)
      .single();

    if (userError || !userProfile) {
        console.error("Aluno não encontrado no banco:", emailAluno);
        // Opcional: Você poderia criar o usuário aqui se ele não existisse
        return response.status(404).json({ error: 'Aluno não encontrado no sistema.' });
    }

    // Atualiza o plano e soma os créditos (ou define o novo total)
    // Estratégia: Se ele já tem créditos, somamos. Se ele mudou de plano, atualizamos o tier.
    const newCredits = (userProfile.credits || 0) + creditsToAdd;

    // Se o plano novo for "superior" ou igual ao atual, atualizamos o tier.
    // Lógica simples: sempre atualiza para o último comprado.
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
          credits: newCredits,
          tier: tier
      })
      .eq('id', userProfile.id);

    if (updateError) {
        console.error("Erro ao atualizar perfil:", updateError);
        return response.status(500).json({ error: 'Erro ao atualizar banco de dados.' });
    }

    console.log(`SUCESSO: ${emailAluno} recebeu ${creditsToAdd} créditos. Plano: ${tier}.`);

    return response.status(200).json({ success: true, message: 'Créditos liberados com sucesso.' });

  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
