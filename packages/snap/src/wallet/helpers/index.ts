import { text, heading, copyable } from '@metamask/snaps-sdk';
import {
  MessageParser,
  parfait,
  ParsedMessage,
  ParsedMessageType,
  Token,
  CosmosGovVoteOption,
} from '@leapwallet/parser-parfait';

import {
  convertObjectCasingFromCamelToSnake,
  DirectSignDocDecoder,
  UnknownMessage,
} from '@leapwallet/buffer-boba';

import * as base64js from 'base64-js';

import { BigNumber } from 'ethers';
import { DENOMS } from '../constants';

const messageParser = new MessageParser();

export const convertVoteOptionToString = (
  voteOption: CosmosGovVoteOption | number | null,
): string => {
  switch (voteOption) {
    case 1:
      return 'Yes';
    case 2:
      return 'Abstain';
    case 3:
      return 'No';
    case 4:
      return 'No with Veto';
    case CosmosGovVoteOption.YES:
      return 'Yes';
    case CosmosGovVoteOption.ABSTAIN:
      return 'Abstain';
    case CosmosGovVoteOption.NO:
      return 'No';
    case CosmosGovVoteOption.NO_WITH_VETO:
      return 'No with Veto';
    case CosmosGovVoteOption.UNSPECIFIED:
      return 'Unspecified';
    default:
      return 'Unspecified';
  }
};

export const getProposalId = (proposalId: any) => {
  if (typeof proposalId === 'string') {
    return proposalId;
  }

  if (typeof proposalId === 'object') {
    return proposalId.low;
  }
  return proposalId;
};

export const formatBigNumber = (n: BigNumber) => {
  if (isNaN(n?.toNumber())) {
    return '-';
  }

  if (n.lt(0.01) && !n.eq(0)) {
    return `<0.01`;
  }

  return n.toNumber().toFixed(2);
};

export const sliceAddress = (address?: string, visibleLetters = 5) => {
  return `${address?.slice(0, visibleLetters)}...${address?.slice(
    address.length - visibleLetters,
    address.length,
  )}`;
};

const tokenToString = (token: Token) => {
  try {
    const trace = DENOMS[token.denomination as keyof typeof DENOMS];
    if (!trace) {
      throw new Error('Denomination not found for the token specified.');
    }
    return `${formatBigNumber(
      BigNumber.from(token.quantity).div(10 ** trace.coinDecimals),
    )} ${trace.coinDenom}`;
  } catch {
    if (token?.denomination?.startsWith('u') ?? false) {
      return `${token.quantity} ${token.denomination.slice(1)}`;
    }
    return `${token?.quantity ?? ''} ${sliceAddress(
      token?.denomination ?? '',
    )}`;
  }
};

const tokensToString = (tokens: Token[]) => {
  const traces = tokens.map((t) => tokenToString(t));
  return traces.join(', ');
};

const formatAllowanceOption = (
  allowance: parfait.cosmos.feegrant.grantAllowance['allowance'],
) => {
  switch (allowance) {
    case 'basic':
      return 'Basic';
    case 'periodic':
      return 'Periodic';
    case 'allowedMsg':
      return 'Allowed Message';
    default:
      return '';
  }
};

export const getSimpleType = (type: string | undefined) => {
  if (!type) {
    return 'unknown';
  }
  const parts =
    (type?.startsWith('/') ? type?.split('.') : type?.split('/')) ?? [];
  return parts[parts.length - 1] ?? '';
};

export const getMessageDetails = (message: ParsedMessage, raw: any): string => {
  switch (message.__type) {
    case ParsedMessageType.AuthzExec:
      return `${sliceAddress(
        message.grantee,
      )} shall execute the following authorized message ${message.messages
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore not sure why ts is complaining here
        .map((m) =>
          getSimpleType('type' in m ? (m['@type'] as string) : m['@type']),
        )
        .join(', ')} on behalf of you`;
    case ParsedMessageType.AuthzGrant:
      return `Grant authorization for ${sliceAddress(
        message.grantee,
      )} to execute ${getSimpleType(
        message.grant.authorization.type,
      )} on behalf of you`;
    case ParsedMessageType.AuthzRevoke:
      return `Revoke authorization for ${sliceAddress(
        message.grantee,
      )} to execute ${getSimpleType(message.permission)} on behalf of you`;
    case ParsedMessageType.BankMultiSend:
      return `Send ${message.inputs.length} coins to ${message.outputs.length} recipients`;
    case ParsedMessageType.BankSend: {
      return `Send ${tokensToString(message.tokens)} to ${sliceAddress(
        message.toAddress,
      )}`;
    }
    case ParsedMessageType.FeeGrantGrantAllowance:
      return `Grant ${formatAllowanceOption(
        message.allowance,
      )} allowance to ${sliceAddress(message.grantee)}`;
    case ParsedMessageType.IbcPacketReceive:
      return `Receive IBC packet from ${sliceAddress(
        message.sourcePort,
      )}/${sliceAddress(message.sourceChannel)}`;
    case ParsedMessageType.FeeGrantRevokeAllowance:
      return `Revoke allowance from ${sliceAddress(message.grantee)}`;
    case ParsedMessageType.GammCreatePool:
      return `Create a Balancer pool with ${tokensToString(
        message.tokens,
      )} assets`;
    case ParsedMessageType.GammJoinPool:
      return `Join pool ${message.poolId} with ${tokensToString(
        message.tokens,
      )} assets in return for ${message.shares} shares`;
    case ParsedMessageType.GammExitPool:
      return `Exit pool ${message.poolId} with ${
        message.shares
      } shares in return for ${tokensToString(message.tokens)} assets`;
    case ParsedMessageType.GammSwapExact: {
      const tokenOut = {
        quantity: message.tokenOutAmount,
        denomination:
          message.routes[message.routes.length - 1].tokenOutDenomination,
      };
      return `Swap ${tokenToString(message.tokenIn)} for ${tokenToString(
        tokenOut,
      )}`;
    }

    case ParsedMessageType.GammSwapMax: {
      const tokenIn = {
        quantity: message.tokenInAmount,
        denomination: message.routes[0].tokenInDenomination,
      };
      return `Swap ${tokenToString(tokenIn)} for ${tokenToString(
        message.tokenOut,
      )}`;
    }
    case ParsedMessageType.GammSwapExactAndExit:
      return `Sell ${message.shares} shares for ${tokenToString(
        message.tokenOut,
      )} and exit pool ${message.poolId}`;
    case ParsedMessageType.GammSwapMaxAndExit:
      return `Sell ${message.shares} shares for ${tokenToString(
        message.tokenOut,
      )} and exit pool ${message.poolId}`;
    case ParsedMessageType.GammSwapExactAndJoin:
      return `Buy ${message.shares} shares for ${tokenToString(
        message.tokenIn,
      )} and join pool ${message.poolId}`;
    case ParsedMessageType.GammSwapMaxAndJoin:
      return `Buy ${message.shares} shares for ${tokenToString(
        message.tokenIn,
      )} and join pool ${message.poolId}`;
    case ParsedMessageType.GovSubmitProposal:
      return `Submit proposal with deposit of ${tokensToString(
        message.initialDeposit,
      )}`;
    case ParsedMessageType.GovVote:
      return `Vote ${convertVoteOptionToString(
        message.option || raw?.option,
      )} on proposal ${getProposalId(message?.proposalId)}`;
    case ParsedMessageType.GovDeposit:
      return `Deposit ${tokensToString(message?.amount ?? [])} on proposal ${
        message.proposalId
      }`;
    case ParsedMessageType.IbcSend:
      return `Send ${tokenToString(message.token)} to ${sliceAddress(
        message.toAddress,
      )} via IBC`;
    case ParsedMessageType.IbcReceive:
      return `Receive ${tokenToString(message.token)} from ${sliceAddress(
        message.fromAddress,
      )} via IBC`;
    case ParsedMessageType.LockupLock:
      return `Lock ${tokensToString(message.tokens)} for ${
        message.duration
      } seconds`;
    case ParsedMessageType.LockupUnlock:
      return `Unlock token from lock ${message.id}`;
    case ParsedMessageType.LockupUnlockAll:
      return `Unlock all tokens from all locks`;
    case ParsedMessageType.SlashingUnjail:
      return `Unjail validator ${sliceAddress(message.validatorAddress)}`;
    case ParsedMessageType.StakingCreateValidator:
      return `Create ${message.moniker} validator with commission rate ${message.rate}`;
    case ParsedMessageType.StakingEditValidator:
      return `Edit ${message.moniker} validator`;
    case ParsedMessageType.StakingDelegate:
      return `Delegate ${tokenToString({
        quantity: message.quantity,
        denomination: message.denomination,
      })} to ${sliceAddress(message.validatorAddress)}`;
    case ParsedMessageType.StakingUndelegate:
      return `Undelegate ${tokenToString({
        quantity: message.quantity,
        denomination: message.denomination,
      })} from ${sliceAddress(message.validatorAddress)}`;
    case ParsedMessageType.StakingBeginRedelegate:
      return `Redelegate ${tokenToString({
        quantity: message.quantity,
        denomination: message.denomination,
      })} from ${sliceAddress(
        message.sourceValidatorAddress,
      )} to ${sliceAddress(message.destinationValidatorAddress)}`;
    case ParsedMessageType.StakingCancelUnbondingDelegation:
      return `Cancel unbonding delegation for ${tokenToString({
        quantity: message.quantity,
        denomination: message.denomination,
      })} from ${sliceAddress(message.validatorAddress)}`;
    case ParsedMessageType.SuperfluidLockAndDelegate:
      return `Lock ${tokensToString(
        message.tokens,
      )} and delegate to ${sliceAddress(message.validatorAddress)}`;
    case ParsedMessageType.SuperfluidUnlockAndUndelegate:
      return `Remove lock ${message.lockId} and undelegate`;
    case ParsedMessageType.SuperfluidDelegate:
      return `Delegate tokens with lock ${message.lockId}`;
    case ParsedMessageType.SuperfluidUndelegate:
      return `Undelegate tokens with lock ${message.lockId}`;
    case ParsedMessageType.StakeIBCAddValidators:
      return `Add liquid staking validators - ${message.validators.join(', ')}`;
    case ParsedMessageType.StakeIBCChangeValidatorWeight:
      return `Change liquid staking validator ${message.validatorAddress}'s weight to ${message.weight}`;
    case ParsedMessageType.StakeIBCDeleteValidator:
      return `Delete liquid staking validator ${message.validatorAddress}`;
    case ParsedMessageType.StakeIBCLiquidStake:
      return `Liquid stake ${tokenToString({
        denomination: message.denomination,
        quantity: message.quantity,
      })}`;
    case ParsedMessageType.StakeIBCClearBalance:
      return `Clear liquid staking balance of ${message.quantity}`;
    case ParsedMessageType.StakeIBCRedeemStake:
      return `Redeem liquid stake of ${
        message.quantity
      } units to ${sliceAddress(message.receiver)}`;
    case ParsedMessageType.StakeIBCClaimUndelegatedTokens:
      return 'Claim undelegated tokens';
    case ParsedMessageType.StakeIBCRegisterHostZone:
      return `Register host zone via ${sliceAddress(
        message.account,
      )} with host denomination ${message.hostDenom}`;
    case ParsedMessageType.StakeIBCRebalanceValidators:
      return `Rebalance ${message.numRebalance} liquid staking validators in ${message.hostZone} host zone`;
    case ParsedMessageType.StakeIBCRestoreInterchainAccount:
      return `Restore interchain account ${sliceAddress(
        message.creator,
      )} of type ${message.accountType}`;
    case ParsedMessageType.StakeIBCUpdateValidatorSharesExchRate:
      return `Update liquid staking validator shares exchange rate for ${sliceAddress(
        message.validatorOperatorAddress,
      )}`;
    case ParsedMessageType.Unimplemented:
      return getSimpleType(
        message.message['@type'] ??
          message.message.type ??
          message.message.type_url ??
          message.message.typeUrl,
      );
    default:
      return 'Unknown Transaction Type';
  }
};

export const parser = {
  parse(signDoc: any, origin: string, signMode: 'direct' | 'amino') {
    if (signMode === 'direct') {
      const bodyBytes = new Uint8Array(Object.values(signDoc.bodyBytes));
      const authInfoBytes = new Uint8Array(
        Object.values(signDoc.authInfoBytes),
      );
      const docDecoder = new DirectSignDocDecoder({
        ...{ ...signDoc, bodyBytes, authInfoBytes },
        accountNumber: signDoc.accountNumber,
      });
      const parsedMessages = docDecoder.txMsgs.map((msg: any) => {
        if (msg instanceof UnknownMessage) {
          const raw = msg.toJSON();
          return {
            raw,
            parsed: {
              __type: ParsedMessageType.Unimplemented,
              message: {
                '@type': raw.type_url,
                body: raw.value,
              },
            } as parfait.unimplemented,
          };
        }

        if (msg.unpacked.msg instanceof Uint8Array) {
          const base64String = base64js.fromByteArray(msg.unpacked.msg);
          const decodedString = Buffer.from(base64String, 'base64').toString();
          try {
            const decodedJson = JSON.parse(decodedString);
            msg.unpacked.msg = decodedJson;
          } catch {
            msg.unpacked.msg = decodedString;
          }
        }

        const convertedMsg = convertObjectCasingFromCamelToSnake(
          ((msg as unknown) as { unpacked: any }).unpacked,
        );

        return {
          raw: {
            '@type': msg.typeUrl,
            ...convertedMsg,
          },
          parsed: messageParser.parse({
            '@type': msg.typeUrl,
            ...convertedMsg,
          }),
        };
      });

      const panels: any = [
        text(` **Approve transaction from**`),
        copyable(`${origin}`),
        heading(''),
      ];

      parsedMessages.forEach((msg) => {
        const panelMsg = getMessageDetails(msg.parsed, msg.raw);
        if (panelMsg !== 'Unknown Transaction Type') {
          panels.push(heading(`${panelMsg}`));
        }
      });

      if (parsedMessages) {
        panels.push(heading(''));
        panels.push(text(' **Raw message**'));
        panels.push(copyable(`${JSON.stringify(parsedMessages, null, 2)}`));
      }
      return panels;
    }
    const panels: any = [
      text(` **Approve transaction from**`),
      copyable(`${origin}`),
      heading(''),
    ];
    panels.push(heading(''));
    panels.push(text(' **Raw message**'));
    panels.push(copyable(`${JSON.stringify(signDoc, null, 2)}`));
    return panels;
  },
};
