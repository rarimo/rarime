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
  claimId?: InputMaybe<Scalars['String']['input']>;
  data?: InputMaybe<Scalars['String']['input']>;
  ownerDid?: InputMaybe<Scalars['String']['input']>;
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
  claimId: Scalars['String']['output'];
  data: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ownerDid: Scalars['String']['output'];
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
  claimId: Scalars['String']['input'];
  data: Scalars['String']['input'];
  ownerDid: Scalars['String']['input'];
  queryHash: Scalars['String']['input'];
};

export type VerifiableCredentialObjectFilterInput = {
  claimId?: InputMaybe<StringValueFilterInput>;
  ownerDid?: InputMaybe<StringValueFilterInput>;
  queryHash?: InputMaybe<StringValueFilterInput>;
};

export type VerifiableCredentialSortingInput = {
  claimId?: InputMaybe<SortOrder>;
  ownerDid?: InputMaybe<SortOrder>;
  queryHash?: InputMaybe<SortOrder>;
};

export type PageInfoFragment = {
  __typename?: 'VerifiableCredentialConnection';
  pageInfo: {
    __typename?: 'PageInfo';
    endCursor?: string | null;
    hasNextPage: boolean;
    startCursor?: string | null;
    hasPreviousPage: boolean;
  };
};

export type VerifiableCredentialFragment = {
  __typename?: 'VerifiableCredentialConnection';
  edges?:
    | ({
        __typename?: 'VerifiableCredentialEdge';
        node?: {
          __typename?: 'VerifiableCredential';
          id: string;
          data: string;
          queryHash: string;
          claimId: string;
        } | null;
      } | null)[]
    | null;
  pageInfo: {
    __typename?: 'PageInfo';
    endCursor?: string | null;
    hasNextPage: boolean;
    startCursor?: string | null;
    hasPreviousPage: boolean;
  };
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
      claimId: string;
    };
  } | null;
};

export type GetAllVerifiableCredentialsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  ownerDid: Scalars['String']['input'];
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
            claimId: string;
          } | null;
        } | null)[]
      | null;
    pageInfo: {
      __typename?: 'PageInfo';
      endCursor?: string | null;
      hasNextPage: boolean;
      startCursor?: string | null;
      hasPreviousPage: boolean;
    };
  } | null;
};

export type GetVerifiableCredentialsByQueryHashQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  queryHash: Scalars['String']['input'];
  ownerDid: Scalars['String']['input'];
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
            claimId: string;
          } | null;
        } | null)[]
      | null;
    pageInfo: {
      __typename?: 'PageInfo';
      endCursor?: string | null;
      hasNextPage: boolean;
      startCursor?: string | null;
      hasPreviousPage: boolean;
    };
  } | null;
};

export type GetVerifiableCredentialsByClaimIdQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  claimId: Scalars['String']['input'];
  ownerDid: Scalars['String']['input'];
}>;

export type GetVerifiableCredentialsByClaimIdQuery = {
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
            claimId: string;
          } | null;
        } | null)[]
      | null;
    pageInfo: {
      __typename?: 'PageInfo';
      endCursor?: string | null;
      hasNextPage: boolean;
      startCursor?: string | null;
      hasPreviousPage: boolean;
    };
  } | null;
};

export type GetVerifiableCredentialsByClaimIdAndQueryHashQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  claimId: Scalars['String']['input'];
  ownerDid: Scalars['String']['input'];
  queryHash: Scalars['String']['input'];
}>;

export type GetVerifiableCredentialsByClaimIdAndQueryHashQuery = {
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
            claimId: string;
          } | null;
        } | null)[]
      | null;
    pageInfo: {
      __typename?: 'PageInfo';
      endCursor?: string | null;
      hasNextPage: boolean;
      startCursor?: string | null;
      hasPreviousPage: boolean;
    };
  } | null;
};

export type ClearVcMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  claimId?: InputMaybe<Scalars['String']['input']>;
  data?: InputMaybe<Scalars['String']['input']>;
  ownerDid?: InputMaybe<Scalars['String']['input']>;
  queryHash?: InputMaybe<Scalars['String']['input']>;
}>;

export type ClearVcMutation = {
  __typename?: 'Mutation';
  updateVerifiableCredential?: {
    __typename?: 'UpdateVerifiableCredentialPayload';
    clientMutationId?: string | null;
    document: {
      __typename?: 'VerifiableCredential';
      claimId: string;
      data: string;
      id: string;
      ownerDid: string;
      queryHash: string;
    };
  } | null;
};

export const PageInfo = gql`
  fragment PageInfo on VerifiableCredentialConnection {
    pageInfo {
      endCursor
      hasNextPage
      startCursor
      hasPreviousPage
    }
  }
`;
export const VerifiableCredential = gql`
  fragment VerifiableCredential on VerifiableCredentialConnection {
    edges {
      node {
        id
        data
        queryHash
        claimId
      }
    }
    ...PageInfo
  }
  ${PageInfo}
`;
export const CreateVc = gql`
  mutation createVC($input: CreateVerifiableCredentialInput!) {
    createVerifiableCredential(input: $input) {
      clientMutationId
      document {
        id
        data
        queryHash
        claimId
      }
    }
  }
`;
export const GetAllVerifiableCredentials = gql`
  query GetAllVerifiableCredentials(
    $first: Int!
    $after: String
    $ownerDid: String!
  ) {
    verifiableCredentialIndex(
      first: $first
      after: $after
      filters: { where: { ownerDid: { equalTo: $ownerDid } } }
    ) {
      ...VerifiableCredential
    }
  }
  ${VerifiableCredential}
`;
export const GetVerifiableCredentialsByQueryHash = gql`
  query GetVerifiableCredentialsByQueryHash(
    $first: Int!
    $after: String
    $queryHash: String!
    $ownerDid: String!
  ) {
    verifiableCredentialIndex(
      first: $first
      after: $after
      filters: {
        where: {
          queryHash: { equalTo: $queryHash }
          ownerDid: { equalTo: $ownerDid }
        }
      }
    ) {
      ...VerifiableCredential
    }
  }
  ${VerifiableCredential}
`;
export const GetVerifiableCredentialsByClaimId = gql`
  query GetVerifiableCredentialsByClaimId(
    $first: Int!
    $after: String
    $claimId: String!
    $ownerDid: String!
  ) {
    verifiableCredentialIndex(
      first: $first
      after: $after
      filters: {
        where: {
          claimId: { equalTo: $claimId }
          ownerDid: { equalTo: $ownerDid }
        }
      }
    ) {
      ...VerifiableCredential
    }
  }
  ${VerifiableCredential}
`;
export const GetVerifiableCredentialsByClaimIdAndQueryHash = gql`
  query GetVerifiableCredentialsByClaimIdAndQueryHash(
    $first: Int!
    $after: String
    $claimId: String!
    $ownerDid: String!
    $queryHash: String!
  ) {
    verifiableCredentialIndex(
      first: $first
      after: $after
      filters: {
        where: {
          claimId: { equalTo: $claimId }
          queryHash: { equalTo: $queryHash }
          ownerDid: { equalTo: $ownerDid }
        }
      }
    ) {
      ...VerifiableCredential
    }
  }
  ${VerifiableCredential}
`;
export const ClearVc = gql`
  mutation ClearVC(
    $id: ID!
    $claimId: String = ""
    $data: String = ""
    $ownerDid: String = ""
    $queryHash: String = ""
  ) {
    updateVerifiableCredential(
      input: {
        id: $id
        content: {
          data: $data
          claimId: $claimId
          ownerDid: $ownerDid
          queryHash: $queryHash
        }
      }
    ) {
      clientMutationId
      document {
        claimId
        data
        id
        ownerDid
        queryHash
      }
    }
  }
`;
