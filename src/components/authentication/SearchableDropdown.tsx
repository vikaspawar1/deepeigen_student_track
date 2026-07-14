import { useState, useEffect, useRef } from "react";
import countriesData from "../../utils/countries.json";

interface SearchableDropdownProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
    required?: boolean;
    className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    value,
    onChange,
    placeholder = "Search or select your country",
    id = "country",
    required = false,
    className = "",
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredCountries, setFilteredCountries] = useState(countriesData);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync searchTerm with initial value if provided
    useEffect(() => {
        if (value && !isDropdownOpen) {
            setSearchTerm(value);
        }
    }, [value, isDropdownOpen]);

    // Filter countries based on search term
    useEffect(() => {
        const filtered = countriesData.filter((country) =>
            country.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCountries(filtered);
    }, [searchTerm]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCountrySelect = (countryName: string) => {
        onChange(countryName);
        setSearchTerm(countryName);
        setIsDropdownOpen(false);
    };

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <div className="dropdown-input-wrapper">
                <input
                    id={id}
                    type="text"
                    placeholder={placeholder}
                    value={isDropdownOpen ? searchTerm : value || searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isDropdownOpen) setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    autoComplete="off"
                    className={className}
                    required={required}
                />
                <i className={isDropdownOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}></i>
            </div>

            {isDropdownOpen && (
                <div className="dropdown-menu">
                    {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                            <div
                                key={country.value}
                                className="dropdown-option"
                                onClick={() => handleCountrySelect(country.value)}
                            >
                                {country.label}
                            </div>
                        ))
                    ) : (
                        <div className="dropdown-no-results">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
