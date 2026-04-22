import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { PHONE_COUNTRIES } from "@/app/utils/phoneValidation.js";

export function CountryPicker({
  value,
  onChange,
  className = "w-full",
  placeholder = "Select country",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  const selectedCountry =
    PHONE_COUNTRIES.find((country) => country.code === value) || null;

  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return PHONE_COUNTRIES;
    }

    return PHONE_COUNTRIES.filter((country) => {
      const haystack = [country.label, country.shortLabel, country.code]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="w-full min-h-[52px] px-4 border border-gray-300 rounded-xl bg-white flex items-center justify-between gap-3 transition-all duration-200 hover:border-gray-400 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
      >
        <span className="flex items-center gap-3 min-w-0">
          {selectedCountry ? (
            <>
              <span className="text-xl leading-none" aria-hidden="true">
                {selectedCountry.flag}
              </span>
              <span className="text-sm font-medium text-gray-700 truncate">
                {selectedCountry.label}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country.code);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-blue-50 transition-colors ${
                    country.code === value ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    {country.flag}
                  </span>
                  <span className="block min-w-0">
                    <span className="block text-sm text-gray-900 truncate">
                      {country.label}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {country.shortLabel}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-gray-500">No countries found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
