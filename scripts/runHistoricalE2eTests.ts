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

import { ArgumentParser } from 'argparse';

import { defaultSasBuildOpts, historicalE2eConfig } from './config';
import { checkTests, launchChainTest } from './e2eHelpers';
import { killAll, launchProcess, setLogLevel } from './sidecarScriptApi';
import { IE2EParseArgs, ProcsType, StatusCode } from './types';

// Stores all the processes
const procs: ProcsType = {};

const main = async (args: IE2EParseArgs): Promise<void> => {
	const { Failed } = StatusCode;
	const localUrl: string | undefined = args.local ? args.local : undefined;

	if (localUrl && !args.chain) {
		console.error('error: `--local` must be used in conjunction with `--chain`');
		process.exit(3);
	}

	if (args.log_level) {
		setLogLevel(args.log_level);
	}

	console.log('Building Sidecar...');
	const sidecarBuild = await launchProcess('yarn', procs, defaultSasBuildOpts);

	if (sidecarBuild.code === Failed) {
		console.error('Sidecar failed to build, exiting...');
		killAll(procs);
		process.exit(2);
	}

	if (args.chain) {
		const selectedChain = await launchChainTest(args.chain, historicalE2eConfig, procs, localUrl);

		checkTests(selectedChain);
	} else {
		const polkadotTest = await launchChainTest('polkadot', historicalE2eConfig, procs);
		const kusamaTest = await launchChainTest('kusama', historicalE2eConfig, procs);
		const westendTest = await launchChainTest('westend', historicalE2eConfig, procs);
		const assetHubKusamaTest = await launchChainTest('kusama-asset-hub', historicalE2eConfig, procs);
		const assetHubPolkadotTest = await launchChainTest('polkadot-asset-hub', historicalE2eConfig, procs);
		const moonbeamTest = await launchChainTest('moonbeam', historicalE2eConfig, procs);

		checkTests(polkadotTest, kusamaTest, westendTest, assetHubKusamaTest, assetHubPolkadotTest, moonbeamTest);
	}
};

/**
 * Arg Parser
 */
const parser = new ArgumentParser();

parser.add_argument('--local', {
	required: false,
	nargs: '?',
});
parser.add_argument('--chain', {
	choices: ['polkadot', 'kusama', 'westend', 'kusama-asset-hub', 'polkadot-asset-hub', 'moonbeam'],
});
parser.add_argument('--log-level', {
	choices: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'],
	default: 'http',
});

const args = parser.parse_args() as IE2EParseArgs;

/**
 * Signal interrupt
 */
process.on('SIGINT', function () {
	console.log('Caught interrupt signal');
	killAll(procs);
	process.exit();
});

/**
 * Signal hangup terminal
 */
process.on('SIGHUP', function () {
	console.log('Caught terminal termination');
	killAll(procs);
	process.exit();
});

main(args)
	.catch((err) => console.error(err))
	.finally(() => process.exit());
