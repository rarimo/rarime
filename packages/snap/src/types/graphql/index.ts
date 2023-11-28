import gql from 'graphql-tag';

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  CeramicCommitID: { input: any; output: any };
};

export type CeramicAccount = Node & {
  __typename?: 'CeramicAccount';
  /** Globally unique identifier of the account (DID string) */
  id: Scalars['ID']['output'];
  /** Whether the Ceramic instance is currently authenticated with this account or not */
  isViewer: Scalars['Boolean']['output'];
  verifiableCredentialList?: Maybe<VerifiableCredentialConnection>;
  verifiableCredentialListCount: Scalars['Int']['output'];
};

export type CeramicAccountVerifiableCredentialListArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<VerifiableCredentialFiltersInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sorting?: InputMaybe<VerifiableCredentialSortingInput>;
};

export type CeramicAccountVerifiableCredentialListCountArgs = {
  filters?: InputMaybe<VerifiableCredentialFiltersInput>;
};

export type CreateVerifiableCredentialInput = {
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  content: VerifiableCredentialInput;
};

export type CreateVerifiableCredentialPayload = {
  __typename?: 'CreateVerifiableCredentialPayload';
  clientMutationId?: Maybe<Scalars['String']['output']>;
  document: VerifiableCredential;
  /** Fetches an object given its ID */
  node?: Maybe<Node>;
  /** Account currently authenticated on the Ceramic instance, if set */
  viewer?: Maybe<CeramicAccount>;
};

export type CreateVerifiableCredentialPayloadNodeArgs = {
  id: Scalars['ID']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createVerifiableCredential?: Maybe<CreateVerifiableCredentialPayload>;
  updateVerifiableCredential?: Maybe<UpdateVerifiableCredentialPayload>;
};

export type MutationCreateVerifiableCredentialArgs = {
  input: CreateVerifiableCredentialInput;
};

export type MutationUpdateVerifiableCredentialArgs = {
  input: UpdateVerifiableCredentialInput;
};

/** An object with an ID */
export type Node = {
  /** The id of the object. */
  id: Scalars['ID']['output'];
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PartialVerifiableCredentialInput = {
  data?: InputMaybe<Scalars['String']['input']>;
  queryHash?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  /** Fetches an object given its ID */
  node?: Maybe<Node>;
  /** Fetches objects given their IDs */
  nodes: Maybe<Node>[];
  verifiableCredentialCount: Scalars['Int']['output'];
  verifiableCredentialIndex?: Maybe<VerifiableCredentialConnection>;
  /** Account currently authenticated on the Ceramic instance, if set */
  viewer?: Maybe<CeramicAccount>;
};

export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};

export type QueryNodesArgs = {
  ids: Scalars['ID']['input'][];
};

export type QueryVerifiableCredentialCountArgs = {
  filters?: InputMaybe<VerifiableCredentialFiltersInput>;
};

export type QueryVerifiableCredentialIndexArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<VerifiableCredentialFiltersInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sorting?: InputMaybe<VerifiableCredentialSortingInput>;
};

export enum SortOrder {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type StringValueFilterInput = {
  equalTo?: InputMaybe<Scalars['String']['input']>;
  greaterThan?: InputMaybe<Scalars['String']['input']>;
  greaterThanOrEqualTo?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Scalars['String']['input'][]>;
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  lessThan?: InputMaybe<Scalars['String']['input']>;
  lessThanOrEqualTo?: InputMaybe<Scalars['String']['input']>;
  notEqualTo?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Scalars['String']['input'][]>;
};

export type UpdateOptionsInput = {
  /** Fully replace the document contents instead of performing a shallow merge */
  replace?: InputMaybe<Scalars['Boolean']['input']>;
  /** Only perform mutation if the document matches the provided version */
  version?: InputMaybe<Scalars['CeramicCommitID']['input']>;
};

export type UpdateVerifiableCredentialInput = {
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  content: PartialVerifiableCredentialInput;
  id: Scalars['ID']['input'];
  options?: InputMaybe<UpdateOptionsInput>;
};

export type UpdateVerifiableCredentialPayload = {
  __typename?: 'UpdateVerifiableCredentialPayload';
  clientMutationId?: Maybe<Scalars['String']['output']>;
  document: VerifiableCredential;
  /** Fetches an object given its ID */
  node?: Maybe<Node>;
  /** Account currently authenticated on the Ceramic instance, if set */
  viewer?: Maybe<CeramicAccount>;
};

export type UpdateVerifiableCredentialPayloadNodeArgs = {
  id: Scalars['ID']['input'];
};

export type VerifiableCredential = Node & {
  __typename?: 'VerifiableCredential';
  data: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  queryHash: Scalars['String']['output'];
};

/** A connection to a list of items. */
export type VerifiableCredentialConnection = {
  __typename?: 'VerifiableCredentialConnection';
  /** A list of edges. */
  edges?: Maybe<Maybe<VerifiableCredentialEdge>[]>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

/** An edge in a connection. */
export type VerifiableCredentialEdge = {
  __typename?: 'VerifiableCredentialEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node?: Maybe<VerifiableCredential>;
};

export type VerifiableCredentialFiltersInput = {
  and?: InputMaybe<VerifiableCredentialFiltersInput[]>;
  not?: InputMaybe<VerifiableCredentialFiltersInput>;
  or?: InputMaybe<VerifiableCredentialFiltersInput[]>;
  where?: InputMaybe<VerifiableCredentialObjectFilterInput>;
};

export type VerifiableCredentialInput = {
  data: Scalars['String']['input'];
  queryHash: Scalars['String']['input'];
};

export type VerifiableCredentialObjectFilterInput = {
  queryHash?: InputMaybe<StringValueFilterInput>;
};

export type VerifiableCredentialSortingInput = {
  queryHash?: InputMaybe<SortOrder>;
};

export type VerifiableCredentialFragmentFragment = {
  __typename?: 'VerifiableCredentialConnection';
  edges?:
    | ({
        __typename?: 'VerifiableCredentialEdge';
        node?: {
          __typename?: 'VerifiableCredential';
          id: string;
          data: string;
          queryHash: string;
        } | null;
      } | null)[]
    | null;
};

export type CreateVcMutationVariables = Exact<{
  input: CreateVerifiableCredentialInput;
}>;

export type CreateVcMutation = {
  __typename?: 'Mutation';
  createVerifiableCredential?: {
    __typename?: 'CreateVerifiableCredentialPayload';
    clientMutationId?: string | null;
    document: {
      __typename?: 'VerifiableCredential';
      id: string;
      data: string;
      queryHash: string;
    };
  } | null;
};

export type GetAllVerifiableCredentialsQueryVariables = Exact<{
  last?: InputMaybe<Scalars['Int']['input']>;
}>;

export type GetAllVerifiableCredentialsQuery = {
  __typename?: 'Query';
  verifiableCredentialIndex?: {
    __typename?: 'VerifiableCredentialConnection';
    edges?:
      | ({
          __typename?: 'VerifiableCredentialEdge';
          node?: {
            __typename?: 'VerifiableCredential';
            id: string;
            data: string;
            queryHash: string;
          } | null;
        } | null)[]
      | null;
  } | null;
};

export type GetVerifiableCredentialsByQueryHashQueryVariables = Exact<{
  last: Scalars['Int']['input'];
  queryHash: Scalars['String']['input'];
}>;

export type GetVerifiableCredentialsByQueryHashQuery = {
  __typename?: 'Query';
  verifiableCredentialIndex?: {
    __typename?: 'VerifiableCredentialConnection';
    edges?:
      | ({
          __typename?: 'VerifiableCredentialEdge';
          node?: {
            __typename?: 'VerifiableCredential';
            id: string;
            data: string;
            queryHash: string;
          } | null;
        } | null)[]
      | null;
  } | null;
};

export const VerifiableCredentialFragment = gql`
  fragment VerifiableCredentialFragment on VerifiableCredentialConnection {
    edges {
      node {
        id
        data
        queryHash
      }
    }
  }
`;
export const CreateVc = gql`
  mutation createVC($input: CreateVerifiableCredentialInput!) {
    createVerifiableCredential(input: $input) {
      clientMutationId
      document {
        id
        data
        queryHash
      }
    }
  }
`;
export const GetAllVerifiableCredentials = gql`
  query GetAllVerifiableCredentials($last: Int) {
    verifiableCredentialIndex(last: $last) {
      ...VerifiableCredentialFragment
    }
  }
  ${VerifiableCredentialFragment}
`;
export const GetVerifiableCredentialsByQueryHash = gql`
  query GetVerifiableCredentialsByQueryHash($last: Int!, $queryHash: String!) {
    verifiableCredentialIndex(
      last: $last
      filters: { where: { queryHash: { equalTo: $queryHash } } }
    ) {
      ...VerifiableCredentialFragment
    }
  }
  ${VerifiableCredentialFragment}
`;
