'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Plane, MapPin, Users, Sparkles, Loader2, RefreshCw, Check, CreditCard } from 'lucide-react';

// ─── Lista de ciudades y destinos para autocompletar ──────────────────────────
const PLACES = [
  // ── Chile — ciudades, pueblos y destinos turísticos ──
  'Santiago, Chile','Valparaíso, Chile','Viña del Mar, Chile','Concepción, Chile',
  'La Serena, Chile','Coquimbo, Chile','Antofagasta, Chile','Iquique, Chile',
  'Arica, Chile','Calama, Chile','Temuco, Chile','Puerto Montt, Chile',
  'Puerto Varas, Chile','Punta Arenas, Chile','Puerto Natales, Chile',
  'San Pedro de Atacama, Chile','Rancagua, Chile','Talca, Chile',
  'Chillán, Chile','Osorno, Chile','Valdivia, Chile','Copiapó, Chile',
  'Pucón, Chile','Villarrica, Chile','Lago Villarrica, Chile',
  'Lican-Ray, Chile','Coñaripe, Chile','Panguipulli, Chile',
  'Torres del Paine, Chile','Puerto Williams, Chile',
  'Chiloé, Chile','Castro, Chile','Ancud, Chile','Quellón, Chile',
  'Frutillar, Chile','Puerto Octay, Chile','Lago Llanquihue, Chile',
  'Parque Conguillío, Chile','Melipeuco, Chile','Curarrehue, Chile',
  'Lago Ranco, Chile','Futrono, Chile','Lago Maihue, Chile',
  'Hanga Roa, Isla de Pascua, Chile','Isla de Pascua, Chile',
  'Cajón del Maipo, Chile','San José de Maipo, Chile',
  'Valle de Elqui, Chile','Vicuña, Chile','Pisco Elqui, Chile','Montegrande, Chile',
  'Pichilemu, Chile','Bucalemu, Chile','Punta de Tralca, Chile',
  'Constitución, Chile','Cobquecura, Chile',
  'Dichato, Chile','Tomé, Chile','Penco, Chile',
  'Curicó, Chile','Linares, Chile','Parral, Chile',
  'Los Ángeles, Chile','Santa Bárbara, Chile','Mulchén, Chile',
  'Angol, Chile','Traiguén, Chile','Collipulli, Chile',
  'Nueva Imperial, Chile','Carahue, Chile','Puerto Saavedra, Chile',
  'Villarrica (volcán), Chile','Volcán Lanín, Chile','Lonquimay, Chile',
  'Cunco, Chile','Loncoche, Chile','Pitrufquén, Chile',
  'Valdivia (río), Chile','Niebla, Chile','Corral, Chile',
  'Puyehue, Chile','Entre Lagos, Chile','Antillanca, Chile',
  'Futaleufú, Chile','Palena, Chile','Chaitén, Chile',
  'Coyhaique, Chile','Puerto Aysén, Chile','Cochrane, Chile',"Villa O'Higgins, Chile",
  'Laguna San Rafael, Chile','Parque Patagonia, Chile',
  'Porvenir, Chile','Cerro Castillo, Chile',
  'La Junta, Chile','Puyuhuapi, Chile','Ventisquero Colgante, Chile',
  'Valle de Colchagua, Chile','Santa Cruz (VI Región), Chile','Viña Santa Cruz, Chile',
  'Zapallar, Chile','Papudo, Chile','La Ligua, Chile',
  'Maitencillo, Chile','Cachagua, Chile','Quintero, Chile',
  'Isla Negra, Chile','El Quisco, Chile','El Tabo, Chile','Cartagena, Chile',
  'Algarrobo, Chile','Las Cruces, Chile',
  'Sewell, Chile','Machalí, Chile',
  'San Fernando, Chile','Pichidegua, Chile',
  'Termas de Chillán, Chile','Nevados de Chillán, Chile',
  'Las Trancas, Chile','Recinto, Chile',
  'Concepción (Bíobío), Chile','Talcahuano, Chile','Hualpén, Chile',
  'Coronel, Chile','Lota, Chile','Arauco, Chile',
  'Lebu, Chile','Cañete, Chile','Tirúa, Chile',
  'Nahuelbuta, Chile','Parque Nahuelbuta, Chile',
  'Cueva del Milodón, Chile',
  'Valle de la Luna, Chile','Atacama (desierto), Chile',
  'Geisers del Tatio, Chile','Lagunas Altiplánicas, Chile',
  'Ojos del Salado, Chile','Parque Llanos de Challe, Chile',
  'Bahía Inglesa, Chile','Caldera, Chile',
  'Chañaral, Chile','Diego de Almagro, Chile',
  'Taltal, Chile','Paposo, Chile',
  'Tocopilla, Chile','Mejillones, Chile',
  'Tarapacá, Chile','Colchane, Chile','Huara, Chile',
  'Pisagua, Chile','Pozo Almonte, Chile','La Tirana, Chile',
  'Putre, Chile','Parinacota, Chile','Parque Nacional Lauca, Chile',
  'Azapa (Valle), Chile','Codpa, Chile',
  // ── Argentina ──
  'Buenos Aires, Argentina','Mendoza, Argentina','Bariloche, Argentina',
  'Córdoba, Argentina','Salta, Argentina','Mar del Plata, Argentina',
  'Ushuaia, Argentina','Puerto Iguazú, Argentina','Tucumán, Argentina','Rosario, Argentina',
  'La Plata, Argentina','San Carlos de Bariloche, Argentina',
  'El Calafate, Argentina','El Chaltén, Argentina','Perito Moreno (glaciar), Argentina',
  'Puerto Madryn, Argentina','Trelew, Argentina','Valdés (Península), Argentina',
  'San Martín de los Andes, Argentina','Villa La Angostura, Argentina',
  'Neuquén, Argentina','Cipolletti, Argentina',
  'Viedma, Argentina','Carmen de Patagones, Argentina',
  'Comodoro Rivadavia, Argentina','Puerto Deseado, Argentina',
  'Río Gallegos, Argentina','Tierra del Fuego, Argentina',
  'Cafayate, Argentina','Tilcara, Argentina','Quebrada de Humahuaca, Argentina',
  'Purmamarca, Argentina','Iruya, Argentina','Humahuaca, Argentina',
  'Jujuy, Argentina','San Salvador de Jujuy, Argentina',
  'Catamarca, Argentina','La Rioja, Argentina',
  'San Juan, Argentina','Ischigualasto (Valle de la Luna), Argentina',
  'Talampaya, Argentina','Chilecito, Argentina',
  'San Luis, Argentina','Merlo, Argentina','Potrero de los Funes, Argentina',
  'Santa Fe, Argentina','Paraná, Argentina',
  'Corrientes, Argentina','Resistencia, Argentina',
  'Posadas, Argentina','Misiones, Argentina','Oberá, Argentina',
  'Colón, Argentina','Gualeguaychú, Argentina',
  'Pinamar, Argentina','Villa Gesell, Argentina','Miramar, Argentina',
  'Tandil, Argentina','Sierra de la Ventana, Argentina',
  'Santa Rosa, Argentina','La Pampa, Argentina',
  // ── Perú ──
  'Lima, Perú','Cusco, Perú','Machu Picchu, Perú','Arequipa, Perú',
  'Trujillo, Perú','Iquitos, Perú','Paracas, Perú','Nazca, Perú',
  'Puno, Perú','Lago Titicaca, Perú','Juliaca, Perú',
  'Pisac, Perú','Ollantaytambo, Perú','Urubamba, Perú','Valle Sagrado, Perú',
  'Chinchero, Perú','Aguas Calientes, Perú',
  'Choquequirao, Perú','Ausangate, Perú','Vinicunca (Montaña de Colores), Perú',
  'Huaraz, Perú','Cordillera Blanca, Perú','Huascarán, Perú',
  'Cajamarca, Perú','Chachapoyas, Perú','Kuelap, Perú',
  'Tarapoto, Perú','Moyobamba, Perú',
  'Puerto Maldonado, Perú','Manu (Reserva), Perú',
  'Máncora, Perú','Huanchaco, Perú','Chiclayo, Perú',
  'Piura, Perú','Tumbes, Perú',
  'Huacachina, Perú','Ica, Perú',
  // ── Colombia ──
  'Bogotá, Colombia','Medellín, Colombia','Cartagena, Colombia',
  'Cali, Colombia','Santa Marta, Colombia','Barranquilla, Colombia','Manizales, Colombia',
  'Pereira, Colombia','Armenia, Colombia','Eje Cafetero, Colombia',
  'Salento, Colombia','El Cocuy, Colombia','Villa de Leyva, Colombia',
  'Barichara, Colombia','San Gil, Colombia',
  'Leticia, Colombia','Amazonas, Colombia',
  'Nuquí, Colombia','Bahía Solano, Colombia',
  'Tayrona (Parque), Colombia','Minca, Colombia',
  'Cartagena de Indias, Colombia','Islas del Rosario, Colombia',
  'San Andrés, Colombia','Providencia, Colombia',
  'Popayán, Colombia','Pasto, Colombia','Ipiales, Colombia',
  'Bucaramanga, Colombia','Girón, Colombia',
  // ── Ecuador ──
  'Quito, Ecuador','Guayaquil, Ecuador','Cuenca, Ecuador','Islas Galápagos, Ecuador',
  'Baños, Ecuador','Riobamba, Ecuador','Nariz del Diablo, Ecuador',
  'Otavalo, Ecuador','Cotacachi, Ecuador','Ibarra, Ecuador',
  'Mindo, Ecuador','Papallacta, Ecuador',
  'Puerto Ayora, Ecuador','Isla Santa Cruz, Ecuador','Isla Isabela, Ecuador',
  'Montañita, Ecuador','Salinas, Ecuador','Manta, Ecuador',
  'Tena, Ecuador','Puyo, Ecuador','Lago Agrio, Ecuador',
  'Loja, Ecuador','Vilcabamba, Ecuador',
  // ── Bolivia ──
  'La Paz, Bolivia','Salar de Uyuni, Bolivia','Santa Cruz, Bolivia',
  'Sucre, Bolivia','Potosí, Bolivia','Copacabana, Bolivia',
  'Isla del Sol, Bolivia','Tiwanaku, Bolivia',
  'Cochabamba, Bolivia','Oruro, Bolivia','Trinidad, Bolivia',
  'Rurrenabaque, Bolivia','Madidi (Parque), Bolivia',
  // ── Brasil ──
  'Río de Janeiro, Brasil','São Paulo, Brasil','Salvador, Brasil',
  'Fortaleza, Brasil','Florianópolis, Brasil','Foz do Iguaçu, Brasil',
  'Natal, Brasil','Recife, Brasil','Manaos, Brasil',
  'Brasilia, Brasil','Belém, Brasil','São Luís, Brasil',
  'João Pessoa, Brasil','Maceió, Brasil','Aracaju, Brasil',
  'Porto Alegre, Brasil','Curitiba, Brasil','Belo Horizonte, Brasil',
  'Lençóis Maranhenses, Brasil','Jericoacoara, Brasil','Bonito, Brasil',
  'Pantanal, Brasil','Chapada Diamantina, Brasil','Chapada dos Veadeiros, Brasil',
  'Ilha Grande, Brasil','Paraty, Brasil','Búzios, Brasil',
  'Gramado, Brasil','Canela, Brasil','Camboriú, Brasil',
  'Arraial do Cabo, Brasil','Trindade, Brasil','Angra dos Reis, Brasil',
  // ── Uruguay ──
  'Montevideo, Uruguay','Punta del Este, Uruguay','Colonia del Sacramento, Uruguay',
  'Cabo Polonio, Uruguay','Punta del Diablo, Uruguay',
  'Minas, Uruguay','Tacuarembó, Uruguay','Salto, Uruguay',
  // ── Paraguay ──
  'Asunción, Paraguay','Ciudad del Este, Paraguay','Encarnación, Paraguay',
  'Misiones (Paraguay), Paraguay','Ybycuí, Paraguay',
  // ── Venezuela ──
  'Caracas, Venezuela','Isla Margarita, Venezuela',
  'Canaima, Venezuela','Salto Ángel, Venezuela',
  'Mérida, Venezuela','Los Roques, Venezuela',
  // ── México ──
  'Ciudad de México, México','Cancún, México','Playa del Carmen, México',
  'Tulum, México','Los Cabos, México','Puerto Vallarta, México',
  'Oaxaca, México','Guadalajara, México','Monterrey, México',
  'Mérida, México','Chichén Itzá, México','San Miguel de Allende, México',
  'Guanajuato, México','Morelia, México','Puebla, México',
  'Taxco, México','Teotihuacán, México','Palenque, México',
  'San Cristóbal de las Casas, México','Chiapas, México',
  'Holbox, México','Bacalar, México','Isla Mujeres, México',
  'Mazatlán, México','Zihuatanejo, México','Ixtapa, México',
  'Acapulco, México','Veracruz, México','Jalapa, México',
  'Tijuana, México','Ensenada, México','La Paz (Baja), México',
  'Loreto, México','Mulege, México',
  'Huatulco, México','Puerto Escondido, México','Bahías de Huatulco, México',
  // ── Centroamérica y Caribe ──
  'San José, Costa Rica','Manuel Antonio, Costa Rica','Arenal, Costa Rica',
  'Monteverde, Costa Rica','Guanacaste, Costa Rica','Tamarindo, Costa Rica',
  'Santa Teresa, Costa Rica','Tortuguero, Costa Rica','Cahuita, Costa Rica',
  'Ciudad de Panamá, Panamá','Bocas del Toro, Panamá','San Blas, Panamá',
  'Boquete, Panamá','El Valle de Antón, Panamá',
  'Antigua, Guatemala','Tikal, Guatemala','Atitlán (Lago), Guatemala',
  'Ciudad de Guatemala, Guatemala','Flores, Guatemala','Semuc Champey, Guatemala',
  'La Habana, Cuba','Trinidad (Cuba), Cuba','Varadero, Cuba','Viñales, Cuba',
  'Punta Cana, República Dominicana','Santo Domingo, República Dominicana',
  'Las Terrenas, República Dominicana','Samaná, República Dominicana',
  'San Juan, Puerto Rico','Vieques, Puerto Rico',
  'Nassau, Bahamas','Exuma, Bahamas',
  'Belize City, Belice','Caye Caulker, Belice','San Pedro (Belice), Belice',
  'Tegucigalpa, Honduras','Roatán, Honduras','Copán (ruinas), Honduras',
  'San Salvador, El Salvador','Santa Ana, El Salvador',
  'Managua, Nicaragua','Granada (Nicaragua), Nicaragua','León, Nicaragua','Ometepe, Nicaragua',
  'Isla Corn (Big Corn), Nicaragua',
  'Bridgetown, Barbados','Kingston, Jamaica','Negril, Jamaica','Montego Bay, Jamaica',
  'Castries, Santa Lucía','Kingstown, San Vicente',
  'Georgetown, Guyana','Paramaribo, Surinam',
  // ── España ──
  'Madrid, España','Barcelona, España','Sevilla, España','Valencia, España',
  'Bilbao, España','Granada, España','Málaga, España','Ibiza, España',
  'San Sebastián, España','Toledo, España','Palma de Mallorca, España',
  'Tenerife, España','Gran Canaria, España','Lanzarote, España','Fuerteventura, España',
  'Formentera, España','Menorca, España',
  'Córdoba, España','Zaragoza, España','Santiago de Compostela, España',
  'Salamanca, España','Ávila, España','Segovia, España','Burgos, España',
  'Cádiz, España','Jerez de la Frontera, España','Ronda, España',
  'Marbella, España','Nerja, España','Frigiliana, España',
  'Pamplona, España','Logroño, España','La Rioja, España',
  'Alicante, España','Murcia, España','Cartagena (España), España',
  'A Coruña, España','Vigo, España','Oviedo, España','Gijón, España',
  'Tarragona, España','Girona, España',
  // ── Portugal ──
  'Lisboa, Portugal','Oporto, Portugal','Algarve, Portugal',
  'Sintra, Portugal','Coimbra, Portugal','Madeira, Portugal','Azores, Portugal',
  'Évora, Portugal','Óbidos, Portugal','Nazaré, Portugal',
  'Faro, Portugal','Tavira, Portugal','Lagos, Portugal',
  'Braga, Portugal','Guimarães, Portugal','Cascais, Portugal',
  'Setúbal, Portugal','Comporta, Portugal',
  // ── Italia ──
  'Roma, Italia','Florencia, Italia','Venecia, Italia','Milán, Italia',
  'Nápoles, Italia','Cinque Terre, Italia','Sicilia, Italia',
  'Amalfi, Italia','Pisa, Italia','Verona, Italia','Turín, Italia',
  'Palermo, Italia','Catania, Italia','Siracusa, Italia','Agrigento, Italia',
  'Bari, Italia','Lecce, Italia','Alberobello, Italia','Matera, Italia',
  'Bolonia, Italia','Módena, Italia','Parma, Italia','Ferrara, Italia',
  'Génova, Italia','Portofino, Italia','San Remo, Italia',
  'Bergamo, Italia','Como, Italia','Lago de Como, Italia',
  'Lago de Garda, Italia','Riva del Garda, Italia',
  'Capri, Italia','Ischia, Italia','Positano, Italia','Ravello, Italia',
  'Pompeya, Italia','Herculano, Italia',
  "Bolzano, Italia","Cortina d'Ampezzo, Italia",'Dolomitas, Italia',
  'Perugia, Italia','Asís, Italia','Orvieto, Italia','Siena, Italia',
  'San Gimignano, Italia','Lucca, Italia',
  'Cerdeña, Italia','Cagliari, Italia','Olbia, Italia',
  // ── Francia ──
  'París, Francia','Niza, Francia','Lyon, Francia','Burdeos, Francia',
  'Estrasburgo, Francia','Versalles, Francia','Marsella, Francia','Bretaña, Francia',
  'Toulouse, Francia','Montpellier, Francia','Nantes, Francia','Rennes, Francia',
  'Grenoble, Francia','Annecy, Francia','Chamonix, Francia','Mont Blanc, Francia',
  'Carcasona, Francia','Aviñón, Francia','Aix-en-Provence, Francia',
  'Cannes, Francia','Mónaco','Saint-Tropez, Francia',
  'Normandía, Francia','Bayona, Francia','Biarritz, Francia',
  'Colmar, Francia','Alsacia, Francia','Reims, Francia',
  'Mont-Saint-Michel, Francia','Loire (Valle), Francia',
  'Córcega, Francia','Ajaccio, Francia',
  // ── Alemania ──
  'Berlín, Alemania','Múnich, Alemania','Hamburgo, Alemania',
  'Frankfurt, Alemania','Dresde, Alemania','Colonia, Alemania','Heidelberg, Alemania',
  'Stuttgart, Alemania','Düsseldorf, Alemania','Leipzig, Alemania',
  'Nuremberg, Alemania','Augsburgo, Alemania','Rothenburg ob der Tauber, Alemania',
  'Freiburg, Alemania','Selva Negra, Alemania',
  'Baviera, Alemania','Neuschwanstein (castillo), Alemania',
  'Lago Constanza, Alemania','Lindau, Alemania',
  'Bremen, Alemania','Lübeck, Alemania',
  // ── Reino Unido e Irlanda ──
  'Londres, Reino Unido','Edimburgo, Escocia','Liverpool, Reino Unido',
  'Manchester, Reino Unido','Oxford, Reino Unido','Cambridge, Reino Unido',
  'Bath, Reino Unido','Dublín, Irlanda','Galway, Irlanda',
  'Bristol, Reino Unido','Brighton, Reino Unido','Canterbury, Reino Unido',
  'Stonehenge, Reino Unido','York, Reino Unido','Durham, Reino Unido',
  'Glasgow, Escocia','Inverness, Escocia','Highlands, Escocia',
  'Lago Ness, Escocia','St Andrews, Escocia',
  'Cardiff, Gales','Snowdonia, Gales',
  'Belfast, Irlanda del Norte','Costa Causeway, Irlanda del Norte',
  'Kerry (Ring of), Irlanda','Cliffs of Moher, Irlanda',
  'Cork, Irlanda','Killarney, Irlanda','Dingle, Irlanda',
  // ── Países Bajos, Bélgica y Luxemburgo ──
  'Ámsterdam, Países Bajos','Rotterdam, Países Bajos',
  'La Haya, Países Bajos','Utrecht, Países Bajos','Leiden, Países Bajos',
  'Delft, Países Bajos','Keukenhof, Países Bajos','Volendam, Países Bajos',
  'Bruselas, Bélgica','Brujas, Bélgica','Gante, Bélgica',
  'Amberes, Bélgica','Lieja, Bélgica',
  'Luxemburgo, Luxemburgo',
  // ── Suiza y Austria ──
  'Zurich, Suiza','Ginebra, Suiza','Berna, Suiza',
  'Interlaken, Suiza','Lucerna, Suiza','Zermatt, Suiza',
  'Grindelwald, Suiza','Lugano, Suiza','Basilea, Suiza',
  'Lausana, Suiza','Montreux, Suiza','St. Moritz, Suiza',
  'Viena, Austria','Salzburgo, Austria','Innsbruck, Austria',
  'Graz, Austria','Hallstatt, Austria','Linz, Austria',
  'Kitzbühel, Austria','Zell am See, Austria',
  // ── Europa del Este ──
  'Atenas, Grecia','Santorini, Grecia','Mykonos, Grecia','Creta, Grecia','Rodos, Grecia',
  'Zakynthos, Grecia','Corfú, Grecia','Meteora, Grecia','Delfos, Grecia',
  'Estambul, Turquía','Capadocia, Turquía','Antalya, Turquía','Éfeso, Turquía',
  'Bodrum, Turquía','Marmaris, Turquía','Pamukkale, Turquía','Göreme, Turquía',
  'Dubrovnik, Croacia','Zagreb, Croacia','Split, Croacia','Lagos de Plitvice, Croacia',
  'Hvar, Croacia','Rovinj, Croacia','Zadar, Croacia','Kotor, Montenegro',
  'Budva, Montenegro','Bar, Montenegro',
  'Praga, República Checa','Budapest, Hungría',
  'Brno, República Checa','Cesky Krumlov, República Checa','Karlovy Vary, República Checa',
  'Bratislava, Eslovaquia','Banská Štiavnica, Eslovaquia',
  'Varsovia, Polonia','Cracovia, Polonia','Gdansk, Polonia','Wroclaw, Polonia',
  'Poznan, Polonia','Torun, Polonia','Zakopane, Polonia',
  'Bucarest, Rumanía','Transilvania, Rumanía','Brasov, Rumanía','Sibiu, Rumanía','Sinaia, Rumanía',
  'Sofía, Bulgaria','Plovdiv, Bulgaria','Varna, Bulgaria',
  'Belgrado, Serbia','Novi Sad, Serbia',
  'Sarajevo, Bosnia y Herzegovina','Mostar, Bosnia y Herzegovina',
  'Ljubljana, Eslovenia','Lago Bled, Eslovenia','Piran, Eslovenia',
  'Skopie, Macedonia del Norte','Ohrid, Macedonia del Norte',
  'Tirana, Albania','Gjirokastra, Albania',
  'Kiev, Ucrania','Lviv, Ucrania',
  // ── Europa del Norte ──
  'Oslo, Noruega','Bergen, Noruega','Fiordos de Noruega, Noruega',
  'Tromsø, Noruega','Ålesund, Noruega','Flåm, Noruega','Geiranger, Noruega',
  'Lofoten, Noruega','Svalbard, Noruega',
  'Reikiavik, Islandia','Círculo Dorado, Islandia','Cueva de Hielo, Islandia',
  'Akureyri, Islandia','Jökulsárlón, Islandia',
  'Estocolmo, Suecia','Gotemburgo, Suecia','Malmö, Suecia','Uppsala, Suecia',
  'Copenhague, Dinamarca','Aarhus, Dinamarca','Odense, Dinamarca',
  'Helsinki, Finlandia','Rovaniemi, Finlandia','Laponia, Finlandia','Tampere, Finlandia',
  'Tallin, Estonia','Tartu, Estonia',
  'Riga, Letonia','Vilnius, Lituania',
  // ── Asia — Japón ──
  'Tokio, Japón','Kioto, Japón','Osaka, Japón','Hiroshima, Japón',
  'Nara, Japón','Sapporo, Japón','Hakone, Japón',
  'Nikko, Japón','Kamakura, Japón','Yokohama, Japón',
  'Nagoya, Japón','Kanazawa, Japón','Takayama, Japón',
  'Fukuoka, Japón','Nagasaki, Japón','Kumamoto, Japón',
  'Okinawa, Japón','Miyajima, Japón',
  'Beppu, Japón','Kagoshima, Japón','Sendai, Japón',
  // ── Asia — Corea del Sur ──
  'Seúl, Corea del Sur','Busan, Corea del Sur','Jeju, Corea del Sur',
  'Gyeongju, Corea del Sur','Incheon, Corea del Sur','Daegu, Corea del Sur',
  // ── Asia — China ──
  "Pekín, China",'Shanghái, China','Guangzhou, China','Chengdu, China',"Xi'an, China",
  'Hangzhou, China','Guilin, China','Lijiang, China','Dali, China',
  'Zhangjiajie, China','Yangshuo, China','Huangshan, China',
  'Hong Kong','Macao',
  // ── Asia — Sudeste Asiático ──
  'Bali, Indonesia','Yakarta, Indonesia','Lombok, Indonesia','Yogyakarta, Indonesia',
  'Ubud, Indonesia','Gili Islands, Indonesia','Raja Ampat, Indonesia','Komodo, Indonesia',
  'Labuan Bajo, Indonesia','Flores, Indonesia','Sumatra, Indonesia',
  'Bangkok, Tailandia','Chiang Mai, Tailandia','Phuket, Tailandia','Koh Samui, Tailandia',
  'Koh Phi Phi, Tailandia','Koh Lanta, Tailandia','Pai, Tailandia','Ayutthaya, Tailandia',
  'Krabi, Tailandia','Kanchanaburi, Tailandia',
  'Hanói, Vietnam','Ho Chi Minh, Vietnam','Hoi An, Vietnam','Ha Long Bay, Vietnam',
  'Hue, Vietnam','Da Nang, Vietnam','Ninh Binh, Vietnam','Sapa, Vietnam',
  'Phú Quốc, Vietnam','Mũi Né, Vietnam',
  'Singapur',
  'Kuala Lumpur, Malasia','Penang, Malasia','Langkawi, Malasia',
  'Kota Kinabalu, Malasia','Kuching, Malasia','Borneo, Malasia',
  'Manila, Filipinas','Boracay, Filipinas','Palawan, Filipinas','Siargao, Filipinas',
  'Cebu, Filipinas','Davao, Filipinas','Vigan, Filipinas','Banaue, Filipinas',
  'Angkor Wat, Camboya','Siem Reap, Camboya','Phnom Penh, Camboya',
  'Luang Prabang, Laos','Vientián, Laos','Vang Vieng, Laos',
  'Rangún, Myanmar','Bagan, Myanmar','Mandalay, Myanmar','Inle (Lago), Myanmar',
  'Naipyidó, Myanmar','Yangon, Myanmar',
  'Colombo, Sri Lanka','Kandy, Sri Lanka','Sigiriya, Sri Lanka','Galle, Sri Lanka',
  'Katmandú, Nepal','Pokhara, Nepal','Chitwan, Nepal','Annapurna, Nepal',
  'Dhaka, Bangladesh',
  // ── Asia — Sur y Oriente Medio ──
  'Nueva Delhi, India','Mumbai, India','Jaipur, India','Goa, India','Varanasi, India','Kerala, India',
  'Agra, India','Taj Mahal, India','Rajastán, India','Udaipur, India',
  'Jodhpur, India','Jaisalmer, India','Pushkar, India',
  'Bangalore, India','Chennai, India','Hyderabad, India','Calcuta, India',
  'Leh, India','Ladakh, India','Amritsar, India',
  'Dubái, Emiratos Árabes','Abu Dhabi, Emiratos Árabes','Sharjah, Emiratos Árabes',
  'Tel Aviv, Israel','Jerusalén, Israel','Mar Muerto, Israel','Eilat, Israel',
  'Ammán, Jordania','Petra, Jordania','Wadi Rum, Jordania',
  'Beirut, Líbano','Byblos, Líbano',
  'Muscat, Omán','Salalah, Omán',
  'Riad, Arabia Saudita',
  'Doha, Catar',
  'Tbilisi, Georgia','Batumi, Georgia',
  'Ereván, Armenia',
  'Bakú, Azerbaiyán',
  'Tashkent, Uzbekistán','Samarcanda, Uzbekistán','Bujará, Uzbekistán',
  // ── África ──
  'Marrakech, Marruecos','Fez, Marruecos','Casablanca, Marruecos','Chefchaouen, Marruecos','Agadir, Marruecos',
  'Essaouira, Marruecos','Tánger, Marruecos','Meknes, Marruecos',
  'El Cairo, Egipto','Luxor, Egipto','Sharm el-Sheik, Egipto','Aswan, Egipto',
  'Alejandría, Egipto','Abu Simbel, Egipto','Hurghada, Egipto',
  'Ciudad del Cabo, Sudáfrica','Johannesburgo, Sudáfrica','Safari Kruger, Sudáfrica','Garden Route, Sudáfrica',
  'Durban, Sudáfrica','Stellenbosch, Sudáfrica','Hermanus, Sudáfrica',
  'Nairobi, Kenia','Masái Mara, Kenia','Diani Beach, Kenia','Malindi, Kenia','Mombasa, Kenia',
  'Zanzíbar, Tanzania','Serengeti, Tanzania','Kilimanjaro, Tanzania','Ngorongoro, Tanzania',
  'Dar es Salaam, Tanzania','Arusha, Tanzania',
  'Kampala, Uganda','Bwindi (gorilas), Uganda',
  'Ruanda, Ruanda','Kigali, Ruanda','Volcanes (Parque), Ruanda',
  'Addis Abeba, Etiopía','Lalibela, Etiopía','Simien Mountains, Etiopía',
  'Túnez, Túnez','Jerba, Túnez','Djerba, Túnez',
  'Argel, Argelia',
  'Dakar, Senegal','Goree (Isla), Senegal',
  'Accra, Ghana','Kumasi, Ghana',
  'Lagos, Nigeria','Abuja, Nigeria',
  'Maputo, Mozambique','Bazaruto, Mozambique','Tofo, Mozambique',
  'Victoria (Cataratas), Zimbabue','Hwange, Zimbabue',
  'Lusaka, Zambia','South Luangwa, Zambia',
  'Antananarivo, Madagascar','Andasibe, Madagascar','Nosy Be, Madagascar',
  'Isla Mauricio','Reunión (isla)','Seychelles',
  // ── Oceanía ──
  'Sídney, Australia','Melbourne, Australia','Brisbane, Australia',
  'Cairns, Australia','Perth, Australia','Gold Coast, Australia','Uluru, Australia',
  'Darwin, Australia','Adelaide, Australia','Hobart, Australia',
  'Gran Barrera de Coral, Australia','Byron Bay, Australia','Noosa, Australia',
  'Auckland, Nueva Zelanda','Wellington, Nueva Zelanda',
  'Queenstown, Nueva Zelanda','Rotorua, Nueva Zelanda',
  'Christchurch, Nueva Zelanda','Milford Sound, Nueva Zelanda',
  'Wanaka, Nueva Zelanda','Franz Josef, Nueva Zelanda',
  'Suva, Fiyi','Nadi, Fiyi','Islas Yasawa, Fiyi',
  'Papeete, Polinesia Francesa','Bora Bora, Polinesia Francesa','Moorea, Polinesia Francesa',
  // ── EE.UU. y Canadá ──
  'Nueva York, EE.UU.','Los Ángeles, EE.UU.','Miami, EE.UU.','Las Vegas, EE.UU.',
  'San Francisco, EE.UU.','Chicago, EE.UU.','Washington DC, EE.UU.',
  'Boston, EE.UU.','New Orleans, EE.UU.','Hawái, EE.UU.',
  'Orlando, EE.UU.','Seattle, EE.UU.','Denver, EE.UU.',
  'Grand Canyon, EE.UU.','Yellowstone, EE.UU.','Nashville, EE.UU.',
  'Austin, EE.UU.','Houston, EE.UU.','Dallas, EE.UU.','San Antonio, EE.UU.',
  'Portland, EE.UU.','San Diego, EE.UU.','Santa Barbara, CA, EE.UU.','Santa Fe, EE.UU.','Sedona, EE.UU.',
  'Napa Valley, EE.UU.','Yosemite, EE.UU.','Zion, EE.UU.','Bryce Canyon, EE.UU.',
  'Monument Valley, EE.UU.','Antelope Canyon, EE.UU.',
  'Memphis, EE.UU.','Atlanta, EE.UU.','Charlotte, EE.UU.',
  'Philadelphia, EE.UU.','Baltimore, EE.UU.',
  'Minneapolis, EE.UU.','Milwaukee, EE.UU.',
  'Savannah, EE.UU.','Charleston, EE.UU.','Asheville, EE.UU.',
  'Toronto, Canadá','Vancouver, Canadá','Montreal, Canadá',
  'Quebec, Canadá','Calgary, Canadá','Banff, Canadá','Cataratas del Niágara, Canadá',
  'Ottawa, Canadá','Edmonton, Canadá','Whistler, Canadá',
  'Isla Vancouver, Canadá','Prince Edward Island, Canadá',
  "Jasper, Canadá",'Lake Louise, Canadá','Kelowna, Canadá',
  "St. John's, Canadá",'Halifax, Canadá',
];

export default function TravelForm({ onClose, initialDestino = '' }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [showOptions, setShowOptions] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [destinoOptions, setDestinoOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(2);
  const [destinoHistory, setDestinoHistory] = useState([]); // v25: historial de opciones
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ── Autocomplete suggestions ──────────────────────────────────────────────
  const [destinoSugg, setDestinoSugg] = useState([]);
  const [origenSugg,  setOrigenSugg]  = useState([]);

  const filterPlaces = (q) => {
    if (!q || q.length < 2) return [];
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const qn = norm(q);
    return PLACES.filter(p => norm(p).includes(qn)).slice(0, 7);
  };

  const [formData, setFormData] = useState({
    tieneDestino: initialDestino ? true : null,
    destino: initialDestino,
    origen: '',
    presupuesto: 2000,
    dias: 7,
    tipoViaje: '',
    numViajeros: 2,
    intereses: [],
    ritmo: 3,
    alojamiento: '',
    nombre: '',
    email: '',
    numNinos: 0, // v25: contador de niños para familia
  });

  const planes = [
    {
      id: 'basico',
      nombre: 'Vivante Básico',
      precio: 10,
      precioClp: 9990,
      descripcion: 'Itinerario personalizado día a día',
      incluye: [
        'Itinerario completo en PDF',
        'Links de vuelos y alojamientos',
        'Puntos de interés',
        'Tips locales básicos para viajeros'
      ]
    },
    {
      id: 'pro',
      nombre: 'Vivante Pro',
      precio: 17,
      precioClp: 16990,
      descripcion: 'Experiencia premium con todos los detalles',
      incluye: [
        'Todo lo del Vivante Básico',
        'Restaurantes recomendados por zona y RRSS',
        'Opciones de tours y actividades',
        'Tips de seguridad y transporte',
        'Tips culturales, de conectividad y dinero',
      ],
      popular: true
    }
  ];

  const interesesOptions = [
    { id: 'playa', label: 'Playa', emoji: '🏖️' },
    { id: 'cultura', label: 'Cultura', emoji: '🏛️' },
    { id: 'aventura', label: 'Aventura', emoji: '🏔️' },
    { id: 'gastronomia', label: 'Gastronomía', emoji: '🍽️' },
    { id: 'relax', label: 'Relax', emoji: '🧘' },
    { id: 'naturaleza', label: 'Naturaleza', emoji: '🌲' },
    { id: 'nocturna', label: 'Vida Nocturna', emoji: '🎉' },
    { id: 'deporte', label: 'Deporte', emoji: '⚽' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  ];

  const alojamientoOptions = [
    { id: 'hotel', label: 'Hotel', emoji: '🏨' },
    { id: 'airbnb', label: 'Airbnb', emoji: '🏠' },
    { id: 'hostal', label: 'Hostal', emoji: '🛏️' },
    { id: 'bnb', label: 'Bed & Breakfast', emoji: '🏡' }, // v25 fix: era "B&B"
  ];

  const toggleInteres = (id) => {
    if (formData.intereses.includes(id)) {
      setFormData({ ...formData, intereses: formData.intereses.filter(i => i !== id) });
    } else if (formData.intereses.length < 4) {
      setFormData({ ...formData, intereses: [...formData.intereses, id] });
    }
  };

  const getRitmoLabel = () => {
    if (formData.ritmo <= 2) return { text: 'Relajado', desc: 'Máximo 2 actividades por día' };
    if (formData.ritmo <= 3) return { text: 'Moderado', desc: '2-3 actividades con pausas' };
    return { text: 'Intenso', desc: '3-4 actividades, aprovechando cada momento' };
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.tieneDestino !== null && (formData.tieneDestino === false || formData.destino.trim());
      case 2: return formData.origen.trim() && formData.presupuesto >= 500 && formData.dias >= 3;
      case 3: return formData.nombre.trim() && formData.email.includes('@') && formData.tipoViaje !== '';
      case 4: return formData.intereses.length > 0 && formData.alojamiento !== '';
      default: return true;
    }
  };

  const fetchDestinationOptions = async () => {
    setIsLoadingOptions(true);
    setError(null);
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al obtener sugerencias');
      setDestinoOptions(data.opciones);
      setShowOptions(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const requestNewOptions = async () => {
    if (attemptsLeft <= 0) return;
    // v25: guardar opciones actuales en historial antes de reemplazarlas
    if (destinoOptions.length > 0) {
      setDestinoHistory(prev => [...prev, destinoOptions]);
    }
    setAttemptsLeft(attemptsLeft - 1);
    setSelectedOption(null);
    await fetchDestinationOptions();
  };

  // v25: volver a las opciones anteriores
  const goBackToPreviousOptions = () => {
    if (destinoHistory.length === 0) return;
    const prev = destinoHistory[destinoHistory.length - 1];
    setDestinoHistory(h => h.slice(0, -1));
    setDestinoOptions(prev);
    setSelectedOption(null);
  };

  const handleSubmit = async (destinoFinal = null) => {
    setIsSubmitting(true);
    setError(null);
    const planInfo = planes.find(p => p.id === selectedPlan);
    const finalData = {
      ...formData,
      destino: destinoFinal || formData.destino,
      tieneDestino: true,
      plan: planInfo?.nombre || 'No seleccionado',
      planPrecio: planInfo?.precio || 0
    };
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al procesar tu solicitud');
      setIsSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep4Submit = async () => {
    if (formData.tieneDestino) {
      setShowPayment(true);
    } else {
      await fetchDestinationOptions();
    }
  };

  const confirmSelection = () => {
    if (!selectedOption) return;
    const destinoTexto = `${selectedOption.destino} (${selectedOption.paises}) - ${selectedOption.dias_distribucion}`;
    setFormData({ ...formData, destino: destinoTexto });
    setShowOptions(false);
    setShowPayment(true);
  };

  // PANTALLA DE ÉXITO
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Excelente, {formData.nombre}!</h2>
          <p className="text-gray-600 mb-4">
            Tu pago fue recibido. Recibirás tu itinerario personalizado en <strong>{formData.email}</strong> en breve.
          </p>
          <p className="text-orange-500 font-medium mb-8 italic">Tu aventura está a punto de comenzar. ✈️</p>
          <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium">¡Entendido!</button>
        </div>
      </div>
    );
  }

  // PANTALLA DE PAGO
  if (showPayment) {
    const planSeleccionado = planes.find(p => p.id === selectedPlan);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 z-10">✕</button>
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirma tu itinerario</h2>
              <p className="text-gray-500">Un paso más para tu viaje perfecto</p>
            </div>

            {/* Resumen del viaje */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">📋 Resumen de tu viaje</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Destino:</span> {formData.destino || 'Por definir'}</p>
                <p><span className="font-medium">Días:</span> {formData.dias}</p>
                <p><span className="font-medium">Viajeros:</span> {formData.numViajeros}</p>
                <p><span className="font-medium">Presupuesto:</span> {formData.presupuesto >= 15000 ? '$15.000+ USD' : `$${formData.presupuesto.toLocaleString()} USD`}</p>
              </div>
            </div>

            {/* Selección de Plan */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">✨ Elige tu plan</h3>
              <div className="space-y-3">
                {planes.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                      selectedPlan === plan.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {selectedPlan === plan.id && <Check className="w-5 h-5 text-orange-500" />}
                        <span className="font-semibold text-gray-800">{plan.nombre}</span>
                      </div>
                      <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                        ${plan.precio} USD
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{plan.descripcion}</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {plan.incluye.map((item, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-green-500">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Monto a pagar */}
            {selectedPlan && (
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Total a pagar</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                  ${planSeleccionado?.precio} USD
                </p>
              </div>
            )}

            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">{error}</div>}

            {/* Botones */}
            <div className="space-y-3">
              <button
                onClick={async () => {
                  if (!selectedPlan) return;
                  // v25: snapshot de formData ANTES del async para evitar problemas de closure
                  const snapFormData = { ...formData };
                  try {
                    localStorage.setItem('vivante_formData', JSON.stringify(snapFormData));
                    localStorage.setItem('vivante_planId', selectedPlan);
                    localStorage.setItem('vivante_formData_ts', Date.now().toString());
                  } catch {}
                  setIsSubmitting(true);
                  setError(null);
                  try {
                    const res = await fetch('/api/payment/create-preference', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        planId: selectedPlan,
                        planNombre: planSeleccionado?.nombre,
                        precio: planSeleccionado?.precioClp,
                        precioUsd: planSeleccionado?.precio,
                        email: snapFormData.email,
                        nombre: snapFormData.nombre,
                        destino: snapFormData.destino, // v25: para codificar en back_url.success
                      }),
                    });
                    const data = await res.json();
                    if (data.init_point) {
                      // v25: guardar también con preference_id como backup
                      if (data.preference_id) {
                        try { localStorage.setItem(`vivante_pref_${data.preference_id}`, JSON.stringify(snapFormData)); } catch {}
                      }
                      window.location.href = data.init_point;
                    } else {
                      throw new Error(data.error || 'No se pudo iniciar el pago');
                    }
                  } catch (e) {
                    setError('Error al procesar el pago. Por favor intenta nuevamente.');
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting || !selectedPlan}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  !isSubmitting && selectedPlan
                    ? 'text-white shadow-lg hover:opacity-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                style={!isSubmitting && selectedPlan ? { backgroundColor: '#009EE3' } : {}}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Redirigiendo a Mercado Pago...</>
                ) : (
                  <>💳 Pagar con Mercado Pago</>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPayment(false);
                  setSelectedPlan(null);
                  if (!formData.tieneDestino) setShowOptions(true);
                }}
                className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >
                ← Volver
              </button>
              <p className="text-center text-xs text-gray-400 pt-1">
                ¿No quedaste conforme? <a href="mailto:vive.vivante.ch@gmail.com" className="underline hover:text-gray-500">Escríbenos</a> y lo solucionamos.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PANTALLA DE OPCIONES DE DESTINO (Sorpréndeme)
  if (showOptions) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 z-10">✕</button>
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Te recomendamos estos destinos</h2>
              <p className="text-gray-500">Basado en tus preferencias, presupuesto y días de viaje</p>
            </div>

            {isLoadingOptions && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Buscando los destinos perfectos para ti...</p>
              </div>
            )}

            {!isLoadingOptions && destinoOptions.length > 0 && (
              <div className="space-y-4">
                {destinoOptions.map((opcion) => (
                  <div
                    key={opcion.id}
                    onClick={() => setSelectedOption(opcion)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedOption?.id === opcion.id ? 'border-orange-500 bg-orange-50 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold text-gray-800">{opcion.destino}</span>
                          {selectedOption?.id === opcion.id && <Check className="w-5 h-5 text-orange-500" />}
                        </div>
                        <p className="text-sm text-gray-500">{opcion.paises}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">${opcion.precio_estimado.toLocaleString()}</div>
                        <p className="text-xs text-gray-400">USD por persona</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-sm text-gray-600"><span className="font-medium">📅</span> {opcion.dias_distribucion}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-3"><span className="font-medium">💡</span> {opcion.porque}</p>
                    <div className="flex flex-wrap gap-2">
                      {opcion.highlights.map((h, i) => (
                        <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-600">{h}</span>
                      ))}
                    </div>
                    <div className="mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${opcion.tipo === 'multidestino' ? 'bg-purple-100 text-purple-600' : opcion.tipo === 'monopais' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {opcion.tipo === 'multidestino' ? '🌍 Multidestino' : opcion.tipo === 'monopais' ? '🗺️ Monopaís' : '📍 Destino único'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mt-4">{error}</div>}

            <div className="mt-8 space-y-3">
              <button
                onClick={confirmSelection}
                disabled={!selectedOption}
                className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${selectedOption ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <Check className="w-5 h-5" /> Elegir este destino
              </button>

              {attemptsLeft > 0 && !isLoadingOptions && (
                <button onClick={requestNewOptions} className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" />
                  Ver otras opciones ({attemptsLeft} {attemptsLeft === 1 ? 'intento restante' : 'intentos restantes'})
                </button>
              )}

              {/* v25: botón "Ver opciones anteriores" */}
              {destinoHistory.length > 0 && !isLoadingOptions && (
                <button onClick={goBackToPreviousOptions} className="w-full py-3 rounded-xl border-2 border-orange-200 text-orange-600 font-medium flex items-center justify-center gap-2 hover:bg-orange-50 transition-all">
                  ← Ver opciones anteriores
                </button>
              )}

              {attemptsLeft === 0 && destinoHistory.length === 0 && (
                <p className="text-center text-sm text-gray-400">Ya no puedes pedir más opciones. Elige una de las anteriores.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORMULARIO PRINCIPAL (4 PASOS)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 z-10">✕</button>
        <div className="p-6 sm:p-8">
          <div className="flex gap-2 mb-8">
            {[1,2,3,4].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-colors ${step >= s ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* PASO 1: Destino */}
          {step === 1 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><MapPin className="w-8 h-8 text-orange-500" /></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">¿A dónde vamos?</h2>
                <p className="text-gray-500">Empecemos por lo más importante</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => setFormData({ ...formData, tieneDestino: false, destino: '' })} className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${formData.tieneDestino === false ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">✨</span>
                    <div><div className="font-semibold text-gray-800">Sorpréndeme con opciones</div><div className="text-sm text-gray-500">Te recomendaremos 3 destinos perfectos</div></div>
                  </div>
                </button>
                <button onClick={() => setFormData({ ...formData, tieneDestino: true })} className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${formData.tieneDestino === true ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🗺️</span>
                    <div><div className="font-semibold text-gray-800">Ya sé a dónde quiero ir</div><div className="text-sm text-gray-500">Crearemos tu itinerario a medida</div></div>
                  </div>
                </button>
                {formData.tieneDestino === true && (
                  <div className="fade-in pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">¿Cuál es tu destino?</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Ej: Lisboa, Portugal"
                        value={formData.destino}
                        autoComplete="off"
                        onChange={(e) => {
                          setFormData({ ...formData, destino: e.target.value });
                          setDestinoSugg(filterPlaces(e.target.value));
                        }}
                        onFocus={() => setDestinoSugg(filterPlaces(formData.destino))}
                        onBlur={() => setTimeout(() => setDestinoSugg([]), 180)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                      />
                      {destinoSugg.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60, marginTop: 4 }}
                          className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                          {destinoSugg.map((s, i) => (
                            <div
                              key={i}
                              onMouseDown={() => { setFormData({ ...formData, destino: s }); setDestinoSugg([]); }}
                              className="px-4 py-3 hover:bg-orange-50 cursor-pointer flex items-center gap-3 text-sm border-b border-gray-50 last:border-0"
                            >
                              <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                              <span className="text-gray-700">{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: Básicos */}
          {step === 2 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Plane className="w-8 h-8 text-orange-500" /></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Los básicos</h2>
                <p className="text-gray-500">Para encontrar las mejores opciones</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Desde qué ciudad viajas?</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Ej: Santiago, Chile"
                      value={formData.origen}
                      autoComplete="off"
                      onChange={(e) => {
                        setFormData({ ...formData, origen: e.target.value });
                        setOrigenSugg(filterPlaces(e.target.value));
                      }}
                      onFocus={() => setOrigenSugg(filterPlaces(formData.origen))}
                      onBlur={() => setTimeout(() => setOrigenSugg([]), 180)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    {origenSugg.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60, marginTop: 4 }}
                        className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        {origenSugg.map((s, i) => (
                          <div
                            key={i}
                            onMouseDown={() => { setFormData({ ...formData, origen: s }); setOrigenSugg([]); }}
                            className="px-4 py-3 hover:bg-orange-50 cursor-pointer flex items-center gap-3 text-sm border-b border-gray-50 last:border-0"
                          >
                            <Plane className="w-4 h-4 text-orange-400 flex-shrink-0" />
                            <span className="text-gray-700">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto por persona (USD)</label>
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-3">
                      {formData.presupuesto >= 15000 ? '$15.000+ USD' : `$${formData.presupuesto.toLocaleString()}`}
                    </div>
                    <input type="range" min="500" max="15000" step="500" value={formData.presupuesto} onChange={(e) => setFormData({ ...formData, presupuesto: parseInt(e.target.value) })} className="w-full" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1"><span>$500</span><span>$15.000+</span></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Cuántos días de viaje?</label>
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={() => formData.dias > 3 && setFormData({ ...formData, dias: formData.dias - 1 })} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200">−</button>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 w-16 text-center">{formData.dias}</div>
                    <button onClick={() => formData.dias < 30 && setFormData({ ...formData, dias: formData.dias + 1 })} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200">+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Contacto + Viajeros */}
          {step === 3 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-orange-500" /></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Cuéntanos sobre vos</h2>
                <p className="text-gray-500">Personalizamos el itinerario a tu medida</p>
              </div>
              <div className="space-y-6">
                {/* Nombre y Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo te llamas?</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tu email</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => {
                      const newEmail = e.target.value;
                      setFormData({ ...formData, email: newEmail });
                      // Guardar lead para remarketing (localStorage + Brevo)
                      if (newEmail.includes('@') && newEmail.includes('.')) {
                        try {
                          const lead = { email: newEmail, nombre: formData.nombre, destino: formData.destino, ts: Date.now() };
                          localStorage.setItem('vivante_lead', JSON.stringify(lead));
                          fetch('/api/lead', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: newEmail, nombre: formData.nombre, destino: formData.destino }),
                          }).catch(() => {});
                        } catch (_) {}
                      }
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">¿Quiénes viajan?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{ id: 'solo', label: 'Solo/a', emoji: '🧍' },{ id: 'pareja', label: 'Pareja', emoji: '💑' },{ id: 'familia', label: 'Familia', emoji: '👨‍👩‍👧‍👦' },{ id: 'amigos', label: 'Amigos/as', emoji: '👯' }].map((tipo) => (
                    <button key={tipo.id} onClick={() => setFormData({ ...formData, tipoViaje: tipo.id, numViajeros: tipo.id === 'solo' ? 1 : tipo.id === 'pareja' ? 2 : formData.numViajeros })} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.tipoViaje === tipo.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-3xl">{tipo.emoji}</span>
                      <span className="font-medium text-gray-800">{tipo.label}</span>
                    </button>
                  ))}
                </div>
                {formData.tipoViaje && !['solo','pareja'].includes(formData.tipoViaje) && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">¿Cuántos viajeros en total?</label>
                    <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 rounded-xl">
                      <button onClick={() => formData.numViajeros > 2 && setFormData({ ...formData, numViajeros: formData.numViajeros - 1 })} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold">−</button>
                      <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">{formData.numViajeros}</span>
                      <button onClick={() => setFormData({ ...formData, numViajeros: formData.numViajeros + 1 })} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold">+</button>
                    </div>
                  </div>
                )}
                {/* v25: campo numNinos para familia */}
                {formData.tipoViaje === 'familia' && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuántos niños viajan? <span className="text-gray-400 font-normal">(aproximado)</span>
                    </label>
                    <div className="flex items-center justify-center gap-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <button type="button" onClick={() => setFormData(prev => ({...prev, numNinos: Math.max(0, (prev.numNinos || 0) - 1)}))} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold text-orange-500 hover:bg-orange-50">−</button>
                      <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">{formData.numNinos || 0}</span>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, numNinos: Math.min(8, (prev.numNinos || 0) + 1)}))} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold text-orange-500 hover:bg-orange-50">+</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: Preferencias (intereses + ritmo + alojamiento) */}
          {step === 4 && (
            <div className="fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8 text-orange-500" /></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu estilo de viaje</h2>
                <p className="text-gray-500">¿Qué te hace feliz viajando?</p>
              </div>
              <div className="space-y-6">
                {/* Intereses */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">¿Qué te interesa? (máximo 4)</label>
                    <span className="text-xs text-gray-400">{formData.intereses.length}/4</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {interesesOptions.map((interes) => (
                      <button key={interes.id} onClick={() => toggleInteres(interes.id)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${formData.intereses.includes(interes.id) ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-xl">{interes.emoji}</span>
                        <span className="text-xs font-medium text-gray-700">{interes.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ritmo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">¿Qué ritmo prefieres?</label>
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-xl">
                    <div className="text-center mb-3">
                      <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">{getRitmoLabel().text}</span>
                      <p className="text-xs text-gray-500 mt-1">{getRitmoLabel().desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>🧘</span>
                      <input type="range" min="1" max="5" value={formData.ritmo} onChange={(e) => setFormData({ ...formData, ritmo: parseInt(e.target.value) })} className="flex-1" />
                      <span>🏃</span>
                    </div>
                  </div>
                </div>

                {/* Alojamiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">¿Dónde prefieres alojarte?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {alojamientoOptions.map((aloj) => (
                      <button key={aloj.id} onClick={() => setFormData({ ...formData, alojamiento: aloj.id })} className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${formData.alojamiento === aloj.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-2xl">{aloj.emoji}</span>
                        <span className="font-medium text-gray-800">{aloj.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mt-4">{error}</div>
          )}

          {/* Navegación */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                <ChevronLeft className="w-5 h-5" /> Atrás
              </button>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${canProceed() ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={handleStep4Submit} disabled={!canProceed() || isSubmitting || isLoadingOptions} className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${canProceed() && !isSubmitting && !isLoadingOptions ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {isSubmitting || isLoadingOptions ? <><Loader2 className="w-5 h-5 animate-spin" /> {isLoadingOptions ? 'Buscando destinos...' : 'Enviando...'}</> : <>Ver mi plan <ChevronRight className="w-5 h-5" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
