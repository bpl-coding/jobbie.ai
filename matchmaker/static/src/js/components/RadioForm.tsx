import React from 'react';
import RadioListItem from './RadioListItem';

function RadioForm({ options, value, onChange }) {
    const handleChange = (e) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    return (
        <>

            <ul className="items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {options.map((option) => (
                    <RadioListItem
                        key={option.id}
                        id={option.id}
                        value={option.value}
                        selectedValue={value}
                        onChange={handleChange}
                        label={option.label}
                    />
                ))}
            </ul>
        </>
    );
}

export default RadioForm;
