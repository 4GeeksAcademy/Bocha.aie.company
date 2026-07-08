(function () {
  'use strict';

  const USD_TO_COP_RATE = 4000;

  const sampleMenuItems = [
    {
      id: 'ITEM-PICANHA-250',
      name: 'Picanha 250g',
      category: 'Meat',
      basePrice: { USD: 18.5, COP: 74000 },
      ingredientCost: { USD: 7.2, COP: 28800 },
      prepTimeMinutes: 15,
      isAvailableInColombia: true,
      isAvailableInUSA: true,
      allergens: [],
      status: 'Active'
    },
    {
      id: 'ITEM-FRIES',
      name: 'Papas Fritas',
      category: 'Side',
      basePrice: { USD: 4.5, COP: 18000 },
      ingredientCost: { USD: 1.2, COP: 4800 },
      prepTimeMinutes: 8,
      isAvailableInColombia: true,
      isAvailableInUSA: true,
      allergens: [],
      status: 'Active'
    },
    {
      id: 'ITEM-COKE',
      name: 'Coca-Cola',
      category: 'Beverage',
      basePrice: { USD: 2.5, COP: 10000 },
      ingredientCost: { USD: 0.8, COP: 3200 },
      prepTimeMinutes: 2,
      isAvailableInColombia: true,
      isAvailableInUSA: true,
      allergens: [],
      status: 'Active'
    },
    {
      id: 'ITEM-CHURROS',
      name: 'Churros',
      category: 'Dessert',
      basePrice: { USD: 5.0, COP: 20000 },
      ingredientCost: { USD: 1.5, COP: 6000 },
      prepTimeMinutes: 10,
      isAvailableInColombia: true,
      isAvailableInUSA: false,
      allergens: ['gluten'],
      status: 'Seasonal'
    }
  ];

  const sampleLocations = [
    {
      id: 'LOC-MEDELLIN-01',
      name: 'Brasaland Medellin Centro',
      city: 'Medellin',
      country: 'Colombia',
      openingYear: 2008,
      seatingCapacity: 80,
      staffCount: 12,
      monthlyRentCost: { USD: 1500, COP: 6000000 },
      averageMonthlyUtilities: { USD: 400, COP: 1600000 },
      manager: 'Carlos Jimenez',
      status: 'Active'
    },
    {
      id: 'LOC-MIAMI-01',
      name: 'Brasaland Miami Beach',
      city: 'Miami',
      country: 'USA',
      openingYear: 2018,
      seatingCapacity: 100,
      staffCount: 15,
      monthlyRentCost: { USD: 5500, COP: 22000000 },
      averageMonthlyUtilities: { USD: 800, COP: 3200000 },
      manager: 'Jake Morrison',
      status: 'Active'
    },
    {
      id: 'LOC-BOGOTA-01',
      name: 'Brasaland Bogota Zona Rosa',
      city: 'Bogota',
      country: 'Colombia',
      openingYear: 2012,
      seatingCapacity: 60,
      staffCount: 10,
      monthlyRentCost: { USD: 1800, COP: 7200000 },
      averageMonthlyUtilities: { USD: 350, COP: 1400000 },
      manager: 'Andrea Morales',
      status: 'Temporarily closed'
    }
  ];

  const sampleSales = [
    {
      id: 'TXN-2024-15482',
      locationId: 'LOC-MEDELLIN-01',
      itemId: 'ITEM-PICANHA-250',
      quantity: 2,
      totalPrice: { USD: 37.0, COP: 148000 },
      paymentMethod: 'Credit card',
      timestamp: new Date('2024-03-15T19:30:00'),
      waiterName: 'Maria Gonzalez'
    },
    {
      id: 'TXN-2024-15483',
      locationId: 'LOC-MIAMI-01',
      itemId: 'ITEM-FRIES',
      quantity: 3,
      totalPrice: { USD: 13.5, COP: 54000 },
      paymentMethod: 'Cash',
      timestamp: new Date('2024-03-15T20:15:00'),
      waiterName: 'John Smith'
    },
    {
      id: 'TXN-2024-15484',
      locationId: 'LOC-MEDELLIN-01',
      itemId: 'ITEM-COKE',
      quantity: 4,
      totalPrice: { USD: 10.0, COP: 40000 },
      paymentMethod: 'Digital wallet',
      timestamp: new Date('2024-03-15T21:00:00'),
      waiterName: 'Maria Gonzalez'
    },
    {
      id: 'TXN-2024-15485',
      locationId: 'LOC-MIAMI-01',
      itemId: 'ITEM-PICANHA-250',
      quantity: 1,
      totalPrice: { USD: 18.5, COP: 74000 },
      paymentMethod: 'Debit card',
      timestamp: new Date('2024-03-16T13:00:00'),
      waiterName: 'Lisa Torres'
    }
  ];

  const sampleWasteRecords = [
    {
      id: 'WASTE-001',
      locationId: 'LOC-MEDELLIN-01',
      itemId: 'ITEM-PICANHA-250',
      quantity: 1,
      reason: 'Cooking error',
      cost: { USD: 7.2, COP: 28800 },
      timestamp: new Date('2024-03-15T18:00:00'),
      reportedBy: 'Carlos Rios'
    },
    {
      id: 'WASTE-002',
      locationId: 'LOC-MIAMI-01',
      itemId: 'ITEM-FRIES',
      quantity: 2,
      reason: 'Expired',
      cost: { USD: 2.4, COP: 9600 },
      timestamp: new Date('2024-03-16T08:00:00'),
      reportedBy: 'Linda Torres'
    }
  ];

  function filterSalesByLocation(sales, locationId) {
    return sales.filter((sale) => sale.locationId === locationId);
  }

  function filterSalesByDateRange(sales, startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return sales.filter((sale) => {
      const t = sale.timestamp.getTime();
      return t >= start && t <= end;
    });
  }

  function filterMenuItemsByCategory(items, category) {
    return items.filter((item) => item.category === category);
  }

  function sortLocationsByCapacity(locations, order) {
    return [...locations].sort((a, b) => order === 'asc' ? a.seatingCapacity - b.seatingCapacity : b.seatingCapacity - a.seatingCapacity);
  }

  function sortMenuItemsByPrice(items, currency, order) {
    return [...items].sort((a, b) => order === 'asc' ? a.basePrice[currency] - b.basePrice[currency] : b.basePrice[currency] - a.basePrice[currency]);
  }

  function findLocationById(locations, id) {
    for (const location of locations) {
      if (location.id === id) return location;
    }
    return null;
  }

  function findMenuItemByName(items, name) {
    const lowerName = name.toLowerCase();
    for (const item of items) {
      if (item.name.toLowerCase() === lowerName) return item;
    }
    return null;
  }

  function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const converted = fromCurrency === 'USD' ? amount * USD_TO_COP_RATE : amount / USD_TO_COP_RATE;
    return Math.round(converted * 100) / 100;
  }

  function calculateDailyRevenue(sales, date, currency) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    const total = sales
      .filter((sale) => {
        const t = sale.timestamp;
        return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
      })
      .reduce((sum, sale) => sum + sale.totalPrice[currency], 0);

    return Math.round(total * 100) / 100;
  }

  function calculateLocationMargin(sales, menuItems, locationId, currency) {
    const locationSales = filterSalesByLocation(sales, locationId);
    if (locationSales.length === 0) return 0;

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
    let totalRevenue = 0;
    let totalIngredientCost = 0;

    for (const sale of locationSales) {
      const item = menuItemMap.get(sale.itemId);
      totalRevenue += sale.totalPrice[currency];
      if (item) {
        totalIngredientCost += item.ingredientCost[currency] * sale.quantity;
      }
    }

    if (totalRevenue === 0) return 0;

    const margin = ((totalRevenue - totalIngredientCost) / totalRevenue) * 100;
    return Math.round(margin * 100) / 100;
  }

  function calculateWasteCost(wasteRecords, locationId, currency) {
    const total = wasteRecords
      .filter((record) => record.locationId === locationId)
      .reduce((sum, record) => sum + record.cost[currency], 0);
    return Math.round(total * 100) / 100;
  }

  function scoreLocationPerformance(location, sales, wasteRecords, menuItems) {
    const locationSales = filterSalesByLocation(sales, location.id);
    const totalRevenueUSD = locationSales.reduce((sum, sale) => sum + sale.totalPrice.USD, 0);

    const currentYear = new Date().getFullYear();
    const yearsOpen = Math.max(currentYear - location.openingYear, 1);
    const operativeDays = yearsOpen * 365;

    const dailyAvgUSD = totalRevenueUSD / operativeDays;
    const revenueScore = Math.min((dailyAvgUSD / 1000) * 40, 40);

    const efficiencyScore = Math.min((locationSales.length / location.seatingCapacity) * 30, 30);

    const wasteCostUSD = calculateWasteCost(wasteRecords, location.id, 'USD');
    const wastePercentage = totalRevenueUSD > 0 ? (wasteCostUSD / totalRevenueUSD) * 100 : 0;
    const wasteScore = Math.max(20 - wastePercentage * 2, 0);

    const margin = calculateLocationMargin(sales, menuItems, location.id, 'USD');
    const marginScore = Math.min(margin / 10, 10);

    return Math.round((revenueScore + efficiencyScore + wasteScore + marginScore) * 100) / 100;
  }

  function rankLocationsByPerformance(locations, sales, wasteRecords, menuItems) {
    return locations
      .map((location) => ({
        location,
        score: scoreLocationPerformance(location, sales, wasteRecords, menuItems)
      }))
      .sort((a, b) => b.score - a.score);
  }

  function countSalesByPaymentMethod(sales) {
    const result = {
      'Cash': 0,
      'Credit card': 0,
      'Debit card': 0,
      'Digital wallet': 0
    };

    for (const sale of sales) {
      result[sale.paymentMethod] += 1;
    }
    return result;
  }

  function calculateAverageTicket(sales, currency) {
    if (sales.length === 0) return 0;
    const total = sales.reduce((sum, sale) => sum + sale.totalPrice[currency], 0);
    return Math.round((total / sales.length) * 100) / 100;
  }

  function findTopSellingItems(sales, menuItems, topN) {
    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
    const soldMap = new Map();

    for (const sale of sales) {
      soldMap.set(sale.itemId, (soldMap.get(sale.itemId) || 0) + sale.quantity);
    }

    return Array.from(soldMap.entries())
      .map(([itemId, totalSold]) => {
        const item = menuItemMap.get(itemId);
        return item ? { item, totalSold } : null;
      })
      .filter((entry) => entry !== null)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, topN);
  }

  function calculateCountryComparison(sales, locations) {
    const countries = ['Colombia', 'USA'];
    const result = {};

    for (const country of countries) {
      const countryLocations = locations.filter((loc) => loc.country === country);
      const countryLocationIds = new Set(countryLocations.map((loc) => loc.id));
      const countrySales = sales.filter((sale) => countryLocationIds.has(sale.locationId));

      const totalRevenueUSD = countrySales.reduce((sum, sale) => sum + sale.totalPrice.USD, 0);
      const totalRevenueCOP = countrySales.reduce((sum, sale) => sum + sale.totalPrice.COP, 0);

      const locationCount = countryLocations.length;
      result[country] = {
        totalLocations: locationCount,
        totalRevenue: {
          USD: Math.round(totalRevenueUSD * 100) / 100,
          COP: Math.round(totalRevenueCOP * 100) / 100
        },
        averageRevenuePerLocation: {
          USD: Math.round((locationCount > 0 ? totalRevenueUSD / locationCount : 0) * 100) / 100,
          COP: Math.round((locationCount > 0 ? totalRevenueCOP / locationCount : 0) * 100) / 100
        },
        totalSales: countrySales.length
      };
    }

    return result;
  }

  function normalizeForJSON(data) {
    return JSON.parse(JSON.stringify(data, function (_, value) {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
  }

  function renderTable(rows) {
    const tableWrapper = document.getElementById('result-table-wrapper');

    if (!Array.isArray(rows) || rows.length === 0 || typeof rows[0] !== 'object') {
      tableWrapper.classList.add('hidden');
      tableWrapper.innerHTML = '';
      return;
    }

    const columns = Object.keys(rows[0]);
    const header = columns.map((column) => '<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-carbon-600 border-b border-carbon-200">' + column + '</th>').join('');

    const body = rows.map((row) => {
      const cells = columns.map((column) => {
        const value = row[column];
        const rendered = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return '<td class="px-3 py-2 text-sm text-carbon-700 border-b border-carbon-100 align-top">' + rendered + '</td>';
      }).join('');
      return '<tr>' + cells + '</tr>';
    }).join('');

    tableWrapper.innerHTML = '<table class="min-w-full bg-white"><thead><tr>' + header + '</tr></thead><tbody>' + body + '</tbody></table>';
    tableWrapper.classList.remove('hidden');
  }

  function showResult(title, subtitle, data, tableRows) {
    const titleEl = document.getElementById('result-title');
    const subtitleEl = document.getElementById('result-subtitle');
    const emptyEl = document.getElementById('result-empty');
    const jsonEl = document.getElementById('result-json');

    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    emptyEl.classList.add('hidden');

    jsonEl.textContent = JSON.stringify(normalizeForJSON(data), null, 2);
    jsonEl.classList.remove('hidden');

    renderTable(tableRows);
  }

  function setupLocationSelect() {
    const select = document.getElementById('filter-location');
    for (const location of sampleLocations) {
      const option = document.createElement('option');
      option.value = location.id;
      option.textContent = location.name + ' (' + location.id + ')';
      select.appendChild(option);
    }
  }

  function parseDateInput(id, fallback) {
    const value = document.getElementById(id).value;
    return value ? new Date(value + 'T00:00:00') : fallback;
  }

  function runFilter() {
    const locationId = document.getElementById('filter-location').value;
    const startDate = parseDateInput('filter-start', new Date('2024-01-01T00:00:00'));
    const endDate = parseDateInput('filter-end', new Date('2024-12-31T23:59:59'));

    let rows = sampleSales;
    if (locationId) {
      rows = filterSalesByLocation(rows, locationId);
    }
    rows = filterSalesByDateRange(rows, startDate, new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59));

    showResult(
      'Filtro de ventas',
      'Locacion: ' + (locationId || 'todas') + ' - Rango aplicado',
      rows,
      rows.map((sale) => ({
        id: sale.id,
        locationId: sale.locationId,
        itemId: sale.itemId,
        quantity: sale.quantity,
        paymentMethod: sale.paymentMethod,
        totalUSD: sale.totalPrice.USD,
        totalCOP: sale.totalPrice.COP,
        timestamp: sale.timestamp.toISOString()
      }))
    );
  }

  function runSearchItem() {
    const name = document.getElementById('search-item-name').value.trim();
    const result = name ? findMenuItemByName(sampleMenuItems, name) : null;
    showResult(
      'Busqueda de item',
      result ? 'Coincidencia exacta encontrada' : 'Sin coincidencias',
      result || { message: 'No se encontro el item solicitado.' },
      result ? [result] : []
    );
  }

  function runSearchLocation() {
    const id = document.getElementById('search-location-id').value.trim();
    const result = id ? findLocationById(sampleLocations, id) : null;
    showResult(
      'Busqueda de locacion',
      result ? 'Locacion encontrada' : 'Sin coincidencias',
      result || { message: 'No se encontro la locacion solicitada.' },
      result ? [result] : []
    );
  }

  function runSort() {
    const target = document.getElementById('sort-target').value;
    const order = document.getElementById('sort-order').value;
    const currency = document.getElementById('sort-currency').value;

    if (target === 'menu') {
      const sortedMenu = sortMenuItemsByPrice(sampleMenuItems, currency, order);
      showResult(
        'Ordenamiento de menu',
        'Moneda: ' + currency + ' - Orden: ' + order,
        sortedMenu,
        sortedMenu.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.basePrice[currency],
          currency: currency,
          status: item.status
        }))
      );
      return;
    }

    const sortedLocations = sortLocationsByCapacity(sampleLocations, order);
    showResult(
      'Ordenamiento de locaciones',
      'Orden: ' + order,
      sortedLocations,
      sortedLocations.map((location) => ({
        id: location.id,
        name: location.name,
        city: location.city,
        country: location.country,
        seatingCapacity: location.seatingCapacity,
        status: location.status
      }))
    );
  }

  function runReportPayments() {
    const report = countSalesByPaymentMethod(sampleSales);
    showResult('Reporte por metodo de pago', 'Conteo de transacciones', report, Object.keys(report).map((key) => ({ method: key, total: report[key] })));
  }

  function runReportTicket() {
    const report = {
      averageTicketUSD: calculateAverageTicket(sampleSales, 'USD'),
      averageTicketCOP: calculateAverageTicket(sampleSales, 'COP'),
      conversionSample100USDToCOP: convertCurrency(100, 'USD', 'COP')
    };

    showResult('Reporte de ticket promedio', 'Promedios en dos monedas', report, [report]);
  }

  function runReportTop() {
    const topItems = findTopSellingItems(sampleSales, sampleMenuItems, 3).map((entry) => ({
      itemId: entry.item.id,
      itemName: entry.item.name,
      category: entry.item.category,
      totalSold: entry.totalSold
    }));

    showResult('Top items mas vendidos', 'Top 3 por cantidad vendida', topItems, topItems);
  }

  function runReportCountry() {
    const report = calculateCountryComparison(sampleSales, sampleLocations);
    const ranking = rankLocationsByPerformance(sampleLocations, sampleSales, sampleWasteRecords, sampleMenuItems).map((entry) => ({
      location: entry.location.name,
      score: entry.score,
      marginUSD: calculateLocationMargin(sampleSales, sampleMenuItems, entry.location.id, 'USD'),
      wasteUSD: calculateWasteCost(sampleWasteRecords, entry.location.id, 'USD'),
      dailyRevenueSampleUSD: calculateDailyRevenue(sampleSales, new Date('2024-03-15T12:00:00'), 'USD')
    }));

    showResult('Comparativa por pais + ranking', 'Resumen financiero y operativo', { byCountry: report, ranking: ranking }, ranking);
  }

  function bindEvents() {
    document.getElementById('run-filter').addEventListener('click', runFilter);
    document.getElementById('run-search-item').addEventListener('click', runSearchItem);
    document.getElementById('run-search-location').addEventListener('click', runSearchLocation);
    document.getElementById('run-sort').addEventListener('click', runSort);
    document.getElementById('run-report-payments').addEventListener('click', runReportPayments);
    document.getElementById('run-report-ticket').addEventListener('click', runReportTicket);
    document.getElementById('run-report-top').addEventListener('click', runReportTop);
    document.getElementById('run-report-country').addEventListener('click', runReportCountry);
  }

  function init() {
    setupLocationSelect();
    bindEvents();
    showResult(
      'Resultados',
      'Pruebas manuales listas para ejecutar',
      {
        menuItems: sampleMenuItems.length,
        locations: sampleLocations.length,
        sales: sampleSales.length,
        wasteRecords: sampleWasteRecords.length
      },
      [
        { metric: 'menuItems', value: sampleMenuItems.length },
        { metric: 'locations', value: sampleLocations.length },
        { metric: 'sales', value: sampleSales.length },
        { metric: 'wasteRecords', value: sampleWasteRecords.length }
      ]
    );
  }

  init();
})();
