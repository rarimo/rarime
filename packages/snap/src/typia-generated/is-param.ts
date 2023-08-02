import typia from 'typia';
import { ClaimOffer } from "../types";
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
    const validate = (input: any): typia.IValidation<ClaimOffer> => {
        const errors = [] as any[];
        const __is = (input: any, _exceptionable: boolean = true): input is ClaimOffer => {
            const $is_url = (typia.createValidateEquals as any).is_url;
            const $io0 = (input: any, _exceptionable: boolean = true): boolean => "object" === typeof input.body && null !== input.body && $io1(input.body, true && _exceptionable) && "string" === typeof input.from && "string" === typeof input.id && (undefined === input.thid || "string" === typeof input.thid) && "string" === typeof input.to && (undefined === input.typ || "string" === typeof input.typ) && "string" === typeof input.type && (5 === Object.keys(input).length || Object.keys(input).every((key: any) => {
                if (["body", "from", "id", "thid", "to", "typ", "type"].some((prop: any) => key === prop))
                    return true;
                const value = input[key];
                if (undefined === value)
                    return true;
                return false;
            }));
            const $io1 = (input: any, _exceptionable: boolean = true): boolean => Array.isArray(input.credentials) && (input.credentials.length === 1 && ("object" === typeof input.credentials[0] && null !== input.credentials[0] && $io2(input.credentials[0], true && _exceptionable))) && ("string" === typeof input.url && $is_url(input.url)) && (2 === Object.keys(input).length || Object.keys(input).every((key: any) => {
                if (["credentials", "url"].some((prop: any) => key === prop))
                    return true;
                const value = input[key];
                if (undefined === value)
                    return true;
                return false;
            }));
            const $io2 = (input: any, _exceptionable: boolean = true): boolean => "string" === typeof input.description && "string" === typeof input.id && (2 === Object.keys(input).length || Object.keys(input).every((key: any) => {
                if (["description", "id"].some((prop: any) => key === prop))
                    return true;
                const value = input[key];
                if (undefined === value)
                    return true;
                return false;
            }));
            return "object" === typeof input && null !== input && $io0(input, true);
        };
        if (false === __is(input)) {
            const $report = (typia.createValidateEquals as any).report(errors);
            ((input: any, _path: string, _exceptionable: boolean = true): input is ClaimOffer => {
                const $join = (typia.createValidateEquals as any).join;
                const $is_url = (typia.createValidateEquals as any).is_url;
                const $vo0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => [("object" === typeof input.body && null !== input.body || $report(_exceptionable, {
                        path: _path + ".body",
                        expected: "__type",
                        value: input.body
                    })) && $vo1(input.body, _path + ".body", true && _exceptionable) || $report(_exceptionable, {
                        path: _path + ".body",
                        expected: "__type",
                        value: input.body
                    }), "string" === typeof input.from || $report(_exceptionable, {
                        path: _path + ".from",
                        expected: "string",
                        value: input.from
                    }), "string" === typeof input.id || $report(_exceptionable, {
                        path: _path + ".id",
                        expected: "string",
                        value: input.id
                    }), undefined === input.thid || "string" === typeof input.thid || $report(_exceptionable, {
                        path: _path + ".thid",
                        expected: "(string | undefined)",
                        value: input.thid
                    }), "string" === typeof input.to || $report(_exceptionable, {
                        path: _path + ".to",
                        expected: "string",
                        value: input.to
                    }), undefined === input.typ || "string" === typeof input.typ || $report(_exceptionable, {
                        path: _path + ".typ",
                        expected: "(string | undefined)",
                        value: input.typ
                    }), "string" === typeof input.type || $report(_exceptionable, {
                        path: _path + ".type",
                        expected: "string",
                        value: input.type
                    }), 5 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map((key: any) => {
                        if (["body", "from", "id", "thid", "to", "typ", "type"].some((prop: any) => key === prop))
                            return true;
                        const value = input[key];
                        if (undefined === value)
                            return true;
                        return $report(_exceptionable, {
                            path: _path + $join(key),
                            expected: "undefined",
                            value: value
                        });
                    }).every((flag: boolean) => flag))].every((flag: boolean) => flag);
                const $vo1 = (input: any, _path: string, _exceptionable: boolean = true): boolean => [(Array.isArray(input.credentials) || $report(_exceptionable, {
                        path: _path + ".credentials",
                        expected: "[{ description: string; id: string; }]",
                        value: input.credentials
                    })) && ((input.credentials.length === 1 || $report(_exceptionable, {
                        path: _path + ".credentials",
                        expected: "[__type.o1]",
                        value: input.credentials
                    })) && [
                        ("object" === typeof input.credentials[0] && null !== input.credentials[0] || $report(_exceptionable, {
                            path: _path + ".credentials[0]",
                            expected: "__type.o1",
                            value: input.credentials[0]
                        })) && $vo2(input.credentials[0], _path + ".credentials[0]", true && _exceptionable) || $report(_exceptionable, {
                            path: _path + ".credentials[0]",
                            expected: "__type.o1",
                            value: input.credentials[0]
                        })
                    ].every((flag: boolean) => flag)) || $report(_exceptionable, {
                        path: _path + ".credentials",
                        expected: "[{ description: string; id: string; }]",
                        value: input.credentials
                    }), "string" === typeof input.url && ($is_url(input.url) || $report(_exceptionable, {
                        path: _path + ".url",
                        expected: "string (@format url)",
                        value: input.url
                    })) || $report(_exceptionable, {
                        path: _path + ".url",
                        expected: "string",
                        value: input.url
                    }), 2 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map((key: any) => {
                        if (["credentials", "url"].some((prop: any) => key === prop))
                            return true;
                        const value = input[key];
                        if (undefined === value)
                            return true;
                        return $report(_exceptionable, {
                            path: _path + $join(key),
                            expected: "undefined",
                            value: value
                        });
                    }).every((flag: boolean) => flag))].every((flag: boolean) => flag);
                const $vo2 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ["string" === typeof input.description || $report(_exceptionable, {
                        path: _path + ".description",
                        expected: "string",
                        value: input.description
                    }), "string" === typeof input.id || $report(_exceptionable, {
                        path: _path + ".id",
                        expected: "string",
                        value: input.id
                    }), 2 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map((key: any) => {
                        if (["description", "id"].some((prop: any) => key === prop))
                            return true;
                        const value = input[key];
                        if (undefined === value)
                            return true;
                        return $report(_exceptionable, {
                            path: _path + $join(key),
                            expected: "undefined",
                            value: value
                        });
                    }).every((flag: boolean) => flag))].every((flag: boolean) => flag);
                return ("object" === typeof input && null !== input || $report(true, {
                    path: _path + "",
                    expected: "ClaimOffer",
                    value: input
                })) && $vo0(input, _path + "", true) || $report(true, {
                    path: _path + "",
                    expected: "ClaimOffer",
                    value: input
                });
            })(input, "$input", true);
        }
        const success = 0 === errors.length;
        return {
            success,
            errors,
            data: success ? input : undefined
        } as any;
    };
    const res = validate(offer);
    if (!res.success) {
        throw new Error(handleIValidation(res));
    }
};
