// Textos fixos da interface (menu, rodapé, home) nos dois idiomas.
// Conteúdo de projetos e posts fica nas coleções, não aqui.

export const locales = ['en', 'pt-br'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const ui = {
  en: {
    'meta.title': 'Thiago Neppel | Creative director & video editor',
    'meta.description':
      'Creative director and video editor blending cinematic aesthetics, visual identity and retention-driven editing for brands, YouTube channels and games.',

    'nav.work': 'Work',
    'nav.about': 'About',
    'nav.blog': 'Blog',
    'nav.contact': 'Contact',
    'nav.cta': "Let's talk",
    // Frases que o botão do menu digita e apaga, em sequência (separadas por |).
    'nav.ctaPhrases':
      "Let's cause trouble|Heyyyyyyyyy|Hire me!|Is your video boring?|What's your channel about?|Don't press!!!|" +
      "Made with love <3|I love açaí|Need a designer?|You just won a quote!|Let's hop on a call?|I need $$$|Hit me up",
    'nav.menu': 'Open menu',
    'lang.label': 'Language',

    'hero.role': 'Creative director · Video editor',
    'hero.loading': 'Loading',

    'about.eyebrow': 'About',
    'about.title': 'Ideas cut',
    'about.titleAccent': 'to be watched.',
    'about.p1':
      'I am a creative director with roots in design, advertising and video production. I turn briefs into videos people actually finish: from YouTube channels and game ads to brand campaigns.',
    'about.p2':
      'Every project is concept, script, edit and pacing working together, so the message lands and the audience stays until the last frame.',
    'about.stat.years': 'Years in video',
    'about.stat.videos': 'Videos in portfolio',
    'about.stat.clients': 'Brands & channels',
    'about.ctaText': 'Have a project that needs to be seen?',
    'about.cta': 'Start a project',

    'work.eyebrow': 'Work',
    'work.title': 'Selected',
    'work.titleAccent': 'work.',
    'work.featured': 'Highlights',
    'work.viewProject': 'Project page',

    'product.eyebrow': 'My product',
    'product.text':
      'A fast, local sound effects manager for video editors. Hit a shortcut over your editor, grab the exact slice of sound you need and drop it straight onto the timeline. No subscription, no Alt+Tab.',
    'product.cta': 'Get MySoundLib',
    'product.note': 'Desktop app for Premiere, DaVinci and CapCut editors',
    'product.sticker': 'Built by me',
    'product.watch': 'Watch the MySoundLib video',

    'realestate.eyebrow': 'Service',
    'realestate.text':
      'Photos, videos and aerial footage for builders, real estate agencies and brokers in Porto Alegre and on the coast. 4K material ready for listings, social media and launches.',
    'realestate.stat.properties': 'Residential and commercial properties shot',
    'realestate.stat.developments': 'Developments served for builders',
    'realestate.cta': 'See the service',
    'realestate.watch': 'Watch the real estate showreel',
    'realestate.clients': 'Builders and brands served',

    'contact.eyebrow': 'Contact',
    'contact.title': "Let's make something",
    'contact.titleAccent': 'worth watching.',
    'contact.text': 'Got a project, an idea or just want to talk? Send a message and I will get back to you soon.',
    'contact.name': 'Name',
    'contact.namePh': 'Your name',
    'contact.email': 'E-mail',
    'contact.emailPh': 'you@email.com',
    'contact.message': 'Project idea',
    'contact.messagePh': 'Tell me what you have in mind...',
    'contact.send': 'Send message',
    'contact.sending': 'Sending...',
    'contact.ok': 'Message sent! I will reply soon.',
    'contact.error': 'Could not send. Please try again or e-mail me directly.',

    'footer.privacy': 'Privacy policy',
    'footer.terms': 'Terms of use',
    'legal.eyebrow': 'Legal',
    'legal.updated': 'Last updated',
    'legal.back': 'Back to home',

    'blog.metaTitle': 'Blog | Thiago Neppel',
    'blog.description':
      'Blog about marketing, design and digital creation, sharing practical experience in audiovisual production, technology and game development.',
    'blog.eyebrow': 'Blog',
    // "Uncut": o oposto do título da home ("Ideas cut to be watched").
    'blog.title': '',
    'blog.titleAccent': 'Uncut.',
    'blog.intro':
      "I write about video editing, design and marketing, based on the work I do for clients and channels. I also document my own projects, like MySoundLib, a sound effects manager for video editors, and my games.",
    'blog.all': 'All',
    'blog.latest': 'Latest',
    'blog.read': 'Read post',
    'blog.minRead': 'min read',
    'blog.back': 'All posts',
    'blog.tagged': 'Posts tagged',
    'blog.more': 'Keep reading',
    'blog.author': 'Written by',
    'blog.authorBio':
      'Creative director and video editor with roots in design, advertising and audiovisual production. Now also building software and games.',
    'blog.authorCta': 'Work with me',
    'blog.rss': 'RSS feed',
    'footer.rights': 'All rights reserved.',
  },
  'pt-br': {
    'meta.title': 'Thiago Neppel | Diretor criativo e editor de vídeo',
    'meta.description':
      'Diretor criativo e editor de vídeo unindo estética cinematográfica, identidade visual e edição com foco em retenção para marcas, canais do YouTube e jogos.',

    'nav.work': 'Trabalhos',
    'nav.about': 'Sobre',
    'nav.blog': 'Blog',
    'nav.contact': 'Contato',
    'nav.cta': 'Vamos conversar',
    'nav.ctaPhrases':
      'Bora causar?|Heyyyyyyyyy|Me contrata!|Seu vídeo tá chato?|Teu canal é de quê?|Não aperte!!!|' +
      'Fiz tudo com amor S2|Eu amo açaí|Quer um designer?|Você ganhou um orçamento!|Bora uma call?|' +
      'Tô precisando de $$$|Me chama, vai',
    'nav.menu': 'Abrir menu',
    'lang.label': 'Idioma',

    'hero.role': 'Diretor criativo · Editor de vídeo',
    'hero.loading': 'Carregando',

    'about.eyebrow': 'Sobre mim',
    'about.title': 'Ideias editadas',
    'about.titleAccent': 'para serem vistas.',
    'about.p1':
      'Sou diretor criativo com raízes em design, publicidade e produção audiovisual. Transformo briefings em vídeos que as pessoas assistem até o fim: de canais do YouTube e anúncios de jogos a campanhas de marca.',
    'about.p2':
      'Cada projeto junta conceito, roteiro, edição e ritmo, para a mensagem chegar e o público ficar até o último frame.',
    'about.stat.years': 'Anos em audiovisual',
    'about.stat.videos': 'Vídeos no portfólio',
    'about.stat.clients': 'Marcas e canais',
    'about.ctaText': 'Tem um projeto que precisa ser visto?',
    'about.cta': 'Iniciar projeto',

    'work.eyebrow': 'Trabalhos',
    'work.title': 'Trabalhos',
    'work.titleAccent': 'selecionados.',
    'work.featured': 'Destaques',
    'work.viewProject': 'Página do projeto',

    'product.eyebrow': 'Meu produto',
    'product.text':
      'Um gerenciador de efeitos sonoros rápido e local para editores de vídeo. Aperte um atalho por cima do editor, pegue o trecho exato do som e solte direto na timeline. Sem assinatura, sem Alt+Tab.',
    'product.cta': 'Conhecer o MySoundLib',
    'product.note': 'App de desktop para quem edita no Premiere, DaVinci e CapCut',
    'product.sticker': 'Feito por mim',
    'product.watch': 'Assistir ao vídeo do MySoundLib',

    'realestate.eyebrow': 'Serviço',
    'realestate.text':
      'Fotos, vídeos e imagens aéreas para construtoras, imobiliárias e corretores em Porto Alegre e no Litoral. Material em 4K pronto para portais, redes sociais e lançamentos.',
    'realestate.stat.properties': 'Imóveis residenciais e comerciais captados',
    'realestate.stat.developments': 'Empreendimentos atendidos para construtoras',
    'realestate.cta': 'Conhecer o serviço',
    'realestate.watch': 'Assistir ao vídeo de imóveis',
    'realestate.clients': 'Construtoras e marcas atendidas',

    'contact.eyebrow': 'Contato',
    'contact.title': 'Vamos criar algo',
    'contact.titleAccent': 'que valha o play.',
    'contact.text': 'Tem um projeto, uma ideia ou só quer trocar uma ideia? Manda a mensagem que eu respondo rápido.',
    'contact.name': 'Nome',
    'contact.namePh': 'Seu nome',
    'contact.email': 'E-mail',
    'contact.emailPh': 'seu@email.com',
    'contact.message': 'Ideia do projeto',
    'contact.messagePh': 'Me conta o que você tem em mente...',
    'contact.send': 'Enviar mensagem',
    'contact.sending': 'Enviando...',
    'contact.ok': 'Mensagem enviada! Respondo em breve.',
    'contact.error': 'Não foi possível enviar. Tente de novo ou mande um e-mail direto.',

    'footer.privacy': 'Política de privacidade',
    'footer.terms': 'Termos de uso',
    'legal.eyebrow': 'Informações legais',
    'legal.updated': 'Última atualização',
    'legal.back': 'Voltar para o início',

    'blog.metaTitle': 'Blog | Thiago Neppel',
    'blog.description':
      'Blog sobre marketing, design e criação digital, com experiências práticas em produção audiovisual, tecnologia e desenvolvimento de jogos.',
    'blog.eyebrow': 'Blog',
    'blog.title': 'Sem',
    'blog.titleAccent': 'cortes.',
    'blog.intro':
      'Escrevo sobre edição de vídeo, design e marketing a partir dos projetos que faço para clientes e canais. Também registro o desenvolvimento dos meus próprios projetos, como o MySoundLib, um gerenciador de efeitos sonoros para editores, e meus jogos.',
    'blog.all': 'Todos',
    'blog.latest': 'Mais recente',
    'blog.read': 'Ler post',
    'blog.minRead': 'min de leitura',
    'blog.back': 'Todos os posts',
    'blog.tagged': 'Posts com a tag',
    'blog.more': 'Continue lendo',
    'blog.author': 'Escrito por',
    'blog.authorBio':
      'Diretor criativo e editor de vídeo com raízes em design, publicidade e produção audiovisual. Agora também criando softwares e jogos.',
    'blog.authorCta': 'Vamos trabalhar juntos',
    'blog.rss': 'Feed RSS',
    'footer.rights': 'Todos os direitos reservados.',
  },
} as const;

export type UiKey = keyof (typeof ui)['en'];

export function getLocale(locale: string | undefined): Locale {
  return locale === 'pt-br' ? 'pt-br' : 'en';
}

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key];
}

/** Monta um caminho no idioma pedido: localePath('pt-br', '/about/') -> '/pt-br/about/' */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean}`;
}

/** Caminho equivalente no outro idioma, para o botão de troca. */
export function alternatePath(pathname: string): { locale: Locale; path: string } {
  if (pathname === '/pt-br' || pathname.startsWith('/pt-br/')) {
    return { locale: 'en', path: pathname.slice('/pt-br'.length) || '/' };
  }
  return { locale: 'pt-br', path: `/pt-br${pathname}` };
}
