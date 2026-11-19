import { Cinematic, CinematicSpeaker } from '../types/game';

export const CINEMATIC_BG_PROLOGUE = '/src/assets/images/knight_cinematic_prologue_1792144598863.jpg';
export const CINEMATIC_BG_DRAGON = '/src/assets/images/knight_boss_dragon_1792144598945.jpg';
export const CINEMATIC_BG_TITLE = '/src/assets/images/knight_hero_title_1792144583168.jpg';
export const MENU_DUNGEON_BG = '/src/assets/images/dungeon_menu_backdrop_1795096328288.jpg';

export const SPEAKERS: Record<string, CinematicSpeaker> = {
  king: {
    id: 'king',
    name: 'Kral Aldor',
    role: 'Eldoria Krallığı Hükümdarı',
    avatarBg: '#991b1b',
    accentColor: '#f59e0b',
  },
  kaelen: {
    id: 'kaelen',
    name: 'Şövalye Kaelen',
    role: 'Krallığın Seçilmiş Muhafızı',
    avatarBg: '#1e3a8a',
    accentColor: '#38bdf8',
  },
  priestess: {
    id: 'priestess',
    name: 'Bilge Rahibe Elaria',
    role: 'Işık Tapınağı Baş Rahibesi',
    avatarBg: '#854d0e',
    accentColor: '#fde047',
  },
  malakor: {
    id: 'malakor',
    name: 'Kara Başrahip Malakor',
    role: 'Nekromansi Tarikatı Lideri',
    avatarBg: '#581c87',
    accentColor: '#c084fc',
  },
  dragon: {
    id: 'dragon',
    name: 'Kızıl Ejder Ignis',
    role: 'Kadim Ateşin Muhafızı',
    avatarBg: '#7c2d12',
    accentColor: '#ea580c',
  },
  vane: {
    id: 'vane',
    name: 'Düşmüş Muhafız Lord Vane',
    role: 'Eski Kraliyet Başkomutanı',
    avatarBg: '#312e81',
    accentColor: '#818cf8',
  },
  valgath: {
    id: 'valgath',
    name: 'Hiçlik Efendisi Valgath',
    role: 'Boyutlararası Karanlığın Tanrısı',
    avatarBg: '#500724',
    accentColor: '#f43f5e',
  },
};

export const CINEMATICS: Record<string, Cinematic> = {
  prologue: {
    id: 'prologue',
    title: 'Giriş: Kutsal Yemin',
    actTitle: 'Bölüm 1 Öncesi - Kraliyet Katedrali',
    slides: [
      {
        speaker: 'king',
        text: 'Ayağa kalk, Şövalye Kaelen. Karanlık yıldızlar gökyüzünde dizildi. Kadim mühürlerin zayıfladığını bütün krallık hissediyor.',
        bgImage: CINEMATIC_BG_PROLOGUE,
        emotion: 'solemn',
      },
      {
        speaker: 'priestess',
        text: 'Orman sınırlarından başlayarak altı bölgeyi karanlık bir lanet sarıyor. Bu kutsal kılıcı kuşan. Işığın son umudu sensin.',
        bgImage: CINEMATIC_BG_PROLOGUE,
        emotion: 'holy',
      },
      {
        speaker: 'kaelen',
        text: 'Canım pahasına krallığı koruyacağıma, masumların kalkanı olacağıma ant içerim! Yolum karanlık olsa da kılıcım parlayacak.',
        bgImage: CINEMATIC_BG_PROLOGUE,
        emotion: 'neutral',
      },
      {
        speaker: 'king',
        text: 'Yeşil Orman’daki haydutlar ve goblinler sınır köylerini yakıyor. İlk olarak orayı temizle. Yolun açık, kılıcın keskin olsun!',
        bgImage: CINEMATIC_BG_PROLOGUE,
        emotion: 'solemn',
      },
    ],
  },

  boss_goblin_defeat: {
    id: 'boss_goblin_defeat',
    title: 'Ormanın Kurtuluşu ve Gölgelerin Uyanışı',
    actTitle: 'Bölüm 5 Sonrası - Goblin Kralı Mağarası',
    slides: [
      {
        speaker: 'kaelen',
        text: 'Grak’zul yere serildi! Yeşil Orman artık köylülerimiz için güvenli.',
        emotion: 'neutral',
      },
      {
        speaker: 'priestess',
        text: 'Fakat zaferimiz kısa sürecek gibi görünüyor Kaelen... Goblinlerin kolyelerinde Lanetli Kript’in kara mühürleri var.',
        emotion: 'solemn',
      },
      {
        speaker: 'priestess',
        text: 'Nekromansici Malakor mezarları kazıyor. Ölüler ordusunu durdurmak için Kript’in derinliklerine inmelisin!',
        emotion: 'holy',
      },
    ],
  },

  act2_intro: {
    id: 'act2_intro',
    title: 'Perde II: Mezarlığın Çürümüş Havası',
    actTitle: 'Bölüm 6 Öncesi - Kemik Vadisi',
    slides: [
      {
        speaker: 'kaelen',
        text: 'Burası bir zamanlar krallığın kahramanlarının yattığı kutsal kabristandı... Şimdi ise çürümüş et ve kemik kokusu havayı kaplamış.',
        emotion: 'solemn',
      },
      {
        speaker: 'malakor',
        text: '(Uzaklardan yankılanan ses): Boşuna geldin genç şövalye! Et çürür, çelik paslanır, fakat ölüm ebedidir!',
        emotion: 'menacing',
      },
      {
        speaker: 'kaelen',
        text: 'Kılıcımın ışığı senin karanlığını bu topraklardan süpürecek Malakor!',
        emotion: 'anger',
      },
    ],
  },

  boss_malakor_defeat: {
    id: 'boss_malakor_defeat',
    title: 'Kara Büyücünün Son Sözleri',
    actTitle: 'Bölüm 10 Sonrası - Kript Taht Odası',
    slides: [
      {
        speaker: 'malakor',
        text: 'Beni yensen bile... çok geç kaldın... Alev Dağları’ndaki Kızıl Ejder Ignis’in zincirleri eridi!',
        emotion: 'menacing',
      },
      {
        speaker: 'kaelen',
        text: 'Ignis mi? Krallığın koruyucusu olan kadim ejderha delirmiş mi?',
        emotion: 'neutral',
      },
      {
        speaker: 'priestess',
        text: 'Birisinin ejderhayı büyüyle zehirlediği aşikar Kaelen. Dağlara çıkıp onu durdurmalısın, yoksa tüm krallık küle dönecek!',
        emotion: 'holy',
      },
    ],
  },

  act3_intro: {
    id: 'act3_intro',
    title: 'Perde III: Lav ve Kükürt',
    actTitle: 'Bölüm 11 Öncesi - Alev Dağları',
    slides: [
      {
        speaker: 'kaelen',
        text: 'Hava nefes almayı zorlaştıracak kadar sıcak. Dağın zirvesinden lav şelaleleri akıyor.',
        emotion: 'solemn',
      },
      {
        speaker: 'dragon',
        text: '(Kükreme): Kim cüret eder benim inime adım atmaya?! Yanın, küstah ölümlüler!',
        emotion: 'anger',
      },
    ],
  },

  boss_dragon_defeat: {
    id: 'boss_dragon_defeat',
    title: 'Kızıl Ejderhanın Aydınlanması',
    actTitle: 'Bölüm 15 Sonrası - Magma Krateri',
    slides: [
      {
        speaker: 'dragon',
        text: 'Gözlerimi... örten kara sis... dağılıyor... Sen... krallığın şövalyesi misin?',
        bgImage: CINEMATIC_BG_DRAGON,
        emotion: 'solemn',
      },
      {
        speaker: 'kaelen',
        text: 'Seni öldürmek istemezdim ulu ejderha. Seni bu deliliğe ne sürükledi?',
        bgImage: CINEMATIC_BG_DRAGON,
        emotion: 'neutral',
      },
      {
        speaker: 'dragon',
        text: 'Eski dostunuz... Lord Vane! O ve karanlık tarikatı beni büyüyle esir aldı. Gölge Kalesi’nde büyük bir ihanet planlıyorlar!',
        bgImage: CINEMATIC_BG_DRAGON,
        emotion: 'solemn',
      },
      {
        speaker: 'kaelen',
        text: 'Lord Vane mi?! Babamın en sadık silah arkadaşı... Bu ihanetin bedelini ödeyecek!',
        bgImage: CINEMATIC_BG_DRAGON,
        emotion: 'anger',
      },
    ],
  },

  act4_intro: {
    id: 'act4_intro',
    title: 'Perde IV: İhanetin Kalesi',
    actTitle: 'Bölüm 16 Öncesi - Gölge Surları',
    slides: [
      {
        speaker: 'king',
        text: 'Kaelen, Lord Vane kraliyet ordusunun yarısını yanına çekip kaleyi işgal etti. Kalbim paramparça...',
        emotion: 'solemn',
      },
      {
        speaker: 'vane',
        text: 'Kral Aldor zayıf! Bu krallık yaklaşan kozmik felakete karşı duramaz. Sadece karanlık güç bizi kurtarabilir!',
        emotion: 'menacing',
      },
      {
        speaker: 'kaelen',
        text: 'Karanlığa teslim olarak krallığı kurtaramazsın Vane. Kılıcım sana onuru hatırlatacak!',
        emotion: 'anger',
      },
    ],
  },

  boss_vane_defeat: {
    id: 'boss_vane_defeat',
    title: 'Düşmüş Komutanın İtirafı',
    actTitle: 'Bölüm 20 Sonrası - Gölge Kalesi Zirvesi',
    slides: [
      {
        speaker: 'vane',
        text: 'Öksürür... Gerçekten... olağanüstü bir savaşçısın Kaelen. Tıpkı baban gibi...',
        emotion: 'solemn',
      },
      {
        speaker: 'kaelen',
        text: 'Neden bunu yaptın Vane? Neden krallığına sırt çevirdin?',
        emotion: 'neutral',
      },
      {
        speaker: 'vane',
        text: 'Gözlerimi açtılar... Kuzeydeki Buzul Titanı Ymir uyandı. Ve onun arkasında... boyutsal bir Hiçlik var. Onu durduramazsanız dünya yok olacak...',
        emotion: 'solemn',
      },
      {
        speaker: 'kaelen',
        text: 'Huzur içinde uyu komutan. Yarattığın hatayı ben düzelteceğim.',
        emotion: 'solemn',
      },
    ],
  },

  act5_intro: {
    id: 'act5_intro',
    title: 'Perde V: Sonsuz Kışın Ayazı',
    actTitle: 'Bölüm 21 Öncesi - Buzul Uçurumlar',
    slides: [
      {
        speaker: 'kaelen',
        text: 'Rüzgar adeta buzdan hançerler gibi tenime batıyor. Donmuş devasa ayak izleri Titan Ymir’in yakın olduğunu gösteriyor.',
        emotion: 'solemn',
      },
      {
        speaker: 'priestess',
        text: 'Ymir antik dünyanın ilkel soğuğunu temsil eder. Kalbindeki kristali kırmadan onu durduramazsın!',
        emotion: 'holy',
      },
    ],
  },

  boss_ymir_defeat: {
    id: 'boss_ymir_defeat',
    title: 'Boyut Yarığı Açılıyor',
    actTitle: 'Bölüm 25 Sonrası - Titan Yıkıntısı',
    slides: [
      {
        speaker: 'kaelen',
        text: 'Titan parçalandı! Fakat gökyüzü... mor ve kara bir yarığa dönüştü!',
        emotion: 'anger',
      },
      {
        speaker: 'valgath',
        text: '(Gök gürültüsü gibi yankılanan kadim ses): Zavallı et yığını... Titan sadece benim uyanışımı geciktiren bir kilitti!',
        emotion: 'menacing',
      },
      {
        speaker: 'valgath',
        text: 'Ben Hiçlik Hükümdarı Valgath! Bu diyar artık benim sonsuz açlığımın ziyafetidir!',
        emotion: 'menacing',
      },
      {
        speaker: 'kaelen',
        text: 'Bu boyuta geçeceğim. Ya bu savaşı kazanırım, ya da hiçlikte yok olurum!',
        emotion: 'neutral',
      },
    ],
  },

  act6_intro: {
    id: 'act6_intro',
    title: 'Perde VI: Yıldızlararası Hiçlik',
    actTitle: 'Bölüm 26 Öncesi - Hiçlik Tapınağı',
    slides: [
      {
        speaker: 'kaelen',
        text: 'Burası dünyamızın sınırlarının ötesi. Yer çekimi garip, zaman akışı bükülüyor. Geri dönüş yok.',
        emotion: 'solemn',
      },
      {
        speaker: 'king',
        text: '(Zihinsel yankı): Bütün Eldoria senin için dua ediyor Kaelen. Krallığın şerefi ve geleceği kılıcının ucunda!',
        emotion: 'holy',
      },
    ],
  },

  boss_valgath_intro: {
    id: 'boss_valgath_intro',
    title: 'Son Savaş: Kıyametin Eşiğinde',
    actTitle: 'Bölüm 30 Öncesi - Hiçlik Tahtı',
    slides: [
      {
        speaker: 'valgath',
        text: 'Buraya kadar gelebilen ilk fani sensin şövalye. Fakat yıldızları yutan bir varlığın önünde senin çeliğin ne hüküm taşır?',
        emotion: 'menacing',
      },
      {
        speaker: 'kaelen',
        text: 'Ben sadece çeliğe değil, arkamda bıraktığım milyonlarca masumun inancına sahibim! Bugün hiçlik ışığa boyun eğecek!',
        emotion: 'anger',
      },
    ],
  },

  epilogue: {
    id: 'epilogue',
    title: 'Epilog: Krallığın Kurtarıcısı',
    actTitle: 'Bölüm 30 Zaferi - Kraliyet Başkenti',
    slides: [
      {
        speaker: 'valgath',
        text: 'İm-kansız... Işık... Hiçliğin kalbini yaktı... Dünya... senin oldu...',
        emotion: 'solemn',
      },
      {
        speaker: 'king',
        text: 'Efsane gerçekleşti! Karanlık gökyüzü çekildi, altın güneş Eldoria üzerinde yeniden doğdu!',
        bgImage: CINEMATIC_BG_TITLE,
        emotion: 'holy',
      },
      {
        speaker: 'priestess',
        text: 'Adın asırlar boyunca şarkılarda, destanlarda ve katedral fresklerinde yankılanacak, Şövalye Kaelen!',
        bgImage: CINEMATIC_BG_TITLE,
        emotion: 'holy',
      },
      {
        speaker: 'kaelen',
        text: 'Barış sağlandı. Kılıcım her zaman krallığın ve adaletin bekçisi olarak kınında hazır bekleyecek.',
        bgImage: CINEMATIC_BG_TITLE,
        emotion: 'neutral',
      },
    ],
  },
};
