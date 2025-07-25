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

import { INodeVersion } from 'src/types/responses';

import { AbstractService } from '../AbstractService';

export class NodeVersionService extends AbstractService {
	async fetchVersion(): Promise<INodeVersion> {
		const { api } = this;
		const [{ implName: clientImplName }, chain, clientVersion] = await Promise.all([
			api.rpc.state.getRuntimeVersion(),
			api.rpc.system.chain(),
			api.rpc.system.version(),
		]);

		return {
			clientVersion,
			clientImplName,
			chain,
		};
	}
}
