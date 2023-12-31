import typia from 'typia';
import { ClaimOffer, CreateProofRequest } from '../types';

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

export const isValidSaveCredentialsOfferRequest = (offer: ClaimOffer) => {
  const validate = typia.createValidateEquals<ClaimOffer>();
  const res = validate(offer);
  if (!res.success) {
    throw new Error(handleIValidation(res));
  }
};

export const isValidCreateProofRequest = (request: CreateProofRequest) => {
  const validate = typia.createValidateEquals<CreateProofRequest>();
  const res = validate(request);
  if (!res.success) {
    throw new Error(handleIValidation(res));
  }
};
