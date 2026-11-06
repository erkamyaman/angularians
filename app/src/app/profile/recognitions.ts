/**
 * People the community recognises outside the Angular repositories, for their profile badges. By GitHub id: a username
 * can change. Lists, not data from the collector: update them by hand.
 *
 * - Angular GDEs: Google Developer Experts for Angular, from https://g.dev/experts?specialization=angular (the
 *   GitHub link on their card, else the same name on their GitHub profile). Only those on the board.
 * - GitHub Stars: https://stars.github.com/profiles. Only those on the board.
 * - Angular security: everyone GitHub credits on an Angular security advisory (https://github.com/advisories, the
 *   ones of @angular/* packages), as reporter, finder, analyst, developer or reviewer of the fix. With how many.
 * - Nx Champions: https://nx.dev/community (names only: matched to their GitHub profile by hand). Only those on the board.
 */

/** Angular GDEs, as of November 2026: GitHub id, and their handle on me.developers.google.com/u/ (null: not in the directory). */
export const ANGULAR_GDES: ReadonlyMap<number, string | null> = new Map([
  [44946000, 'romanski'], // AdrianRomanski
  [8947112, 'amadou'], // ahasall
  [9844254, 'ahsanayaz'], // AhsanAyaz
  [6935240, 'Gentleman_Programming'], // Alan-TheGentleman
  [4699771, 'alain-chautard'], // alcfeoh
  [6283346, 'alejandrocubaruiz'], // alejandrocuba
  [2830407, 'alex-okrushko'], // alex-okrushko
  [7586237, 'alisaduncan'], // alisaduncan
  [17092119, 'alvaro'], // alvarocamillont
  [46297789, 'ezchilamen'], // amilamen
  [33789321, 'ankitsharma'], // AnkitSharma-007
  [11583391, 'antoniocardenas'], // AntonioCardenas
  [20133025, 'armen-vardanyan'], // Armenvardanyan95
  [7337691, null], // arturovt
  [52851438, 'babatundelmd'], // babatundelmd
  [7170892, 'aristeidis'], // bampakoa
  [5384791, 'chrisperko'], // BaronVonPerko
  [7414771, '107500763050233005038'], // bezael
  [10064416, '113015974447266798835'], // BioPhoton
  [61436, 'blove'], // blove
  [42211, 'brandonroberts'], // brandonroberts
  [9142917, 'briantreese'], // brianmtreese
  [1565117, 'brocco'], // Brocco
  [8807391, 'carloscaballero'], // Caballerog
  [6698344, 'christianliebel'], // christianliebel
  [888718, 'christianweyer'], // ChristianWeyer
  [11466673, 'combimau'], // combimauri
  [32693792, 'damiansire'], // damiansire
  [5494535, 'danywalls'], // danywalls
  [29404081, 'DavidePassafaro'], // DavidePassafaro
  [7987365, 'deborahk'], // DeborahK
  [11162114, '113784963826671278615'], // devpato
  [8568104, 'dmezhenskyi'], // DMezhenskyi
  [88981, 'will'], // doggy8088
  [6004537, 'elad'], // EladBezalel
  [790704, 'elecash'], // Elecash
  [18899577, 'eliassy'], // eliraneliassy
  [25394362, 'enea'], // eneajaho
  [11268349, 'fabiangosebrink'], // FabianGosebrink
  [1772083, 'biondifabio'], // fabiobiondi
  [37409120, 'famzil'], // famzila
  [1683147, 'fmalcher'], // fmalcher
  [444278, 'gregor'], // GregOnNet
  [4660316, 'gerardsans'], // gsans
  [8426937, 'emrehizli'], // hizliemre
  [1511551, 'iliya-idakiev'], // IliaIdakiev
  [1870060, 'jeff'], // jeffwhelpley
  [10909792, 'jimydolores'], // jimyhdolores
  [640639, 'JohannesHoppe'], // JohannesHoppe
  [1202528, '111068699697656810962'], // johnpapa
  [3605268, 'jordanpowell'], // jordanpowell88
  [5982204, 'jorgeucano'], // jorgeucano
  [2578009, 'joshuamorony'], // joshuamorony
  [1243236, 'schwarty'], // jschwarty
  [542458, 'juri'], // juristr
  [5073455, 'jaroslawzolnowski'], // jzolnowski
  [6573939, 'ngKalbarczyk'], // kalbarczyk
  [34801008, 'browser-person'], // korneevamg
  [1283734, 'kuncevic'], // kuncevic
  [1529180, 'laco'], // lacolaco
  [8270563, 'ladyleet'], // ladyleet
  [35490499, 'lamisChebbi'], // lamisChebbi
  [97639402, 'lara-newsom'], // lara-newsom
  [6683747, 'LMFinney'], // LMFinney
  [59545, 'loiane'], // loiane
  [3485075, 'luixaviles'], // luixaviles
  [12270550, 'mainawycliffe'], // mainawycliffe
  [6603745, 'katerina'], // mandarini
  [1573728, 'manfredsteyer'], // manfredsteyer
  [16544451, 'marianocodes'], // marianocodes
  [17877290, 'markostanimirovic'], // markostanimirovic
  [6086902, 'martinakraus'], // martinakraus
  [17507258, 'martine'], // martine-dowden
  [890800, 'mashhoodr'], // mashhoodr
  [6124091, 'maxkoretskyi'], // maxkoretskyi
  [2835826, 'mhartington'], // mhartington
  [3712277, 'mikeryan'], // MikeRyanDev
  [25516557, 'chautran'], // nartc
  [7611944, 'nicobytes'], // nicobytes
  [24563545, 'nicolas-frizzarin'], // Nicoss54
  [2496253, 'nirkaufman'], // nirkaufman
  [26349046, 'NishuGoel'], // NishuGoel
  [1909643, 'oidacra'], // oidacra
  [5320044, 'pankajparkar'], // pankajparkar
  [2006222, 'prestonjlamb'], // pjlamb12
  [7045092, 'profanis'], // profanis
  [1159649, 'connieleung'], // railsstudent
  [5721205, 'rainerhahnekamp'], // rainerhahnekamp
  [1866918, 'rakia-ben-sassi'], // rakia
  [2565606, '116962574362005684340'], // rblmdst
  [35105981, 'ricardochl'], // ricardochl
  [277805, 'rmestre'], // rlmestre
  [4833351, 'sajeetharan'], // sajeetharan
  [231618, 'samvloeberghs'], // samvloeberghs
  [1249083, 'SanderElias'], // SanderElias
  [11923975, 'SantoshYadavDev'], // santoshyadavdev
  [1430726, 'shairez'], // shairez
  [593151, 'sinedied'], // sinedied
  [7893485, 'stanimira'], // sis0k0
  [59734, 'sonukapoor'], // sonukapoor
  [7772451, 'srashtisj'], // srashtisj
  [165056, 'stephen'], // StephenFluin
  [30832608, 'thomas-laforge'], // tomalaforge
  [3764868, 'tomastrajan'], // tomastrajan
  [6767322, 'trungvose'], // trungvose
  [4145169, 'balramchavan'], // ultrasonicsoft
  [19549842, 'michelestieven'], // UserGalileo
  [1107171, 'valorkin'], // valorkin
  [1209238, 'villanuevand'], // Villanuevand
  [7274335, 'vmasek'], // vmasek
  [1506722, 'yadong'], // vthinkxie
  [11832552, 'alexander'], // waterplea
  [8777127, 'webdave_de'], // web-dave
  [1560278, 'salnikov'], // webmaxru
  [8186117, 'mikehuang'], // wellwind
  [2189998, 'willgm'], // willgm
  [1252570, 'willmendesneto'], // willmendesneto
  [5797213, 'xocomil'], // xocomil
  [9469090, 'jaycooperbell'], // yharaskrik
  [2674658, 'younes'], // yjaaidi
]);

/** GitHub Stars, as of November 2026. */
export const GITHUB_STARS: ReadonlySet<number> = new Set([
  9100169, // crutchcorn
  1361891, // huan
  2099300, // indcoder
  1500684, // kentcdodds
  11923975, // santoshyadavdev
  1326112, // tiangolo
]);

/** Nx Champions, as of November 2026: started with the ones we know, add the rest from the page. */
export const NX_CHAMPIONS: ReadonlySet<number> = new Set([
  11923975, // santoshyadavdev
]);

/** Angular security advisories, as of November 2026: GitHub id, and how many credit them. */
export const ANGULAR_SECURITY: ReadonlyMap<number, number> = new Map([
  [98734964, 1], // 0xEr3n
  [49720976, 1], // Adyej999
  [110790294, 2], // AKiileX
  [17563226, 42], // alan-agius4
  [43554145, 19], // AndrewKushnir
  [479713, 4], // atscott
  [4450522, 2], // crisbeto
  [4987015, 1], // devversion
  [11010321, 7], // dgp1130
  [8604205, 1], // gkalpak
  [162155285, 1], // hdtmccallie
  [62616592, 2], // Hexix23
  [567540, 4], // hybrist
  [6357121, 1], // irsl
  [1300985, 14], // JeanMeche
  [838736, 2], // jelbourn
  [123679, 1], // JoostK
  [10864441, 23], // josephperrott
  [164016954, 1], // kimkou2024
  [128171, 1], // koto
  [162270335, 1], // mabjr33
  [1499192, 1], // masatokinugawa
  [97605956, 1], // meDavidNS
  [11680102, 6], // securityMB
  [26125957, 1], // ShelbyKelley
  [73321943, 18], // SkyZeroZx
  [113363362, 1], // spectacularpigeoncow
  [281478990, 1], // srkyn
  [16122665, 1], // tdunlap607
  [1596273, 1], // thePunderWoman
  [113508132, 1], // TTracz2i
  [68438061, 5], // VenkatKwest
  [211584612, 3], // Yenya030
  [30854794, 1], // YLChen-007
]);
