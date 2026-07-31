(() => {
  'use strict';

  const USER_SCOPE = String(window.electrifyAuthUser?.uid || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '_');
  const STORAGE_CURRENT = `electrify_current_v2_${USER_SCOPE}`;
  const STORAGE_PROJECTS = `electrify_projects_v2_${USER_SCOPE}`;
  const STANDARD_BREAKERS_A = [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250];
  const CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];
  const AMPACITY_COPPER = {1.5:14, 2.5:20, 4:27, 6:34, 10:46, 16:62, 25:80, 35:99, 50:118, 70:149, 95:179, 120:206, 150:236, 185:268, 240:315, 300:360, 400:415};
  const AMPACITY_ALUMINUM = {1.5:10, 2.5:15, 4:21, 6:27, 10:36, 16:49, 25:64, 35:78, 50:94, 70:119, 95:143, 120:165, 150:188, 185:214, 240:252, 300:289, 400:333};


  const BATTERY_CATALOG = {
    'deye-se-g5-1-pro-b': {
      id:'deye-se-g5-1-pro-b', brand:'Deye', model:'SE-G5.1 Pro-B', chemistry:'LiFePO₄',
      voltage:51.2, ah:100, energyKWh:5.12, usableKWh:4.6, dod:90, efficiency:95,
      recommendedCurrentA:50, maxCurrentA:100, peakCurrentA:150, maxParallel:64,
      dimensions:'440×133×540 mm', weightKg:45, warranty:'10 سنوات',
      image:'assets/battery-deye-se-g5-1-pro-b.webp'
    },
    'deye-se-g10-2': {
      id:'deye-se-g10-2', brand:'Deye', model:'SE-G10.2', chemistry:'LiFePO₄',
      voltage:51.2, ah:200, energyKWh:10.24, usableKWh:8.192, dod:80, efficiency:95,
      recommendedCurrentA:100, maxCurrentA:100, peakCurrentA:200, maxParallel:null,
      dimensions:'710×540×133 mm', weightKg:85, warranty:'5 سنوات',
      image:'assets/battery-deye-se-g10-2.webp'
    }
  };

  function inverterImage(model) {
    if (!model) return 'assets/inverter-deye-single.webp';
    if (model.phase === 'three' && String(model.family).includes('SG04LP3')) return 'assets/inverter-deye-three-sg04.webp';
    if (model.phase === 'three') return 'assets/inverter-deye-three-sg05.webp';
    return 'assets/inverter-deye-single.webp';
  }

  // كتالوج شائع لموديلات Deye الهجينة منخفضة الجهد. القيم مأخوذة من نشرات Deye الرسمية.
  const DEYE_INVERTERS = [
    { id:'deye-sg05lp1-3.6', brand:'Deye', family:'SG05LP1-EU', model:'SUN-3.6K-SG05LP1-EU', phase:'single', ratedW:3600, peakW:7200, maxPvW:5760, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp1-5', brand:'Deye', family:'SG05LP1-EU', model:'SUN-5K-SG05LP1-EU', phase:'single', ratedW:5000, peakW:10000, maxPvW:8000, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp1-6', brand:'Deye', family:'SG05LP1-EU', model:'SUN-6K-SG05LP1-EU', phase:'single', ratedW:6000, peakW:12000, maxPvW:9600, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp1-7', brand:'Deye', family:'SG05LP1-EU', model:'SUN-7K-SG05LP1-EU', phase:'single', ratedW:7000, peakW:14000, maxPvW:11200, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp1-7.6', brand:'Deye', family:'SG05LP1-EU', model:'SUN-7.6K-SG05LP1-EU', phase:'single', ratedW:7600, peakW:15200, maxPvW:12160, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[26,26], stringsPerMppt:[2,2], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp1-8', brand:'Deye', family:'SG05LP1-EU', model:'SUN-8K-SG05LP1-EU', phase:'single', ratedW:8000, peakW:16000, maxPvW:12800, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[26,26], stringsPerMppt:[2,2], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp1-10', brand:'Deye', family:'SG05LP1-EU', model:'SUN-10K-SG05LP1-EU', phase:'single', ratedW:10000, peakW:20000, maxPvW:16000, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[26,26], stringsPerMppt:[2,2], efficiency:97.6, rank:1 },

    { id:'deye-sg03lp1-3.6', brand:'Deye', family:'SG03LP1-EU', model:'SUN-3.6K-SG03LP1-EU', phase:'single', ratedW:3600, peakW:7200, maxPvW:4680, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:2 },
    { id:'deye-sg03lp1-5', brand:'Deye', family:'SG03LP1-EU', model:'SUN-5K-SG03LP1-EU', phase:'single', ratedW:5000, peakW:10000, maxPvW:6500, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:2 },
    { id:'deye-sg03lp1-6', brand:'Deye', family:'SG03LP1-EU', model:'SUN-6K-SG03LP1-EU', phase:'single', ratedW:6000, peakW:12000, maxPvW:7800, maxDcV:500, mpptMinV:150, mpptMaxV:425, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:2 },

    { id:'deye-sg05lp3-3', brand:'Deye', family:'SG05LP3-EU-SM2', model:'SUN-3K-SG05LP3-EU-SM2', phase:'three', ratedW:3000, peakW:6000, maxPvW:4500, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[20,20], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp3-4', brand:'Deye', family:'SG05LP3-EU-SM2', model:'SUN-4K-SG05LP3-EU-SM2', phase:'three', ratedW:4000, peakW:8000, maxPvW:6000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[20,20], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp3-5', brand:'Deye', family:'SG05LP3-EU-SM2', model:'SUN-5K-SG05LP3-EU-SM2', phase:'three', ratedW:5000, peakW:10000, maxPvW:7500, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[20,20], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp3-6', brand:'Deye', family:'SG05LP3-EU-SM2', model:'SUN-6K-SG05LP3-EU-SM2', phase:'three', ratedW:6000, peakW:12000, maxPvW:9000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[20,20], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp3-8', brand:'Deye', family:'SG05LP3-EU-SM2', model:'SUN-8K-SG05LP3-EU-SM2', phase:'three', ratedW:8000, peakW:16000, maxPvW:12000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[20,20], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp3-10', brand:'Deye', family:'SG05LP3-EU-SM2', model:'SUN-10K-SG05LP3-EU-SM2', phase:'three', ratedW:10000, peakW:20000, maxPvW:15000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[20,20], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },
    { id:'deye-sg05lp3-12', brand:'Deye', family:'SG05LP3-EU-SM2', model:'SUN-12K-SG05LP3-EU-SM2', phase:'three', ratedW:12000, peakW:24000, maxPvW:18000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[20,20], stringsPerMppt:[1,1], efficiency:97.6, rank:1 },

    { id:'deye-sg04lp3-5', brand:'Deye', family:'SG04LP3-EU', model:'SUN-5K-SG04LP3-EU', phase:'three', ratedW:5000, peakW:10000, maxPvW:7500, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:2 },
    { id:'deye-sg04lp3-6', brand:'Deye', family:'SG04LP3-EU', model:'SUN-6K-SG04LP3-EU', phase:'three', ratedW:6000, peakW:12000, maxPvW:9000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:2 },
    { id:'deye-sg04lp3-8', brand:'Deye', family:'SG04LP3-EU', model:'SUN-8K-SG04LP3-EU', phase:'three', ratedW:8000, peakW:16000, maxPvW:12000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[13,13], stringsPerMppt:[1,1], efficiency:97.6, rank:2 },
    { id:'deye-sg04lp3-10', brand:'Deye', family:'SG04LP3-EU', model:'SUN-10K-SG04LP3-EU', phase:'three', ratedW:10000, peakW:20000, maxPvW:15000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[26,13], stringsPerMppt:[2,1], efficiency:97.6, rank:2 },
    { id:'deye-sg04lp3-12', brand:'Deye', family:'SG04LP3-EU', model:'SUN-12K-SG04LP3-EU', phase:'three', ratedW:12000, peakW:24000, maxPvW:18000, maxDcV:800, mpptMinV:200, mpptMaxV:650, mpptCurrents:[26,13], stringsPerMppt:[2,1], efficiency:97.6, rank:2 }
  ];


  // اللوحان المتاحان في Electrify. جميع القيم التالية هي قيم STC من نشرات Jinko الرسمية المرفقة.
  const PANEL_CATALOG = {
    'jinko-735': {
      id: 'jinko-735', brand: 'Jinko Solar', family: 'Tiger Neo 66HL5-BDV',
      model: 'JKM735N-66HL5-BDV', fullModel: 'JKM710-735N-66HL5-BDV-Z3-EU',
      power: 735, vmp: 41.23, imp: 17.83, voc: 49.52, isc: 18.88,
      efficiency: 23.66, maxSeriesFuseA: 35, dimensions: '2384×1303×33 mm', weightKg: 37.5,
      datasheet: 'assets/datasheets/JKM710-735N-66HL5-BDV-Z3-EU.pdf'
    },
    'jinko-650': {
      id: 'jinko-650', brand: 'Jinko Solar', family: 'Tiger Neo 66HL4M-BDV',
      model: 'JKM650N-66HL4M-BDV', fullModel: 'JKM625-650N-66HL4M-BDV-Z1-EU',
      power: 650, vmp: 41.58, imp: 15.64, voc: 50.28, isc: 16.44,
      efficiency: 24.06, maxSeriesFuseA: 35, dimensions: '2382×1134×30 mm', weightKg: 32.4,
      datasheet: 'assets/datasheets/JKM625-650N-66HL4M-BDV-Z1-EU.pdf'
    }
  };

  const formIds = [
    'projectName','clientName','location','systemType','currency','phase','acVoltage','psh','losses','inverterMargin','autonomyDays','dod',
    'panelSelection','panelPower','panelPrice','panelVmp','panelVoc','panelImp','panelIsc','inverterSelection','customInverterName','inverterRatedW','inverterPeakW','maxPvPower','maxDcVoltage','inverterEff','inverterPrice','mpptMinV','mpptMaxV','mpptCurrentPattern','mpptStringPattern',
    'batterySelection','batteryVoltage','batteryAh','bankVoltage','batteryPrice','batteryType','batteryEff','pvCableLength','batteryCableLength','acCableLength','dcDrop','acDrop','conductor',
    'structureCost','electricalCost','installationCost','otherCost','autoCalculate'
  ];

  const $ = (id) => document.getElementById(id);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const num = (id, fallback = 0) => {
    const value = Number($(id)?.value);
    return Number.isFinite(value) ? value : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
  const format = (value, digits = 0) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  let currentProjectId = null;
  let calculation = null;
  let saveTimer = null;
  let installPrompt = null;
  let toastTimer = null;

  const defaultLoads = [
    { name: 'إنارة LED', qty: 10, watts: 12, hours: 6, simultaneity: 80, surge: 1 },
    { name: 'ثلاجة (ضاغط عادي)', qty: 1, watts: 180, hours: 10, simultaneity: 100, surge: 4 },
    { name: 'تلفاز', qty: 1, watts: 120, hours: 5, simultaneity: 80, surge: 1.1 },
    { name: 'غسالة', qty: 1, watts: 500, hours: 1, simultaneity: 50, surge: 2.5 },
    { name: 'مكيف (عادي)', qty: 1, watts: 1200, hours: 6, simultaneity: 100, surge: 3.5 }
  ];

  function createLoadRow(load = {}) {
    const tr = document.createElement('tr');
    const values = {
      name: load.name || 'جهاز جديد',
      qty: load.qty ?? 1,
      watts: load.watts ?? 100,
      hours: load.hours ?? 1,
      simultaneity: load.simultaneity ?? 100,
      surge: load.surge ?? 1
    };
    tr.innerHTML = `
      <td><input class="device-input" data-field="name" value="${escapeHtml(values.name)}" aria-label="اسم الجهاز"></td>
      <td><input data-field="qty" type="number" min="0" step="1" value="${values.qty}" aria-label="عدد الأجهزة"></td>
      <td><input data-field="watts" type="number" min="0" step="1" value="${values.watts}" aria-label="قدرة الجهاز"></td>
      <td><input data-field="hours" type="number" min="0" max="24" step="0.25" value="${values.hours}" aria-label="ساعات التشغيل"></td>
      <td><input data-field="simultaneity" type="number" min="0" max="100" step="1" value="${values.simultaneity}" aria-label="نسبة التزامن"></td>
      <td><input data-field="surge" type="number" min="1" max="10" step="0.1" value="${values.surge}" aria-label="معامل الإقلاع"></td>
      <td class="row-energy">0.00</td>
      <td class="no-print"><button class="delete-row" type="button" aria-label="حذف الجهاز">×</button></td>`;
    $('loadsBody').appendChild(tr);
    updateRowEnergy(tr);
    return tr;
  }

  function getLoads() {
    return [...$('loadsBody').querySelectorAll('tr')].map((tr) => {
      const get = (field) => tr.querySelector(`[data-field="${field}"]`)?.value;
      return {
        name: get('name')?.trim() || 'جهاز',
        qty: Math.max(0, Number(get('qty')) || 0),
        watts: Math.max(0, Number(get('watts')) || 0),
        hours: clamp(Number(get('hours')) || 0, 0, 24),
        simultaneity: clamp(Number(get('simultaneity')) || 0, 0, 100),
        surge: Math.max(1, Number(get('surge')) || 1)
      };
    });
  }

  function updateRowEnergy(tr) {
    const qty = Number(tr.querySelector('[data-field="qty"]')?.value) || 0;
    const watts = Number(tr.querySelector('[data-field="watts"]')?.value) || 0;
    const hours = Number(tr.querySelector('[data-field="hours"]')?.value) || 0;
    const energy = qty * watts * hours / 1000;
    const cell = tr.querySelector('.row-energy');
    if (cell) cell.textContent = format(energy, 2);
  }

  function nextStandard(value, standards) {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return standards.find((item) => item >= value) || Math.ceil(value / 100) * 100;
  }

  function parsePattern(value, fallback = [0]) {
    const parsed = String(value ?? '').split(/[+,/؛،\s]+/).map(Number).filter((item) => Number.isFinite(item) && item >= 0);
    return parsed.length ? parsed : fallback;
  }

  function patternText(values) {
    return (values || []).map((value) => Number(value)).join('+');
  }

  function getCatalogModel(id) {
    return DEYE_INVERTERS.find((model) => model.id === id) || null;
  }

  function inverterLabel(model) {
    return model ? `${model.brand} ${model.model}` : '—';
  }

  function getCustomInverter() {
    const currents = parsePattern($('mpptCurrentPattern')?.value, [13, 13]);
    const stringCaps = parsePattern($('mpptStringPattern')?.value, currents.map(() => 1));
    const count = Math.max(currents.length, stringCaps.length, 1);
    while (currents.length < count) currents.push(currents.at(-1) || 13);
    while (stringCaps.length < count) stringCaps.push(stringCaps.at(-1) || 1);
    return {
      id: 'custom',
      brand: 'مخصص',
      family: 'Custom',
      model: $('customInverterName')?.value.trim() || 'إنفرتر مخصص',
      phase: $('phase').value,
      ratedW: Math.max(num('inverterRatedW', 5000), 100),
      peakW: Math.max(num('inverterPeakW', 10000), 100),
      maxPvW: Math.max(num('maxPvPower', 8000), 100),
      maxDcV: Math.max(num('maxDcVoltage', 500), 50),
      mpptMinV: Math.max(num('mpptMinV', 150), 0),
      mpptMaxV: Math.max(num('mpptMaxV', 425), 1),
      mpptCurrents: currents,
      stringsPerMppt: stringCaps,
      efficiency: clamp(num('inverterEff', 97.6), 50, 100),
      rank: 99
    };
  }

  function syncInverterInputs(model, custom = false) {
    if (!model) return;
    const values = {
      inverterRatedW: model.ratedW,
      inverterPeakW: model.peakW,
      maxPvPower: model.maxPvW,
      maxDcVoltage: model.maxDcV,
      mpptMinV: model.mpptMinV,
      mpptMaxV: model.mpptMaxV,
      mpptCurrentPattern: patternText(model.mpptCurrents),
      mpptStringPattern: patternText(model.stringsPerMppt),
      inverterEff: model.efficiency
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = $(id);
      if (!element) return;
      if (document.activeElement !== element || !custom) element.value = value;
      element.readOnly = !custom;
      element.classList.toggle('readonly-field', !custom);
    });
    $('customInverterNameWrap')?.classList.toggle('hidden', !custom);
  }

  function getSelectedPanel() {
    const id = $('panelSelection')?.value || 'jinko-735';
    return PANEL_CATALOG[id] || PANEL_CATALOG['jinko-735'];
  }

  function syncPanelSelection(preferredId = null) {
    const select = $('panelSelection');
    if (!select) return PANEL_CATALOG['jinko-735'];
    const requested = preferredId || select.value || 'jinko-735';
    select.value = PANEL_CATALOG[requested] ? requested : 'jinko-735';
    const panel = getSelectedPanel();
    const values = {
      panelPower: panel.power,
      panelVmp: panel.vmp,
      panelVoc: panel.voc,
      panelImp: panel.imp,
      panelIsc: panel.isc
    };
    Object.entries(values).forEach(([id, value]) => { if ($(id)) $(id).value = String(value); });
    setText('panelSpecModel', panel.model);
    setText('panelSpecPower', `${format(panel.power, 0)} W`);
    setText('panelSpecVmpImp', `${format(panel.vmp, 2)} V / ${format(panel.imp, 2)} A`);
    setText('panelSpecVocIsc', `${format(panel.voc, 2)} V / ${format(panel.isc, 2)} A`);
    setText('panelSpecEfficiency', `${format(panel.efficiency, 2)}%`);
    setText('panelSpecDimensions', `${panel.dimensions} — ${format(panel.weightKg, 1)} kg`);
    const link = $('panelDatasheetLink');
    if (link) link.href = panel.datasheet;
    return panel;
  }

  function getSelectedBattery() {
    const id = $('batterySelection')?.value || 'deye-se-g5-1-pro-b';
    return BATTERY_CATALOG[id] || BATTERY_CATALOG['deye-se-g5-1-pro-b'];
  }

  function syncBatterySelection(preferredId = null, { syncDod = true, syncInputs = true } = {}) {
    const select = $('batterySelection');
    if (!select) return BATTERY_CATALOG['deye-se-g5-1-pro-b'];
    const requested = preferredId || select.value || 'deye-se-g5-1-pro-b';
    select.value = BATTERY_CATALOG[requested] ? requested : 'deye-se-g5-1-pro-b';
    const battery = getSelectedBattery();
    if (syncInputs) {
      const values = { batteryVoltage:battery.voltage, batteryAh:battery.ah, bankVoltage:battery.voltage, batteryType:'lithium', batteryEff:battery.efficiency };
      Object.entries(values).forEach(([id,value]) => { if ($(id)) $(id).value = String(value); });
    }
    if (syncDod && $('dod')) $('dod').value = String(battery.dod);
    setText('batterySpecModel', battery.model);
    setText('batterySpecEnergy', `${format(battery.energyKWh, 2)} kWh`);
    setText('batterySpecUsable', `${format(battery.usableKWh, 2)} kWh`);
    setText('batterySpecVoltageAh', `${format(battery.voltage, 1)} V / ${format(battery.ah, 0)} Ah`);
    setText('batterySpecDod', `${format(battery.dod, 0)}%`);
    setText('batterySpecDimensions', `${battery.dimensions} — ${format(battery.weightKg, 0)} kg`);
    setText('batteryProductModel', battery.model);
    setText('batteryProductMeta', `${format(battery.energyKWh, 2)} kWh — ${format(battery.voltage, 1)} V — ${format(battery.ah, 0)} Ah`);
    const image = $('batteryProductImage');
    if (image) { image.src = battery.image; image.alt = `بطارية Deye ${battery.model}`; }
    return battery;
  }

  function populateInverterOptions(preferredValue = null) {
    const select = $('inverterSelection');
    if (!select) return;
    const phase = $('phase').value;
    const current = preferredValue ?? select.value ?? 'auto';
    const models = DEYE_INVERTERS.filter((model) => model.phase === phase)
      .sort((a, b) => a.ratedW - b.ratedW || a.rank - b.rank || a.model.localeCompare(b.model));
    const grouped = models.reduce((groups, model) => {
      (groups[model.family] ||= []).push(model);
      return groups;
    }, {});
    select.innerHTML = '<option value="auto">اختيار تلقائي — استخدم اقتراح Electrify</option>' +
      Object.entries(grouped).map(([family, familyModels]) => `<optgroup label="Deye ${escapeHtml(family)}">${familyModels.map((model) => `<option value="${model.id}">${escapeHtml(model.model)} — ${format(model.ratedW / 1000, 1).replace('.0','')} kW</option>`).join('')}</optgroup>`).join('') +
      '<option value="custom">موديل آخر / إدخال يدوي</option>';
    select.value = [...select.options].some((option) => option.value === current) ? current : 'auto';
  }

  function distributeStrings(totalStrings, currents, capacities, panelImp) {
    const count = Math.max(currents.length, capacities.length, 1);
    const amps = [...currents];
    const caps = [...capacities];
    while (amps.length < count) amps.push(amps.at(-1) || 0);
    while (caps.length < count) caps.push(caps.at(-1) || 1);
    let best = null;
    function walk(index, remaining, allocation) {
      if (index === count) {
        if (remaining !== 0) return;
        const spread = Math.max(...allocation) - Math.min(...allocation);
        if (!best || spread < best.spread) best = { allocation:[...allocation], spread };
        return;
      }
      const maxForMppt = Math.min(caps[index], Math.floor((amps[index] * 1.03 + 1e-9) / Math.max(panelImp, 0.001)));
      for (let strings = Math.min(maxForMppt, remaining); strings >= 0; strings -= 1) {
        allocation.push(strings);
        walk(index + 1, remaining - strings, allocation);
        allocation.pop();
      }
    }
    walk(0, totalStrings, []);
    return best?.allocation || null;
  }

  function findStringing(panelCount, model, panel) {
    if (!model || panelCount <= 0) return { valid:false, series:0, parallel:0, configuredPanels:panelCount, allocation:[], reasons:['لا توجد ألواح للحساب.'] };
    const coldVocFactor = 1.2;
    const minSeries = Math.max(1, Math.ceil(model.mpptMinV / panel.vmp));
    const maxByMppt = Math.floor(model.mpptMaxV / panel.vmp);
    const maxByDc = Math.floor(model.maxDcV / (panel.voc * coldVocFactor));
    const maxSeries = Math.max(0, Math.min(maxByMppt, maxByDc));
    const totalStringCapacity = model.stringsPerMppt.reduce((sum, value) => sum + value, 0);
    const candidates = [];

    // لا نزيد عدد الألواح هنا. يجب أن يستخدم التوصيل نفس العدد الناتج من N = Pdc(STC) / Ppv.
    if (maxSeries >= minSeries && totalStringCapacity > 0) {
      for (let series = minSeries; series <= maxSeries; series += 1) {
        if (panelCount % series !== 0) continue;
        const parallel = panelCount / series;
        if (parallel > totalStringCapacity) continue;
        const allocation = distributeStrings(parallel, model.mpptCurrents, model.stringsPerMppt, panel.imp);
        if (!allocation) continue;
        const powerW = panelCount * panel.power;
        if (powerW > model.maxPvW * 1.001) continue;
        candidates.push({
          valid:true, series, parallel, configuredPanels:panelCount, allocation, powerW,
          minSeries, maxSeries, stringVmp:series * panel.vmp,
          stringVocCold:series * panel.voc * coldVocFactor,
          arrayCurrent:parallel * panel.isc * 1.25,
          reasons:[]
        });
      }
    }

    if (candidates.length) {
      candidates.sort((a, b) => a.parallel - b.parallel || b.series - a.series);
      return candidates[0];
    }

    const reasons = [];
    if (maxSeries < minSeries) reasons.push(`مجال الجهد لا يسمح بسلسلة بين ${minSeries} و${maxSeries} ألواح.`);
    if (panel.power * panelCount > model.maxPvW) reasons.push(`قدرة المصفوفة ${format(panel.power * panelCount / 1000,2)} kWp تتجاوز حد الموديل ${format(model.maxPvW / 1000,2)} kW.`);
    if (!distributeStrings(1, model.mpptCurrents, model.stringsPerMppt, panel.imp)) reasons.push(`تيار اللوح Imp (${format(panel.imp,2)} A) أعلى من تيار MPPT المتاح.`);
    if (!reasons.length) reasons.push(`عدد الألواح المحسوب (${panelCount}) لا يتوزع إلى سلاسل صحيحة ضمن مجال MPPT وعدد المداخل المتاحة.`);
    reasons.push('لم يغيّر Electrify العدد تلقائيًا؛ عدّل Pdc(STC) أو اختر لوحًا/إنفرترًا متوافقًا.');
    return { valid:false, series:0, parallel:0, configuredPanels:panelCount, allocation:[], powerW:panelCount * panel.power, minSeries, maxSeries, stringVmp:0, stringVocCold:0, arrayCurrent:0, reasons };
  }

  function evaluateInverter(model, needs, panelCount, panel) {
    const stringing = findStringing(panelCount, model, panel);
    const checks = {
      phase: model.phase === needs.phase,
      continuous: model.ratedW >= needs.continuousW,
      surge: model.peakW >= needs.surgeW,
      pv: stringing.valid
    };
    const valid = Object.values(checks).every(Boolean);
    const reasons = [];
    if (!checks.phase) reasons.push('عدد الأطوار مختلف عن المشروع.');
    if (!checks.continuous) reasons.push(`القدرة الاسمية أقل من المطلوب ${format(needs.continuousW / 1000,2)} kW.`);
    if (!checks.surge) reasons.push(`قدرة الذروة أقل من إقلاع الأحمال ${format(needs.surgeW / 1000,2)} kW.`);
    if (!checks.pv) reasons.push(...stringing.reasons);
    return { model, valid, checks, reasons, stringing };
  }

  function recommendDeye(needs, panelCount, panel) {
    const candidates = DEYE_INVERTERS.filter((model) => model.phase === needs.phase)
      .map((model) => evaluateInverter(model, needs, panelCount, panel));
    const valid = candidates.filter((candidate) => candidate.valid)
      .sort((a, b) => a.model.ratedW - b.model.ratedW || a.model.rank - b.model.rank || a.stringing.configuredPanels - b.stringing.configuredPanels);
    if (valid.length) return valid[0];
    const powerCompatible = candidates.filter((candidate) => candidate.checks.continuous && candidate.checks.surge)
      .sort((a, b) => a.model.ratedW - b.model.ratedW || a.model.rank - b.model.rank);
    return powerCompatible[0] || candidates.sort((a,b) => b.model.ratedW - a.model.ratedW || a.model.rank - b.model.rank)[0] || null;
  }

  function chooseCable(currentA, lengthM, voltageV, dropPct, conductor, circuit = 'dc', minimum = 1.5) {
    if (currentA <= 0 || lengthM <= 0 || voltageV <= 0) return { size: 0, dropBased: 0, currentBased: 0, dropActual: 0 };
    const rho = conductor === 'aluminum' ? 0.0282 : 0.0175;
    const ampacity = conductor === 'aluminum' ? AMPACITY_ALUMINUM : AMPACITY_COPPER;
    const allowableDropV = Math.max(voltageV * Math.max(dropPct, 0.1) / 100, 0.01);
    const factor = circuit === 'three' ? Math.sqrt(3) : 2;
    const dropBased = factor * rho * lengthM * currentA / allowableDropV;
    const currentSize = CABLE_SIZES.find((size) => ampacity[size] >= currentA) || CABLE_SIZES.at(-1);
    const required = Math.max(dropBased, currentSize, minimum);
    const size = CABLE_SIZES.find((candidate) => candidate >= required) || CABLE_SIZES.at(-1);
    const actualDropV = factor * rho * lengthM * currentA / size;
    return { size, dropBased, currentBased: currentSize, dropActual: actualDropV / voltageV * 100 };
  }

  function calculate() {
    const loads = getLoads();
    loads.forEach((_, index) => updateRowEnergy($('loadsBody').children[index]));

    const systemType = $('systemType').value;
    const isBatterySystem = systemType !== 'ongrid';
    const phase = $('phase').value;
    const dailyWh = loads.reduce((sum, load) => sum + load.qty * load.watts * load.hours, 0);
    const connectedW = loads.reduce((sum, load) => sum + load.qty * load.watts, 0);
    const simultaneousW = loads.reduce((sum, load) => sum + load.qty * load.watts * load.simultaneity / 100, 0);
    const largestStartExtraW = loads.reduce((max, load) => Math.max(max, load.qty * load.watts * Math.max(load.surge - 1, 0)), 0);
    const surgeW = simultaneousW + largestStartExtraW;

    const psh = Math.max(num('psh', 5.5), 0.1);
    const lossesPct = clamp(num('losses', 20), 0, 90);
    const lossFactor = 1 - lossesPct / 100;
    const selectedPanel = syncPanelSelection();
    const panel = { ...selectedPanel };
    const pdcStcW = dailyWh > 0 ? dailyWh / (psh * Math.max(lossFactor, 0.1)) : 0;
    const rawRequiredPvW = pdcStcW; // اسم قديم محفوظ للتوافق مع التقارير والمشاريع السابقة.
    const initialPanelCount = pdcStcW > 0 ? Math.ceil(pdcStcW / panel.power) : 0;

    const inverterMargin = clamp(num('inverterMargin', 25), 0, 200) / 100;
    const inverterNeedW = simultaneousW * (1 + inverterMargin);
    const needs = { continuousW: inverterNeedW, surgeW, phase };
    const recommendation = recommendDeye(needs, initialPanelCount, panel);

    const selection = $('inverterSelection')?.value || 'auto';
    let selectedModel;
    if (selection === 'custom') {
      selectedModel = getCustomInverter();
      syncInverterInputs(selectedModel, true);
    } else {
      selectedModel = selection === 'auto' ? recommendation?.model : getCatalogModel(selection);
      if (!selectedModel) selectedModel = recommendation?.model || DEYE_INVERTERS.find((model) => model.phase === phase) || getCustomInverter();
      syncInverterInputs(selectedModel, false);
    }

    const selectedEvaluation = evaluateInverter(selectedModel, needs, initialPanelCount, panel);
    const stringing = selectedEvaluation.stringing;
    const panelCount = initialPanelCount;
    const pvPowerW = panelCount * panel.power;
    const stringVmp = stringing.valid ? stringing.stringVmp : 0;
    const stringVocCold = stringing.valid ? stringing.stringVocCold : 0;
    const pvStringDesignA = panel.isc * 1.25;
    const pvArrayDesignA = stringing.valid ? stringing.arrayCurrent : panel.isc * Math.max(initialPanelCount, 1) * 1.25;
    const currentByMppt = stringing.valid ? stringing.allocation.map((count, index) => ({
      strings: count,
      operatingA: count * panel.imp,
      limitA: selectedModel.mpptCurrents[index] || selectedModel.mpptCurrents.at(-1) || 0
    })) : [];

    const inverterW = selectedModel.ratedW;
    const inverterPeakW = selectedModel.peakW;
    const inverterEff = clamp(selectedModel.efficiency, 1, 100) / 100;

    const selectedBattery = getSelectedBattery();
    const batteryVoltage = selectedBattery.voltage;
    const batteryAh = selectedBattery.ah;
    const requestedBankV = selectedBattery.voltage;
    const autonomyDays = Math.max(num('autonomyDays', 1), 0.1);
    const dod = clamp(num('dod', selectedBattery.dod), 1, selectedBattery.dod) / 100;
    const batteryEff = clamp(num('batteryEff', selectedBattery.efficiency), 1, 100) / 100;
    const batteriesSeries = isBatterySystem ? 1 : 0;
    const actualBankV = isBatterySystem ? selectedBattery.voltage : requestedBankV;
    const requiredNominalBatteryWh = isBatterySystem && dailyWh > 0 ? dailyWh * autonomyDays / (dod * inverterEff * batteryEff) : 0;
    const moduleBatteryWh = selectedBattery.energyKWh * 1000;
    const batteriesParallel = isBatterySystem && requiredNominalBatteryWh > 0 ? Math.max(1, Math.ceil(requiredNominalBatteryWh / moduleBatteryWh)) : 0;
    const batteryCount = batteriesParallel;
    const nominalBatteryWh = batteryCount * moduleBatteryWh;
    const usableBatteryWh = nominalBatteryWh * dod * batteryEff * inverterEff;
    const batteryRecommendedCurrentA = batteryCount * selectedBattery.recommendedCurrentA;
    const batteryMaxCurrentA = batteryCount * selectedBattery.maxCurrentA;
    const runtimeHours = simultaneousW > 0 ? usableBatteryWh / simultaneousW : 0;
    const batteryDesignA = isBatterySystem && actualBankV > 0 ? inverterW / (actualBankV * inverterEff) * 1.25 : 0;
    const controllerA = isBatterySystem && actualBankV > 0 ? pvPowerW / (actualBankV * 0.95) * 1.25 : 0;

    const acVoltage = Math.max(num('acVoltage', 230), 1);
    const acOperatingA = phase === 'three' ? inverterW / (Math.sqrt(3) * acVoltage) : inverterW / acVoltage;
    const acDesignA = acOperatingA * 1.25;
    const conductor = $('conductor').value;
    const dcDrop = Math.max(num('dcDrop', 2), 0.1);
    const acDrop = Math.max(num('acDrop', 3), 0.1);
    const pvCableLength = Math.max(num('pvCableLength', 20), 0.1);
    const batteryCableLength = Math.max(num('batteryCableLength', 2), 0.1);
    const acCableLength = Math.max(num('acCableLength', 15), 0.1);

    const pvStringCable = chooseCable(pvStringDesignA, pvCableLength, Math.max(stringVmp, panel.vmp), dcDrop, conductor, 'dc', 4);
    const pvArrayCable = chooseCable(pvArrayDesignA, pvCableLength, Math.max(stringVmp, panel.vmp), dcDrop, conductor, 'dc', 4);
    const batteryCable = chooseCable(batteryDesignA, batteryCableLength, Math.max(actualBankV, requestedBankV), dcDrop, conductor, 'dc', 10);
    const acCable = chooseCable(acDesignA, acCableLength, acVoltage, acDrop, conductor, phase === 'three' ? 'three' : 'dc', 2.5);

    const pvStringFuseA = nextStandard(panel.isc * 1.56, STANDARD_BREAKERS_A);
    const pvArrayBreakerA = nextStandard(Math.max(stringing.parallel, 1) * panel.isc * 1.56, STANDARD_BREAKERS_A);
    const batteryBreakerA = nextStandard(batteryDesignA, STANDARD_BREAKERS_A);
    const acBreakerA = nextStandard(acDesignA, STANDARD_BREAKERS_A);

    const currency = $('currency').value;
    const panelCost = panelCount * Math.max(num('panelPrice'), 0);
    const inverterCost = Math.max(num('inverterPrice'), 0);
    const batteryCost = isBatterySystem ? batteryCount * Math.max(num('batteryPrice'), 0) : 0;
    const structureCost = Math.max(num('structureCost'), 0);
    const electricalCost = Math.max(num('electricalCost'), 0);
    const installationCost = Math.max(num('installationCost'), 0);
    const otherCost = Math.max(num('otherCost'), 0);
    const equipmentCost = panelCost + inverterCost + batteryCost;
    const totalCost = equipmentCost + structureCost + electricalCost + installationCost + otherCost;
    const equipmentShare = totalCost > 0 ? equipmentCost / totalCost * 100 : 0;

    const alerts = [];
    if (loads.length === 0 || dailyWh <= 0) alerts.push({ type: 'error', text: 'أضف جهازًا واحدًا على الأقل بقدرة وساعات تشغيل أكبر من صفر.' });
    if (!recommendation?.valid) alerts.push({ type: 'warning', text: 'لم يجد الكتالوج المضمّن موديل Deye يطابق الحمل والألواح بالكامل. راجع التنبيهات أو استخدم موديلًا مخصصًا.' });
    if (initialPanelCount > 0) alerts.push({ type: 'info', text: `عدد الألواح محسوب مباشرةً من N = Pdc(STC) ÷ Ppv: ceil(${format(pdcStcW,0)} ÷ ${format(panel.power,0)}) = ${initialPanelCount} ألواح.` });
    if (!selectedEvaluation.checks.continuous) alerts.push({ type: 'error', text: `الإنفرتر المختار قدرته ${format(inverterW / 1000,2)} kW، بينما الحمل المستمر مع الهامش يحتاج ${format(inverterNeedW / 1000,2)} kW.` });
    if (!selectedEvaluation.checks.surge) alerts.push({ type: 'error', text: `ذروة الإنفرتر المختار ${format(inverterPeakW / 1000,2)} kW أقل من ذروة إقلاع الأحمال ${format(surgeW / 1000,2)} kW.` });
    if (isBatterySystem && batteryDesignA > batteryMaxCurrentA + 0.01) alerts.push({ type:'error', text:`بنك بطاريات ${selectedBattery.model} يوفر تيارًا مستمرًا أقصى ${format(batteryMaxCurrentA,0)} A، بينما التصميم يحتاج تقريبًا ${format(batteryDesignA,0)} A. زد عدد البطاريات أو اختر سعة أعلى.` });
    else if (isBatterySystem && batteryDesignA > batteryRecommendedCurrentA + 0.01) alerts.push({ type:'warning', text:`تيار التصميم ${format(batteryDesignA,0)} A أعلى من التيار الموصى به للبنك ${format(batteryRecommendedCurrentA,0)} A، رغم بقائه ضمن الحد الأقصى.` });
    if (isBatterySystem && selectedBattery.maxParallel && batteryCount > selectedBattery.maxParallel) alerts.push({ type:'error', text:`عدد البطاريات ${batteryCount} يتجاوز حد التوازي المعلن للموديل ${selectedBattery.model} وهو ${selectedBattery.maxParallel} وحدة.` });
    if (!selectedEvaluation.checks.pv) selectedEvaluation.stringing.reasons.forEach((reason) => alerts.push({ type: 'error', text: `عدم توافق الألواح مع الإنفرتر: ${reason}` }));
    if (selection !== 'auto' && recommendation?.model && selectedModel.id !== recommendation.model.id) alerts.push({ type: 'info', text: `اقتراح الموقع هو ${recommendation.model.model}، لكن الحسابات النهائية تستخدم الموديل الذي اخترته: ${selectedModel.model}.` });
    currentByMppt.forEach((mppt, index) => {
      if (mppt.operatingA > mppt.limitA * 1.03) alerts.push({ type:'warning', text:`تيار MPPT ${index + 1} (${format(mppt.operatingA,2)} A) أعلى من حد الموديل (${format(mppt.limitA,2)} A).` });
    });
    if (isBatterySystem && Math.abs(actualBankV - requestedBankV) / requestedBankV > 0.08) alerts.push({ type: 'warning', text: `جهد البنك الناتج من وحدات البطارية هو ${format(actualBankV,1)} V، وهو مختلف عن جهد البنك المختار ${format(requestedBankV,1)} V.` });
    if (!isBatterySystem) alerts.push({ type: 'info', text: 'في نظام On-Grid أُلغيت حسابات البطاريات ومنظم الشحن المستقل.' });
    if (phase === 'three' && acVoltage < 350) alerts.push({ type:'warning', text:'تم اختيار إنفرتر ثلاثي الطور مع جهد AC منخفض؛ غالبًا يجب اختيار 400 V والتحقق من شبكة الموقع.' });
    if (phase === 'single' && acVoltage > 300) alerts.push({ type:'warning', text:'تم اختيار إنفرتر أحادي الطور مع جهد AC مرتفع؛ راجع جهد الخرج المختار.' });
    if (Math.max(pvStringCable.dropActual, pvArrayCable.dropActual, acCable.dropActual, batteryCable.dropActual || 0) > 5) alerts.push({ type: 'warning', text: 'يوجد مسار كابل بهبوط جهد مرتفع؛ راجع الأطوال ومقاطع الكابلات.' });

    calculation = {
      loads, systemType, isBatterySystem, dailyWh, connectedW, simultaneousW, surgeW,
      psh, lossesPct, lossFactor, panel, pdcStcW, rawRequiredPvW, initialPanelCount, panelCount, pvPowerW, stringing, stringVmp, stringVocCold, pvStringDesignA, pvArrayDesignA, currentByMppt,
      inverterW, inverterPeakW, inverterNeedW, recommendation, recommendedModel: recommendation?.model || null, selectedModel, selectedEvaluation,
      requiredNominalBatteryWh, batteryCount, batteriesSeries, batteriesParallel, actualBankV, selectedBattery, batteryRecommendedCurrentA, batteryMaxCurrentA,
      nominalBatteryWh, usableBatteryWh, runtimeHours, batteryDesignA, controllerA,
      pvStringCable, pvArrayCable, batteryCable, acCable, pvStringFuseA, pvArrayBreakerA, batteryBreakerA, acBreakerA,
      acOperatingA, acDesignA, currency, panelCost, inverterCost, batteryCost, structureCost, electricalCost, installationCost, otherCost,
      equipmentCost, totalCost, equipmentShare, alerts
    };

    render(calculation);
    updateCompletion();
    scheduleCurrentSave();
    return calculation;
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function cableText(cable) {
    return cable?.size ? `${format(cable.size, 1).replace('.0','')} mm² — هبوط ${format(cable.dropActual, 2)}%` : '—';
  }

  function render(c) {
    const isOnGrid = c.systemType === 'ongrid';
    all('.battery-only').forEach((element) => element.classList.toggle('hidden', isOnGrid));
    document.body.classList.toggle('system-ongrid', isOnGrid);

    const recommendedLabel = inverterLabel(c.recommendedModel);
    const selectedLabel = inverterLabel(c.selectedModel);
    const inverterImageEl = $('inverterProductImage');
    if (inverterImageEl) { inverterImageEl.src = inverterImage(c.selectedModel); inverterImageEl.alt = `إنفرتر ${selectedLabel}`; }
    setText('inverterProductModel', selectedLabel);
    setText('inverterProductMeta', `${c.selectedModel.phase === 'three' ? 'ثلاثي الطور' : 'أحادي الطور'} — ${format(c.inverterW / 1000, 2)} kW — ${c.selectedModel.family}`);
    syncBatterySelection(c.selectedBattery?.id || $('batterySelection')?.value, { syncDod:false, syncInputs:false });
    const compatibility = $('inverterCompatibility');
    const selectedValid = c.selectedEvaluation.valid;
    if (compatibility) {
      compatibility.className = `compatibility-box ${selectedValid ? 'success' : 'error'}`;
      compatibility.textContent = selectedValid
        ? `✓ الموديل المختار مناسب للحمل، ذروة الإقلاع، وقدرة الألواح ضمن البيانات المدخلة.`
        : `✕ الموديل المختار غير متوافق بالكامل: ${c.selectedEvaluation.reasons.join(' ')}`;
    }

    setText('requiredInverterInline', `${format(c.inverterNeedW / 1000, 2)} kW`);
    setText('recommendedInverterInline', c.recommendedModel ? `${c.recommendedModel.model} (${format(c.recommendedModel.ratedW / 1000,1)} kW)` : 'لا يوجد تطابق كامل');

    setText('dailyEnergyInline', `${format(c.dailyWh / 1000, 2)} kWh`);
    setText('connectedLoadInline', `${format(c.connectedW / 1000, 2)} kW`);
    setText('peakLoadInline', `${format(c.simultaneousW / 1000, 2)} kW`);
    setText('surgeLoadInline', `${format(c.surgeW / 1000, 2)} kW`);

    setText('dailyEnergyResult', format(c.dailyWh / 1000, 2));
    setText('pvPowerResult', format(c.pvPowerW / 1000, 2));
    setText('panelCountResult', format(c.panelCount));
    setText('inverterNeedResult', format(c.inverterNeedW / 1000, 2));
    setText('recommendedInverterResult', c.recommendedModel?.model || 'لا يوجد تطابق');
    setText('recommendedInverterPower', c.recommendedModel ? `${format(c.recommendedModel.ratedW / 1000, 2)} kW — أقصى ألواح ${format(c.recommendedModel.maxPvW / 1000, 2)} kW` : 'استخدم موديلًا مخصصًا');
    setText('selectedInverterResult', c.selectedModel.model);
    setText('inverterResult', `${format(c.inverterW / 1000, 2)} kW — ذروة ${format(c.inverterPeakW / 1000, 2)} kW`);
    setText('batteryEnergyResult', format(c.nominalBatteryWh / 1000, 2));
    setText('batteryCountResult', format(c.batteryCount));
    setText('runtimeResult', format(c.runtimeHours, 2));
    setText('controllerResult', isOnGrid ? '—' : format(nextStandard(c.controllerA, STANDARD_BREAKERS_A)));

    setText('pvFormulaResult', `${format(c.pdcStcW / 1000, 2)} kWp`);
    setText('pvFormulaDetail', `Pdc(STC) = ${format(c.dailyWh / 1000,2)} kWh ÷ (${format(c.psh,1)} ساعة × معامل صافي ${format(c.lossFactor,2)})`);
    setText('panelBaseResult', `${c.panelCount} لوح`);
    setText('panelBaseDetail', `N = ceil(Pdc(STC) ÷ Ppv) = ceil(${format(c.pdcStcW,0)} W ÷ ${format(c.panel.power,0)} W) = ${c.panelCount}`);
    if (c.stringing.valid) {
      setText('panelAdjustmentResult', 'متوافق — العدد لم يتغير');
      setText('panelAdjustmentDetail', `${c.stringing.series} ألواح في السلسلة × ${c.stringing.parallel} سلاسل، ضمن MPPT ${format(c.selectedModel.mpptMinV,0)}–${format(c.selectedModel.mpptMaxV,0)} V وحد DC ${format(c.selectedModel.maxDcV,0)} V.`);
      setText('panelDecisionBadge', 'Pdc(STC) ÷ Ppv');
    } else {
      setText('panelAdjustmentResult', 'العدد ثابت — التوصيل يحتاج مراجعة');
      setText('panelAdjustmentDetail', c.stringing.reasons.join(' '));
      setText('panelDecisionBadge', 'راجع MPPT');
    }

    setText('stringConfig', c.stringing.valid ? `${c.stringing.series} لوح تسلسل × ${c.stringing.parallel} سلسلة توازٍ` : 'غير متوافق');
    setText('mpptDistribution', c.stringing.valid ? c.stringing.allocation.map((count, index) => `MPPT ${index + 1}: ${count} سلسلة`).join(' — ') : '—');
    setText('stringVmp', c.stringing.valid ? `${format(c.stringVmp, 1)} V` : '—');
    setText('stringVoc', c.stringing.valid ? `${format(c.stringVocCold, 1)} V` : '—');
    setText('arrayCurrent', c.stringing.valid ? `${format(c.pvArrayDesignA, 1)} A` : '—');
    setText('inverterContinuousNeed', `${format(c.inverterNeedW / 1000,2)} kW`);
    setText('inverterSurgeNeed', `${format(c.surgeW / 1000,2)} kW`);
    setText('selectedInverterCapacity', `${format(c.inverterW / 1000,2)} kW مستمر / ${format(c.inverterPeakW / 1000,2)} kW ذروة`);
    setText('selectedInverterStatus', selectedValid ? 'متوافق مع الحسابات' : 'غير متوافق — راجع التنبيهات');
    $('selectedInverterStatus')?.classList.toggle('status-good', selectedValid);
    $('selectedInverterStatus')?.classList.toggle('status-bad', !selectedValid);

    setText('batteryConfig', c.batteryCount ? `${c.batteriesSeries} تسلسل × ${c.batteriesParallel} توازٍ` : '—');
    setText('bankCapacity', c.batteryCount ? `${format(c.actualBankV, 1)} V / ${format(c.batteryCount * c.selectedBattery.ah, 0)} Ah` : '—');
    setText('usableBattery', c.batteryCount ? `${format(c.usableBatteryWh / 1000, 2)} kWh` : '—');
    setText('batteryCurrent', c.batteryCount ? `${format(c.batteryDesignA, 1)} A مطلوب / ${format(c.batteryMaxCurrentA, 0)} A متاح` : '—');
    setText('pvStringCable', cableText(c.pvStringCable));
    setText('pvArrayCable', cableText(c.pvArrayCable));
    setText('batteryCable', cableText(c.batteryCable));
    setText('acCable', cableText(c.acCable));
    setText('pvStringFuse', c.pvStringFuseA ? `${c.pvStringFuseA} A DC` : '—');
    setText('pvArrayBreaker', c.pvArrayBreakerA ? `${c.pvArrayBreakerA} A DC` : '—');
    setText('batteryBreaker', c.batteryBreakerA ? `${c.batteryBreakerA} A DC` : '—');
    setText('acBreaker', c.acBreakerA ? `${c.acBreakerA} A AC` : '—');

    $('alerts').innerHTML = c.alerts.map((alert) => `<div class="alert ${alert.type}"><b>${alert.type === 'error' ? '!' : alert.type === 'warning' ? '⚠' : 'ⓘ'}</b><span>${escapeHtml(alert.text)}</span></div>`).join('');
    renderChart(c.loads);
    renderDiagram(c);
    renderCosts(c);
    renderNotes(c);
    updateReportCover(c);
  }

  function renderChart(loads) {
    const chart = $('energyChart');
    const values = loads.map((load) => ({ name: load.name, value: load.qty * load.watts * load.hours / 1000 })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);
    if (!values.length) {
      chart.innerHTML = '<div class="empty-chart">لا توجد بيانات استهلاك لعرضها.</div>';
      return;
    }
    const max = Math.max(...values.map((item) => item.value), 0.01);
    chart.innerHTML = values.map((item) => `<div class="chart-row"><span class="chart-label" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span><div class="chart-track"><div class="chart-bar" style="width:${Math.max(item.value / max * 100, 1)}%"></div></div><span class="chart-value">${format(item.value, 2)}</span></div>`).join('');
  }

  function renderDiagram(c) {
    setText('diagramPanels', `${c.panelCount} لوح / ${format(c.pvPowerW / 1000, 2)} kWp`);
    setText('diagramInverter', `${c.selectedModel.brand} ${format(c.inverterW / 1000, 2)} kW`);
    setText('diagramLoad', `${format(c.simultaneousW / 1000, 2)} kW`);
    setText('diagramBattery', `${format(c.nominalBatteryWh / 1000, 2)} kWh`);
    all('.battery-node, .battery-path').forEach((element) => element.style.display = c.isBatterySystem ? '' : 'none');
    all('.grid-node, .grid-path').forEach((element) => element.style.display = c.systemType === 'offgrid' ? 'none' : '');
  }

  function renderCosts(c) {
    const money = (value) => `${format(value, 0)} ${c.currency}`;
    setText('costCurrencyPill', c.currency);
    setText('costPanelsQty', c.panelCount);
    setText('costPanelUnit', money(num('panelPrice')));
    setText('costPanelsTotal', money(c.panelCost));
    setText('costInverterName', `إنفرتر ${c.selectedModel.model}`);
    setText('costInverterUnit', money(c.inverterCost));
    setText('costInverterTotal', money(c.inverterCost));
    setText('costBatteryName', c.isBatterySystem ? `بطارية Deye ${c.selectedBattery.model}` : 'بطاريات Deye');
    setText('costBatteriesQty', c.batteryCount);
    setText('costBatteryUnit', money(num('batteryPrice')));
    setText('costBatteriesTotal', money(c.batteryCost));
    setText('structureTotal', money(c.structureCost));
    setText('electricalTotal', money(c.electricalCost));
    setText('installationTotal', money(c.installationCost));
    setText('otherTotal', money(c.otherCost));
    setText('grandTotal', money(c.totalCost));
    setText('costPerWatt', c.pvPowerW > 0 ? `${format(c.totalCost / c.pvPowerW, 2)} ${c.currency} لكل واط شمسي` : '—');
    setText('equipmentShare', `${format(c.equipmentShare, 0)}%`);
    const circumference = 302;
    $('costRingValue').style.strokeDashoffset = String(circumference * (1 - clamp(c.equipmentShare, 0, 100) / 100));
  }

  function renderNotes(c) {
    const notes = [
      `حُسبت Pdc(STC) من الاستهلاك اليومي ÷ ساعات الشمس ÷ معامل صافي النظام: ${format(c.dailyWh / 1000,2)} ÷ (${format(c.psh,1)} × ${format(c.lossFactor,2)}) = ${format(c.pdcStcW / 1000,2)} kWp.`,
      `عدد الألواح = ceil(Pdc(STC) ÷ Ppv) = ceil(${format(c.pdcStcW,0)} ÷ ${format(c.panel.power,0)}) = ${c.panelCount} ألواح من موديل ${escapeHtml(c.panel.model)}. فحص MPPT لا يغيّر العدد تلقائيًا.`,
      `اختيار البطارية: ${escapeHtml(c.selectedBattery.model)} بسعة ${format(c.selectedBattery.energyKWh,2)} kWh للوحدة؛ يحتاج المشروع ${c.batteryCount} وحدة. اقتراح الإنفرتر يعتمد على الحمل المستمر مع هامش ${format(num('inverterMargin'),0)}% وعلى ذروة الإقلاع وحدود PV وMPPT. الموديل المختار هو ${escapeHtml(c.selectedModel.model)}.`,
      `جهد الدارة المفتوحة للألواح صُحح بمعامل بارد محافظ قدره 1.20 قبل مقارنته بأقصى جهد DC.`,
      `مقاطع الكابلات والحمايات مقترحات أولية تعتمد على الأطوال وهبوط الجهد المدخل، ولا تستبدل جداول الكود المحلي وطريقة التمديد ودرجة الحرارة.`,
      c.isBatterySystem ? `سعة البطاريات تعتمد على ${format(num('autonomyDays'),2)} يوم استقلالية وعمق تفريغ ${format(num('dod'),0)}%.` : 'النظام مرتبط بالشبكة، لذلك لم تُدرج بطاريات في الحساب.',
      `الأسعار تقديرية بالعملة المختارة (${escapeHtml(c.currency)}) ولا تشمل الضرائب أو الشحن إلا إذا أُضيفت ضمن البنود الأخرى.`
    ];
    $('reportNotes').innerHTML = notes.map((note) => `<li>${note}</li>`).join('');
  }

  function updateReportCover(c) {
    let cover = $('reportCover');
    if (!cover) {
      cover = document.createElement('section');
      cover.id = 'reportCover';
      cover.className = 'print-only report-cover';
      document.querySelector('.content').prepend(cover);
    }
    const date = new Date().toLocaleDateString('ar-PS', { year: 'numeric', month: 'long', day: 'numeric' });
    cover.innerHTML = `<div class="report-brand"><span>ϟ</span><div><b>Electrify</b><small>Solar Design Studio</small></div></div><p>تقرير تصميم أولي لنظام طاقة شمسية</p><h1>${escapeHtml($('projectName').value || 'مشروع دون اسم')}</h1><div>العميل: ${escapeHtml($('clientName').value || '—')} &nbsp; | &nbsp; الموقع: ${escapeHtml($('location').value || '—')} &nbsp; | &nbsp; التاريخ: ${date}<br>نوع النظام: ${escapeHtml($('systemType').selectedOptions[0].text)} &nbsp; | &nbsp; القدرة الشمسية: ${format(c.pvPowerW / 1000,2)} kWp &nbsp; | &nbsp; الإنفرتر: ${escapeHtml(c.selectedModel.model)} &nbsp; | &nbsp; التكلفة: ${format(c.totalCost,0)} ${escapeHtml(c.currency)}</div><footer>تم إعداد التقرير بواسطة Electrify — تطوير محمد زاهدة · © 2026 جميع الحقوق محفوظة</footer>`;
  }

  function updateCompletion() {
    // تمثل النسبة مدى جاهزية المشروع الحقيقي، لا مجرد وجود قيم افتراضية في الحقول.
    let score = 0;
    const loads = getLoads();
    const validLoads = loads.length > 0 && loads.every((load) =>
      load.name.trim() && load.qty > 0 && load.watts > 0 && load.hours > 0 &&
      load.simultaneity > 0 && load.simultaneity <= 100 && load.surge >= 1
    );
    const panelReady = Boolean(PANEL_CATALOG[$('panelSelection')?.value]) && num('panelPower') > 0 && num('panelVmp') > 0 && num('panelVoc') > 0 && num('panelImp') > 0 && num('panelIsc') > 0;
    const selectedManually = ($('inverterSelection')?.value || 'auto') !== 'auto';
    const inverterValid = Boolean(calculation?.selectedEvaluation?.valid);
    const batteryReady = $('systemType').value === 'ongrid' || Boolean(BATTERY_CATALOG[$('batterySelection')?.value] && num('batteryPrice') > 0 && num('dod') > 0);
    const pricingReady = num('panelPrice') > 0 && num('inverterPrice') > 0 &&
      ($('systemType').value === 'ongrid' || num('batteryPrice') > 0) &&
      num('structureCost') > 0 && num('electricalCost') > 0 && num('installationCost') > 0;

    if ($('projectName').value.trim()) score += 5;
    if ($('clientName').value.trim()) score += 5;
    if ($('location').value.trim()) score += 5;
    if (validLoads) score += 20;
    if (panelReady) score += 15;
    if (inverterValid) score += selectedManually ? 20 : 10;
    if (batteryReady) score += 10;
    if (pricingReady) score += 10;
    if (currentProjectId) score += 10;

    const percent = clamp(Math.round(score), 0, 100);
    setText('completionText', `${percent}%`);
    $('completionBar').style.width = `${percent}%`;
    const meter = document.querySelector('.hero-meter');
    if (meter) {
      const missing = [];
      if (!$('clientName').value.trim()) missing.push('اسم العميل');
      if (!validLoads) missing.push('مراجعة الأحمال');
      if (!selectedManually) missing.push('اختيار الإنفرتر المتوفر');
      if (!currentProjectId) missing.push('حفظ المشروع');
      meter.title = missing.length ? `للوصول إلى 100%: ${missing.join('، ')}` : 'بيانات المشروع مكتملة ومحفوظة.';
    }
  }

  function serialize() {
    const fields = {};
    formIds.forEach((id) => {
      const element = $(id);
      if (!element) return;
      fields[id] = element.type === 'checkbox' ? element.checked : element.value;
    });
    return {
      app: 'electrify-solar-designer',
      version: 2,
      id: currentProjectId,
      fields,
      loads: getLoads(),
      updatedAt: new Date().toISOString()
    };
  }

  function applyState(state, { calculateAfter = true } = {}) {
    if (!state || typeof state !== 'object') return;
    const fields = state.fields || {};
    if (fields.phase && $('phase')) $('phase').value = fields.phase;
    populateInverterOptions(fields.inverterSelection || 'auto');
    const legacyPower = Number(fields.panelPower || 0);
    const legacyPanelId = legacyPower >= 700 || legacyPower <= 0 ? 'jinko-735' : 'jinko-650';
    const panelId = PANEL_CATALOG[fields.panelSelection] ? fields.panelSelection : legacyPanelId;
    if ($('panelSelection')) $('panelSelection').value = panelId;
    const batteryId = BATTERY_CATALOG[fields.batterySelection] ? fields.batterySelection : (Number(fields.batteryAh || 0) >= 180 ? 'deye-se-g10-2' : 'deye-se-g5-1-pro-b');
    if ($('batterySelection')) $('batterySelection').value = batteryId;
    Object.entries(fields).forEach(([id, value]) => {
      const element = $(id);
      if (!element || ['panelPower','panelVmp','panelVoc','panelImp','panelIsc','batteryVoltage','batteryAh','bankVoltage','batteryType'].includes(id)) return;
      if (element.type === 'checkbox') element.checked = Boolean(value);
      else element.value = value;
    });
    syncPanelSelection(panelId);
    syncBatterySelection(batteryId, { syncDod: !fields.dod });
    if (!$('inverterSelection').value) $('inverterSelection').value = 'auto';
    $('loadsBody').innerHTML = '';
    const loads = Array.isArray(state.loads) && state.loads.length ? state.loads : defaultLoads;
    loads.forEach(createLoadRow);
    currentProjectId = state.id || null;
    if (calculateAfter) calculate();
  }

  function scheduleCurrentSave() {
    clearTimeout(saveTimer);
    setText('saveStatus', 'جارٍ الحفظ…');
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_CURRENT, JSON.stringify(serialize()));
        setText('saveStatus', 'محفوظ محليًا');
      } catch (error) {
        setText('saveStatus', 'تعذّر الحفظ');
      }
    }, 350);
  }

  function readProjects() {
    try { return JSON.parse(localStorage.getItem(STORAGE_PROJECTS) || '[]'); }
    catch { return []; }
  }

  function writeProjects(projects) {
    try {
      localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects));
      return true;
    } catch {
      return false;
    }
  }

  function saveNamedProject() {
    try {
      const state = serialize();
      const projects = readProjects();
      if (!currentProjectId) currentProjectId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `project-${Date.now()}`;
      state.id = currentProjectId;
      state.name = $('projectName').value.trim() || 'مشروع دون اسم';
      state.updatedAt = new Date().toISOString();
      const index = projects.findIndex((project) => project.id === currentProjectId);
      if (index >= 0) projects[index] = state; else projects.unshift(state);
      if (!writeProjects(projects.slice(0, 50))) throw new Error('storage');
      localStorage.setItem(STORAGE_CURRENT, JSON.stringify(state));
      showToast('تم حفظ المشروع في هذا المتصفح.');
      renderProjectsList();
      updateCompletion();
    } catch {
      showToast('تعذّر الحفظ. شغّل الموقع عبر localhost أو اسمح بالتخزين المحلي.');
    }
  }

  function renderProjectsList() {
    const projects = readProjects().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const list = $('projectsList');
    if (!projects.length) {
      list.innerHTML = '<div class="empty-projects">لا توجد مشاريع محفوظة بعد.</div>';
      return;
    }
    list.innerHTML = projects.map((project) => {
      const date = new Date(project.updatedAt).toLocaleString('ar-PS', { dateStyle: 'medium', timeStyle: 'short' });
      const location = project.fields?.location || '—';
      return `<article class="project-item"><div><h3>${escapeHtml(project.name || project.fields?.projectName || 'مشروع')}</h3><p>${escapeHtml(location)} — ${escapeHtml(date)}</p></div><div class="project-item-actions"><button class="load-project" data-id="${escapeHtml(project.id)}" type="button">فتح</button><button class="delete-project" data-id="${escapeHtml(project.id)}" type="button">حذف</button></div></article>`;
    }).join('');
  }

  function deleteProject(id) {
    const projects = readProjects().filter((project) => project.id !== id);
    writeProjects(projects);
    if (currentProjectId === id) currentProjectId = null;
    renderProjectsList();
    showToast('تم حذف المشروع.');
  }

  function resetProject() {
    currentProjectId = null;
    formIds.forEach((id) => {
      const element = $(id);
      if (!element) return;
      if (element.type === 'checkbox') element.checked = true;
    });
    const defaults = {
      projectName:'منزل سكني', clientName:'', location:'فلسطين', systemType:'hybrid', currency:'₪', phase:'single', acVoltage:'230', psh:'5.5', losses:'20', inverterMargin:'25', autonomyDays:'1', dod:'80',
      panelSelection:'jinko-735', panelPower:'735', panelPrice:'650', panelVmp:'41.23', panelVoc:'49.52', panelImp:'17.83', panelIsc:'18.88', inverterSelection:'auto', customInverterName:'إنفرتر مخصص', inverterRatedW:'3600', inverterPeakW:'7200', maxPvPower:'5760', maxDcVoltage:'500', inverterEff:'97.6', inverterPrice:'5200', mpptMinV:'150', mpptMaxV:'425', mpptCurrentPattern:'13+13', mpptStringPattern:'1+1',
      batterySelection:'deye-se-g5-1-pro-b', batteryVoltage:'51.2', batteryAh:'100', bankVoltage:'51.2', batteryPrice:'5200', batteryType:'lithium', batteryEff:'95', pvCableLength:'20', batteryCableLength:'2', acCableLength:'15', dcDrop:'2', acDrop:'3', conductor:'copper',
      structureCost:'1800', electricalCost:'1600', installationCost:'2200', otherCost:'0'
    };
    Object.entries(defaults).forEach(([id, value]) => { if ($(id)) $(id).value = value; });
    syncPanelSelection('jinko-735');
    syncBatterySelection('deye-se-g5-1-pro-b');
    populateInverterOptions('auto');
    $('loadsBody').innerHTML = '';
    defaultLoads.forEach(createLoadRow);
    localStorage.removeItem(STORAGE_CURRENT);
    calculate();
    showToast('تم إنشاء مشروع جديد.');
  }

  function exportProject() {
    const state = serialize();
    state.name = $('projectName').value.trim() || 'مشروع';
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.name.replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'solar-project'}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('تم تصدير ملف المشروع.');
  }

  async function importProject(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const state = JSON.parse(text);
      if (!state.fields || !Array.isArray(state.loads)) throw new Error('invalid');
      currentProjectId = null;
      state.id = null;
      applyState(state);
      showToast('تم استيراد المشروع بنجاح.');
    } catch {
      showToast('الملف غير صالح أو غير متوافق.');
    } finally {
      $('importInput').value = '';
    }
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function bindEvents() {
    document.addEventListener('input', (event) => {
      if (event.target.closest('#loadsBody')) updateRowEnergy(event.target.closest('tr'));
      if ($('autoCalculate').checked || event.target.id === 'autoCalculate') calculate();
      else scheduleCurrentSave();
    });
    document.addEventListener('change', (event) => {
      if (event.target.id === 'importInput') return;
      if (event.target.id === 'phase') {
        $('acVoltage').value = event.target.value === 'three' ? '400' : '230';
        populateInverterOptions('auto');
        calculate();
        return;
      }
      if (event.target.id === 'panelSelection') {
        syncPanelSelection(event.target.value);
        calculate();
        return;
      }
      if (event.target.id === 'batterySelection') {
        syncBatterySelection(event.target.value);
        calculate();
        return;
      }
      if (event.target.id === 'inverterSelection') {
        const selected = event.target.value;
        if (selected === 'custom') syncInverterInputs(getCustomInverter(), true);
        else if (selected !== 'auto') syncInverterInputs(getCatalogModel(selected), false);
        calculate();
        return;
      }
      if ($('autoCalculate').checked || event.target.id === 'autoCalculate') calculate();
      else scheduleCurrentSave();
    });

    $('loadsBody').addEventListener('click', (event) => {
      const button = event.target.closest('.delete-row');
      if (!button) return;
      button.closest('tr').remove();
      calculate();
    });
    $('addLoadBtn').addEventListener('click', () => {
      const row = createLoadRow();
      row.querySelector('[data-field="name"]').focus();
      calculate();
    });
    $('calculateBtn').addEventListener('click', () => { calculate(); showToast('تم تحديث جميع الحسابات.'); });
    $('saveBtn').addEventListener('click', saveNamedProject);
    $('projectsBtn').addEventListener('click', () => { renderProjectsList(); $('projectsDialog').showModal(); });
    $('projectsList').addEventListener('click', (event) => {
      const loadButton = event.target.closest('.load-project');
      const deleteButton = event.target.closest('.delete-project');
      if (loadButton) {
        const project = readProjects().find((item) => item.id === loadButton.dataset.id);
        if (project) { applyState(project); $('projectsDialog').close(); showToast('تم فتح المشروع.'); }
      }
      if (deleteButton) deleteProject(deleteButton.dataset.id);
    });
    $('resetBtn').addEventListener('click', () => {
      if (window.confirm('سيتم مسح المشروع الحالي غير المحفوظ. هل تريد المتابعة؟')) resetProject();
    });
    $('printBtn').addEventListener('click', () => { calculate(); window.print(); });
    $('exportBtn').addEventListener('click', exportProject);
    $('importInput').addEventListener('change', (event) => importProject(event.target.files?.[0]));

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      installPrompt = event;
      $('installBtn').classList.remove('hidden');
    });
    $('installBtn').addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      $('installBtn').classList.add('hidden');
    });
    window.addEventListener('appinstalled', () => showToast('تم تثبيت الموقع كتطبيق.'));

    const sections = all('main section[id]');
    const navLinks = all('.nav-card a');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
      }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.2] });
      sections.forEach((section) => observer.observe(section));
    }
  }

  function init() {
    syncPanelSelection('jinko-735');
    syncBatterySelection('deye-se-g5-1-pro-b');
    populateInverterOptions('auto');
    bindEvents();
    let restored = false;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_CURRENT) || 'null');
      if (saved?.fields && Array.isArray(saved.loads)) { applyState(saved, { calculateAfter: false }); restored = true; }
    } catch { /* use defaults */ }
    if (!restored) defaultLoads.forEach(createLoadRow);
    calculate();

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
    }
  }

  init();
})();
