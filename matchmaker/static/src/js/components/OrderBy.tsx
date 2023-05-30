import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'

export type SortState = 'ascending' | 'descending';

interface OrderByProps {
    sortState: [SortState, React.Dispatch<React.SetStateAction<SortState>>];
    onSortChange: () => void;
}

const OrderBy: React.FC<OrderByProps> = ({ sortState, onSortChange }) => {
    const [externalSort, setExternalSort] = sortState;
    const [internalSort, setInternalSort] = useState<'initial' | SortState>('initial');

    useEffect(() => {
        if (internalSort !== 'initial') {
            setExternalSort(internalSort);
        }
    }, [internalSort]);

    const handleClick = () => {
        switch (internalSort) {
            case 'initial':
                setInternalSort('descending');
                break;
            case 'ascending':
                setInternalSort('descending');
                break;
            case 'descending':
                setInternalSort('ascending');
                break;
        }
        onSortChange();
    };

    return (
        <button onClick={handleClick}>
            <div className='flex'>
                <div className="mr-5">
                    {externalSort === 'ascending' ? <h3 className="dark:text-gray-200">Best matches first</h3> : <h3 className="dark:text-gray-200">Worst matches first</h3>}
                </div>
                {internalSort === 'initial' && <FontAwesomeIcon icon={faSort} className="dark:text-gray-200" />}
                {internalSort === 'ascending' && <FontAwesomeIcon icon={faSortUp} className="dark:text-gray-200" />}
                {internalSort === 'descending' && <FontAwesomeIcon icon={faSortDown} className="dark:text-gray-200" />}
            </div>
        </button>
    )
}

export default OrderBy;
