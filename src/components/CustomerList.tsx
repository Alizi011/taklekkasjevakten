import { useState, useEffect } from "react";
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Search,
  UserPlus,
  Eye,
} from "lucide-react";
import { apiUrl } from "../lib/api";
import CustomerProfilePage from "../pages/CustomerProfilePage";
export interface Customer {
  id?: number;
  core_id?: number;
  source_customer_id?: number | null;
  customer_number?: string | null;
  organization_number?: string | null;
  name: string;
  customer_type: "Privatperson" | "B2B" | "Borettslag/Sameie";
  email: string;
  phone: string;
  address: string;
  city: string;
}

export type CustomerView =
  | "all"
  | "private"
  | "business"
  | "housing"
  | "properties";

interface CustomerListProps {
  activeView?: CustomerView;
  onViewAsCustomer?: (customer: Customer) => void;
}

type CoreCustomer = {
  id: number;
  source_customer_id?: number | string | null;
  customer_number?: string | null;
  customer_type?: string | null;
  name?: string | null;
  organization_number?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
};

type CoreProperty = {
  id: number;
  customer_id?: number | null;
  customer_name?: string | null;
  name?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  status?: string | null;
};

const coreTypeToUiType = (
  value?: string | null
): Customer["customer_type"] => {
  switch (String(value || "").toLowerCase()) {
    case "business":
      return "B2B";
    case "housing_association":
    case "condominium":
      return "Borettslag/Sameie";
    case "private":
    default:
      return "Privatperson";
  }
};

const uiTypeToCoreType = (
  value: Customer["customer_type"]
): "private" | "business" | "housing_association" => {
  if (value === "B2B") return "business";
  if (value === "Borettslag/Sameie") return "housing_association";
  return "private";
};

export default function CustomerList({
  activeView = "all",
  onViewAsCustomer,
}: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoreCustomerId, setSelectedCoreCustomerId] = useState<number | null>(null);
  const [properties, setProperties] = useState<CoreProperty[]>([]);
  const [propertyLoading, setPropertyLoading] = useState(false);
  const [propertyError, setPropertyError] = useState("");

  const [newCustomer, setNewCustomer] = useState<Customer>({
    name: "",
    customer_type: "Privatperson",
    email: "",
    phone: "",
    address: "",
    city: "Oslo",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (activeView === "properties") {
      fetchProperties();
    }
  }, [activeView]);

  const fetchCustomers = async () => {
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/core/customers.php?status=all"));
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke hente kunder fra perun_core.");
      }

      const rows: CoreCustomer[] = Array.isArray(data.customers)
        ? data.customers
        : [];

      const mapped: Customer[] = rows.map((customer) => {
        const sourceId = customer.source_customer_id
          ? Number(customer.source_customer_id)
          : null;

        return {
          // Behold gammel Taklekkasjevakten-ID som id når den finnes,
          // slik at dagens "Vis som kunde"-flyt fortsatt fungerer.
          id: sourceId || undefined,
          core_id: Number(customer.id),
          source_customer_id: sourceId,
          customer_number: customer.customer_number || null,
          organization_number: customer.organization_number || null,
          name: String(customer.name || ""),
          customer_type: coreTypeToUiType(customer.customer_type),
          email: String(customer.email || ""),
          phone: String(customer.phone || ""),
          address: String(customer.address || ""),
          city: String(customer.city || ""),
        };
      });

      setCustomers(mapped);
    } catch (err) {
      console.error("Feil ved henting av kunder:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    setPropertyLoading(true);
    setPropertyError("");

    try {
      const res = await fetch(apiUrl("/core/properties.php"));
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Kunne ikke hente eiendommer fra perun_core."
        );
      }

      setProperties(
        Array.isArray(data.properties) ? data.properties : []
      );
    } catch (err) {
      setPropertyError(
        err instanceof Error
          ? err.message
          : "Kunne ikke hente eiendommer."
      );
      setProperties([]);
    } finally {
      setPropertyLoading(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(apiUrl("/core/customers.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_system: "taklekkasjevakten",
          customer_type: uiTypeToCoreType(newCustomer.customer_type),
          name: newCustomer.name,
          email: newCustomer.email || null,
          phone: newCustomer.phone || null,
          address: newCustomer.address || null,
          city: newCustomer.city || null,
          country: "Norge",
          language: "nb",
          currency: "NOK",
          status: "active",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke registrere kunden.");
      }

      if (data.success) {
        alert("Kunde registrert i felles kunderegister!");

        setNewCustomer({
          name: "",
          customer_type: "Privatperson",
          email: "",
          phone: "",
          address: "",
          city: "Oslo",
        });

        fetchCustomers();
      }
    } catch (err) {
      console.error("Feil ved lagring av kunde:", err);
    }
  };

  const handleViewAsCustomer = (customer: Customer) => {
    if (!customer.source_customer_id && !customer.id) {
      alert(
        "Denne kunden finnes i felles kunderegister, men har foreløpig ingen Taklekkasjevakten-ID eller sak å åpne."
      );
      return;
    }

    if (!onViewAsCustomer) {
      alert(
        "Knappen er lagt inn, men CustomerList må kobles til kundevisningen i foreldrekoden."
      );
      return;
    }

    onViewAsCustomer({
      ...customer,
      id: customer.source_customer_id || customer.id,
    });
  };

  const customerTypeMatchesView = (customer: Customer) => {
    if (activeView === "all") return true;
    if (activeView === "private") {
      return customer.customer_type === "Privatperson";
    }
    if (activeView === "business") {
      return customer.customer_type === "B2B";
    }
    if (activeView === "housing") {
      return customer.customer_type === "Borettslag/Sameie";
    }
    return false;
  };

  const filteredCustomers = customers.filter((c) => {
    if (!customerTypeMatchesView(c)) return false;

    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return (
      c.name.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query) ||
      c.phone?.includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query) ||
      c.organization_number?.includes(query)
    );
  });

  const filteredProperties = properties.filter((property) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return [
      property.name,
      property.address,
      property.postal_code,
      property.city,
      property.customer_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const viewTitle =
    activeView === "private"
      ? "Privatkunder"
      : activeView === "business"
        ? "Bedrifter"
        : activeView === "housing"
          ? "Borettslag / sameier"
          : "Alle kunder";

  const viewDescription =
    activeView === "private"
      ? "Kunder registrert som privatpersoner."
      : activeView === "business"
        ? "Virksomheter og næringskunder."
        : activeView === "housing"
          ? "Borettslag, sameier og boligsameier."
          : "Alle kunder i felles kunderegister.";

  if (selectedCoreCustomerId !== null) {
    return (
      <CustomerProfilePage
        customerId={selectedCoreCustomerId}
        onBack={() => setSelectedCoreCustomerId(null)}
      />
    );
  }

  if (activeView === "properties") {
    return (
      <div className="space-y-6">
        <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#F5B800]" />
                Eiendommer ({properties.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Eiendommer koblet til kunder i perun_core.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Søk adresse, kunde eller sted..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 pl-9"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {propertyError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-xs text-red-300">
              {propertyError}
            </div>
          )}

          {propertyLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" />
              Henter eiendommer...
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Ingen eiendommer funnet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                >
                  <div className="border-b border-slate-900 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <h5 className="font-extrabold text-xs text-white">
                        {property.name || property.address || `Eiendom #${property.id}`}
                      </h5>
                      <span className="text-[8px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">
                        #{property.id}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-1.5">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                      <span>
                        {[property.address, property.postal_code, property.city]
                          .filter(Boolean)
                          .join(", ") || "Adresse mangler"}
                      </span>
                    </p>

                    {property.customer_name && (
                      <p className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        {property.customer_name}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={() => {
                        if (property.customer_id) {
                          setSelectedCoreCustomerId(
                            Number(property.customer_id)
                          );
                        }
                      }}
                      disabled={!property.customer_id}
                      className="w-full px-3 py-2 rounded-lg text-[10px] font-extrabold transition-colors bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/15 disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      <Building className="w-3.5 h-3.5" />
                      Åpne kundeprofil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skjema for å registrere ny kunde */}
      <form
        onSubmit={handleSaveCustomer}
        className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <UserPlus className="w-5 h-5 text-[#F5B800]" />

          <div>
            <h3 className="font-extrabold text-base text-white">
              Registrer Ny Kunde
            </h3>

            <p className="text-xs text-slate-400 mt-0.5">
              Registrer privatkunde, bedrift eller borettslag/sameie.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Navn / Firma *"
            value={newCustomer.name}
            onChange={(e) =>
              setNewCustomer({
                ...newCustomer,
                name: e.target.value,
              })
            }
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            required
          />

          <select
            value={newCustomer.customer_type}
            onChange={(e) =>
              setNewCustomer({
                ...newCustomer,
                customer_type: e.target.value as Customer["customer_type"],
              })
            }
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white cursor-pointer"
          >
            <option value="Privatperson">Privatperson</option>
            <option value="B2B">B2B / Næring</option>
            <option value="Borettslag/Sameie">Borettslag / Sameie</option>
          </select>

          <input
            type="text"
            placeholder="Telefon *"
            value={newCustomer.phone}
            onChange={(e) =>
              setNewCustomer({
                ...newCustomer,
                phone: e.target.value,
              })
            }
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
            required
          />

          <input
            type="email"
            placeholder="E-post"
            value={newCustomer.email}
            onChange={(e) =>
              setNewCustomer({
                ...newCustomer,
                email: e.target.value,
              })
            }
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
          />

          <input
            type="text"
            placeholder="Gateadresse"
            value={newCustomer.address}
            onChange={(e) =>
              setNewCustomer({
                ...newCustomer,
                address: e.target.value,
              })
            }
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
          />

          <input
            type="text"
            placeholder="Poststed / By"
            value={newCustomer.city}
            onChange={(e) =>
              setNewCustomer({
                ...newCustomer,
                city: e.target.value,
              })
            }
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#F5B800] hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Lagre Kunde
          </button>
        </div>
      </form>

      {/* Kundeliste */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-[#F5B800]" />
              {viewTitle} ({filteredCustomers.length})
            </h3>

            <p className="text-xs text-slate-400 mt-0.5">
              {viewDescription}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Søk på navn, by eller telefon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 pl-9"
            />

            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#F5B800]" />
            Henter kundeliste...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Ingen kunder funnet i registeret.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <h5 className="font-extrabold text-xs text-white truncate max-w-[180px]">
                    {c.name}
                  </h5>

                  <div className="flex items-center gap-1.5">
                    {c.core_id && (
                      <span className="text-[8px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">
                        Core #{c.core_id}
                      </span>
                    )}
                    <span className="text-[9px] bg-slate-900 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                      {c.customer_type || "Privatperson"}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1.5 font-mono">
                  <p className="flex items-center gap-2 text-amber-400">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    {c.phone}
                  </p>

                  {c.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      {c.email}
                    </p>
                  )}

                  {c.address && (
                    <p className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      {c.address}, {c.city}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (c.core_id) {
                        setSelectedCoreCustomerId(c.core_id);
                      }
                    }}
                    disabled={!c.core_id}
                    className="w-full px-3 py-2 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/15 disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Building className="w-3.5 h-3.5" />
                    Intern profil
                  </button>

                  <button
                    type="button"
                    onClick={() => handleViewAsCustomer(c)}
                    className="w-full px-3 py-2 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors bg-slate-900 text-slate-300 border border-slate-700 hover:border-amber-500/50 hover:text-amber-400 flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Vis som kunde
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}