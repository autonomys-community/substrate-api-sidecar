// Copyright 2017-2025 Parity Technologies (UK) Ltd.
// This file is part of Substrate API Sidecar.
//
// Substrate API Sidecar is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { ControllerConfig } from '../types/chains-config';
import { initLRUCache, QueryFeeDetailsCache } from './cache';

/**
 * Asset Hub Polkadot configuration for Sidecar.
 */
export const assetHubPolkadotControllers: ControllerConfig = {
	controllers: [
		'AccountsAssets',
		'AccountsBalanceInfo',
		'AccountsCompare',
		'AccountsProxyInfo',
		'AccountsValidate',
		'Blocks',
		'BlocksExtrinsics',
		'BlocksRawExtrinsics',
		'NodeNetwork',
		'NodeTransactionPool',
		'NodeVersion',
		'PalletsAssets',
		'PalletsAssetConversion',
		'PalletsDispatchables',
		'PalletsConsts',
		'PalletsEvents',
		'PalletsErrors',
		'PalletsForeignAssets',
		'RcAccountsBalanceInfo',
		'RcAccountsProxyInfo',
		'RuntimeCode',
		'RuntimeMetadata',
		'RuntimeSpec',
		'TransactionDryRun',
		'TransactionFeeEstimate',
		'TransactionMaterial',
		'TransactionSubmit',
	],
	options: {
		finalizes: true,
		minCalcFeeRuntime: 601,
		blockStore: initLRUCache(),
		hasQueryFeeApi: new QueryFeeDetailsCache(null, null),
	},
};
