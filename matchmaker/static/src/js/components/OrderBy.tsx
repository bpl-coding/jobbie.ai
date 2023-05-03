import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'

export type SortState = 'ascending' | 'descending';

interface OrderByProps {
    sortState: [SortState, React.Dispatch<React.SetStateAction<SortState>>];
}

const OrderBy: React.FC<OrderByProps> = ({ sortState }) => {
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
                setInternalSort('ascending');
                break;
            case 'ascending':
                setInternalSort('descending');
                break;
            case 'descending':
                setInternalSort('ascending');
                break;
        }
    };

    return (
        <button onClick={handleClick}>
            {internalSort === 'initial' && <FontAwesomeIcon icon={faSort} />}
            {internalSort === 'ascending' && <FontAwesomeIcon icon={faSortUp} />}
            {internalSort === 'descending' && <FontAwesomeIcon icon={faSortDown} />}
        </button>
    )
}

export default OrderBy;
