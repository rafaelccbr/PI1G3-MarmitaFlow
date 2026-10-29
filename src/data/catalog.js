// Restaurante conceito independente oficial: Marmita Flow
export const INITIAL_RESTAURANTS = [
  {
    id: 'rest-marmita-flow',
    slug: 'marmita-flow',
    name: 'Marmita Flow',
    tagline: 'Comida caseira no capricho, quentinha e sem rasuras',
    description: 'Especialista em marmitas completas, ingredientes frescos do dia e opções saudáveis balanceadas.',
    primaryColor: '#FF6B00',
    secondaryColor: '#10B981',
    logoUrl: '/assets/mascote_flow.jpg',
    bannerUrl: '/assets/feijoada_flow.jpg',
    pixKey: 'financeiro@marmitaflow.com.br',
    pixKeyType: 'E-mail',
    phone: '(11) 98765-4321',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    deliveryFee: 3.00,
    deliveryTime: '30-45 min',
    rating: '4.9 (184 avaliações)',
    isOpen: true,
    adminEmail: 'admin@marmitaflow.com',
    adminPass: '123456',
    ownerName: 'Rafael Miquelin'
  },
  {
    id: 'rest-cantina-nona',
    slug: 'cantina-da-nona',
    name: 'Cantina da Nona',
    tagline: 'O verdadeiro sabor da comida caseira da vó',
    description: 'Receitas tradicionais italianas e brasileiras, molho artesanal e carnes assadas na brasa.',
    primaryColor: '#DC2626',
    secondaryColor: '#16A34A',
    logoUrl: '/assets/marmita_custom.jpg',
    bannerUrl: '/assets/marmita_custom.jpg',
    pixKey: 'contato@cantinadanona.com.br',
    pixKeyType: 'E-mail',
    phone: '(11) 97711-2233',
    address: 'Rua dos Pinheiros, 450 - Pinheiros, São Paulo - SP',
    deliveryFee: 4.50,
    deliveryTime: '40-55 min',
    rating: '4.8 (92 avaliações)',
    isOpen: true,
    adminEmail: 'nona@cantina.com',
    adminPass: '123456',
    ownerName: 'Dona Carmela'
  }
];

// Pratos associados aos seus respectivos restaurantes independentes
export const INITIAL_PRODUCTS = [
  // --- Pratos do Marmita Flow ---
  {
    id: 'prod-mf-feijoada',
    restaurantId: 'rest-marmita-flow',
    name: 'Feijoada Flow Completa',
    category: 'Marmitas Tradicionais',
    price: 29.90,
    description: 'Feijoada completa com arroz soltinho, feijão preto encorpado, couve refogada no alho, farofa crocante de milho com bacon, fatias de laranja e torresmo pururuca.',
    image: '/assets/feijoada_flow.jpg',
    badge: 'Mais Vendido 🔥',
    isCustomizable: true,
    available: true,
    suggestedAlternativeId: 'prod-mf-frango'
  },
  {
    id: 'prod-mf-frango',
    restaurantId: 'rest-marmita-flow',
    name: 'Frango Grelhado com Legumes',
    category: 'Linha Fit & Equilíbrio',
    price: 27.90,
    description: 'Filé de peito de frango grelhado marinado com ervas finas, arroz integral com sementes, feijão preto, legumes salteados no azeite e saladinha fresca.',
    image: '/assets/frango_grelhado.jpg',
    badge: 'Fit Saudável 🥗',
    isCustomizable: true,
    available: true,
    suggestedAlternativeId: 'prod-mf-feijoada'
  },
  {
    id: 'prod-mf-salmao',
    restaurantId: 'rest-marmita-flow',
    name: 'Salmão Orange Gourmet',
    category: 'Marmitas Gourmet',
    price: 32.90,
    description: 'Filé de salmão grelhado regado com redução cítrica de laranja e ervas frescas, arroz com brócolis aromático e cenouras baby salteadas na manteiga de ervas.',
    image: '/assets/salmao_orange.jpg',
    badge: 'Chef Especial 🌟',
    isCustomizable: true,
    available: true,
    suggestedAlternativeId: 'prod-mf-frango'
  },
  {
    id: 'prod-mf-custom',
    restaurantId: 'rest-marmita-flow',
    name: 'Monte Sua Marmita Artesanal',
    category: 'Personalizável',
    price: 26.90,
    description: 'Crie sua refeição perfeita: escolha o tamanho, 1 proteína nobre, 1 base, 1 tipo de feijão, 2 acompanhamentos frescos e adicionais ao seu gosto.',
    image: '/assets/marmita_custom.jpg',
    badge: '100% Você 🎯',
    isCustomizable: true,
    available: true,
    suggestedAlternativeId: 'prod-mf-feijoada'
  },
  {
    id: 'prod-mf-suco-laranja',
    restaurantId: 'rest-marmita-flow',
    name: 'Suco de Laranja Natural 500ml',
    category: 'Bebidas',
    price: 8.00,
    description: '100% fruta espremida na hora com gelo e fatia de laranja, super refrescante e sem conservantes.',
    image: '/assets/suco_laranja.jpg',
    badge: 'Natural 🍊',
    isCustomizable: false,
    available: true
  },
  {
    id: 'prod-mf-refrigerante',
    restaurantId: 'rest-marmita-flow',
    name: 'Refrigerante em Lata 350ml',
    category: 'Bebidas',
    price: 6.00,
    description: 'Gelado na temperatura perfeita (Guaraná, Coca-Cola ou Soda).',
    image: '/assets/refrigerante.jpg',
    badge: 'Gelado 🧊',
    isCustomizable: false,
    available: true
  },
  {
    id: 'prod-mf-brownie',
    restaurantId: 'rest-marmita-flow',
    name: 'Brownie Artesanal com Nozes',
    category: 'Sobremesas',
    price: 9.50,
    description: 'Massa cremosa e molhadinha com pedaços de nozes crocantes e chocolate nobre.',
    image: '/assets/brownie.jpg',
    badge: 'Doce Paixão 🍫',
    isCustomizable: false,
    available: true
  },

  // --- Pratos da Cantina da Nona ---
  {
    id: 'prod-cn-lasanha',
    restaurantId: 'rest-cantina-nona',
    name: 'Lasanha Bolonhesa da Nona',
    category: 'Massas Caseiras',
    price: 31.90,
    description: 'Massa artesanal recheada com carne nobre cozida lentamente no molho de tomate rústico e queijo gratinado.',
    image: '/assets/marmita_custom.jpg',
    badge: 'Receita de Família 👵',
    isCustomizable: true,
    available: true
  },
  {
    id: 'prod-cn-frango',
    restaurantId: 'rest-cantina-nona',
    name: 'Polenta com Frango Caipira',
    category: 'Marmitas Tradicionais',
    price: 28.50,
    description: 'Polenta cremosa com queijo e galinha caipira desfiada ao molho com ervas frescas.',
    image: '/assets/frango_grelhado.jpg',
    badge: 'Clássico 🍲',
    isCustomizable: true,
    available: true
  }
];

export const CUSTOMIZATION_OPTIONS = {
  sizes: [
    { id: 'size-p', name: 'Tamanho P (400g - Individual Leve)', price: 0 },
    { id: 'size-m', name: 'Tamanho M (600g - Porção Padrão)', price: 4.00, default: true },
    { id: 'size-g', name: 'Tamanho G (800g - Super Reforçado)', price: 8.00 }
  ],
  proteins: [
    { id: 'prot-frango', name: 'Filé de Frango Grelhado Suculento', price: 0, default: true },
    { id: 'prot-feijoada', name: 'Carnes Nobres da Feijoada (Costelinha, Paio e Carne Seca)', price: 3.50 },
    { id: 'prot-picanha', name: 'Tiras de Picanha Grelhada na Manteiga', price: 7.00 },
    { id: 'prot-salmao', name: 'Filé de Salmão com Molho de Laranja', price: 8.00 },
    { id: 'prot-omelete', name: 'Omelete com Queijo e Tomate (Vegetariano)', price: 0 }
  ],
  bases: [
    { id: 'base-arroz-branco', name: 'Arroz Branco Soltinho e Temperado', price: 0, default: true },
    { id: 'base-arroz-integral', name: 'Arroz Integral com Chia e Linhaça', price: 0 },
    { id: 'base-arroz-brocolis', name: 'Arroz com Brócolis Fresco Picado', price: 2.00 },
    { id: 'base-sem-arroz', name: 'Sem Arroz (Aumentar Legumes)', price: 0 }
  ],
  beans: [
    { id: 'bean-preto', name: 'Feijão Preto Encorpado com Louro e Alho', price: 0, default: true },
    { id: 'bean-carioca', name: 'Feijão Carioca Clássico Cremoso', price: 0 },
    { id: 'bean-sem', name: 'Sem Feijão', price: 0 }
  ],
  sides: [
    { id: 'side-farofa', name: 'Farofa Crocante de Milho com Bacon' },
    { id: 'side-couve', name: 'Couve Manteiga Refogada no Azeite' },
    { id: 'side-legumes', name: 'Legumes Salteados (Brócolis, Cenoura, Abobrinha)' },
    { id: 'side-banana', name: 'Banana da Terra Grelhada Caramelizada' },
    { id: 'side-batata', name: 'Batata Rústica Assada com Alecrim' },
    { id: 'side-salada', name: 'Salada de Folhas com Tomatinho Sweet Grape' }
  ],
  addons: [
    { id: 'addon-ovo', name: 'Ovo Frito com Gema Mole Perfeita', price: 3.00 },
    { id: 'addon-torresmo', name: 'Porção Extra de Torresmo Pururuca Crocante', price: 5.50 },
    { id: 'addon-vinagrete', name: 'Pote de Vinagrete Fresco Artesanal', price: 3.50 },
    { id: 'addon-molho-pimenta', name: 'Molho de Pimenta da Casa (Leve)', price: 2.00 }
  ]
};
