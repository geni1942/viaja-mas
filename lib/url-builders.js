export function buildAirlineUrl(aerolinea) {
  const a = (aerolinea || '').toLowerCase();
  if (a.includes('latam')) return 'https://www.latam.com/';
  if (a.includes('jetsmart')) return 'https://www.jetsmart.com/';
  if (a.includes('sky') && !a.includes('scanner')) return 'https://www.skyairline.com/';
  if (a.includes('avianca')) return 'https://www.avianca.com/';
  if (a.includes('copa')) return 'https://www.copaair.com/';
  if (a.includes('aerolineas') || a.includes('aerolíneas') || a.includes('argentinas')) return 'https://www.aerolineas.com.ar/';
  if (a.includes('aeromexico') || a.includes('aerom\u00e9xico')) return 'https://www.aeromexico.com/';
  if (a.includes('iberia express') || (a.includes('iberia') && a.includes('express'))) return 'https://www.iberiaexpress.com/';
  if (a.includes('iberia')) return 'https://www.iberia.com/';
  if (a.includes('air europa') || a.includes('aireuropa')) return 'https://www.aireuropa.com/';
  if (a.includes('turkish') || a.includes('thy')) return 'https://www.turkishairlines.com/';
  if (a.includes('air france') || a.includes('airfrance')) return 'https://www.airfrance.com/';
  if (a.includes('klm')) return 'https://www.klm.com/';
  if (a.includes('lufthansa')) return 'https://www.lufthansa.com/';
  if (a.includes('british')) return 'https://www.britishairways.com/';
  if (a.includes('tap') || a.includes('portugal')) return 'https://www.flytap.com/';
  if (a.includes('american')) return 'https://www.aa.com/';
  if (a.includes('united')) return 'https://www.united.com/';
  if (a.includes('delta')) return 'https://www.delta.com/';
  if (a.includes('qatar')) return 'https://www.qatarairways.com/';
  if (a.includes('emirates')) return 'https://www.emirates.com/';
  if (a.includes('singapore')) return 'https://www.singaporeair.com/';
  if (a.includes('japan airlines') || a.includes('jal')) return 'https://www.jal.co.jp/';
  if (a.includes('gol')) return 'https://www.voegol.com.br/';
  if (a.includes('azul')) return 'https://www.voeazul.com.br/';
  return null;
}

export function buildAlojamientoUrl(op, destino, checkin, checkout, adults, alojPref) {
  const plat = (op.plataforma || '').toLowerCase();
  const zona  = (op.zona || op.nombre || '').trim();
  const cat   = (op.categoria || '').toLowerCase();
  const searchZona = zona ? `${zona}, ${destino}` : (destino || '');

  if (plat.includes('hostel')) {
    const fmtHW = (d) => { if (!d) return ''; const [y,m,dd]=d.split('-'); return `${dd}%2F${m}%2F${y}`; };
    const minRating = cat.includes('premium') ? 85 : cat.includes('confort') ? 80 : 75;
    return `https://www.hostelworld.com/search?search_keywords=${encodeURIComponent(searchZona)}&dateFrom=${fmtHW(checkin)}&dateTo=${fmtHW(checkout)}&numberOfGuests=${adults||2}&min_rating=${minRating}`;
  }
  if (plat.includes('airbnb')) {
    const roomType = cat.includes('econ') ? 'Private room' : 'Entire home/apt';
    const p = new URLSearchParams({ checkin: checkin||'', checkout: checkout||'', adults: adults||2, query: zona || destino });
    p.append('room_types[]', roomType);
    return `https://www.airbnb.com/s/${encodeURIComponent(destino||'')}/homes?${p}`;
  }
  const stars = cat.includes('premium') ? 'class=4;class=5'
              : cat.includes('confort')  ? 'class=3;class=4'
              :                            'class=2;class=3';
  const nflt  = alojPref === 'bnb' ? 'pt=11' : `ht_id=204;${stars}`;
  const p = new URLSearchParams({ ss: searchZona, checkin: checkin||'', checkout: checkout||'', group_adults: adults||2, no_rooms:1, selected_currency:'USD' });
  return `https://www.booking.com/searchresults.html?${p}&nflt=${encodeURIComponent(nflt)}`;
}
