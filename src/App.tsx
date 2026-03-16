import React from 'react';

type Category = 'All' | 'Beach' | 'Food' | 'Shopping' | 'Landmark';
type Tab = 'places' | 'beaches' | 'restaurants' | 'shops' | 'passport' | 'concierge' | 'transit' | 'essentials';

type Business = {
  id: string;
  name: string;
  category: Exclude<Category, 'All'>;
  featured?: boolean;
  rating: number;
  location: string;
  image: string;
  description: string;
};

const businesses: Business[] = [
  { id: 'stt-magens', name: 'Magens Bay', category: 'Beach', featured: true, rating: 4.8, location: 'Magens Bay Rd', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', description: 'Voted among the world\'s best beaches with calm turquoise water.' },
  { id: 'stt-lindquist', name: 'Lindquist Beach', category: 'Beach', featured: true, rating: 4.9, location: 'Smith Bay Park', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', description: 'Pristine white sand, crystal-clear water, and postcard views.' },
  { id: 'stt-gladys', name: "Gladys' Cafe", category: 'Food', featured: true, rating: 4.9, location: 'Royal Dane Mall', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', description: 'Authentic Caribbean flavor and island comfort dishes.' },
  { id: 'stt-greengos', name: 'Greengos Cantina', category: 'Food', rating: 4.7, location: 'Hibiscus Alley', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80', description: 'Town favorite for tacos, margaritas, and casual nightlife.' },
  { id: 'stt-ahr', name: 'AH Riise Mall', category: 'Shopping', featured: true, rating: 4.7, location: 'Main Street', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', description: 'Duty-free shopping for jewelry, spirits, and gifts.' },
  { id: 'stt-fort', name: 'Fort Christian', category: 'Landmark', rating: 4.6, location: 'Waterfront', image: 'https://images.unsplash.com/photo-1534531173927-aeb928d54385?auto=format&fit=crop&w=1200&q=80', description: 'Historic Danish fort and one of St. Thomas\' oldest landmarks.' }
];

const tabToCategory: Record<Tab, Category> = {
  places: 'All', beaches: 'Beach', restaurants: 'Food', shops: 'Shopping',
  passport: 'All', concierge: 'All', transit: 'All', essentials: 'All'
};

export default function App() {
  const [activeTab, setActiveTab] = React.useState<Tab>('places');
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<Business | null>(null);

  const filtered = React.useMemo(() => {
    const cat = tabToCategory[activeTab];
    return businesses
      .filter((b) => (cat === 'All' ? true : b.category === cat))
      .filter((b) => `${b.name} ${b.category} ${b.location}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [activeTab, search]);

  const utilityTab = ['passport', 'concierge', 'transit', 'essentials'].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-gradient-to-br from-sky-800 via-sky-600 to-sky-400 text-white">
        <div className="sticky top-0 z-40 border-b border-white/20 bg-white/10 backdrop-blur-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase">Admin</span>
            <h1 className="text-sm font-black uppercase tracking-wide sm:text-xl">STT Insider Pro</h1>
            <button className="text-[10px] font-bold uppercase">Support</button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 text-center sm:px-6 md:pt-12">
          <span className="inline-block rounded-full border border-white/20 bg-sky-400/30 px-3 py-1 text-[10px] font-black uppercase">The definitive St. Thomas guide</span>
          <h2 className="mt-4 text-4xl font-black leading-none tracking-tight sm:text-6xl">Island <br />Discovery.</h2>

          <div className="mx-auto mt-8 max-w-5xl rounded-3xl border border-white/20 bg-white p-2 text-slate-800 shadow-2xl">
            <div className="flex flex-col gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dining, beaches, shops..."
                className="w-full rounded-2xl bg-slate-100 px-4 py-4 text-sm font-semibold outline-none"
              />
              <div className="no-scrollbar flex overflow-x-auto rounded-2xl bg-slate-100 p-1.5 text-[10px] font-black uppercase">
                {[
                  ['places', 'Home'], ['concierge', 'Concierge'], ['transit', 'Transit'], ['beaches', 'Beaches'],
                  ['restaurants', 'Dining'], ['shops', 'Shops'], ['passport', 'Passport']
                ].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as Tab)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 transition ${activeTab === id ? 'bg-white text-sky-700 shadow' : 'text-slate-500'}`}
                  >{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 pb-24 sm:p-6">
        {utilityTab ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <h3 className="text-2xl font-black">{activeTab.toUpperCase()}</h3>
            <p className="mt-2 text-sm text-slate-500">This utility module is ready for your app integrations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <img src={item.image} alt={item.name} className="h-52 w-full object-cover" />
                <div className="space-y-3 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-extrabold text-slate-900">{item.name}</h3>
                    <span className="text-sm font-bold text-amber-500">★ {item.rating}</span>
                  </div>
                  <p className="text-sm text-slate-500">{item.description}</p>
                  <button onClick={() => setSelected(item)} className="w-full rounded-2xl bg-sky-600 py-3 text-[10px] font-black uppercase text-white">Details & booking</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white">
            <img src={selected.image} alt={selected.name} className="h-64 w-full object-cover" />
            <div className="space-y-4 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h4 className="text-3xl font-black">{selected.name}</h4>
                <button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">Close</button>
              </div>
              <p className="text-sm text-slate-500">{selected.description}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.location)}`} target="_blank" rel="noreferrer" className="rounded-2xl border-2 border-sky-600 py-3 text-center text-[10px] font-black uppercase text-sky-600">Directions</a>
                <button className="rounded-2xl bg-amber-400 py-3 text-[10px] font-black uppercase text-sky-900">Authenticate stamp</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-3xl text-white shadow-xl sm:bottom-8 sm:right-8 sm:h-16 sm:w-16">+</button>
    </div>
  );
}
