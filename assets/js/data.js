/* Captured by Katherine — one source of truth for prices (AUD), packages and settings.
   Edit this file to update every price, tool and form on the site at once. */
window.CBK = {
  contact: {
    name: 'Katherine Christensen',
    email: 'katherine@capturedbykatherine.com.au',
    phone: '0416 344 067',
    phoneIntl: '+61416344067'
  },

  // Optional: a form endpoint (e.g. Formspree, Basin, or your own) that accepts JSON POSTs.
  // Leave empty and enquiries open a pre-written email to Katherine instead.
  formEndpoint: '',

  // Dates already booked (YYYY-MM-DD). The date checker shows these as taken.
  bookedDates: [],

  currency: 'AUD',        // all prices are in Australian dollars
  deposit: 330,
  extraHourRate: 330,
  maxExtraHours: 2,
  bookAheadMonths: '9–12',

  // Brisbane — used for sunrise / sunset and golden-hour times (AEST, no daylight saving)
  location: { lat: -27.4698, lng: 153.0251, utcOffset: 10, label: 'Brisbane (AEST)' },

  weddings: [
    { id: 'intimate', name: 'The Intimate', hours: 2, price: 950,
      tag: 'Elopements, registry weddings or small weekday celebrations.',
      blurb: 'Ideal for a ceremony and portraits, with a few cherished moments in between.' },
    { id: 'essentials', name: 'The Essentials', hours: 4, price: 1850,
      tag: 'Perfect for daytime affairs or intimate gatherings.',
      blurb: 'Ceremony through to couple portraits and candid family moments.' },
    { id: 'storyteller', name: 'The Storyteller', hours: 8, price: 3100,
      tag: 'Capturing prep through to early reception highlights.',
      blurb: 'Morning preparations to your first dance: the full experience.' },
    { id: 'signature', name: 'The Signature', hours: 10, price: 3700,
      tag: 'Capturing all the essential moments of the day.',
      blurb: 'Morning preparations to your departure, so you don’t miss a single moment.' }
  ],

  lifestyle: {
    family1: { name: 'Family Session 1', price: 550, hours: 1, note: 'One family unit, up to 7 people' },
    family2: { name: 'Family Session 2', price: 750, hours: 1.5, note: 'Extended families or a small group of families' },
    preSemi: { name: 'Pre-Semi Formal', price: 750, hours: 2, note: 'Flat fee, one location' },
    preFormal: { name: 'Pre-Formal', price: 750, hours: 2, includedCouples: 10, extraCouple: 75, note: 'Covers up to 10 couples' }
  }
};
