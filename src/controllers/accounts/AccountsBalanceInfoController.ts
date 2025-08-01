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

import { BlockHash } from '@polkadot/types/interfaces';
import { RequestHandler } from 'express';
import { IAddressParam } from 'src/types/requests';

import { validateAddress, validateBoolean, validateRcAt } from '../../middleware';
import { AccountsBalanceInfoService } from '../../services';
import AbstractController from '../AbstractController';

/**
 * GET balance information for an address.
 *
 * Paths:
 * - `address`: The address to query.
 *
 * Query:
 * - (Optional)`at`: Block at which to retrieve runtime version information at. Block
 * 		identifier, as the block height or block hash. Defaults to most recent block.
 * - (Optional)`rcAt`: Relay chain block at which to retrieve Asset Hub balance info. Only supported
 * 		for Asset Hub endpoints. Cannot be used with 'at' parameter.
 *
 * Returns:
 * - `at`: Block number and hash at which the call was made.
 * - `nonce`: Account nonce.
 * - `free`: Free balance of the account. Not equivalent to _spendable_ balance. This is the only
 *   balance that matters in terms of most operations on tokens.
 * - `reserved`: Reserved balance of the account.
 * - `miscFrozen`: The amount that `free` may not drop below when withdrawing for anything except
 *   transaction fee payment.
 * - `feeFrozen`: The amount that `free` may not drop below when withdrawing specifically for
 *   transaction fee payment.
 * - `locks`: Array of locks on a balance. There can be many of these on an account and they
 *   "overlap", so the same balance is frozen by multiple locks. Contains:
 *   - `id`: An identifier for this lock. Only one lock may be in existence for each identifier.
 *   - `amount`: The amount below which the free balance may not drop with this lock in effect.
 *   - `reasons`: If true, then the lock remains in effect even for payment of transaction fees.
 * - `rcBlockNumber`: The relay chain block number used for the query. Only present when `rcAt` parameter is used.
 * - `ahTimestamp`: The Asset Hub block timestamp. Only present when `rcAt` parameter is used.
 *
 * Substrate Reference:
 * - FRAME System: https://crates.parity.io/frame_system/index.html
 * - Balances Pallet: https://crates.parity.io/pallet_balances/index.html
 * - `AccountInfo`: https://crates.parity.io/frame_system/struct.AccountInfo.html
 * - `AccountData`: https://crates.parity.io/pallet_balances/struct.AccountData.html
 * - `BalanceLock`: https://crates.parity.io/pallet_balances/struct.BalanceLock.html
 */
export default class AccountsBalanceController extends AbstractController<AccountsBalanceInfoService> {
	static controllerName = 'AccountsBalanceInfo';
	static requiredPallets = [['Balances', 'System']];
	constructor(api: string) {
		super(api, '/accounts/:address/balance-info', new AccountsBalanceInfoService(api));
		this.initRoutes();
	}

	protected initRoutes(): void {
		this.router.use(this.path, validateAddress, validateBoolean(['denominated']), validateRcAt);

		this.safeMountAsyncGetHandlers([['', this.getAccountBalanceInfo]]);
	}

	/**
	 * Get the latest account balance summary of `address`.
	 *
	 * @param req Express Request
	 * @param res Express Response
	 */
	private getAccountBalanceInfo: RequestHandler<IAddressParam> = async (
		{ params: { address }, query: { at, rcAt, token, denominated } },
		res,
	): Promise<void> => {
		let hash: BlockHash;
		let rcBlockNumber: string | undefined;

		if (rcAt) {
			const rcAtResult = await this.getHashFromRcAt(rcAt);
			hash = rcAtResult.ahHash;
			rcBlockNumber = rcAtResult.rcBlockNumber;
		} else {
			hash = await this.getHashFromAt(at);
		}

		const tokenArg =
			typeof token === 'string'
				? token.toUpperCase()
				: // We assume the first token is the native token
					this.api.registry.chainTokens[0].toUpperCase();
		const withDenomination = denominated === 'true';

		const historicApi = await this.api.at(hash);

		const result = await this.service.fetchAccountBalanceInfo(hash, historicApi, address, tokenArg, withDenomination);

		if (rcBlockNumber) {
			const apiAt = await this.api.at(hash);
			const ahTimestamp = await apiAt.query.timestamp.now();

			const enhancedResult = {
				...result,
				rcBlockNumber,
				ahTimestamp: ahTimestamp.toString(),
			};

			AccountsBalanceController.sanitizedSend(res, enhancedResult);
		} else {
			AccountsBalanceController.sanitizedSend(res, result);
		}
	};
}
