import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createRateLimiter } from './src/server/rate-limit';
import { parseLabelRequest } from './src/server/label-request';
import { LabelAnalysisSchema } from './src/domain/label-schema';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Cada instância do Cloud Run conta sozinha e zera ao escalar para zero.
// O teto diário e o máximo de instâncias fecham a conta.
const perIp = createRateLimiter({ windowMs: 10 * 60_000, max: 10 });
const perDay = createRateLimiter({
  windowMs: 24 * 60 * 60_000,
  max: Number(process.env.GEMINI_DAILY_CAP) || 500,
});

// O Cloud Run passa o IP do cliente em X-Forwarded-For.
app.set('trust proxy', true);

// A foto chega em base64 e já vem reduzida pelo cliente (900x1200).
app.use(express.json({ limit: '8mb' }));

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('A chave de API do Gemini (GEMINI_API_KEY) não está configurada no ambiente.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Endpoint: Analyze Wine Label Photo with Gemini Multimodal Vision
app.post('/api/analyze-wine-label', async (req, res) => {
  const request = parseLabelRequest(req.body);
  // O tsconfig não usa strict, então `ok` não discrimina a união.
  if ('status' in request) {
    res.status(request.status).json({ success: false, error: request.error });
    return;
  }

  const ipHit = perIp.hit(req.ip || 'unknown');
  if (!ipHit.allowed) {
    res.set('Retry-After', String(ipHit.retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'Muitas leituras seguidas. Tente de novo em alguns minutos.',
    });
    return;
  }

  if (!perDay.hit('global').allowed) {
    res.status(503).json({
      success: false,
      error: 'A leitura de rótulos chegou ao limite de hoje. Preencha à mão ou tente amanhã.',
    });
    return;
  }

  try {
    const ai = getGenAI();

    const imagePart = {
      inlineData: {
        mimeType: request.mimeType,
        data: request.data,
      },
    };

    const textPart = {
      text: `Analise a foto do rótulo ou da garrafa de vinho enviada.
Identifique e extraia todas as informações disponíveis impressas no rótulo e, caso alguma informação não esteja explícita, utilize seu conhecimento enológico e do produtor/rótulo para inferir com precisão técnica.
Retorne o JSON preenchido rigorosamente com os campos solicitados em português.`,
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [imagePart, textPart] },
      config: {
        abortSignal: AbortSignal.timeout(30_000),
        systemInstruction: `Você é um Master Sommelier e especialista mundial em vinhos e catalogação de rótulos.
Sua missão é extrair e estruturar os dados de garrafas de vinho a partir de fotografias de seus rótulos frontais ou contra-rótulos.
Priorize:
1. Produtor / Vinícola (ex: "Catena Zapata", "Bodegas Atalaya", "Quinta do Crasto", "Château Margaux")
2. Nome comercial do vinho / Rótulo (ex: "Alaya Tierra", "Reserva Malbec", "Vinha da Ponte")
3. Safra / Ano (ex: "2021", "2019", "N/V" se for não safrado como espumante ou porto)
4. Uvas / Variedades (ex: "Cabernet Sauvignon", "Garnacha Tintorera", "Touriga Nacional, Tinta Roriz", "Chardonnay")
5. Região vitivinícola e País (ex: "Mendoza - Argentina", "Almansa - Espanha", "Douro - Portugal", "Bordeaux - França")
6. Tipo do vinho: 'tranquilo', 'espumante', 'licoroso', 'fortificado' ou 'sobremesa'
7. Estilo do vinho: 'tinto', 'branco' ou 'rose'
8. Teor alcoólico aproximado ou lido (ex: "14.5%", "13.0%")
9. Sugestão de temperatura de serviço recomendada (ex: "16°C - 18°C", "10°C - 12°C", "6°C - 8°C")
10. Sugestão de decantação / aeração (ex: "45 min em decanter", "1 hora em decanter", "Não necessita")
11. Potencial de guarda (ex: "Pronto para consumo", "Beber ou guardar 3-5 anos", "Longa guarda (10+ anos)")
12. Notas aromáticas esperadas para este vinho (aromas primários e secundários típicos da uva e região)
13. Harmonização recomendada com pratos gastronômicos
14. Cor Hex sugerida para a taça (ex: tinto rubi #83122D, tinto granada #58132F, branco palha #F3E99F, branco dourado #E8C15A, rosé #E57A8B)
15. Resumo descritivo da vinícola e características gerais daquele vinho`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            produtor: { type: Type.STRING, description: 'Nome da vinícola ou produtor' },
            vinho: { type: Type.STRING, description: 'Nome do vinho ou linha do rótulo' },
            safra: { type: Type.STRING, description: 'Ano da safra ou N/V' },
            uvas: { type: Type.STRING, description: 'Uvas ou castas' },
            regiaoPais: { type: Type.STRING, description: 'Região e país de origem' },
            tipo: {
              type: Type.STRING,
              description: "Tipo: 'tranquilo', 'espumante', 'licoroso', 'fortificado' ou 'sobremesa'",
            },
            estilo: {
              type: Type.STRING,
              description: "Estilo: 'tinto', 'branco' ou 'rose'",
            },
            alcool: { type: Type.STRING, description: 'Teor alcoólico aproximado ou lido' },
            temperaturaServico: { type: Type.STRING, description: 'Temperatura de serviço recomendada' },
            decantacao: { type: Type.STRING, description: 'Sugestão de decantação' },
            potencialGuarda: { type: Type.STRING, description: 'Potencial de guarda' },
            aromasSugeridos: { type: Type.STRING, description: 'Notas de aromas típicas' },
            harmonizacaoSugerida: { type: Type.STRING, description: 'Sugestões de harmonização' },
            qualidadeEstimada: { type: Type.STRING, description: 'Qualidade estimada (ex: Boa, Muito boa, Excelente, Excepcional)' },
            corHexSugerida: { type: Type.STRING, description: 'Código hexadecimal da cor típica' },
            resumo: { type: Type.STRING, description: 'Breve resumo sobre o vinho e produtor' },
          },
          required: ['produtor', 'vinho', 'tipo', 'estilo'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('A IA não retornou texto ou a análise foi interrompida.');
    }

    const parsed = LabelAnalysisSchema.safeParse(JSON.parse(textOutput));
    if (!parsed.success) {
      throw new Error('Resposta do Gemini fora do formato esperado.');
    }
    res.json({
      success: true,
      data: parsed.data,
    });
  } catch (err: any) {
    console.error('Erro na análise de rótulo via Gemini:', err);
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    res.status(timedOut ? 504 : 502).json({
      success: false,
      error: timedOut
        ? 'A leitura demorou demais. Tente de novo.'
        : 'Não foi possível ler o rótulo agora. Preencha à mão ou tente de novo.',
    });
  }
});

// Corpo acima do limite vira JSON, não a página HTML padrão do Express.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ success: false, error: 'A foto é grande demais. Tente outra.' });
    return;
  }
  next(err);
});

// Vite middleware for development & Static file serving for production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Sommelier rodando na porta ${PORT}`);
  });
}

setupViteOrStatic();
