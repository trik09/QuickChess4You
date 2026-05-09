import PropTypes from 'prop-types';
import { FaFilter, FaSearch } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import styles from './SearchableFilterSelect.module.css';

function SearchableFilterSelect({ value, onChange, options, label, icon: Icon, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Filter options based on search term (case-insensitive)
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Find the selected option label
    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : '';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) {
            setSearchTerm('');
        }
    };

    return (
        <div className={`${styles.filterSelect} ${className}`} ref={containerRef}>
            {Icon && <Icon className={styles.filterIcon} />}
            <div
                className={styles.select}
                onClick={handleToggle}
                aria-label={label}
                role="button"
                tabIndex={0}
            >
                {displayValue || 'Select...'}
            </div>
            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.searchContainer}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className={styles.optionsList}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className={styles.noResults}>No matching categories</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

SearchableFilterSelect.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ).isRequired,
    label: PropTypes.string,
    icon: PropTypes.elementType,
    className: PropTypes.string,
};

export default SearchableFilterSelect;