import typia from 'typia';
import { CreateProofRequest, SaveCredentialsRequestParams } from '../types';
const formatErrorMessages = (errors: typia.IValidation.IError[]): string => {
  let errorMessage = 'invalid_argument: ';
  for (let i = 0; i < errors.length; i += 1) {
    errorMessage += errors[i].path;
    if (i < errors.length - 1) {
      errorMessage += ', ';
    }
  }
  return errorMessage;
};
const handleIValidation = (result: typia.IValidation<unknown>) => {
  if (result.success) {
    return undefined;
  }
  return formatErrorMessages(result.errors);
};
export const isValidSaveCredentialsOfferRequest = (
  offer: SaveCredentialsRequestParams,
) => {
  const validate = (
    input: any,
  ): typia.IValidation<SaveCredentialsRequestParams> => {
    const errors = [] as any[];
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is SaveCredentialsRequestParams => {
      const $io0 = (input: any, _exceptionable: boolean = true): boolean =>
        'object' === typeof input.body &&
        null !== input.body &&
        $io1(input.body, true && _exceptionable) &&
        'string' === typeof input.from &&
        'string' === typeof input.id &&
        (undefined === input.threadID || 'string' === typeof input.threadID) &&
        'string' === typeof input.to &&
        (undefined === input.typ || 'string' === typeof input.typ) &&
        'string' === typeof input.type &&
        (5 === Object.keys(input).length ||
          Object.keys(input).every((key) => {
            if (
              ['body', 'from', 'id', 'threadID', 'to', 'typ', 'type'].some(
                (prop) => key === prop,
              )
            )
              return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      const $io1 = (input: any, _exceptionable: boolean = true): boolean =>
        Array.isArray(input.Credentials) &&
        input.Credentials.length === 1 &&
        'object' === typeof input.Credentials[0] &&
        null !== input.Credentials[0] &&
        $io2(input.Credentials[0], true && _exceptionable) &&
        'string' === typeof input.url &&
        (2 === Object.keys(input).length ||
          Object.keys(input).every((key) => {
            if (['Credentials', 'url'].some((prop) => key === prop))
              return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      const $io2 = (input: any, _exceptionable: boolean = true): boolean =>
        'string' === typeof input.description &&
        'string' === typeof input.id &&
        (2 === Object.keys(input).length ||
          Object.keys(input).every((key) => {
            if (['description', 'id'].some((prop) => key === prop)) return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      return 'object' === typeof input && null !== input && $io0(input, true);
    };
    if (false === __is(input)) {
      const $report = (typia.createValidateEquals as any).report(errors);
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is SaveCredentialsRequestParams => {
        const $join = (typia.createValidateEquals as any).join;
        const $vo0 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          [
            ((('object' === typeof input.body && null !== input.body) ||
              $report(_exceptionable, {
                path: _path + '.body',
                expected: '__type',
                value: input.body,
              })) &&
              $vo1(input.body, _path + '.body', true && _exceptionable)) ||
              $report(_exceptionable, {
                path: _path + '.body',
                expected: '__type',
                value: input.body,
              }),
            'string' === typeof input.from ||
              $report(_exceptionable, {
                path: _path + '.from',
                expected: 'string',
                value: input.from,
              }),
            'string' === typeof input.id ||
              $report(_exceptionable, {
                path: _path + '.id',
                expected: 'string',
                value: input.id,
              }),
            undefined === input.threadID ||
              'string' === typeof input.threadID ||
              $report(_exceptionable, {
                path: _path + '.threadID',
                expected: '(string | undefined)',
                value: input.threadID,
              }),
            'string' === typeof input.to ||
              $report(_exceptionable, {
                path: _path + '.to',
                expected: 'string',
                value: input.to,
              }),
            undefined === input.typ ||
              'string' === typeof input.typ ||
              $report(_exceptionable, {
                path: _path + '.typ',
                expected: '(string | undefined)',
                value: input.typ,
              }),
            'string' === typeof input.type ||
              $report(_exceptionable, {
                path: _path + '.type',
                expected: 'string',
                value: input.type,
              }),
            5 === Object.keys(input).length ||
              false === _exceptionable ||
              Object.keys(input)
                .map((key) => {
                  if (
                    [
                      'body',
                      'from',
                      'id',
                      'threadID',
                      'to',
                      'typ',
                      'type',
                    ].some((prop) => key === prop)
                  )
                    return true;
                  const value = input[key];
                  if (undefined === value) return true;
                  return $report(_exceptionable, {
                    path: _path + $join(key),
                    expected: 'undefined',
                    value: value,
                  });
                })
                .every((flag: boolean) => flag),
          ].every((flag: boolean) => flag);
        const $vo1 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          [
            ((Array.isArray(input.Credentials) ||
              $report(_exceptionable, {
                path: _path + '.Credentials',
                expected: '[{ description: string; id: string; }]',
                value: input.Credentials,
              })) &&
              (input.Credentials.length === 1 ||
                $report(_exceptionable, {
                  path: _path + '.Credentials',
                  expected: '[__type.o1]',
                  value: input.Credentials,
                })) &&
              [
                ((('object' === typeof input.Credentials[0] &&
                  null !== input.Credentials[0]) ||
                  $report(_exceptionable, {
                    path: _path + '.Credentials[0]',
                    expected: '__type.o1',
                    value: input.Credentials[0],
                  })) &&
                  $vo2(
                    input.Credentials[0],
                    _path + '.Credentials[0]',
                    true && _exceptionable,
                  )) ||
                  $report(_exceptionable, {
                    path: _path + '.Credentials[0]',
                    expected: '__type.o1',
                    value: input.Credentials[0],
                  }),
              ].every((flag: boolean) => flag)) ||
              $report(_exceptionable, {
                path: _path + '.Credentials',
                expected: '[{ description: string; id: string; }]',
                value: input.Credentials,
              }),
            'string' === typeof input.url ||
              $report(_exceptionable, {
                path: _path + '.url',
                expected: 'string',
                value: input.url,
              }),
            2 === Object.keys(input).length ||
              false === _exceptionable ||
              Object.keys(input)
                .map((key) => {
                  if (['Credentials', 'url'].some((prop) => key === prop))
                    return true;
                  const value = input[key];
                  if (undefined === value) return true;
                  return $report(_exceptionable, {
                    path: _path + $join(key),
                    expected: 'undefined',
                    value: value,
                  });
                })
                .every((flag: boolean) => flag),
          ].every((flag: boolean) => flag);
        const $vo2 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          [
            'string' === typeof input.description ||
              $report(_exceptionable, {
                path: _path + '.description',
                expected: 'string',
                value: input.description,
              }),
            'string' === typeof input.id ||
              $report(_exceptionable, {
                path: _path + '.id',
                expected: 'string',
                value: input.id,
              }),
            2 === Object.keys(input).length ||
              false === _exceptionable ||
              Object.keys(input)
                .map((key) => {
                  if (['description', 'id'].some((prop) => key === prop))
                    return true;
                  const value = input[key];
                  if (undefined === value) return true;
                  return $report(_exceptionable, {
                    path: _path + $join(key),
                    expected: 'undefined',
                    value: value,
                  });
                })
                .every((flag: boolean) => flag),
          ].every((flag: boolean) => flag);
        return (
          ((('object' === typeof input && null !== input) ||
            $report(true, {
              path: _path + '',
              expected: 'SaveCredentialsRequestParams',
              value: input,
            })) &&
            $vo0(input, _path + '', true)) ||
          $report(true, {
            path: _path + '',
            expected: 'SaveCredentialsRequestParams',
            value: input,
          })
        );
      })(input, '$input', true);
    }
    const success = 0 === errors.length;
    return {
      success,
      errors,
      data: success ? input : undefined,
    } as any;
  };
  const res = validate(offer);
  if (!res.success) {
    throw new Error(handleIValidation(res));
  }
};
export const isValidCreateProofRequest = (request: CreateProofRequest) => {
  const validate = (input: any): typia.IValidation<CreateProofRequest> => {
    const errors = [] as any[];
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is CreateProofRequest => {
      const $join = (typia.createValidateEquals as any).join;
      const $io0 = (input: any, _exceptionable: boolean = true): boolean =>
        (undefined === input.id || 'number' === typeof input.id) &&
        (undefined === input.accountAddress ||
          'string' === typeof input.accountAddress) &&
        ('credentialAtomicQueryMTPV2' === input.circuitId ||
          'credentialAtomicQueryMTPV2OnChain' === input.circuitId ||
          'credentialAtomicQuerySigV2' === input.circuitId ||
          'credentialAtomicQuerySigV2OnChain' === input.circuitId) &&
        (undefined === input.challenge ||
          'string' === typeof input.challenge) &&
        'object' === typeof input.query &&
        null !== input.query &&
        false === Array.isArray(input.query) &&
        $io1(input.query, true && _exceptionable) &&
        (2 === Object.keys(input).length ||
          Object.keys(input).every((key) => {
            if (
              ['id', 'accountAddress', 'circuitId', 'challenge', 'query'].some(
                (prop) => key === prop,
              )
            )
              return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      const $io1 = (input: any, _exceptionable: boolean = true): boolean =>
        (undefined === input.allowedIssuers ||
          (Array.isArray(input.allowedIssuers) &&
            input.allowedIssuers.every(
              (elem: any, _index1: number) => 'string' === typeof elem,
            ))) &&
        (undefined === input.credentialSubject ||
          ('object' === typeof input.credentialSubject &&
            null !== input.credentialSubject &&
            false === Array.isArray(input.credentialSubject) &&
            $io2(input.credentialSubject, true && _exceptionable))) &&
        (undefined === input.schema || 'string' === typeof input.schema) &&
        (undefined === input.claimId || 'string' === typeof input.claimId) &&
        (undefined === input.credentialSubjectId ||
          'string' === typeof input.credentialSubjectId) &&
        (undefined === input.context || 'string' === typeof input.context) &&
        (undefined === input.type ||
          (Array.isArray(input.type) &&
            input.type.every(
              (elem: any, _index2: number) => 'string' === typeof elem,
            ))) &&
        (0 === Object.keys(input).length ||
          Object.keys(input).every((key) => {
            if (
              [
                'allowedIssuers',
                'credentialSubject',
                'schema',
                'claimId',
                'credentialSubjectId',
                'context',
                'type',
              ].some((prop) => key === prop)
            )
              return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      const $io2 = (input: any, _exceptionable: boolean = true): boolean =>
        Object.keys(input).every((key) => {
          const value = input[key];
          if (undefined === value) return true;
          if (RegExp(/(.*)/).test(key)) return true;
          return false;
        });
      return 'object' === typeof input && null !== input && $io0(input, true);
    };
    if (false === __is(input)) {
      const $report = (typia.createValidateEquals as any).report(errors);
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is CreateProofRequest => {
        const $join = (typia.createValidateEquals as any).join;
        const $vo0 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          [
            undefined === input.id ||
              'number' === typeof input.id ||
              $report(_exceptionable, {
                path: _path + '.id',
                expected: '(number | undefined)',
                value: input.id,
              }),
            undefined === input.accountAddress ||
              'string' === typeof input.accountAddress ||
              $report(_exceptionable, {
                path: _path + '.accountAddress',
                expected: '(string | undefined)',
                value: input.accountAddress,
              }),
            'credentialAtomicQueryMTPV2' === input.circuitId ||
              'credentialAtomicQueryMTPV2OnChain' === input.circuitId ||
              'credentialAtomicQuerySigV2' === input.circuitId ||
              'credentialAtomicQuerySigV2OnChain' === input.circuitId ||
              $report(_exceptionable, {
                path: _path + '.circuitId',
                expected:
                  '("credentialAtomicQueryMTPV2" | "credentialAtomicQueryMTPV2OnChain" | "credentialAtomicQuerySigV2" | "credentialAtomicQuerySigV2OnChain")',
                value: input.circuitId,
              }),
            undefined === input.challenge ||
              'string' === typeof input.challenge ||
              $report(_exceptionable, {
                path: _path + '.challenge',
                expected: '(string | undefined)',
                value: input.challenge,
              }),
            ((('object' === typeof input.query &&
              null !== input.query &&
              false === Array.isArray(input.query)) ||
              $report(_exceptionable, {
                path: _path + '.query',
                expected: 'ProofQuery',
                value: input.query,
              })) &&
              $vo1(input.query, _path + '.query', true && _exceptionable)) ||
              $report(_exceptionable, {
                path: _path + '.query',
                expected: 'ProofQuery',
                value: input.query,
              }),
            2 === Object.keys(input).length ||
              false === _exceptionable ||
              Object.keys(input)
                .map((key) => {
                  if (
                    [
                      'id',
                      'accountAddress',
                      'circuitId',
                      'challenge',
                      'query',
                    ].some((prop) => key === prop)
                  )
                    return true;
                  const value = input[key];
                  if (undefined === value) return true;
                  return $report(_exceptionable, {
                    path: _path + $join(key),
                    expected: 'undefined',
                    value: value,
                  });
                })
                .every((flag: boolean) => flag),
          ].every((flag: boolean) => flag);
        const $vo1 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          [
            undefined === input.allowedIssuers ||
              ((Array.isArray(input.allowedIssuers) ||
                $report(_exceptionable, {
                  path: _path + '.allowedIssuers',
                  expected: '(Array<string> | undefined)',
                  value: input.allowedIssuers,
                })) &&
                input.allowedIssuers
                  .map(
                    (elem: any, _index1: number) =>
                      'string' === typeof elem ||
                      $report(_exceptionable, {
                        path: _path + '.allowedIssuers[' + _index1 + ']',
                        expected: 'string',
                        value: elem,
                      }),
                  )
                  .every((flag: boolean) => flag)) ||
              $report(_exceptionable, {
                path: _path + '.allowedIssuers',
                expected: '(Array<string> | undefined)',
                value: input.allowedIssuers,
              }),
            undefined === input.credentialSubject ||
              ((('object' === typeof input.credentialSubject &&
                null !== input.credentialSubject &&
                false === Array.isArray(input.credentialSubject)) ||
                $report(_exceptionable, {
                  path: _path + '.credentialSubject',
                  expected: '(__type | undefined)',
                  value: input.credentialSubject,
                })) &&
                $vo2(
                  input.credentialSubject,
                  _path + '.credentialSubject',
                  true && _exceptionable,
                )) ||
              $report(_exceptionable, {
                path: _path + '.credentialSubject',
                expected: '(__type | undefined)',
                value: input.credentialSubject,
              }),
            undefined === input.schema ||
              'string' === typeof input.schema ||
              $report(_exceptionable, {
                path: _path + '.schema',
                expected: '(string | undefined)',
                value: input.schema,
              }),
            undefined === input.claimId ||
              'string' === typeof input.claimId ||
              $report(_exceptionable, {
                path: _path + '.claimId',
                expected: '(string | undefined)',
                value: input.claimId,
              }),
            undefined === input.credentialSubjectId ||
              'string' === typeof input.credentialSubjectId ||
              $report(_exceptionable, {
                path: _path + '.credentialSubjectId',
                expected: '(string | undefined)',
                value: input.credentialSubjectId,
              }),
            undefined === input.context ||
              'string' === typeof input.context ||
              $report(_exceptionable, {
                path: _path + '.context',
                expected: '(string | undefined)',
                value: input.context,
              }),
            undefined === input.type ||
              ((Array.isArray(input.type) ||
                $report(_exceptionable, {
                  path: _path + '.type',
                  expected: '(Array<string> | undefined)',
                  value: input.type,
                })) &&
                input.type
                  .map(
                    (elem: any, _index2: number) =>
                      'string' === typeof elem ||
                      $report(_exceptionable, {
                        path: _path + '.type[' + _index2 + ']',
                        expected: 'string',
                        value: elem,
                      }),
                  )
                  .every((flag: boolean) => flag)) ||
              $report(_exceptionable, {
                path: _path + '.type',
                expected: '(Array<string> | undefined)',
                value: input.type,
              }),
            0 === Object.keys(input).length ||
              false === _exceptionable ||
              Object.keys(input)
                .map((key) => {
                  if (
                    [
                      'allowedIssuers',
                      'credentialSubject',
                      'schema',
                      'claimId',
                      'credentialSubjectId',
                      'context',
                      'type',
                    ].some((prop) => key === prop)
                  )
                    return true;
                  const value = input[key];
                  if (undefined === value) return true;
                  return $report(_exceptionable, {
                    path: _path + $join(key),
                    expected: 'undefined',
                    value: value,
                  });
                })
                .every((flag: boolean) => flag),
          ].every((flag: boolean) => flag);
        const $vo2 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          [
            false === _exceptionable ||
              Object.keys(input)
                .map((key) => {
                  const value = input[key];
                  if (undefined === value) return true;
                  if (RegExp(/(.*)/).test(key)) return true;
                  return $report(_exceptionable, {
                    path: _path + $join(key),
                    expected: 'undefined',
                    value: value,
                  });
                })
                .every((flag: boolean) => flag),
          ].every((flag: boolean) => flag);
        return (
          ((('object' === typeof input && null !== input) ||
            $report(true, {
              path: _path + '',
              expected: 'CreateProofRequest',
              value: input,
            })) &&
            $vo0(input, _path + '', true)) ||
          $report(true, {
            path: _path + '',
            expected: 'CreateProofRequest',
            value: input,
          })
        );
      })(input, '$input', true);
    }
    const success = 0 === errors.length;
    return {
      success,
      errors,
      data: success ? input : undefined,
    } as any;
  };
  const res = validate(request);
  if (!res.success) {
    throw new Error(handleIValidation(res));
  }
};
