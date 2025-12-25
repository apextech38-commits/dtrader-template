import React from 'react';
import PropTypes from 'prop-types';
import { Skeleton } from '@deriv/components';

const AccountsInfoLoader = ({ is_logged_in }) => (is_logged_in ? <LoggedInPreloader /> : <LoggedOutPreloader />);

const LoggedOutPreloader = () => (
    <React.Fragment>
        <div />
        <Skeleton height={40} width={80} />
    </React.Fragment>
);

const LoggedInPreloader = () => (
    <React.Fragment>
        <Skeleton height={40} width={140} />
        <Skeleton height={40} width={80} />
    </React.Fragment>
);

AccountsInfoLoader.propTypes = {
    is_logged_in: PropTypes.bool,
};

export { AccountsInfoLoader };
