import { BusinessTable } from "@/components/business/business-table";
import { getAllBusinesses, setPipelineStage } from "@/lib/firebase/usvi-businesses";
import { BUSINESS_CATEGORIES, ISLANDS, PIPELINE_STAGES, type BusinessRecord } from "@/types/business";

type SearchParams = {
  q?: string;
  island?: string;
  category?: string;
  stage?: string;
};

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const allBusinesses = await getAllBusinesses();
  const businesses = filterBusinesses(allBusinesses, params);

  return (
    <main className="space-y-6 p-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">Business Explorer</h1>
        <p className="mt-1 text-sm text-slate-600">Search and qualify high-opportunity USVI accounts.</p>
      </section>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search business, city, notes..."
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <select name="island" defaultValue={params.island ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All islands</option>
          {ISLANDS.map((island) => (
            <option key={island} value={island}>
              {island.replace("_", " ")}
            </option>
          ))}
        </select>

        <select name="category" defaultValue={params.category ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All categories</option>
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category.replace("_", " ")}
            </option>
          ))}
        </select>

        <select name="stage" defaultValue={params.stage ?? "all"} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All stages</option>
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage.replace("_", " ")}
            </option>
          ))}
        </select>

        <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white md:col-span-4">
          Apply Filters
        </button>
      </form>

      <BusinessTable businesses={businesses} onMoveToQualified={(id) => setPipelineStage(id, "qualified")} />
    </main>
  );
}

function filterBusinesses(businesses: BusinessRecord[], params: SearchParams): BusinessRecord[] {
  const search = params.q?.trim().toLowerCase();

  return businesses.filter((business) => {
    if (params.island && params.island !== "all" && business.island !== params.island) return false;
    if (params.category && params.category !== "all" && business.category !== params.category) return false;
    if (params.stage && params.stage !== "all" && business.pipelineStage !== params.stage) return false;

    if (!search) return true;

    const haystack = [
      business.name,
      business.legalName,
      business.description,
      business.address?.city,
      business.address?.neighborhood,
      business.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}
