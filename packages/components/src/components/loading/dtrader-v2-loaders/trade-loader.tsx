import React from 'react';
import { Skeleton } from '../../skeleton';

const TradeLoader = () => {
    return (
        <div className='loading-dtrader-v2__trade' data-testid='dt_trade_loader'>
            <div className='skeleton-box__trade-types'>
                {[...new Array(6)].map((_, idx) => (
                    <Skeleton key={idx} width={88} height={32} />
                ))}
            </div>
            <div className='skeleton-box__market'>
                <Skeleton height={42} />
            </div>
            <div className='skeleton-box__chart'>
                <Skeleton />
            </div>
            <div className='skeleton-box__trade-params'>
                <Skeleton height={164} />
                <Skeleton height={56} />
            </div>
        </div>
    );
};

export default TradeLoader;
