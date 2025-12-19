import React from 'react';

import { DerivProductBrandLightDerivTraderLogoIcon } from '@deriv/quill-icons';
import { observer } from '@deriv/stores';

import { useMobileBridge } from 'App/Hooks/useMobileBridge';

const BrandShortLogo = observer(() => {
    const { isBridgeAvailable } = useMobileBridge();

    // Hide logo when coming from Flutter mobile app
    if (isBridgeAvailable) {
        return null;
    }

    return (
        <div className='header__menu-left-logo'>
            <div data-testid='brand-logo'>
                <DerivProductBrandLightDerivTraderLogoIcon width={32} height={32} />
            </div>
        </div>
    );
});

export default BrandShortLogo;
