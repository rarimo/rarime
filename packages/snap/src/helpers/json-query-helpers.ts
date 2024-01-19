/* eslint-disable @typescript-eslint/no-parameter-properties */
import type { ProofQuery } from '@rarimo/rarime-connector';
import { W3CCredential } from '../types';

export enum SearchError {
  NotDefinedQueryKey = 'not defined query key',
  NotDefinedComparator = 'not defined comparator',
}

export type FilterOperatorMethod =
  | '$noop'
  | '$eq'
  | '$in'
  | '$nin'
  | '$gt'
  | '$lt'
  | '$ne';

export type FilterOperatorFunction = (a: any, b: any) => boolean;

const comparatorOptions: {
  [v in FilterOperatorMethod]: FilterOperatorFunction;
} = {
  $noop: () => true,
  $eq: (a, b) => a === b,
  $in: (a: string, b: string[]) => b.includes(a),
  $nin: (a: string, b: string[]) => !b.includes(a),
  $gt: (a: number, b: number) => a > b,
  $lt: (a: number, b: number) => a < b,
  $ne: (a, b) => a !== b,
};

type PathObject = { [key: string]: any };

export const resolvePath = (
  object: PathObject,
  path: string,
  defaultValue = null,
) => path.split('.').reduce((o, p) => (o ? o[p] : defaultValue), object);

export class FilterQuery {
  constructor(
    public path: string,
    public operatorFunc: FilterOperatorFunction,
    public value: any,
    public isReverseParams = false,
  ) {}

  execute(credential: W3CCredential): boolean {
    if (!this.operatorFunc) {
      throw new Error(SearchError.NotDefinedComparator);
    }
    const credentialPathValue = resolvePath(credential, this.path);
    if (credentialPathValue === null || credentialPathValue === undefined) {
      return false;
    }

    if (this.isReverseParams) {
      return this.operatorFunc(this.value, credentialPathValue);
    }
    return this.operatorFunc(credentialPathValue, this.value);
  }
}

export const StandardJSONCredentialsQueryFilter = (
  query: ProofQuery,
): FilterQuery[] => {
  return Object.keys(query).reduce((acc: FilterQuery[], queryKey) => {
    const queryValue = query[queryKey as keyof ProofQuery];
    switch (queryKey) {
      case 'claimId':
        return acc.concat(
          new FilterQuery('id', comparatorOptions.$eq, queryValue),
        );
      case 'allowedIssuers': {
        const [first] = (queryValue as string[]) ?? [];
        if (first && first === '*') {
          return acc;
        }
        return acc.concat(
          new FilterQuery('issuer', comparatorOptions.$in, queryValue),
        );
      }
      case 'type':
        return acc.concat(
          new FilterQuery('type', comparatorOptions.$in, queryValue, true),
        );
      case 'context':
        return acc.concat(
          new FilterQuery('@context', comparatorOptions.$in, queryValue, true),
        );
      case 'credentialSubjectId':
        return acc.concat(
          new FilterQuery(
            'credentialSubject.id',
            comparatorOptions.$eq,
            queryValue,
          ),
        );
      case 'schema':
        return acc.concat(
          new FilterQuery(
            'credentialSchema.id',
            comparatorOptions.$eq,
            queryValue,
          ),
        );
      case 'skipClaimRevocationCheck':
        return acc;
      case 'credentialSubject': {
        const queryVal = queryValue as { [key: string]: any };
        const reqFilters = Object.keys(queryVal).reduce(
          (arr: FilterQuery[], fieldKey) => {
            const fieldParams = queryVal[fieldKey];
            const res = Object.keys(fieldParams).map((comparator) => {
              const value = fieldParams[comparator];
              const path = `credentialSubject.${fieldKey}`;
              return new FilterQuery(
                path,
                comparatorOptions[comparator as FilterOperatorMethod],
                value,
              );
            });
            return arr.concat(res);
          },
          [],
        );

        return acc.concat(reqFilters);
      }
      default:
        throw new Error(SearchError.NotDefinedQueryKey);
    }
  }, []);
};
