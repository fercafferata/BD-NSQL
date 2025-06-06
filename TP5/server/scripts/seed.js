import mongoose from "mongoose"
import dotenv from "dotenv"
import Hero from "../models/hero.js"

dotenv.config()

const sampleHeroes = [
  {
    name: "Amethyst",
    realName: "Amaya",
    yearOfAppearance: 1983,
    publisher: "dc",
    biography: "Amethyst es una joven que descubre ser la princesa de Gemworld, un reino mágico. Posee habilidades místicas y lucha contra fuerzas oscuras para proteger su mundo.",
    equipment: "Cristales mágicos, espada encantada",
    images: "/images/amethyst.jpg"
  },
  {
    name: "Aztek",
    realName: "Uno desconocido / Curt Falconer",
    yearOfAppearance: 1996,
    publisher: "dc",
    biography: "Aztek es un guerrero entrenado desde pequeño por una sociedad secreta para combatir al mal supremo. Usa una armadura avanzada alimentada por energía cuántica.",
    equipment: "Armadura Quetzalcoatl con invisibilidad, vuelo y visión de rayos X",
    images: "/images/aztek.jpg"
  },
  {
    name: "Batman",
    realName: "Bruce Wayne",
    yearOfAppearance: 1939,
    publisher: "dc",
    biography: "Bruce Wayne se convirtió en Batman tras presenciar el asesinato de sus padres. Usa su entrenamiento, inteligencia y recursos para combatir el crimen en Gotham.",
    equipment: "Batarangs, Batmóvil, Batcomputadora, traje táctico",
    images: "/images/batman.jpg"
  },
  {
    name: "Black Canary",
    realName: "Dinah Lance",
    yearOfAppearance: 1947,
    publisher: "dc",
    biography: "Experta en artes marciales y poseedora del 'Canario Grito', una onda sónica poderosa. Lucha por la justicia con su voz y habilidades de combate.",
    equipment: "Traje de combate, motocicleta, dispositivos de comunicación",
    images: "/images/blackcanary.jpg"
  },
  {
    name: "Black Widow",
    realName: "Natasha Romanoff",
    yearOfAppearance: 1964,
    publisher: "marvel",
    biography: "Una espía rusa reformada, entrenada en espionaje y combate cuerpo a cuerpo. Se convirtió en una heroína clave dentro de los Avengers.",
    equipment: "Pulseras Widow’s Bite, traje táctico, armas de fuego",
    images: "/images/blackwidow.jpg"
  },
  {
    name: "Blue Beetle",
    realName: "Jaime Reyes",
    yearOfAppearance: 2006,
    publisher: "dc",
    biography: "Un adolescente que descubre un escarabajo alienígena que se fusiona con su cuerpo, otorgándole una armadura avanzada con múltiples armas.",
    equipment: "Armadura alienígena con vuelo, cañones de energía, escudos",
    images: "/images/bluebeetle.jpg"
  },
  {
    name: "Booster Gold",
    realName: "Michael Jon Carter",
    yearOfAppearance: 1986,
    publisher: "dc",
    biography: "Viajero del tiempo del siglo XXV que busca fama como superhéroe, aunque a menudo termina haciendo lo correcto por los motivos correctos.",
    equipment: "Traje del futuro, Skeets (robot asistente), campo de fuerza",
    images: "/images/boostergold.jpg"
  },
  {
    name: "Darkhawk",
    realName: "Chris Powell",
    yearOfAppearance: 1991,
    publisher: "marvel",
    biography: "Descubre un amuleto que lo transforma en Darkhawk, un ser con armadura poderosa que le permite combatir el crimen con fuerza mejorada y vuelo.",
    equipment: "Armadura alienígena, garras, escudo de energía",
    images: "/images/darkhawk.jpg"
  },
  {
    name: "Doctor Mid-Nite",
    realName: "Charles McNider",
    yearOfAppearance: 1941,
    publisher: "dc",
    biography: "Pionero héroe ciego que solo puede ver en la oscuridad. Usa gafas especiales y bombas de humo para pelear contra el crimen como vigilante nocturno.",
    equipment: "Gafas infrarrojas, bombas de humo, habilidades médicas",
    images: "/images/doctormidnite.jpg"
  },
  {
    name: "Elsa Bloodstone",
    realName: "Elsa Bloodstone",
    yearOfAppearance: 2001,
    publisher: "marvel",
    biography: "Cazadora de monstruos con fuerza y resistencia sobrehumanas gracias a una gema mágica heredada de su padre. Enfrenta amenazas sobrenaturales.",
    equipment: "Gema de Bloodstone, armamento de caza de monstruos",
    images: "/images/elsabloodstone.jpg"
  },
  {
    name: "Fantasma",
    realName: "Jim Corrigan",
    yearOfAppearance: 1940,
    publisher: "dc",
    biography: "El Espíritu de la Venganza de DC, un ente sobrenatural que castiga a los criminales con poderes divinos. Fusionado con el alma del detective Jim Corrigan.",
    equipment: "Poderes sobrenaturales, manipulación del alma y materia",
    images: "/images/fantasma.jpg"
  },
  {
    name: "Flash",
    realName: "Barry Allen",
    yearOfAppearance: 1956,
    publisher: "dc",
    biography: "Después de un accidente con químicos y un rayo, Barry obtuvo la supervelocidad. Como Flash, protege Central City y el multiverso con su conexión a la Fuerza de la Velocidad.",
    equipment: "Anillo de Flash, traje especial, acceso a la Fuerza de la Velocidad",
    images: "/images/flash.jpg"
  },
  {
    name: "Geo-Force",
    realName: "Brion Markov",
    yearOfAppearance: 1983,
    publisher: "dc",
    biography: "Príncipe de Markovia con poderes geotectónicos, puede manipular la tierra y la lava. Es miembro fundador de los Outsiders y hermano de Terra.",
    equipment: "Traje reforzado, control geológico, vuelo",
    images: "/images/geo-force.jpg"
  },
  {
    name: "Hawkman",
    realName: "Carter Hall",
    yearOfAppearance: 1940,
    publisher: "dc",
    biography: "Reencarnación de un antiguo príncipe egipcio. Usa alas de metal nth y combate el crimen con su maza. Conecta sus vidas pasadas con tecnología alienígena.",
    equipment: "Alas de metal Nth, maza, armadura",
    images: "/images/hawkman.jpg"
  },
  {
    name: "Hellcat",
    realName: "Patsy Walker",
    yearOfAppearance: 1944,
    publisher: "marvel",
    biography: "Exmodelo y estrella de cómic convertida en superheroína. Tiene poderes psíquicos y un traje que mejora su agilidad y fuerza. Aliada frecuente de los Defenders.",
    equipment: "Traje de Hellcat, garras retráctiles, poderes psíquicos",
    images: "/images/hellcat.jpg"
  },
  {
    name: "Hulk",
    realName: "Bruce Banner",
    yearOfAppearance: 1962,
    publisher: "marvel",
    biography: "Tras un experimento con rayos gamma, el científico Bruce Banner se transforma en Hulk, una criatura con fuerza ilimitada cada vez que se enfurece.",
    equipment: "Fuerza sobrehumana, regeneración, resistencia extrema",
    images: "/images/hulk.jpg"
  },
  {
    name: "Husk",
    realName: "Paige Guthrie",
    yearOfAppearance: 1984,
    publisher: "marvel",
    biography: "Mutante que puede cambiar la composición de su cuerpo al quitarse la piel. Hermana menor de Cannonball y exmiembro de Generation X.",
    equipment: "Habilidad mutante de transformar su piel en acero, roca, etc.",
    images: "/images/husk.jpg"
  },
  {
    name: "Iron Man",
    realName: "Tony Stark",
    yearOfAppearance: 1963,
    publisher: "marvel",
    biography: "Tony Stark es un genio millonario que construyó una armadura para escapar de sus captores y luego la perfeccionó para convertirse en el héroe tecnológico Iron Man.",
    equipment: "Armadura con armas, vuelo, inteligencia artificial FRIDAY",
    images: "/images/ironman.jpg"
  },
  {
    name: "Karma",
    realName: "Xi'an Coy Manh",
    yearOfAppearance: 1980,
    publisher: "marvel",
    biography: "Mutante vietnamita con la habilidad de poseer mentalmente a otras personas. Es miembro de los New Mutants y figura maternal del grupo.",
    equipment: "Poderes psíquicos de posesión, entrenamiento táctico",
    images: "/images/karma.jpg"
  },
  {
    name: "Green Lantern",
    realName: "Hal Jordan",
    yearOfAppearance: 1959,
    publisher: "dc",
    biography: "Piloto de pruebas elegido por el anillo de poder para unirse a los Green Lantern Corps, una fuerza intergaláctica que protege el universo usando la voluntad.",
    equipment: "Anillo de poder, batería de energía",
    images: "/images/linternaverde.jpg"
  },
  {
    name: "Man-Wolf",
    realName: "John Jameson",
    yearOfAppearance: 1971,
    publisher: "marvel",
    biography: "Astronauta e hijo de J. Jonah Jameson. Se convierte en el hombre lobo Man-Wolf al entrar en contacto con la Gema de Dios, una fuente de poder místico lunar.",
    equipment: "Fuerza sobrehumana, sentidos agudizados, transformación en lobo",
    images: "/images/man-wolf.jpg"
  },
  {
    name: "Moon Knight",
    realName: "Marc Spector",
    yearOfAppearance: 1975,
    publisher: "marvel",
    biography: "Exmercenario resucitado por el dios egipcio Khonshu, lucha contra el crimen en Nueva York como Moon Knight, con múltiples personalidades y entrenamiento en combate.",
    equipment: "Armadura, bastones lunares, tecnología, armas arrojadizas",
    images: "/images/moonknight.jpg"
  },
  {
    name: "Moonstone",
    realName: "Karla Sofen",
    yearOfAppearance: 1975,
    publisher: "marvel",
    biography: "Psiquiatra que obtuvo poderes al manipular a un paciente y adquirir una gema alienígena. Fue miembro de los Thunderbolts y los Dark Avengers.",
    equipment: "Gema lunar que otorga vuelo, intangibilidad y rayos de energía",
    images: "/images/moonstone.jpg"
  },
  {
    name: "Wonder Woman",
    realName: "Diana Prince",
    yearOfAppearance: 1941,
    publisher: "dc",
    biography: "Guerrera amazona de Themyscira, dotada de poderes divinos y habilidades de combate. Lucha por la justicia, la igualdad y la paz en el mundo humano.",
    equipment: "Lazo de la Verdad, brazaletes indestructibles, tiara, espada",
    images: "/images/mujermaravilla.jpg"
  },
  {
    name: "Nico Minoru",
    realName: "Nico Minoru",
    yearOfAppearance: 2003,
    publisher: "marvel",
    biography: "Hija de dos villanos ocultistas, lidera a los Runaways. Empuña el Bastón del Uno, un artefacto mágico poderoso con un gran costo personal.",
    equipment: "Bastón del Uno (artefacto mágico), magia oscura",
    images: "/images/nicominoru.jpg"
  },
  {
    name: "Nova",
    realName: "Richard Rider",
    yearOfAppearance: 1976,
    publisher: "marvel",
    biography: "Un adolescente que recibe el poder del Nova Corps tras la destrucción de Xandar. Con poderes cósmicos, se convierte en defensor de la galaxia.",
    equipment: "Uniforme Nova, vuelo, supervelocidad, manipulación de energía",
    images: "/images/nova.jpg"
  },
  {
    name: "Phantom Stranger",
    realName: "Desconocido",
    yearOfAppearance: 1952,
    publisher: "dc",
    biography: "Misterioso ser inmortal con vastos poderes mágicos. Actúa como observador y guía de eventos sobrenaturales, raramente interviniendo directamente.",
    equipment: "Capa encantada, conocimientos místicos, poderes divinos",
    images: "/images/phantomstranger.jpg"
  },
  {
    name: "Plastic Man",
    realName: "Patrick - Eel O'Brian",
    yearOfAppearance: 1941,
    publisher: "dc",
    biography: "Excriminal que tras un accidente químico adquiere la habilidad de estirarse y moldear su cuerpo a voluntad. Usa sus poderes con humor para combatir el crimen.",
    equipment: "Elasticidad extrema, forma cambiante, resistencia al daño",
    images: "/images/plasticman.jpg"
  },
  {
    name: "Ragman",
    realName: "Rory Regan",
    yearOfAppearance: 1976,
    publisher: "dc",
    biography: "Un hombre común que hereda el Traje de las Almas, compuesto por retazos místicos que contienen las almas de los pecadores que redime mediante sus actos heroicos.",
    equipment: "Traje de almas místicas, habilidades físicas aumentadas",
    images: "/images/ragman.jpg"
  },
  {
    name: "Shang-Chi",
    realName: "Shang-Chi",
    yearOfAppearance: 1973,
    publisher: "marvel",
    biography: "Maestro de las artes marciales entrenado desde joven. Hijo del criminal Fu Manchú (en versiones originales), lucha por la justicia usando su disciplina y poder interior.",
    equipment: "Anillos de poder (versión reciente), armas cuerpo a cuerpo",
    images: "/images/shangchi.jpg"
  },
  {
    name: "She-Hulk",
    realName: "Jennifer Walters",
    yearOfAppearance: 1980,
    publisher: "marvel",
    biography: "Prima de Bruce Banner, recibió una transfusión de sangre de él y adquirió habilidades similares. Abogada y superheroína, combina fuerza con inteligencia legal.",
    equipment: "Fuerza sobrehumana, resistencia, habilidades legales",
    images: "/images/shehulk.jpg"
  },
  {
    name: "Songbird",
    realName: "Melissa Gold",
    yearOfAppearance: 1997,
    publisher: "marvel",
    biography: "Excriminal que se reformó y se unió a los Thunderbolts. Usa implantes sónicos para generar alas sólidas y ataques de sonido.",
    equipment: "Implantes sónicos, alas de energía, ataques sónicos",
    images: "/images/songbird.jpg"
  },
  {
    name: "Spider-Man",
    realName: "Peter Parker",
    yearOfAppearance: 1962,
    publisher: "marvel",
    biography: "Joven con poderes arácnidos tras ser picado por una araña radiactiva. Usa sus habilidades para proteger a los inocentes como Spider-Man.",
    equipment: "Lanzatelarañas, traje, rastreador arácnido",
    images: "/images/spiderman.jpg"
  },
  {
    name: "Squirrel Girl",
    realName: "Doreen Green",
    yearOfAppearance: 1991,
    publisher: "marvel",
    biography: "Joven optimista con habilidades de ardilla. Ha derrotado a numerosos villanos, incluyendo a Thanos, gracias a su astucia e inesperado poder.",
    equipment: "Cola de ardilla, comunicación con ardillas, garras",
    images: "/images/squirrelgirl.jpg"
  },
  {
    name: "Stingray",
    realName: "Walter Newell",
    yearOfAppearance: 1967,
    publisher: "marvel",
    biography: "Científico oceanógrafo que diseñó un traje de alta tecnología para explorar el océano. Se convirtió en el superhéroe submarino Stingray.",
    equipment: "Traje acorazado de natación, descargas eléctricas",
    images: "/images/stingray.jpg"
  },
  {
    name: "Superman",
    realName: "Clark Kent / Kal-El",
    yearOfAppearance: 1938,
    publisher: "dc",
    biography: "Último hijo del planeta Krypton, criado en la Tierra como Clark Kent. Posee increíbles poderes y defiende la verdad, justicia y esperanza como Superman.",
    equipment: "Capa, visión calorífica, aliento helado, vuelo, fuerza sobrehumana",
    images: "/images/superman.jpg"
  },
  {
    name: "The Question",
    realName: "Vic Sage",
    yearOfAppearance: 1967,
    publisher: "dc",
    biography: "Investigador enmascarado conocido por su rostro sin rasgos. Busca la verdad mediante la lógica, el periodismo y la filosofía.",
    equipment: "Gas que oculta su rostro, habilidades de combate y deducción",
    images: "/images/thequestion.jpg"
  },
  {
    name: "The Ray",
    realName: "Ray Terrill",
    yearOfAppearance: 1992,
    publisher: "dc",
    biography: "Joven que absorbe y manipula energía luminosa. Puede convertirse en luz pura, volar y disparar rayos, siendo un defensor de la justicia.",
    equipment: "Control de energía luminosa, vuelo, intangibilidad",
    images: "/images/theray.jpg"
  },
  {
    name: "Thor",
    realName: "Thor Odinson",
    yearOfAppearance: 1962,
    publisher: "marvel",
    biography: "Dios del trueno asgardiano, hijo de Odín. Protector de los Nueve Reinos y miembro fundador de los Vengadores.",
    equipment: "Mjölnir (martillo), Stormbreaker, control del rayo y el trueno",
    images: "/images/thor.jpg"
  },
  {
    name: "Vixen",
    realName: "Mari McCabe",
    yearOfAppearance: 1981,
    publisher: "dc",
    biography: "Modelo y activista que heredó un tótem mágico que le permite canalizar las habilidades de cualquier animal de la Tierra.",
    equipment: "Tótem de Tantu, poderes animales",
    images: "/images/vixen.jpg"
  }
]

async function seedDatabase() {
  try {
    console.log("🌱 Connecting to MongoDB...")
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // Limpiar la colección existente
    console.log("🧹 Clearing existing heroes...")
    await Hero.deleteMany({})

    // Insertar datos de ejemplo
    console.log("📝 Inserting sample heroes...")
    const insertedHeroes = await Hero.insertMany(sampleHeroes)

    console.log(`✅ Successfully inserted ${insertedHeroes.length} heroes:`)
    insertedHeroes.forEach((hero) => {
      console.log(`   - ${hero.name} (${hero.publisher})`)
    })

    console.log("🎉 Database seeded successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error.message)
    process.exit(1)
  }
}

seedDatabase()
